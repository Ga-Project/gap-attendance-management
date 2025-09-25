# Service class for attendance business logic
class AttendanceService
  def initialize(user, attendance = nil)
    @user = user
    @attendance = attendance
  end

  def find_or_create_today_attendance
    @user.attendances.find_or_create_by(date: Date.current) do |attendance|
      attendance.status = :not_started
      attendance.total_work_minutes = 0
      attendance.total_break_minutes = 0
    end
  end

  def clock_in(attendance)
    return { error: 'Already clocked in today' } unless attendance.can_clock_in?

    ActiveRecord::Base.transaction do
      attendance.update!(
        clock_in_time: Time.current,
        status: :clocked_in
      )

      attendance.attendance_records.create!(
        record_type: :clock_in,
        timestamp: Time.current
      )
    end

    { success: true, message: 'Successfully clocked in' }
  rescue ActiveRecord::RecordInvalid => e
    { error: 'Validation failed', details: e.record.errors.full_messages }
  rescue StandardError => e
    { error: 'Failed to clock in', details: e.message }
  end

  def clock_out(attendance)
    return { error: 'Cannot clock out. Must be clocked in first' } unless attendance.can_clock_out?

    ActiveRecord::Base.transaction do
      end_current_break(attendance) if attendance.on_break?

      attendance.update!(
        clock_out_time: Time.current,
        status: :clocked_out
      )

      attendance.attendance_records.create!(
        record_type: :clock_out,
        timestamp: Time.current
      )
    end

    { success: true, message: 'Successfully clocked out' }
  rescue ActiveRecord::RecordInvalid => e
    { error: 'Validation failed', details: e.record.errors.full_messages }
  rescue StandardError => e
    { error: 'Failed to clock out', details: e.message }
  end

  def start_break(attendance)
    return { error: 'Cannot start break. Must be clocked in first' } unless attendance.can_start_break?

    ActiveRecord::Base.transaction do
      attendance.update!(status: :on_break)

      attendance.attendance_records.create!(
        record_type: :break_start,
        timestamp: Time.current
      )
    end

    { success: true, message: 'Break started' }
  rescue ActiveRecord::RecordInvalid => e
    { error: 'Validation failed', details: e.record.errors.full_messages }
  rescue StandardError => e
    { error: 'Failed to start break', details: e.message }
  end

  def end_break(attendance)
    return { error: 'Cannot end break. Must be on break first' } unless attendance.can_end_break?

    ActiveRecord::Base.transaction do
      calculate_and_add_break_time(attendance)
      attendance.update!(status: :clocked_in)

      attendance.attendance_records.create!(
        record_type: :break_end,
        timestamp: Time.current
      )
    end

    { success: true, message: 'Break ended' }
  rescue ActiveRecord::RecordInvalid => e
    { error: 'Validation failed', details: e.record.errors.full_messages }
  rescue StandardError => e
    { error: 'Failed to end break', details: e.message }
  end

  private

  def calculate_and_add_break_time(attendance)
    break_start_record = attendance.attendance_records
                                   .break_start
                                   .ordered_by_time
                                   .last

    return unless break_start_record

    break_duration = ((Time.current - break_start_record.timestamp) / 1.minute).to_i
    attendance.total_break_minutes += break_duration
    attendance.save!
  end

  def end_current_break(attendance)
    calculate_and_add_break_time(attendance)

    attendance.attendance_records.create!(
      record_type: :break_end,
      timestamp: Time.current
    )
  end
end
