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

    execute_attendance_action('Successfully clocked in', 'Failed to clock in') do
      perform_clock_in(attendance)
    end
  end

  def clock_out(attendance)
    return { error: 'Cannot clock out. Must be clocked in first' } unless attendance.can_clock_out?

    execute_attendance_action('Successfully clocked out', 'Failed to clock out') do
      perform_clock_out(attendance)
    end
  end

  def start_break(attendance)
    return { error: 'Cannot start break. Must be clocked in first' } unless attendance.can_start_break?

    execute_attendance_action('Break started', 'Failed to start break') do
      attendance.update!(status: :on_break)
      create_attendance_record(attendance, :break_start)
    end
  end

  def end_break(attendance)
    return { error: 'Cannot end break. Must be on break first' } unless attendance.can_end_break?

    execute_attendance_action('Break ended', 'Failed to end break') do
      calculate_and_add_break_time(attendance)
      attendance.update!(status: :clocked_in)
      create_attendance_record(attendance, :break_end)
    end
  end

  private

  def execute_attendance_action(success_message, error_message, &)
    ActiveRecord::Base.transaction(&)

    { success: true, message: success_message }
  rescue ActiveRecord::RecordInvalid => e
    { error: 'Validation failed', details: e.record.errors.full_messages }
  rescue StandardError => e
    { error: error_message, details: e.message }
  end

  def perform_clock_in(attendance)
    attendance.update!(
      clock_in_time: Time.current,
      status: :clocked_in
    )

    create_attendance_record(attendance, :clock_in)
  end

  def perform_clock_out(attendance)
    end_current_break(attendance) if attendance.on_break?

    attendance.update!(
      clock_out_time: Time.current,
      status: :clocked_out
    )

    create_attendance_record(attendance, :clock_out)
  end

  def create_attendance_record(attendance, record_type)
    attendance.attendance_records.create!(
      record_type: record_type,
      timestamp: Time.current
    )
  end

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
    create_attendance_record(attendance, :break_end)
  end
end
