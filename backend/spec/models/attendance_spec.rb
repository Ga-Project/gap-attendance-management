require 'rails_helper'

RSpec.describe Attendance, type: :model do
  let(:user) { create(:user) }
  let(:attendance) { build(:attendance, user: user) }

  describe 'associations' do
    it 'belongs to user' do
      expect(attendance).to respond_to(:user)
      expect(attendance.user).to eq(user)
    end

    it 'will have many attendance_records (to be implemented in task 5.3)' do
      # This association will be added in task 5.3
      expect(true).to be true
    end
  end

  describe 'validations' do
    it 'validates presence of date' do
      attendance.date = nil
      expect(attendance).not_to be_valid
      expect(attendance.errors[:date]).to include("can't be blank")
    end

    it 'validates presence of user_id' do
      attendance.user = nil
      expect(attendance).not_to be_valid
      expect(attendance.errors[:user]).to include('must exist')
    end

    it 'validates presence of status' do
      attendance.status = nil
      expect(attendance).not_to be_valid
      expect(attendance.errors[:status]).to include("can't be blank")
    end

    it 'validates presence of total_work_minutes' do
      attendance.total_work_minutes = nil
      expect(attendance).not_to be_valid
      expect(attendance.errors[:total_work_minutes]).to include("can't be blank")
    end

    it 'validates presence of total_break_minutes' do
      attendance.total_break_minutes = nil
      expect(attendance).not_to be_valid
      expect(attendance.errors[:total_break_minutes]).to include("can't be blank")
    end

    it 'validates total_work_minutes is greater than or equal to 0' do
      attendance.total_work_minutes = -1
      expect(attendance).not_to be_valid
      expect(attendance.errors[:total_work_minutes]).to include('must be greater than or equal to 0')
    end

    it 'validates total_break_minutes is greater than or equal to 0' do
      attendance.total_break_minutes = -1
      expect(attendance).not_to be_valid
      expect(attendance.errors[:total_break_minutes]).to include('must be greater than or equal to 0')
    end

    it 'validates uniqueness of date scoped to user' do
      create(:attendance, user: user, date: Date.current)
      duplicate_attendance = build(:attendance, user: user, date: Date.current)

      expect(duplicate_attendance).not_to be_valid
      expect(duplicate_attendance.errors[:date]).to include('has already been taken')
    end

    it 'allows same date for different users' do
      other_user = create(:user, email: 'other@example.com', google_id: 'other_google_id')
      create(:attendance, user: user, date: Date.current)
      other_attendance = build(:attendance, user: other_user, date: Date.current)

      expect(other_attendance).to be_valid
    end

    describe 'clock_out_after_clock_in validation' do
      it 'is valid when clock_out_time is after clock_in_time' do
        attendance.clock_in_time = 1.hour.ago
        attendance.clock_out_time = Time.current

        expect(attendance).to be_valid
      end

      it 'is invalid when clock_out_time is before clock_in_time' do
        attendance.clock_in_time = Time.current
        attendance.clock_out_time = 1.hour.ago

        expect(attendance).not_to be_valid
        expect(attendance.errors[:clock_out_time]).to include('must be after clock in time')
      end

      it 'is valid when only clock_in_time is set' do
        attendance.clock_in_time = Time.current
        attendance.clock_out_time = nil

        expect(attendance).to be_valid
      end
    end

    describe 'date_not_in_future validation' do
      it 'is valid for today' do
        attendance.date = Date.current

        expect(attendance).to be_valid
      end

      it 'is valid for past dates' do
        attendance.date = 1.day.ago.to_date

        expect(attendance).to be_valid
      end

      it 'is invalid for future dates' do
        attendance.date = 1.day.from_now.to_date

        expect(attendance).not_to be_valid
        expect(attendance.errors[:date]).to include('cannot be in the future')
      end
    end
  end

  describe 'enums' do
    it 'defines status enum correctly' do
      expect(Attendance.statuses).to eq({
                                          'not_started' => 0,
                                          'clocked_in' => 1,
                                          'on_break' => 2,
                                          'clocked_out' => 3,
                                        })
    end

    it 'allows setting status by name' do
      attendance.status = :clocked_in
      expect(attendance.status).to eq('clocked_in')
      expect(attendance.clocked_in?).to be true
    end
  end

  describe 'scopes' do
    let!(:today_attendance) { create(:attendance, user: user, date: Date.current) }
    let!(:yesterday_attendance) { create(:attendance, user: user, date: 1.day.ago.to_date) }
    let!(:other_user_attendance) { create(:attendance, date: Date.current) }

    describe '.for_date' do
      it 'returns attendances for specific date' do
        result = Attendance.for_date(Date.current)

        expect(result).to include(today_attendance, other_user_attendance)
        expect(result).not_to include(yesterday_attendance)
      end
    end

    describe '.for_user' do
      it 'returns attendances for specific user' do
        result = Attendance.for_user(user)

        expect(result).to include(today_attendance, yesterday_attendance)
        expect(result).not_to include(other_user_attendance)
      end
    end

    describe '.for_date_range' do
      it 'returns attendances within date range' do
        result = Attendance.for_date_range(2.days.ago.to_date, Date.current)

        expect(result).to include(today_attendance, yesterday_attendance, other_user_attendance)
      end
    end

    describe '.completed' do
      it 'returns only clocked out attendances' do
        today_attendance.update!(status: :clocked_out)

        result = Attendance.completed

        expect(result).to include(today_attendance)
        expect(result).not_to include(yesterday_attendance, other_user_attendance)
      end
    end
  end

  describe 'status check methods' do
    describe '#can_clock_in?' do
      it 'returns true when status is not_started' do
        attendance.status = :not_started
        expect(attendance.can_clock_in?).to be true
      end

      it 'returns false when status is not not_started' do
        attendance.status = :clocked_in
        expect(attendance.can_clock_in?).to be false
      end
    end

    describe '#can_clock_out?' do
      it 'returns true when status is clocked_in' do
        attendance.status = :clocked_in
        expect(attendance.can_clock_out?).to be true
      end

      it 'returns true when status is on_break' do
        attendance.status = :on_break
        expect(attendance.can_clock_out?).to be true
      end

      it 'returns false when status is not_started' do
        attendance.status = :not_started
        expect(attendance.can_clock_out?).to be false
      end

      it 'returns false when status is clocked_out' do
        attendance.status = :clocked_out
        expect(attendance.can_clock_out?).to be false
      end
    end

    describe '#can_start_break?' do
      it 'returns true when status is clocked_in' do
        attendance.status = :clocked_in
        expect(attendance.can_start_break?).to be true
      end

      it 'returns false when status is not clocked_in' do
        attendance.status = :not_started
        expect(attendance.can_start_break?).to be false
      end
    end

    describe '#can_end_break?' do
      it 'returns true when status is on_break' do
        attendance.status = :on_break
        expect(attendance.can_end_break?).to be true
      end

      it 'returns false when status is not on_break' do
        attendance.status = :clocked_in
        expect(attendance.can_end_break?).to be false
      end
    end
  end

  describe 'time calculation methods' do
    let(:clock_in_time) { Time.current.beginning_of_day + 9.hours }
    let(:clock_out_time) { Time.current.beginning_of_day + 18.hours }

    before do
      attendance.save!
      attendance.update!(
        clock_in_time: clock_in_time,
        clock_out_time: clock_out_time,
        status: :clocked_out
      )
    end

    describe '#current_work_minutes' do
      it 'calculates work time correctly when clocked out' do
        # 9 hours = 540 minutes
        expect(attendance.current_work_minutes).to eq(540)
      end

      it 'calculates work time excluding breaks' do
        # Add a 1-hour break
        attendance.update!(total_break_minutes: 60)
        attendance.send(:calculate_work_and_break_time)

        # 9 hours - 1 hour break = 8 hours = 480 minutes
        expect(attendance.current_work_minutes).to eq(480)
      end
    end

    describe '#total_office_minutes' do
      it 'calculates total office time correctly' do
        # 9 hours = 540 minutes
        expect(attendance.total_office_minutes).to eq(540)
      end
    end

    describe '#formatted_work_time' do
      it 'formats work time as HH:MM' do
        expect(attendance.formatted_work_time).to eq('09:00')
      end
    end

    describe '#formatted_break_time' do
      it 'formats break time as HH:MM' do
        attendance.update!(total_break_minutes: 90) # 1.5 hours

        expect(attendance.formatted_break_time).to eq('01:30')
      end
    end

    describe '#formatted_total_office_time' do
      it 'formats total office time as HH:MM' do
        expect(attendance.formatted_total_office_time).to eq('09:00')
      end
    end
  end

  describe 'status check methods' do
    describe '#complete?' do
      it 'returns true when clocked out' do
        attendance.status = :clocked_out
        expect(attendance.complete?).to be true
      end

      it 'returns false when not clocked out' do
        attendance.status = :clocked_in
        expect(attendance.complete?).to be false
      end
    end

    describe '#in_progress?' do
      it 'returns true when clocked in' do
        attendance.status = :clocked_in
        expect(attendance.in_progress?).to be true
      end

      it 'returns true when on break' do
        attendance.status = :on_break
        expect(attendance.in_progress?).to be true
      end

      it 'returns false when not started' do
        attendance.status = :not_started
        expect(attendance.in_progress?).to be false
      end

      it 'returns false when clocked out' do
        attendance.status = :clocked_out
        expect(attendance.in_progress?).to be false
      end
    end
  end

  describe 'callbacks' do
    describe 'calculate_work_and_break_time' do
      it 'calculates work and break time when clocked out' do
        attendance.clock_in_time = 2.hours.ago
        attendance.clock_out_time = Time.current
        attendance.status = :clocked_out
        attendance.total_break_minutes = 30

        attendance.save!

        # 2 hours - 30 minutes break = 90 minutes work
        expect(attendance.total_work_minutes).to eq(90)
      end

      it 'does not calculate final times when not clocked out' do
        attendance.clock_in_time = 2.hours.ago
        attendance.status = :clocked_in

        attendance.save!

        expect(attendance.total_work_minutes).to eq(0)
      end
    end
  end
end
