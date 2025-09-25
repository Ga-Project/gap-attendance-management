# Admin Controller for administrative functions
module Api
  module V1
    class AdminController < ApplicationController
      before_action :require_admin

      # Get all users with their basic information
      def users
        users = User.includes(:attendances)
                   .select(:id, :name, :email, :role, :created_at)
                   .order(:name)

        render json: {
          users: users.map do |user|
            {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              created_at: user.created_at,
              total_attendances: user.attendances.count
            }
          end
        }
      end

      # Get all attendance data with filtering options
      def attendances
        attendances = Attendance.includes(:user, :attendance_records)
                                .joins(:user)

        # Apply date filtering if provided
        if params[:start_date].present?
          attendances = attendances.where('date >= ?', Date.parse(params[:start_date]))
        end

        if params[:end_date].present?
          attendances = attendances.where('date <= ?', Date.parse(params[:end_date]))
        end

        # Apply user filtering if provided
        if params[:user_id].present?
          attendances = attendances.where(user_id: params[:user_id])
        end

        attendances = attendances.order('date DESC, users.name ASC')

        render json: {
          attendances: attendances.map do |attendance|
            {
              id: attendance.id,
              user: {
                id: attendance.user.id,
                name: attendance.user.name,
                email: attendance.user.email
              },
              date: attendance.date,
              clock_in_time: attendance.clock_in_time,
              clock_out_time: attendance.clock_out_time,
              total_work_minutes: attendance.total_work_minutes,
              total_break_minutes: attendance.total_break_minutes,
              status: attendance.status,
              records: attendance.attendance_records.map do |record|
                {
                  id: record.id,
                  record_type: record.record_type,
                  timestamp: record.timestamp
                }
              end
            }
          end
        }
      end

      # Update attendance record (for corrections)
      def update_attendance
        # Validate reason parameter
        unless params[:reason].present?
          return render json: {
            error: 'Reason is required for attendance modifications'
          }, status: :unprocessable_entity
        end

        attendance = Attendance.find(params[:id])
        
        # Store original values for audit log
        original_values = {
          clock_in_time: attendance.clock_in_time,
          clock_out_time: attendance.clock_out_time,
          total_work_minutes: attendance.total_work_minutes,
          total_break_minutes: attendance.total_break_minutes
        }

        # Update attendance with new values
        if attendance.update(attendance_params)
          # Recalculate work and break minutes if times were changed
          if params[:attendance][:clock_in_time].present? || params[:attendance][:clock_out_time].present?
            attendance.recalculate_totals!
          end

          # Create audit log entry
          create_audit_log(attendance, original_values, params[:reason])

          render json: {
            message: 'Attendance updated successfully',
            attendance: format_attendance_response(attendance)
          }
        else
          render json: {
            error: 'Failed to update attendance',
            details: attendance.errors.full_messages
          }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Attendance record not found' }, status: :not_found
      end

      # Get audit logs with filtering
      def audit_logs
        logs = AuditLog.includes(:user, :target_user)
                      .order(created_at: :desc)

        # Apply date filtering if provided
        if params[:start_date].present?
          logs = logs.where('created_at >= ?', Date.parse(params[:start_date]))
        end

        if params[:end_date].present?
          logs = logs.where('created_at <= ?', Date.parse(params[:end_date]).end_of_day)
        end

        # Apply user filtering if provided
        if params[:target_user_id].present?
          logs = logs.where(target_user_id: params[:target_user_id])
        end

        logs = logs.limit(params[:limit]&.to_i || 100)

        render json: {
          audit_logs: logs.map do |log|
            {
              id: log.id,
              admin_user: {
                id: log.user.id,
                name: log.user.name,
                email: log.user.email
              },
              target_user: {
                id: log.target_user.id,
                name: log.target_user.name,
                email: log.target_user.email
              },
              action: log.action,
              changes: log.change_data,
              reason: log.reason,
              created_at: log.created_at
            }
          end
        }
      end

      # Export attendance data as CSV
      def export_csv
        attendances = Attendance.includes(:user, :attendance_records)
                                .joins(:user)

        # Apply date filtering
        if params[:start_date].present?
          attendances = attendances.where('date >= ?', Date.parse(params[:start_date]))
        end

        if params[:end_date].present?
          attendances = attendances.where('date <= ?', Date.parse(params[:end_date]))
        end

        attendances = attendances.order('date ASC, users.name ASC')

        csv_data = generate_csv(attendances)

        send_data csv_data,
                  filename: "attendance_export_#{Date.current.strftime('%Y%m%d')}.csv",
                  type: 'text/csv',
                  disposition: 'attachment'
      end

      private

      def attendance_params
        params.require(:attendance).permit(:clock_in_time, :clock_out_time, :total_work_minutes, :total_break_minutes)
      end

      def create_audit_log(attendance, original_values, reason)
        changes = {}
        
        attendance_params.each do |key, new_value|
          original_value = original_values[key.to_sym]
          if original_value != new_value
            changes[key] = {
              from: original_value,
              to: new_value
            }
          end
        end

        AuditLog.create!(
          user: @current_user,
          target_user: attendance.user,
          action: 'update_attendance',
          change_data: changes,
          reason: reason || 'No reason provided'
        )
      end

      def format_attendance_response(attendance)
        {
          id: attendance.id,
          user: {
            id: attendance.user.id,
            name: attendance.user.name,
            email: attendance.user.email
          },
          date: attendance.date,
          clock_in_time: attendance.clock_in_time,
          clock_out_time: attendance.clock_out_time,
          total_work_minutes: attendance.total_work_minutes,
          total_break_minutes: attendance.total_break_minutes,
          status: attendance.status
        }
      end

      def generate_csv(attendances)
        require 'csv'

        CSV.generate(headers: true) do |csv|
          # CSV headers
          csv << [
            'Date',
            'Employee Name',
            'Employee Email',
            'Clock In',
            'Clock Out',
            'Work Hours',
            'Break Minutes',
            'Status'
          ]

          # CSV data rows
          attendances.each do |attendance|
            work_hours = attendance.total_work_minutes ? (attendance.total_work_minutes / 60.0).round(2) : 0

            csv << [
              attendance.date.strftime('%Y-%m-%d'),
              attendance.user.name,
              attendance.user.email,
              attendance.clock_in_time&.strftime('%H:%M'),
              attendance.clock_out_time&.strftime('%H:%M'),
              work_hours,
              attendance.total_break_minutes || 0,
              attendance.status.humanize
            ]
          end
        end
      end
    end
  end
end