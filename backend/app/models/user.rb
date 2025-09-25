class User < ApplicationRecord
  # Role enum for employee/admin management
  enum role: { employee: 0, admin: 1 }

  # Associations
  has_many :attendances, dependent: :destroy
  # has_many :audit_logs, dependent: :destroy  # Will be added in task 5.4

  # Validations
  validates :google_id, presence: true, uniqueness: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true
  validates :role, presence: true

  # Scopes
  scope :employees, -> { where(role: :employee) }
  scope :admins, -> { where(role: :admin) }

  # Instance methods
  def admin?
    role == 'admin'
  end

  def employee?
    role == 'employee'
  end

  def full_name
    name
  end
end
