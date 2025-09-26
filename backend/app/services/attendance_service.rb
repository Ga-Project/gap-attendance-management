# Service class for attendance business logic
class AttendanceService
  include ServiceErrors

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
    unless attendance.can_clock_in?
      Rails.logger.error 'Clock in validation failed: Already clocked in today'
      raise ServiceErrors::InvalidStateError, 'Already clocked in today'
    end

    execute_attendance_action('Successfully clocked in') do
      perform_clock_in(attendance)
    end
  end

  def clock_out(attendance)
    unless attendance.can_clock_out?
      raise ServiceErrors::InvalidStateError,
            'Cannot clock out. Must be clocked in first'
    end

    execute_attendance_action('Successfully clocked out') do
      perform_clock_out(attendance)
    end
  end

  def start_break(attendance)
    unless attendance.can_start_break?
      raise ServiceErrors::InvalidStateError,
            'Cannot start break. Must be clocked in first'
    end

    execute_attendance_action('Break started') do
      attendance.update!(status: :on_break)
      create_attendance_record(attendance, :break_start)
    end
  end

  def end_break(attendance)
    raise ServiceErrors::InvalidStateError, 'Cannot end break. Must be on break first' unless attendance.can_end_break?

    execute_attendance_action('Break ended') do
      calculate_and_add_break_time(attendance)
      attendance.update!(status: :clocked_in)
      create_attendance_record(attendance, :break_end)
    end
  end

  private

  def execute_attendance_action(success_message, &)
    ActiveRecord::Base.transaction(&)
    { success: true, message: success_message }
  rescue ActiveRecord::RecordInvalid => e
    raise ServiceErrors::AttendanceError.new('Validation failed', details: e.record.errors.full_messages)
  rescue StandardError => e
    Rails.logger.error "Attendance action failed: #{e.message}"
    raise ServiceErrors::AttendanceError.new('Attendance operation failed', details: e.message)
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
