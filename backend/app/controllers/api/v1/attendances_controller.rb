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
        render json: { error: 'Invalid date format. Use YYYY-MM-DD' }, status: :bad_request
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
      end

      # POST /api/v1/attendances/clock_out
      def clock_out
        result = attendance_service.clock_out(@today_attendance)
        handle_service_result(result)
      end

      # POST /api/v1/attendances/break_start
      def break_start
        result = attendance_service.start_break(@today_attendance)
        handle_service_result(result)
      end

      # POST /api/v1/attendances/break_end
      def break_end
        result = attendance_service.end_break(@today_attendance)
        handle_service_result(result)
      end

      private

      def attendance_service
        @attendance_service ||= AttendanceService.new(current_user)
      end

      def handle_service_result(result)
        if result[:success]
          render json: {
            message: result[:message],
            attendance: AttendanceSerializer.serialize(@today_attendance.reload),
          }
        else
          render_error(result[:error], result[:details])
        end
      end

      def set_attendance
        @attendance = current_user.attendances.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Attendance record not found' }, status: :not_found
      end

      def find_or_create_today_attendance
        @today_attendance = attendance_service.find_or_create_today_attendance
      end

      def render_error(message, details = nil)
        error_response = { error: message }
        error_response[:details] = details if details
        render json: error_response, status: :unprocessable_entity
      end
    end
  end
end
