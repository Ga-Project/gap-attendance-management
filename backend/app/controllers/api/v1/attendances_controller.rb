# Attendances Controller for time tracking functionality
module Api
  module V1
    class AttendancesController < ApplicationController
      before_action :set_attendance, only: [:show]
      before_action :find_or_create_today_attendance, only: %i[clock_in clock_out break_start break_end today]

      # GET /api/v1/attendances
      # Get user's attendance history
      def index
        attendances = current_user.attendances.includes(:attendance_records)
                                  .order(date: :desc)
                                  .limit(30) # Limit to last 30 records for performance

        # Apply date filtering if provided
        if params[:start_date].present? && params[:end_date].present?
          start_date = Date.parse(params[:start_date])
          end_date = Date.parse(params[:end_date])
          attendances = attendances.for_date_range(start_date, end_date)
        end

        render json: {
          attendances: attendances.map { |attendance| attendance_response(attendance) },
        }
      rescue Date::Error
        render json: { error: 'Invalid date format. Use YYYY-MM-DD' }, status: :bad_request
      end

      # GET /api/v1/attendances/:id
      # Get specific attendance record
      def show
        render json: { attendance: attendance_response(@attendance) }
      end

      # GET /api/v1/attendances/today
      # Get today's attendance status
      def today
        render json: {
          attendance: attendance_response(@today_attendance),
          can_clock_in: @today_attendance.can_clock_in?,
          can_clock_out: @today_attendance.can_clock_out?,
          can_start_break: @today_attendance.can_start_break?,
          can_end_break: @today_attendance.can_end_break?,
        }
      end

      # POST /api/v1/attendances/clock_in
      # Clock in for work
      def clock_in
        return render_error('Already clocked in today') unless @today_attendance.can_clock_in?

        ActiveRecord::Base.transaction do
          # Update attendance record
          @today_attendance.update!(
            clock_in_time: Time.current,
            status: :clocked_in
          )

          # Create attendance record
          @today_attendance.attendance_records.create!(
            record_type: :clock_in,
            timestamp: Time.current
          )
        end

        render json: {
          message: 'Successfully clocked in',
          attendance: attendance_response(@today_attendance.reload),
        }
      rescue ActiveRecord::RecordInvalid => e
        render_validation_error(e)
      rescue StandardError => e
        render_error('Failed to clock in', e.message)
      end

      # POST /api/v1/attendances/clock_out
      # Clock out from work
      def clock_out
        return render_error('Cannot clock out. Must be clocked in first') unless @today_attendance.can_clock_out?

        ActiveRecord::Base.transaction do
          # If currently on break, end the break first
          end_current_break if @today_attendance.on_break?

          # Update attendance record
          @today_attendance.update!(
            clock_out_time: Time.current,
            status: :clocked_out
          )

          # Create attendance record
          @today_attendance.attendance_records.create!(
            record_type: :clock_out,
            timestamp: Time.current
          )
        end

        render json: {
          message: 'Successfully clocked out',
          attendance: attendance_response(@today_attendance.reload),
        }
      rescue ActiveRecord::RecordInvalid => e
        render_validation_error(e)
      rescue StandardError => e
        render_error('Failed to clock out', e.message)
      end

      # POST /api/v1/attendances/break_start
      # Start break
      def break_start
        return render_error('Cannot start break. Must be clocked in first') unless @today_attendance.can_start_break?

        ActiveRecord::Base.transaction do
          # Update attendance status
          @today_attendance.update!(status: :on_break)

          # Create attendance record
          @today_attendance.attendance_records.create!(
            record_type: :break_start,
            timestamp: Time.current
          )
        end

        render json: {
          message: 'Break started',
          attendance: attendance_response(@today_attendance.reload),
        }
      rescue ActiveRecord::RecordInvalid => e
        render_validation_error(e)
      rescue StandardError => e
        render_error('Failed to start break', e.message)
      end

      # POST /api/v1/attendances/break_end
      # End break
      def break_end
        return render_error('Cannot end break. Must be on break first') unless @today_attendance.can_end_break?

        ActiveRecord::Base.transaction do
          # Calculate and add break time
          calculate_and_add_break_time

          # Update attendance status back to clocked_in
          @today_attendance.update!(status: :clocked_in)

          # Create attendance record
          @today_attendance.attendance_records.create!(
            record_type: :break_end,
            timestamp: Time.current
          )
        end

        render json: {
          message: 'Break ended',
          attendance: attendance_response(@today_attendance.reload),
        }
      rescue ActiveRecord::RecordInvalid => e
        render_validation_error(e)
      rescue StandardError => e
        render_error('Failed to end break', e.message)
      end

      private

      def set_attendance
        @attendance = current_user.attendances.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Attendance record not found' }, status: :not_found
      end

      def find_or_create_today_attendance
        @today_attendance = current_user.attendances.find_or_create_by(date: Date.current) do |attendance|
          attendance.status = :not_started
          attendance.total_work_minutes = 0
          attendance.total_break_minutes = 0
        end
      end

      def calculate_and_add_break_time
        # Find the most recent break_start record
        break_start_record = @today_attendance.attendance_records
                                              .break_start
                                              .ordered_by_time
                                              .last

        return unless break_start_record

        # Calculate break duration in minutes
        break_duration = ((Time.current - break_start_record.timestamp) / 1.minute).to_i

        # Add to total break time
        @today_attendance.total_break_minutes += break_duration
        @today_attendance.save!
      end

      def end_current_break
        # This is called when clocking out while on break
        calculate_and_add_break_time

        # Create break_end record
        @today_attendance.attendance_records.create!(
          record_type: :break_end,
          timestamp: Time.current
        )
      end

      def attendance_response(attendance)
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
          records: format_attendance_records(attendance),
        }
      end

      def format_attendance_records(attendance)
        attendance.attendance_records.ordered_by_time.map do |record|
          {
            id: record.id,
            record_type: record.record_type,
            timestamp: record.timestamp,
          }
        end
      end

      def render_error(message, details = nil)
        error_response = { error: message }
        error_response[:details] = details if details
        render json: error_response, status: :unprocessable_entity
      end

      def render_validation_error(exception)
        render json: {
          error: 'Validation failed',
          details: exception.record.errors.full_messages,
        }, status: :unprocessable_entity
      end
    end
  end
end
