require 'rails_helper'

RSpec.describe AuditLog, type: :model do
  let(:admin_user) { create(:user, role: :admin) }
  let(:target_user) { create(:user) }
  let(:audit_log) do
    create(:audit_log,
           user: admin_user,
           target_user: target_user,
           action: 'update_attendance',
           change_data: { 'clock_in_time' => ['09:00', '08:30'] },
           reason: 'Employee requested correction')
  end

  describe 'associations' do
    it { should belong_to(:user) }
    it { should belong_to(:target_user).class_name('User') }
  end

  describe 'validations' do
    it { should validate_presence_of(:action) }
    it { should validate_presence_of(:reason) }
  end

  describe 'scopes' do
    let!(:audit_log1) { create(:audit_log, action: 'update_attendance', target_user: target_user) }
    let!(:audit_log2) { create(:audit_log, action: 'delete_attendance', target_user: target_user) }
    let!(:audit_log3) { create(:audit_log, action: 'update_attendance', target_user: create(:user)) }

    describe '.by_action' do
      it 'filters by action' do
        expect(AuditLog.by_action('update_attendance')).to include(audit_log1, audit_log3)
        expect(AuditLog.by_action('update_attendance')).not_to include(audit_log2)
      end

      it 'returns all records when action is blank' do
        expect(AuditLog.by_action(nil).count).to eq(AuditLog.count)
      end
    end

    describe '.by_target_user' do
      it 'filters by target user' do
        expect(AuditLog.by_target_user(target_user.id)).to include(audit_log1, audit_log2)
        expect(AuditLog.by_target_user(target_user.id)).not_to include(audit_log3)
      end
    end

    describe '.by_admin_user' do
      it 'filters by admin user' do
        admin2 = create(:user, role: :admin)
        audit_log4 = create(:audit_log, user: admin2)

        # Create audit logs with the same admin user
        audit_log_by_admin = create(:audit_log, user: admin_user, target_user: target_user)

        expect(AuditLog.by_admin_user(admin_user.id)).to include(audit_log_by_admin)
        expect(AuditLog.by_admin_user(admin_user.id)).not_to include(audit_log4)
      end
    end

    describe '.by_date_range' do
      it 'filters by date range' do
        old_log = create(:audit_log, created_at: 1.week.ago)
        recent_log = create(:audit_log, created_at: 1.day.ago)

        start_date = 3.days.ago.to_date
        end_date = Date.current

        expect(AuditLog.by_date_range(start_date, end_date)).to include(recent_log)
        expect(AuditLog.by_date_range(start_date, end_date)).not_to include(old_log)
      end
    end

    describe '.recent' do
      it 'orders by created_at desc' do
        expect(AuditLog.recent.first.created_at).to be >= AuditLog.recent.last.created_at
      end
    end
  end

  describe '.log_change' do
    it 'creates an audit log with the provided parameters' do
      changes = { 'clock_in_time' => ['09:00', '08:30'] }
      reason = 'Employee requested correction'

      expect do
        AuditLog.log_change(
          admin_user: admin_user,
          target_user: target_user,
          action: 'update_attendance',
          changes: changes,
          reason: reason
        )
      end.to change(AuditLog, :count).by(1)

      log = AuditLog.last
      expect(log.user).to eq(admin_user)
      expect(log.target_user).to eq(target_user)
      expect(log.action).to eq('update_attendance')
      expect(log.change_data).to eq(changes)
      expect(log.reason).to eq(reason)
    end
  end

  describe '#admin_user' do
    it 'returns the user who performed the action' do
      expect(audit_log.admin_user).to eq(admin_user)
    end
  end

  describe '#formatted_changes' do
    context 'when change_data is blank' do
      it 'returns empty hash' do
        audit_log.change_data = nil
        expect(audit_log.formatted_changes).to eq({})
      end
    end

    context 'when change_data contains array values' do
      it 'formats changes with from/to structure' do
        audit_log.change_data = { 'clock_in_time' => ['09:00', '08:30'] }
        expected = {
          'clock_in_time' => {
            from: '09:00',
            to: '08:30',
          },
        }
        expect(audit_log.formatted_changes).to eq(expected)
      end
    end

    context 'when change_data contains non-array values' do
      it 'returns the value as is' do
        audit_log.change_data = { 'status' => 'active' }
        expect(audit_log.formatted_changes).to eq({ 'status' => 'active' })
      end
    end
  end

  describe '#change_summary' do
    context 'when change_data is blank' do
      it 'returns no changes message' do
        audit_log.change_data = nil
        expect(audit_log.change_summary).to eq('No changes recorded')
      end
    end

    context 'when change_data contains formatted data' do
      it 'returns human readable summary' do
        audit_log.change_data = { 'clock_in_time' => ['09:00', '08:30'] }
        expect(audit_log.change_summary).to eq('Clock in time: 09:00 → 08:30')
      end
    end

    context 'when change_data contains multiple fields' do
      it 'returns comma-separated summary' do
        audit_log.change_data = {
          'clock_in_time' => ['09:00', '08:30'],
          'clock_out_time' => ['17:00', '17:30'],
        }
        expected = 'Clock in time: 09:00 → 08:30, Clock out time: 17:00 → 17:30'
        expect(audit_log.change_summary).to eq(expected)
      end
    end
  end
end
