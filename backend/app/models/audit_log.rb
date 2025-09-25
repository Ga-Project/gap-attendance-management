class AuditLog < ApplicationRecord
  belongs_to :user
  belongs_to :target_user, class_name: 'User'

  validates :action, presence: true
  validates :reason, presence: true

  # Scopes for filtering and searching
  scope :by_action, ->(action) { where(action: action) if action.present? }
  scope :by_target_user, ->(user_id) { where(target_user_id: user_id) if user_id.present? }
  scope :by_admin_user, ->(user_id) { where(user_id: user_id) if user_id.present? }
  scope :by_date_range, lambda { |start_date, end_date|
    where(created_at: start_date.beginning_of_day..end_date.end_of_day) if start_date.present? && end_date.present?
  }
  scope :recent, -> { order(created_at: :desc) }

  # Class method for creating audit logs
  def self.log_change(admin_user:, target_user:, action:, changes:, reason:)
    create!(
      user: admin_user,
      target_user: target_user,
      action: action,
      change_data: changes,
      reason: reason
    )
  end

  # Instance methods for better readability
  def admin_user
    user
  end

  def formatted_changes
    return {} if change_data.blank?

    change_data.transform_values do |change_info|
      if change_info.is_a?(Array) && change_info.length == 2
        {
          from: change_info[0],
          to: change_info[1],
        }
      else
        change_info
      end
    end
  end

  def change_summary
    return 'No changes recorded' if change_data.blank?

    formatted_changes.map do |field, change_info|
      if change_info.is_a?(Hash) && change_info.key?(:from) && change_info.key?(:to)
        "#{field.humanize}: #{change_info[:from]} → #{change_info[:to]}"
      else
        "#{field.humanize}: #{change_info}"
      end
    end.join(', ')
  end
end
