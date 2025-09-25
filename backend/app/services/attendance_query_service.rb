# Service class for attendance queries
class AttendanceQueryService
  def initialize(user, params = {})
    @user = user
    @params = params
  end

  def fetch_attendances_with_filtering
    attendances = base_attendances_query
    return attendances unless date_filtering_params_present?

    apply_date_filtering(attendances)
  end

  def fetch_monthly_statistics(year, month)
    start_date = Date.new(year, month, 1)
    end_date = start_date.end_of_month

    attendances = @user.attendances
                       .for_date_range(start_date, end_date)
                       .completed

    calculate_monthly_stats(attendances)
  end

  def fetch_date_range_statistics(start_date, end_date)
    attendances = @user.attendances
                       .for_date_range(start_date, end_date)
                       .completed

    calculate_date_range_stats(attendances, start_date, end_date)
  end

  private

  def base_attendances_query
    @user.attendances.includes(:attendance_records)
         .order(date: :desc)
         .limit(30) # Limit to last 30 records for performance
  end

  def date_filtering_params_present?
    @params[:start_date].present? && @params[:end_date].present?
  end

  def apply_date_filtering(attendances)
    start_date = Date.parse(@params[:start_date])
    end_date = Date.parse(@params[:end_date])
    attendances.for_date_range(start_date, end_date)
  end

  def calculate_monthly_stats(attendances)
    stats = build_basic_stats(attendances)

    stats.merge(
      year: attendances.first&.date&.year,
      month: attendances.first&.date&.month
    )
  end

  def calculate_date_range_stats(attendances, start_date, end_date)
    stats = build_basic_stats(attendances)
    total_days = (end_date - start_date).to_i + 1

    stats.merge(
      start_date: start_date,
      end_date: end_date,
      total_days: total_days
    )
  end

  def build_basic_stats(attendances)
    total_work_minutes = attendances.sum(:total_work_minutes)
    total_break_minutes = attendances.sum(:total_break_minutes)
    working_days = attendances.count
    average_minutes = calculate_average_work_minutes(working_days, total_work_minutes)

    {
      working_days: working_days,
      total_work_minutes: total_work_minutes,
      total_break_minutes: total_break_minutes,
      formatted_total_work_time: format_minutes(total_work_minutes),
      formatted_total_break_time: format_minutes(total_break_minutes),
      average_work_minutes_per_day: average_minutes,
      formatted_average_work_time_per_day: format_minutes(average_minutes),
    }
  end

  def calculate_average_work_minutes(working_days, total_work_minutes)
    working_days.positive? ? (total_work_minutes / working_days) : 0
  end

  def format_minutes(minutes)
    return '00:00' if minutes.nil? || minutes.negative?

    hours = minutes / 60
    mins = minutes % 60
    format('%<hours>02d:%<mins>02d', hours: hours, mins: mins)
  end
end
