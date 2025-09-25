# spec/services/attendance_query_service_spec.rb
require 'rails_helper'

RSpec.describe AttendanceQueryService, type: :service do
  let(:user) { create(:user) }
  let(:service) { AttendanceQueryService.new(user) }

  describe '#fetch_attendances_with_filtering' do
    let!(:attendance1) { create(:attendance, user: user, date: Date.current - 1.day) }
    let!(:attendance2) { create(:attendance, user: user, date: Date.current - 2.days) }
    let!(:attendance3) { create(:attendance, user: user, date: Date.current - 3.days) }
    let!(:other_user_attendance) { create(:attendance, date: Date.current) }

    context 'without date filtering' do
      it 'returns user attendances ordered by date desc' do
        attendances = service.fetch_attendances_with_filtering

        expect(attendances.count).to eq(3)
        expect(attendances.first.date).to eq(Date.current - 1.day)
        expect(attendances.last.date).to eq(Date.current - 3.days)
      end

      it 'limits results to 30 records' do
        # Create 35 attendances with different dates
        35.times do |i|
          create(:attendance, user: user, date: Date.current - (i + 10).days)
        end

        attendances = service.fetch_attendances_with_filtering

        expect(attendances.count).to eq(30)
      end

      it 'includes attendance_records association' do
        create(:attendance_record, attendance: attendance1)

        attendances = service.fetch_attendances_with_filtering

        expect(attendances.first.association(:attendance_records)).to be_loaded
      end
    end

    context 'with date filtering' do
      let(:service_with_params) do
        AttendanceQueryService.new(user, {
                                     start_date: (Date.current - 2.days).to_s,
                                     end_date: (Date.current - 1.day).to_s,
                                   })
      end

      it 'filters attendances by date range' do
        attendances = service_with_params.fetch_attendances_with_filtering

        expect(attendances.count).to eq(2)
        dates = attendances.map(&:date)
        expect(dates).to include(Date.current - 1.day, Date.current - 2.days)
        expect(dates).not_to include(Date.current - 3.days)
      end
    end

    context 'with invalid date format' do
      let(:service_with_invalid_params) do
        AttendanceQueryService.new(user, {
                                     start_date: 'invalid-date',
                                     end_date: Date.current.to_s,
                                   })
      end

      it 'raises ArgumentError for invalid date' do
        expect do
          service_with_invalid_params.fetch_attendances_with_filtering
        end.to raise_error(ArgumentError)
      end
    end
  end

  describe '#fetch_monthly_statistics' do
    let(:year) { 2024 }
    let(:month) { 1 }
    let!(:jan_attendance1) do
      create(:attendance,
             user: user,
             date: Date.new(2024, 1, 15),
             status: :clocked_out,
             total_work_minutes: 480,
             total_break_minutes: 60)
    end
    let!(:jan_attendance2) do
      create(:attendance,
             user: user,
             date: Date.new(2024, 1, 16),
             status: :clocked_out,
             total_work_minutes: 450,
             total_break_minutes: 30)
    end
    let!(:feb_attendance) do
      create(:attendance,
             user: user,
             date: Date.new(2024, 2, 15),
             status: :clocked_out,
             total_work_minutes: 400,
             total_break_minutes: 45)
    end
    let!(:incomplete_attendance) do
      create(:attendance,
             user: user,
             date: Date.new(2024, 1, 17),
             status: :clocked_in,
             total_work_minutes: 0,
             total_break_minutes: 0)
    end

    it 'returns statistics for the specified month' do
      stats = service.fetch_monthly_statistics(year, month)

      expect(stats[:year]).to eq(2024)
      expect(stats[:month]).to eq(1)
      expect(stats[:working_days]).to eq(2) # Only completed attendances
      expect(stats[:total_work_minutes]).to eq(930) # 480 + 450
      expect(stats[:total_break_minutes]).to eq(90) # 60 + 30
    end

    it 'calculates formatted time strings' do
      stats = service.fetch_monthly_statistics(year, month)

      expect(stats[:formatted_total_work_time]).to eq('15:30') # 930 minutes
      expect(stats[:formatted_total_break_time]).to eq('01:30') # 90 minutes
    end

    it 'calculates average work time per day' do
      stats = service.fetch_monthly_statistics(year, month)

      expect(stats[:average_work_minutes_per_day]).to eq(465) # 930 / 2
      expect(stats[:formatted_average_work_time_per_day]).to eq('07:45')
    end

    it 'excludes incomplete attendances' do
      stats = service.fetch_monthly_statistics(year, month)

      # Should not include the incomplete_attendance
      expect(stats[:working_days]).to eq(2)
    end

    it 'excludes attendances from other months' do
      stats = service.fetch_monthly_statistics(year, month)

      # Should not include feb_attendance
      expect(stats[:total_work_minutes]).to eq(930)
    end

    context 'when no attendances exist for the month' do
      it 'returns zero statistics' do
        stats = service.fetch_monthly_statistics(2024, 12)

        expect(stats[:working_days]).to eq(0)
        expect(stats[:total_work_minutes]).to eq(0)
        expect(stats[:total_break_minutes]).to eq(0)
        expect(stats[:average_work_minutes_per_day]).to eq(0)
        expect(stats[:formatted_total_work_time]).to eq('00:00')
      end
    end
  end

  describe '#fetch_date_range_statistics' do
    let(:start_date) { Date.new(2024, 1, 15) }
    let(:end_date) { Date.new(2024, 1, 17) }
    let!(:attendance1) do
      create(:attendance,
             user: user,
             date: Date.new(2024, 1, 15),
             status: :clocked_out,
             total_work_minutes: 480,
             total_break_minutes: 60)
    end
    let!(:attendance2) do
      create(:attendance,
             user: user,
             date: Date.new(2024, 1, 16),
             status: :clocked_out,
             total_work_minutes: 450,
             total_break_minutes: 30)
    end
    let!(:outside_range_attendance) do
      create(:attendance,
             user: user,
             date: Date.new(2024, 1, 20),
             status: :clocked_out,
             total_work_minutes: 400,
             total_break_minutes: 45)
    end

    it 'returns statistics for the specified date range' do
      stats = service.fetch_date_range_statistics(start_date, end_date)

      expect(stats[:start_date]).to eq(start_date)
      expect(stats[:end_date]).to eq(end_date)
      expect(stats[:total_days]).to eq(3) # 15, 16, 17
      expect(stats[:working_days]).to eq(2) # Only completed attendances
      expect(stats[:total_work_minutes]).to eq(930) # 480 + 450
      expect(stats[:total_break_minutes]).to eq(90) # 60 + 30
    end

    it 'excludes attendances outside the date range' do
      stats = service.fetch_date_range_statistics(start_date, end_date)

      # Should not include outside_range_attendance
      expect(stats[:total_work_minutes]).to eq(930)
    end

    it 'calculates total days correctly for single day range' do
      stats = service.fetch_date_range_statistics(start_date, start_date)

      expect(stats[:total_days]).to eq(1)
    end
  end

  describe 'private methods' do
    describe '#format_minutes' do
      let(:service) { AttendanceQueryService.new(user) }

      it 'formats minutes correctly' do
        expect(service.send(:format_minutes, 0)).to eq('00:00')
        expect(service.send(:format_minutes, 60)).to eq('01:00')
        expect(service.send(:format_minutes, 90)).to eq('01:30')
        expect(service.send(:format_minutes, 480)).to eq('08:00')
        expect(service.send(:format_minutes, 930)).to eq('15:30')
      end

      it 'handles nil and negative values' do
        expect(service.send(:format_minutes, nil)).to eq('00:00')
        expect(service.send(:format_minutes, -30)).to eq('00:00')
      end

      it 'handles large values' do
        expect(service.send(:format_minutes, 1440)).to eq('24:00') # 24 hours
        expect(service.send(:format_minutes, 1500)).to eq('25:00') # 25 hours
      end
    end

    describe '#calculate_average_work_minutes' do
      let(:service) { AttendanceQueryService.new(user) }

      it 'calculates average correctly' do
        expect(service.send(:calculate_average_work_minutes, 2, 930)).to eq(465)
        expect(service.send(:calculate_average_work_minutes, 5, 2400)).to eq(480)
      end

      it 'returns 0 when no working days' do
        expect(service.send(:calculate_average_work_minutes, 0, 480)).to eq(0)
      end

      it 'handles integer division correctly' do
        expect(service.send(:calculate_average_work_minutes, 3, 500)).to eq(166) # 500/3 = 166.67 -> 166
      end
    end

    describe '#build_basic_stats' do
      let(:service) { AttendanceQueryService.new(user) }
      let(:attendances) do
        [
          double('Attendance', total_work_minutes: 480, total_break_minutes: 60),
          double('Attendance', total_work_minutes: 450, total_break_minutes: 30),
        ]
      end

      before do
        allow(attendances).to receive(:sum).with(:total_work_minutes).and_return(930)
        allow(attendances).to receive(:sum).with(:total_break_minutes).and_return(90)
        allow(attendances).to receive(:count).and_return(2)
      end

      it 'builds comprehensive statistics' do
        stats = service.send(:build_basic_stats, attendances)

        expect(stats[:working_days]).to eq(2)
        expect(stats[:total_work_minutes]).to eq(930)
        expect(stats[:total_break_minutes]).to eq(90)
        expect(stats[:formatted_total_work_time]).to eq('15:30')
        expect(stats[:formatted_total_break_time]).to eq('01:30')
        expect(stats[:average_work_minutes_per_day]).to eq(465)
        expect(stats[:formatted_average_work_time_per_day]).to eq('07:45')
      end
    end
  end

  describe 'edge cases' do
    context 'when user has no attendances' do
      let(:empty_user) { create(:user) }
      let(:empty_service) { AttendanceQueryService.new(empty_user) }

      it 'returns empty results for fetch_attendances_with_filtering' do
        attendances = empty_service.fetch_attendances_with_filtering
        expect(attendances.count).to eq(0)
      end

      it 'returns zero statistics for monthly stats' do
        stats = empty_service.fetch_monthly_statistics(2024, 1)
        expect(stats[:working_days]).to eq(0)
        expect(stats[:total_work_minutes]).to eq(0)
      end

      it 'returns zero statistics for date range stats' do
        stats = empty_service.fetch_date_range_statistics(Date.current, Date.current)
        expect(stats[:working_days]).to eq(0)
        expect(stats[:total_work_minutes]).to eq(0)
      end
    end

    context 'with boundary dates' do
      let!(:boundary_attendance) do
        create(:attendance,
               user: user,
               date: Date.new(2024, 1, 31), # Last day of January
               status: :clocked_out,
               total_work_minutes: 480)
      end

      it 'includes boundary dates in monthly statistics' do
        stats = service.fetch_monthly_statistics(2024, 1)
        expect(stats[:working_days]).to eq(1)
        expect(stats[:total_work_minutes]).to eq(480)
      end

      it 'includes boundary dates in date range statistics' do
        stats = service.fetch_date_range_statistics(Date.new(2024, 1, 31), Date.new(2024, 1, 31))
        expect(stats[:working_days]).to eq(1)
        expect(stats[:total_work_minutes]).to eq(480)
      end
    end
  end
end
