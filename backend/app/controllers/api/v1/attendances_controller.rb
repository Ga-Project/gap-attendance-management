# Attendances Controller for time tracking functionality
module Api
  module V1
    class AttendancesController < ApplicationController
      before_action :set_attendance, only: [:show]
      before_action :find_or_create_today_attendance, only: %i[clock_in clock_out break_start break_end today]

      # GET /api/v1/attendances
      def index
        query_service = AttendanceQueryService.new(current_user, params)
        attendances = query_service.fetch_attendances_with_filtering
        render json: { attendances: AttendanceSerializer.serialize_collection(attendances) }
      rescue Date::Error
        render_error('Invalid date format. Use YYYY-MM-DD', :bad_request)
      end

      # GET /api/v1/attendances/statistics
      def statistics
        query_service = AttendanceQueryService.new(current_user, params)

        if monthly_params_present?
          render_monthly_statistics(query_service)
        elsif date_range_params_present?
          render_date_range_statistics(query_service)
        else
          render_missing_parameters_error
        end
      rescue Date::Error
        render_invalid_date_format_error
      end

      # GET /api/v1/attendances/monthly/:year/:month
      def monthly
        year, month = extract_year_month_params
        return if invalid_year_month?(year, month)

        date_range = build_monthly_date_range(year, month)
        query_service = build_monthly_query_service(date_range)

        render_monthly_data(query_service, year, month)
      rescue Date::Error, ArgumentError
        render_error('Invalid year or month', :bad_request)
      end

      # GET /api/v1/attendances/:id
      def show
        render json: { attendance: AttendanceSerializer.serialize(@attendance) }
      end

      # GET /api/v1/attendances/today
      def today
        render json: {
          attendance: AttendanceSerializer.serialize(@today_attendance),
          can_clock_in: @today_attendance.can_clock_in?,
          can_clock_out: @today_attendance.can_clock_out?,
          can_start_break: @today_attendance.can_start_break?,
          can_end_break: @today_attendance.can_end_break?,
        }
      end

      # POST /api/v1/attendances/clock_in
      def clock_in
        result = attendance_service.clock_in(@today_attendance)
        handle_service_result(result)
      rescue ServiceErrors::InvalidStateError => e
        render_error(e.message, :unprocessable_entity)
      end

      # POST /api/v1/attendances/clock_out
      def clock_out
        result = attendance_service.clock_out(@today_attendance)
        handle_service_result(result)
      rescue ServiceErrors::InvalidStateError => e
        render_error(e.message, :unprocessable_entity)
      end

      # POST /api/v1/attendances/break_start
      def break_start
        result = attendance_service.start_break(@today_attendance)
        handle_service_result(result)
      rescue ServiceErrors::InvalidStateError => e
        render_error(e.message, :unprocessable_entity)
      end

      # POST /api/v1/attendances/break_end
      def break_end
        result = attendance_service.end_break(@today_attendance)
        handle_service_result(result)
      rescue ServiceErrors::InvalidStateError => e
        render_error(e.message, :unprocessable_entity)
      end

      private

      def attendance_service
        @attendance_service ||= AttendanceService.new(current_user)
      end

      # Statistics helper methods
      def monthly_params_present?
        params[:year] && params[:month]
      end

      def date_range_params_present?
        params[:start_date] && params[:end_date]
      end

      def render_monthly_statistics(query_service)
        year = params[:year].to_i
        month = params[:month].to_i
        stats = query_service.fetch_monthly_statistics(year, month)
        render json: { monthly_statistics: stats }
      end

      def render_date_range_statistics(query_service)
        start_date = Date.parse(params[:start_date])
        end_date = Date.parse(params[:end_date])
        stats = query_service.fetch_date_range_statistics(start_date, end_date)
        render json: { date_range_statistics: stats }
      end

      def render_missing_parameters_error
        render json: {
          error: 'Please provide either year/month or start_date/end_date parameters',
        }, status: :bad_request
      end

      def render_invalid_date_format_error
        render json: {
          error: 'Invalid date format. Use YYYY-MM-DD for dates or valid integers for year/month',
        }, status: :bad_request
      end

      # Monthly helper methods
      def extract_year_month_params
        [params[:year].to_i, params[:month].to_i]
      end

      def invalid_year_month?(year, month)
        if year <= 0 || month <= 0 || month > 12
          render_error('Invalid year or month', :bad_request)
          true
        else
          false
        end
      end

      def build_monthly_date_range(year, month)
        start_date = Date.new(year, month, 1)
        end_date = start_date.end_of_month
        { start_date: start_date.to_s, end_date: end_date.to_s }
      end

      def build_monthly_query_service(date_range)
        AttendanceQueryService.new(current_user, date_range)
      end

      def render_monthly_data(query_service, year, month)
        attendances = query_service.fetch_attendances_with_filtering
        statistics = query_service.fetch_monthly_statistics(year, month)

        render json: {
          attendances: AttendanceSerializer.serialize_collection(attendances),
          statistics: statistics,
        }
      end

      def handle_service_result(result)
        render json: {
          message: result[:message],
          attendance: AttendanceSerializer.serialize(@today_attendance.reload),
        }
      end

      def set_attendance
        @attendance = current_user.attendances.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render_error('Attendance record not found', :not_found)
      end

      def find_or_create_today_attendance
        @today_attendance = attendance_service.find_or_create_today_attendance
      end
    end
  end
end
