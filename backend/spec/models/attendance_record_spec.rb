require 'rails_helper'

RSpec.describe AttendanceRecord, type: :model do
  let(:user) { create(:user) }
  let(:attendance) { create(:attendance, user: user) }

  describe 'associations' do
    it { should belong_to(:attendance) }
  end

  describe 'validations' do
    subject { build(:attendance_record, attendance: attendance) }

    it { should validate_presence_of(:record_type) }
    it { should validate_presence_of(:timestamp) }
    it { should validate_presence_of(:attendance_id) }
  end

  describe 'enums' do
    it 'defines record_type enum correctly' do
      expect(AttendanceRecord.record_types).to eq({
                                                    'clock_in' => 0,
                                                    'clock_out' => 1,
                                                    'break_start' => 2,
                                                    'break_end' => 3,
                                                  })
    end

    it 'allows setting record_type using enum values' do
      record = build(:attendance_record, attendance: attendance)

      record.record_type = :clock_in
      expect(record.clock_in?).to be true

      record.record_type = :clock_out
      expect(record.clock_out?).to be true

      record.record_type = :break_start
      expect(record.break_start?).to be true

      record.record_type = :break_end
      expect(record.break_end?).to be true
    end
  end

  describe 'scopes' do
    let(:today) { Date.current }
    let(:yesterday) { Date.current - 1.day }
    let(:other_user) { create(:user) }
    let(:today_attendance) { create(:attendance, user: user, date: today) }
    let(:yesterday_attendance) { create(:attendance, user: user, date: yesterday) }
    let(:other_user_attendance) { create(:attendance, user: other_user, date: today) }

    before do
      # Create records for today
      @today_record1 = create(:attendance_record,
                              attendance: today_attendance,
                              record_type: :clock_in,
                              timestamp: Time.current.beginning_of_day + 9.hours)
      @today_record2 = create(:attendance_record,
                              attendance: today_attendance,
                              record_type: :clock_out,
                              timestamp: Time.current.beginning_of_day + 17.hours)

      # Create records for yesterday
      @yesterday_record = create(:attendance_record,
                                 attendance: yesterday_attendance,
                                 record_type: :clock_in,
                                 timestamp: yesterday.beginning_of_day + 9.hours)

      # Create records for other user
      @other_user_record = create(:attendance_record,
                                  attendance: other_user_attendance,
                                  record_type: :clock_in,
                                  timestamp: Time.current.beginning_of_day + 10.hours)
    end

    describe '.for_date' do
      it 'returns records for the specified date' do
        records = AttendanceRecord.for_date(today)
        expect(records).to include(@today_record1, @today_record2, @other_user_record)
        expect(records).not_to include(@yesterday_record)
      end
    end

    describe '.for_user' do
      it 'returns records for the specified user' do
        records = AttendanceRecord.for_user(user)
        expect(records).to include(@today_record1, @today_record2, @yesterday_record)
        expect(records).not_to include(@other_user_record)
      end
    end

    describe '.ordered_by_time' do
      it 'returns records ordered by timestamp' do
        records = AttendanceRecord.for_date(today).ordered_by_time
        expect(records.first).to eq(@today_record1) # 9:00 AM
        expect(records.second).to eq(@other_user_record) # 10:00 AM
        expect(records.third).to eq(@today_record2) # 5:00 PM
      end
    end
  end

  describe 'timestamp accuracy' do
    it 'records timestamp with precision' do
      timestamp = Time.current
      record = create(:attendance_record,
                      attendance: attendance,
                      record_type: :clock_in,
                      timestamp: timestamp)

      expect(record.timestamp).to be_within(1.second).of(timestamp)
    end

    it 'preserves timezone information' do
      timestamp = Time.zone.parse('2023-12-25 09:00:00')
      record = create(:attendance_record,
                      attendance: attendance,
                      record_type: :clock_in,
                      timestamp: timestamp)

      expect(record.timestamp.zone).to eq(timestamp.zone)
    end
  end

  describe 'factory' do
    it 'creates valid attendance record' do
      record = build(:attendance_record, attendance: attendance)
      expect(record).to be_valid
    end

    it 'creates attendance record with all required attributes' do
      record = create(:attendance_record, attendance: attendance)
      expect(record.attendance).to eq(attendance)
      expect(record.record_type).to be_present
      expect(record.timestamp).to be_present
    end
  end

  describe 'integration with attendance' do
    it 'is destroyed when attendance is destroyed' do
      create(:attendance_record, attendance: attendance)
      expect { attendance.destroy }.to change { AttendanceRecord.count }.by(-1)
    end

    it 'can access attendance through association' do
      record = create(:attendance_record, attendance: attendance)
      expect(record.attendance.user).to eq(user)
    end
  end
end
