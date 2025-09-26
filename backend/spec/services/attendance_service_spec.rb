# spec/services/attendance_service_spec.rb
require 'rails_helper'

RSpec.describe AttendanceService, type: :service do
  let(:user) { create(:user) }
  let(:service) { AttendanceService.new(user) }

  describe '#find_or_create_today_attendance' do
    context 'when no attendance exists for today' do
      it 'creates a new attendance record' do
        expect do
          service.find_or_create_today_attendance
        end.to change(Attendance, :count).by(1)
      end

      it 'creates attendance with correct default values' do
        attendance = service.find_or_create_today_attendance

        expect(attendance.date).to eq(Date.current)
        expect(attendance.status).to eq('not_started')
        expect(attendance.total_work_minutes).to eq(0)
        expect(attendance.total_break_minutes).to eq(0)
        expect(attendance.user).to eq(user)
      end
    end

    context 'when attendance already exists for today' do
      let!(:existing_attendance) { create(:attendance, user: user, date: Date.current) }

      it 'does not create a new attendance record' do
        expect do
          service.find_or_create_today_attendance
        end.not_to change(Attendance, :count)
      end

      it 'returns the existing attendance' do
        attendance = service.find_or_create_today_attendance
        expect(attendance.id).to eq(existing_attendance.id)
      end
    end
  end

  describe '#clock_in' do
    let(:attendance) { create(:attendance, user: user, status: :not_started) }

    context 'when user can clock in' do
      it 'successfully clocks in the user' do
        result = service.clock_in(attendance)

        expect(result[:success]).to be true
        expect(result[:message]).to eq('Successfully clocked in')

        attendance.reload
        expect(attendance.status).to eq('clocked_in')
        expect(attendance.clock_in_time).to be_present
      end

      it 'creates a clock_in attendance record' do
        expect do
          service.clock_in(attendance)
        end.to change { attendance.attendance_records.clock_in.count }.by(1)

        record = attendance.attendance_records.clock_in.last
        expect(record.timestamp).to be_within(1.second).of(Time.current)
      end
    end

    context 'when user cannot clock in' do
      let(:attendance) { create(:attendance, user: user, status: :clocked_in) }

      it 'raises InvalidStateError' do
        expect do
          service.clock_in(attendance)
        end.to raise_error(ServiceErrors::InvalidStateError, 'Already clocked in today')
      end

      it 'does not create attendance record' do
        expect do
          expect { service.clock_in(attendance) }.to raise_error(ServiceErrors::InvalidStateError)
        end.not_to(change { attendance.attendance_records.count })
      end
    end

    context 'when database error occurs' do
      before do
        allow(attendance).to receive(:update!).and_raise(ActiveRecord::RecordInvalid.new(attendance))
        allow(attendance.errors).to receive(:full_messages).and_return(['Test error'])
      end

      it 'raises AttendanceError' do
        expect { service.clock_in(attendance) }.to raise_error(ServiceErrors::AttendanceError) do |error|
          expect(error.message).to eq('Validation failed')
          expect(error.details).to eq(['Test error'])
        end
      end
    end
  end

  describe '#clock_out' do
    context 'when user is clocked in' do
      let(:attendance) do
        create(:attendance,
               user: user,
               status: :clocked_in,
               clock_in_time: 2.hours.ago)
      end

      it 'successfully clocks out the user' do
        result = service.clock_out(attendance)

        expect(result[:success]).to be true
        expect(result[:message]).to eq('Successfully clocked out')

        attendance.reload
        expect(attendance.status).to eq('clocked_out')
        expect(attendance.clock_out_time).to be_present
      end

      it 'creates a clock_out attendance record' do
        expect do
          service.clock_out(attendance)
        end.to change { attendance.attendance_records.clock_out.count }.by(1)
      end
    end

    context 'when user is on break' do
      let(:attendance) do
        create(:attendance,
               user: user,
               status: :on_break,
               clock_in_time: 2.hours.ago,
               total_break_minutes: 0)
      end
      let!(:break_start_record) do
        create(:attendance_record,
               attendance: attendance,
               record_type: :break_start,
               timestamp: 30.minutes.ago)
      end

      it 'ends break and clocks out the user' do
        result = service.clock_out(attendance)

        expect(result[:success]).to be true
        expect(result[:message]).to eq('Successfully clocked out')

        attendance.reload
        expect(attendance.status).to eq('clocked_out')
        expect(attendance.total_break_minutes).to be > 0
      end

      it 'creates both break_end and clock_out records' do
        expect do
          service.clock_out(attendance)
        end.to change { attendance.attendance_records.break_end.count }.by(1)

        expect(attendance.attendance_records.clock_out.count).to eq(1)
      end
    end

    context 'when user cannot clock out' do
      let(:attendance) { create(:attendance, user: user, status: :not_started) }

      it 'raises InvalidStateError' do
        expect do
          service.clock_out(attendance)
        end.to raise_error(ServiceErrors::InvalidStateError,
                           'Cannot clock out. Must be clocked in first')
      end
    end
  end

  describe '#start_break' do
    context 'when user can start break' do
      let(:attendance) do
        create(:attendance,
               user: user,
               status: :clocked_in,
               clock_in_time: 1.hour.ago)
      end

      it 'successfully starts break' do
        result = service.start_break(attendance)

        expect(result[:success]).to be true
        expect(result[:message]).to eq('Break started')

        attendance.reload
        expect(attendance.status).to eq('on_break')
      end

      it 'creates a break_start attendance record' do
        expect do
          service.start_break(attendance)
        end.to change { attendance.attendance_records.break_start.count }.by(1)
      end
    end

    context 'when user cannot start break' do
      let(:attendance) { create(:attendance, user: user, status: :not_started) }

      it 'raises InvalidStateError' do
        expect do
          service.start_break(attendance)
        end.to raise_error(ServiceErrors::InvalidStateError,
                           'Cannot start break. Must be clocked in first')
      end
    end
  end

  describe '#end_break' do
    context 'when user can end break' do
      let(:attendance) do
        create(:attendance,
               user: user,
               status: :on_break,
               clock_in_time: 2.hours.ago,
               total_break_minutes: 0)
      end
      let!(:break_start_record) do
        create(:attendance_record,
               attendance: attendance,
               record_type: :break_start,
               timestamp: 30.minutes.ago)
      end

      it 'successfully ends break' do
        result = service.end_break(attendance)

        expect(result[:success]).to be true
        expect(result[:message]).to eq('Break ended')

        attendance.reload
        expect(attendance.status).to eq('clocked_in')
      end

      it 'calculates and adds break time' do
        service.end_break(attendance)

        attendance.reload
        # Should be approximately 30 minutes
        expect(attendance.total_break_minutes).to be_between(29, 31)
      end

      it 'creates a break_end attendance record' do
        expect do
          service.end_break(attendance)
        end.to change { attendance.attendance_records.break_end.count }.by(1)
      end
    end

    context 'when user cannot end break' do
      let(:attendance) { create(:attendance, user: user, status: :clocked_in) }

      it 'raises InvalidStateError' do
        expect do
          service.end_break(attendance)
        end.to raise_error(ServiceErrors::InvalidStateError,
                           'Cannot end break. Must be on break first')
      end
    end

    context 'when no break_start record exists' do
      let(:attendance) do
        create(:attendance,
               user: user,
               status: :on_break,
               total_break_minutes: 0)
      end

      it 'does not add break time' do
        service.end_break(attendance)

        attendance.reload
        expect(attendance.total_break_minutes).to eq(0)
      end
    end
  end

  describe 'break time calculation' do
    let(:attendance) do
      create(:attendance,
             user: user,
             status: :on_break,
             total_break_minutes: 30) # Previous break time
    end

    context 'with multiple break periods' do
      let!(:first_break_start) do
        create(:attendance_record,
               attendance: attendance,
               record_type: :break_start,
               timestamp: 3.hours.ago)
      end
      let!(:first_break_end) do
        create(:attendance_record,
               attendance: attendance,
               record_type: :break_end,
               timestamp: 2.5.hours.ago)
      end
      let!(:second_break_start) do
        create(:attendance_record,
               attendance: attendance,
               record_type: :break_start,
               timestamp: 1.hour.ago)
      end

      it 'calculates break time from the most recent break_start' do
        service.end_break(attendance)

        attendance.reload
        # Should be 30 (previous) + ~60 (current break) = ~90 minutes
        expect(attendance.total_break_minutes).to be_between(89, 91)
      end
    end
  end

  describe 'error handling' do
    let(:attendance) { create(:attendance, user: user, status: :not_started) }

    context 'when standard error occurs' do
      before do
        allow(attendance).to receive(:update!).and_raise(StandardError.new('Database connection failed'))
      end

      it 'raises AttendanceError' do
        expect { service.clock_in(attendance) }.to raise_error(ServiceErrors::AttendanceError) do |error|
          expect(error.message).to eq('Attendance operation failed')
          expect(error.details).to eq('Database connection failed')
        end
      end
    end
  end

  describe 'transaction rollback' do
    let(:attendance) { create(:attendance, user: user, status: :not_started) }

    context 'when attendance record creation fails' do
      before do
        allow_any_instance_of(AttendanceRecord).to receive(:save!).and_raise(ActiveRecord::RecordInvalid.new(AttendanceRecord.new))
      end

      it 'rolls back attendance status change' do
        original_status = attendance.status

        expect { service.clock_in(attendance) }.to raise_error(ServiceErrors::AttendanceError)

        attendance.reload
        expect(attendance.status).to eq(original_status)
      end
    end
  end
end
