class Attendance < ApplicationRecord
  # Associations
  belongs_to :user
  has_many :attendance_records, dependent: :destroy

  # Enums
  enum status: {
    not_started: 0,
    clocked_in: 1,
    on_break: 2,
    clocked_out: 3,
  }

  # Validations
  validates :date, presence: true, uniqueness: { scope: :user_id }
  validates :user_id, presence: true
  validates :status, presence: true
  validates :total_work_minutes, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :total_break_minutes, presence: true, numericality: { greater_than_or_equal_to: 0 }

  # Custom validations
  validate :clock_out_after_clock_in
  validate :date_not_in_future

  # Scopes
  scope :for_date, ->(date) { where(date: date) }
  scope :for_user, ->(user) { where(user: user) }
  scope :for_date_range, ->(start_date, end_date) { where(date: start_date..end_date) }
  scope :completed, -> { where(status: :clocked_out) }

  # Callbacks
  before_save :calculate_work_and_break_time

  # Instance methods

  # Check if user can clock in
  def can_clock_in?
    not_started?
  end

  # Check if user can clock out
  def can_clock_out?
    clocked_in? || on_break?
  end

  # Check if user can start break
  def can_start_break?
    clocked_in?
  end

  # Check if user can end break
  def can_end_break?
    on_break?
  end

  # Get current work duration in minutes (excluding breaks)
  def current_work_minutes
    return 0 unless clock_in_time

    end_time = clock_out_time || Time.current
    total_minutes = ((end_time - clock_in_time) / 1.minute).to_i

    # Subtract break time
    total_minutes - current_break_minutes
  end

  # Get current break duration in minutes
  def current_break_minutes
    return total_break_minutes if clocked_out?

    # For now, return the stored total_break_minutes
    # This will be enhanced in task 5.3 when AttendanceRecord model is implemented
    total_break_minutes
  end

  # Get formatted work time as "HH:MM"
  def formatted_work_time
    format_minutes(total_work_minutes)
  end

  # Get formatted break time as "HH:MM"
  def formatted_break_time
    format_minutes(total_break_minutes)
  end

  # Get total time at office (work + break) in minutes
  def total_office_minutes
    return 0 unless clock_in_time

    end_time = clock_out_time || Time.current
    ((end_time - clock_in_time) / 1.minute).to_i
  end

  # Get formatted total office time as "HH:MM"
  def formatted_total_office_time
    format_minutes(total_office_minutes)
  end

  # Check if attendance is complete (clocked out)
  def complete?
    clocked_out?
  end

  # Check if attendance is in progress
  def in_progress?
    clocked_in? || on_break?
  end

  private

  # Calculate and update work and break time
  def calculate_work_and_break_time
    if attendance_completed?
      calculate_final_times
    else
      initialize_default_times
    end
  end

  def attendance_completed?
    clocked_out? && clock_in_time && clock_out_time
  end

  def calculate_final_times
    total_office_time = ((clock_out_time - clock_in_time) / 1.minute).to_i
    self.total_break_minutes = current_break_minutes
    self.total_work_minutes = [total_office_time - total_break_minutes, 0].max
  end

  def initialize_default_times
    return unless clock_in_time && !clocked_out?

    self.total_work_minutes ||= 0
    self.total_break_minutes ||= 0
  end

  # Validation: clock_out_time must be after clock_in_time
  def clock_out_after_clock_in
    return unless clock_in_time && clock_out_time

    return unless clock_out_time <= clock_in_time

    errors.add(:clock_out_time, 'must be after clock in time')
  end

  # Validation: date cannot be in the future
  def date_not_in_future
    return unless date

    return unless date > Date.current

    errors.add(:date, 'cannot be in the future')
  end

  # Helper method to format minutes as "HH:MM"
  def format_minutes(minutes)
    return '00:00' if minutes.nil? || minutes.negative?

    hours = minutes / 60
    mins = minutes % 60
    format('%<hours>02d:%<mins>02d', hours: hours, mins: mins)
  end
end
