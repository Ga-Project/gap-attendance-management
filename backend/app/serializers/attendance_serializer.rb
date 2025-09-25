# Serializer for attendance response formatting
class AttendanceSerializer
  def self.serialize(attendance)
    {
      id: attendance.id,
      date: attendance.date,
      status: attendance.status,
      clock_in_time: attendance.clock_in_time,
      clock_out_time: attendance.clock_out_time,
      total_work_minutes: attendance.total_work_minutes,
      total_break_minutes: attendance.total_break_minutes,
      formatted_work_time: attendance.formatted_work_time,
      formatted_break_time: attendance.formatted_break_time,
      formatted_total_office_time: attendance.formatted_total_office_time,
      complete: attendance.complete?,
      in_progress: attendance.in_progress?,
      records: serialize_records(attendance),
    }
  end

  def self.serialize_records(attendance)
    attendance.attendance_records.ordered_by_time.map do |record|
      {
        id: record.id,
        record_type: record.record_type,
        timestamp: record.timestamp,
      }
    end
  end

  def self.serialize_collection(attendances)
    attendances.map { |attendance| serialize(attendance) }
  end
end
