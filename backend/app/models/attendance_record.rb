class AttendanceRecord < ApplicationRecord
  belongs_to :attendance

  enum record_type: {
    clock_in: 0,
    clock_out: 1,
    break_start: 2,
    break_end: 3,
  }

  validates :record_type, presence: true
  validates :timestamp, presence: true
  validates :attendance_id, presence: true

  scope :for_date, ->(date) { joins(:attendance).where(attendances: { date: date }) }
  scope :for_user, ->(user) { joins(:attendance).where(attendances: { user: user }) }
  scope :ordered_by_time, -> { order(:timestamp) }
end
