require 'rails_helper'

RSpec.describe Api::V1::AdminController, type: :controller do
  let(:admin_user) { create(:user, role: :admin) }
  let(:employee_user) { create(:user, role: :employee) }
  let(:other_employee) { create(:user, role: :employee) }

  before do
    allow(JwtService).to receive(:verify_token).and_return(admin_user)
    allow(controller).to receive(:authenticate_request).and_return(true)
    allow(controller).to receive(:current_user).and_return(admin_user)
    controller.instance_variable_set(:@current_user, admin_user)
  end

  describe 'GET #users' do
    before do
      create_list(:user, 3, role: :employee)
    end

    it 'returns all users with their basic information' do
      get :users

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      expect(json_response['users']).to be_an(Array)
      expect(json_response['users'].length).to eq(4) # 3 employees + 1 admin

      user_data = json_response['users'].first
      expect(user_data).to have_key('id')
      expect(user_data).to have_key('name')
      expect(user_data).to have_key('email')
      expect(user_data).to have_key('role')
      expect(user_data).to have_key('total_attendances')
    end

    context 'when user is not admin' do
      before do
        allow(JwtService).to receive(:verify_token).and_return(employee_user)
        allow(controller).to receive(:authenticate_request).and_return(true)
        allow(controller).to receive(:current_user).and_return(employee_user)
        controller.instance_variable_set(:@current_user, employee_user)
      end

      it 'returns forbidden status' do
        get :users
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe 'GET #attendances' do
    let!(:attendance1) { create(:attendance, user: employee_user, date: Date.current) }
    let!(:attendance2) { create(:attendance, user: other_employee, date: Date.current - 1.day) }

    it 'returns all attendances with user information' do
      get :attendances

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      expect(json_response['attendances']).to be_an(Array)
      expect(json_response['attendances'].length).to eq(2)

      attendance_data = json_response['attendances'].first
      expect(attendance_data).to have_key('id')
      expect(attendance_data).to have_key('user')
      expect(attendance_data['user']).to have_key('name')
      expect(attendance_data['user']).to have_key('email')
    end

    it 'filters by user_id when provided' do
      get :attendances, params: { user_id: employee_user.id }

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      expect(json_response['attendances'].length).to eq(1)
      expect(json_response['attendances'].first['user']['id']).to eq(employee_user.id)
    end

    it 'filters by date range when provided' do
      get :attendances, params: {
        start_date: Date.current.to_s,
        end_date: Date.current.to_s,
      }

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      expect(json_response['attendances'].length).to eq(1)
      expect(json_response['attendances'].first['date']).to eq(Date.current.to_s)
    end
  end

  describe 'PUT #update_attendance' do
    let!(:attendance) { create(:attendance, user: employee_user, date: Date.current) }
    let(:update_params) do
      {
        id: attendance.id,
        attendance: {
          clock_in_time: '2023-01-01T09:00:00Z',
          clock_out_time: '2023-01-01T18:00:00Z',
        },
        reason: 'Correcting time entry error',
      }
    end

    it 'updates attendance record successfully' do
      put :update_attendance, params: update_params

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      expect(json_response['message']).to eq('Attendance updated successfully')

      attendance.reload
      expect(attendance.clock_in_time.strftime('%H:%M')).to eq('09:00')
      expect(attendance.clock_out_time.strftime('%H:%M')).to eq('18:00')
    end

    it 'creates audit log entry' do
      expect do
        put :update_attendance, params: update_params
      end.to change(AuditLog, :count).by(1)

      audit_log = AuditLog.last
      expect(audit_log.user).to eq(admin_user)
      expect(audit_log.target_user).to eq(employee_user)
      expect(audit_log.action).to eq('update_attendance')
      expect(audit_log.reason).to eq('Correcting time entry error')
    end

    it 'returns error for invalid attendance ID' do
      put :update_attendance, params: update_params.merge(id: 99_999)

      expect(response).to have_http_status(:not_found)
      json_response = JSON.parse(response.body)
      expect(json_response['error']).to eq('Attendance record not found')
    end

    it 'returns error when reason is missing' do
      params_without_reason = update_params.dup
      params_without_reason.delete(:reason)

      put :update_attendance, params: params_without_reason

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe 'GET #audit_logs' do
    let!(:audit_log) do
      create(:audit_log,
             user: admin_user,
             target_user: employee_user,
             action: 'update_attendance',
             reason: 'Test correction')
    end

    it 'returns audit logs with user information' do
      get :audit_logs

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      expect(json_response['audit_logs']).to be_an(Array)
      expect(json_response['audit_logs'].length).to eq(1)

      log_data = json_response['audit_logs'].first
      expect(log_data).to have_key('admin_user')
      expect(log_data).to have_key('target_user')
      expect(log_data['admin_user']['name']).to eq(admin_user.name)
      expect(log_data['target_user']['name']).to eq(employee_user.name)
    end

    it 'filters by target_user_id when provided' do
      create(:audit_log, user: admin_user, target_user: other_employee)

      get :audit_logs, params: { target_user_id: employee_user.id }

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      expect(json_response['audit_logs'].length).to eq(1)
      expect(json_response['audit_logs'].first['target_user']['id']).to eq(employee_user.id)
    end
  end

  describe 'GET #export_csv' do
    let!(:attendance) { create(:attendance, user: employee_user, date: Date.current) }

    it 'returns CSV file with attendance data' do
      get :export_csv

      expect(response).to have_http_status(:ok)
      expect(response.content_type).to eq('text/csv')
      expect(response.headers['Content-Disposition']).to include('attachment')
      expect(response.headers['Content-Disposition']).to include('.csv')
    end

    it 'includes proper CSV headers' do
      get :export_csv

      csv_content = response.body
      lines = csv_content.split("\n")
      headers = lines.first.split(',')

      expect(headers).to include('Date')
      expect(headers).to include('Employee Name')
      expect(headers).to include('Employee Email')
      expect(headers).to include('Clock In')
      expect(headers).to include('Clock Out')
    end
  end
end
