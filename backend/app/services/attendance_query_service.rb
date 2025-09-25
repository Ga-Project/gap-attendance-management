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
end
