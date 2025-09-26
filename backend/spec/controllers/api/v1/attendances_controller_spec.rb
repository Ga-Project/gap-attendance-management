require 'rails_helper'

RSpec.describe Api::V1::AttendancesController, type: :controller do
  let(:user) { create(:user) }
  let(:admin_user) { create(:user, :admin) }
  let(:jwt_token) { JwtService.generate_access_token(user) }
  let(:admin_jwt_token) { JwtService.generate_access_token(admin_user) }

  before do
    request.headers['Authorization'] = "Bearer #{jwt_token}"
  end

  describe 'GET #index' do
    let!(:attendance1) { create(:attendance, user: user, date: Date.current - 1.day) }
    let!(:attendance2) { create(:attendance, user: user, date: Date.current - 2.days) }
    let!(:other_user_attendance) { create(:attendance, date: Date.current) }

    it 'returns user attendances ordered by date desc' do
      get :index

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)

      expect(json_response['attendances']).to be_an(Array)
      expect(json_response['attendances'].length).to eq(2)

      # Check ordering (most recent first)
      dates = json_response['attendances'].map { |a| Date.parse(a['date']) }
      expect(dates).to eq([Date.current - 1.day, Date.current - 2.days])
    end

    it 'filters attendances by date range when provided' do
      get :index, params: {
        start_date: (Date.current - 1.day).to_s,
        end_date: Date.current.to_s,
      }

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)

      expect(json_response['attendances'].length).to eq(1)
      expect(Date.parse(json_response['attendances'][0]['date'])).to eq(Date.current - 1.day)
    end

    it 'returns error for invalid date format' do
      get :index, params: { start_date: 'invalid-date', end_date: Date.current.to_s }

      expect(response).to have_http_status(:bad_request)
      json_response = JSON.parse(response.body)
      expect(json_response['error']['message']).to include('Invalid date format')
    end

    it 'requires authentication' do
      request.headers['Authorization'] = nil
      get :index

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe 'GET #show' do
    let!(:attendance) { create(:attendance, user: user) }
    let!(:other_user_attendance) { create(:attendance) }

    it 'returns the specific attendance record' do
      get :show, params: { id: attendance.id }

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)

      expect(json_response['attendance']['id']).to eq(attendance.id)
      expect(json_response['attendance']['date']).to eq(attendance.date.to_s)
    end

    it 'returns 404 for non-existent attendance' do
      get :show, params: { id: 99_999 }

      expect(response).to have_http_status(:not_found)
    end

    it 'returns 404 for other user attendance' do
      get :show, params: { id: other_user_attendance.id }

      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'GET #today' do
    context 'when no attendance exists for today' do
      it 'creates and returns today attendance with not_started status' do
        get :today

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)

        expect(json_response['attendance']['date']).to eq(Date.current.to_s)
        expect(json_response['attendance']['status']).to eq('not_started')
        expect(json_response['can_clock_in']).to be true
        expect(json_response['can_clock_out']).to be false
        expect(json_response['can_start_break']).to be false
        expect(json_response['can_end_break']).to be false
      end
    end

    context 'when attendance exists for today' do
      let!(:today_attendance) { create(:attendance, user: user, date: Date.current, status: :clocked_in) }

      it 'returns existing attendance with correct permissions' do
        get :today

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)

        expect(json_response['attendance']['status']).to eq('clocked_in')
        expect(json_response['can_clock_in']).to be false
        expect(json_response['can_clock_out']).to be true
        expect(json_response['can_start_break']).to be true
        expect(json_response['can_end_break']).to be false
      end
    end
  end

  describe 'POST #clock_in' do
    context 'when user has not clocked in today' do
      it 'successfully clocks in the user' do
        expect do
          post :clock_in
        end.to change { user.attendances.count }.by(1)
                                                .and change { AttendanceRecord.count }.by(1)

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)

        expect(json_response['message']).to eq('Successfully clocked in')
        expect(json_response['attendance']['status']).to eq('clocked_in')
        expect(json_response['attendance']['clock_in_time']).to be_present

        # Check attendance record was created
        attendance = user.attendances.for_date(Date.current).first
        expect(attendance.attendance_records.clock_in.count).to eq(1)
      end
    end

    context 'when user has already clocked in today' do
      let!(:today_attendance) { create(:attendance, user: user, date: Date.current, status: :clocked_in) }

      it 'returns error for duplicate clock in' do
        post :clock_in

        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        expect(json_response['error']['message']).to eq('Already clocked in today')
      end
    end
  end

  describe 'POST #clock_out' do
    context 'when user is clocked in' do
      let!(:today_attendance) do
        create(:attendance,
               user: user,
               date: Date.current,
               status: :clocked_in,
               clock_in_time: 2.hours.ago)
      end

      it 'successfully clocks out the user' do
        expect do
          post :clock_out
        end.to change { AttendanceRecord.count }.by(1)

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)

        expect(json_response['message']).to eq('Successfully clocked out')
        expect(json_response['attendance']['status']).to eq('clocked_out')
        expect(json_response['attendance']['clock_out_time']).to be_present

        # Check attendance record was created
        today_attendance.reload
        expect(today_attendance.attendance_records.clock_out.count).to eq(1)
      end
    end

    context 'when user is on break' do
      let!(:today_attendance) do
        create(:attendance,
               user: user,
               date: Date.current,
               status: :on_break,
               clock_in_time: 2.hours.ago)
      end
      let!(:break_start_record) do
        create(:attendance_record,
               attendance: today_attendance,
               record_type: :break_start,
               timestamp: 30.minutes.ago)
      end

      it 'ends break and clocks out the user' do
        # break_end + clock_out
        expect do
          post :clock_out
        end.to change { AttendanceRecord.count }.by(2)
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)

        expect(json_response['message']).to eq('Successfully clocked out')
        expect(json_response['attendance']['status']).to eq('clocked_out')

        # Check both records were created
        today_attendance.reload
        expect(today_attendance.attendance_records.break_end.count).to eq(1)
        expect(today_attendance.attendance_records.clock_out.count).to eq(1)
        expect(today_attendance.total_break_minutes).to be > 0
      end
    end

    context 'when user has not clocked in' do
      it 'returns error' do
        post :clock_out

        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        expect(json_response['error']['message']).to eq('Cannot clock out. Must be clocked in first')
      end
    end
  end

  describe 'POST #break_start' do
    context 'when user is clocked in' do
      let!(:today_attendance) do
        create(:attendance,
               user: user,
               date: Date.current,
               status: :clocked_in,
               clock_in_time: 1.hour.ago)
      end

      it 'successfully starts break' do
        expect do
          post :break_start
        end.to change { AttendanceRecord.count }.by(1)

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)

        expect(json_response['message']).to eq('Break started')
        expect(json_response['attendance']['status']).to eq('on_break')

        # Check attendance record was created
        today_attendance.reload
        expect(today_attendance.attendance_records.break_start.count).to eq(1)
      end
    end

    context 'when user is not clocked in' do
      it 'returns error' do
        post :break_start

        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        expect(json_response['error']['message']).to eq('Cannot start break. Must be clocked in first')
      end
    end

    context 'when user is already on break' do
      let!(:today_attendance) do
        create(:attendance,
               user: user,
               date: Date.current,
               status: :on_break,
               clock_in_time: 1.hour.ago)
      end

      it 'returns error' do
        post :break_start

        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        expect(json_response['error']['message']).to eq('Cannot start break. Must be clocked in first')
      end
    end
  end

  describe 'POST #break_end' do
    context 'when user is on break' do
      let!(:today_attendance) do
        create(:attendance,
               user: user,
               date: Date.current,
               status: :on_break,
               clock_in_time: 2.hours.ago,
               total_break_minutes: 0)
      end
      let!(:break_start_record) do
        create(:attendance_record,
               attendance: today_attendance,
               record_type: :break_start,
               timestamp: 30.minutes.ago)
      end

      it 'successfully ends break and calculates break time' do
        expect do
          post :break_end
        end.to change { AttendanceRecord.count }.by(1)

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)

        expect(json_response['message']).to eq('Break ended')
        expect(json_response['attendance']['status']).to eq('clocked_in')

        # Check break time was calculated
        today_attendance.reload
        expect(today_attendance.attendance_records.break_end.count).to eq(1)
        expect(today_attendance.total_break_minutes).to be > 0
      end
    end

    context 'when user is not on break' do
      let!(:today_attendance) do
        create(:attendance,
               user: user,
               date: Date.current,
               status: :clocked_in,
               clock_in_time: 1.hour.ago)
      end

      it 'returns error' do
        post :break_end

        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        expect(json_response['error']['message']).to eq('Cannot end break. Must be on break first')
      end
    end
  end

  describe 'business logic validation' do
    it 'prevents clock_out before clock_in' do
      post :clock_out

      expect(response).to have_http_status(:unprocessable_entity)
      json_response = JSON.parse(response.body)
      expect(json_response['error']['message']).to eq('Cannot clock out. Must be clocked in first')
    end

    it 'prevents break_start before clock_in' do
      post :break_start

      expect(response).to have_http_status(:unprocessable_entity)
      json_response = JSON.parse(response.body)
      expect(json_response['error']['message']).to eq('Cannot start break. Must be clocked in first')
    end

    it 'prevents break_end when not on break' do
      post :break_end

      expect(response).to have_http_status(:unprocessable_entity)
      json_response = JSON.parse(response.body)
      expect(json_response['error']['message']).to eq('Cannot end break. Must be on break first')
    end

    it 'prevents duplicate clock_in' do
      # First clock in
      post :clock_in
      expect(response).to have_http_status(:ok)

      # Second clock in attempt
      post :clock_in
      expect(response).to have_http_status(:unprocessable_entity)
      json_response = JSON.parse(response.body)
      expect(json_response['error']['message']).to eq('Already clocked in today')
    end
  end

  describe 'GET #statistics' do
    let!(:attendance1) do
      create(:attendance,
             user: user,
             date: Date.current - 2.days,
             status: :clocked_out,
             total_work_minutes: 480,
             total_break_minutes: 60)
    end
    let!(:attendance2) do
      create(:attendance,
             user: user,
             date: Date.current - 1.day,
             status: :clocked_out,
             total_work_minutes: 450,
             total_break_minutes: 30)
    end

    context 'with date range parameters' do
      it 'returns statistics for the specified date range' do
        get :statistics, params: {
          start_date: (Date.current - 2.days).to_s,
          end_date: (Date.current - 1.day).to_s,
        }

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)

        stats = json_response['date_range_statistics']
        expect(stats['working_days']).to eq(2)
        expect(stats['total_work_minutes']).to eq(930)
        expect(stats['total_break_minutes']).to eq(90)
        expect(stats['formatted_total_work_time']).to eq('15:30')
        expect(stats['formatted_total_break_time']).to eq('01:30')
      end
    end

    context 'with year and month parameters' do
      it 'returns monthly statistics' do
        current_month = Date.current.month
        current_year = Date.current.year

        get :statistics, params: {
          year: current_year,
          month: current_month,
        }

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)

        stats = json_response['monthly_statistics']
        expect(stats['year']).to eq(current_year)
        expect(stats['month']).to eq(current_month)
        expect(stats['working_days']).to eq(2)
        expect(stats['total_work_minutes']).to eq(930)
      end
    end

    context 'with invalid parameters' do
      it 'returns error when no parameters provided' do
        get :statistics

        expect(response).to have_http_status(:bad_request)
        json_response = JSON.parse(response.body)
        expect(json_response['error']).to include('Please provide either year/month or start_date/end_date parameters')
      end

      it 'returns error for invalid date format' do
        get :statistics, params: {
          start_date: 'invalid-date',
          end_date: Date.current.to_s,
        }

        expect(response).to have_http_status(:bad_request)
        json_response = JSON.parse(response.body)
        expect(json_response['error']).to include('Invalid date format')
      end
    end
  end

  describe 'GET #monthly' do
    let!(:monthly_attendance1) do
      create(:attendance,
             user: user,
             date: Date.new(2024, 1, 15),
             status: :clocked_out,
             total_work_minutes: 480,
             total_break_minutes: 60)
    end
    let!(:monthly_attendance2) do
      create(:attendance,
             user: user,
             date: Date.new(2024, 1, 16),
             status: :clocked_out,
             total_work_minutes: 450,
             total_break_minutes: 30)
    end
    let!(:other_month_attendance) do
      create(:attendance,
             user: user,
             date: Date.new(2024, 2, 15),
             status: :clocked_out,
             total_work_minutes: 400,
             total_break_minutes: 45)
    end

    it 'returns attendances and statistics for the specified month' do
      get :monthly, params: { year: 2024, month: 1 }

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)

      # Check attendances
      attendances = json_response['attendances']
      expect(attendances.length).to eq(2)
      dates = attendances.map { |a| Date.parse(a['date']) }
      expect(dates).to all(satisfy { |date| date.month == 1 && date.year == 2024 })

      # Check statistics
      stats = json_response['statistics']
      expect(stats['year']).to eq(2024)
      expect(stats['month']).to eq(1)
      expect(stats['working_days']).to eq(2)
      expect(stats['total_work_minutes']).to eq(930)
      expect(stats['total_break_minutes']).to eq(90)
    end

    it 'returns error for invalid year or month' do
      get :monthly, params: { year: 'invalid', month: 1 }

      expect(response).to have_http_status(:bad_request)
      json_response = JSON.parse(response.body)
      expect(json_response['error']['message']).to eq('Invalid year or month')
    end
  end

  describe 'time calculations' do
    let!(:today_attendance) do
      create(:attendance,
             user: user,
             date: Date.current,
             status: :clocked_in,
             clock_in_time: 4.hours.ago,
             total_break_minutes: 0)
    end

    it 'calculates break time correctly when ending break' do
      # Start break
      break_start_time = 1.hour.ago
      create(:attendance_record,
             attendance: today_attendance,
             record_type: :break_start,
             timestamp: break_start_time)

      today_attendance.update!(status: :on_break)

      # End break
      post :break_end

      expect(response).to have_http_status(:ok)

      today_attendance.reload
      # Should be approximately 60 minutes (allowing for small timing differences)
      expect(today_attendance.total_break_minutes).to be_between(59, 61)
    end

    it 'accumulates multiple break periods' do
      # First break period
      create(:attendance_record,
             attendance: today_attendance,
             record_type: :break_start,
             timestamp: 3.hours.ago)
      create(:attendance_record,
             attendance: today_attendance,
             record_type: :break_end,
             timestamp: 2.5.hours.ago)

      today_attendance.update!(total_break_minutes: 30) # 30 minutes from first break

      # Second break period
      create(:attendance_record,
             attendance: today_attendance,
             record_type: :break_start,
             timestamp: 1.hour.ago)

      today_attendance.update!(status: :on_break)

      # End second break
      post :break_end

      expect(response).to have_http_status(:ok)

      today_attendance.reload
      # Should be approximately 90 minutes (30 + 60)
      expect(today_attendance.total_break_minutes).to be_between(89, 91)
    end
  end
end
