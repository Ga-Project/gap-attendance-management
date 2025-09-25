require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'validations' do
    let(:user) { build(:user) }

    it 'is valid with valid attributes' do
      expect(user).to be_valid
    end

    it 'validates presence of google_id' do
      user.google_id = nil
      expect(user).not_to be_valid
      expect(user.errors[:google_id]).to include("can't be blank")
    end

    it 'validates uniqueness of google_id' do
      create(:user, google_id: 'unique_google_id')
      user.google_id = 'unique_google_id'
      expect(user).not_to be_valid
      expect(user.errors[:google_id]).to include('has already been taken')
    end

    it 'validates presence of email' do
      user.email = nil
      expect(user).not_to be_valid
      expect(user.errors[:email]).to include("can't be blank")
    end

    it 'validates uniqueness of email' do
      create(:user, email: 'unique@example.com')
      user.email = 'unique@example.com'
      expect(user).not_to be_valid
      expect(user.errors[:email]).to include('has already been taken')
    end

    it 'validates presence of name' do
      user.name = nil
      expect(user).not_to be_valid
      expect(user.errors[:name]).to include("can't be blank")
    end

    it 'validates presence of role' do
      user.role = nil
      expect(user).not_to be_valid
      expect(user.errors[:role]).to include("can't be blank")
    end

    it 'validates email format' do
      user.email = 'invalid_email'
      expect(user).not_to be_valid
      expect(user.errors[:email]).to include('is invalid')
    end
  end

  describe 'enums' do
    it 'defines role enum with correct values' do
      expect(User.roles).to eq({ 'employee' => 0, 'admin' => 1 })
    end
  end

  describe 'scopes' do
    let!(:employee) { create(:user, role: :employee) }
    let!(:admin) { create(:user, role: :admin) }

    it 'returns employees' do
      expect(User.employees).to include(employee)
      expect(User.employees).not_to include(admin)
    end

    it 'returns admins' do
      expect(User.admins).to include(admin)
      expect(User.admins).not_to include(employee)
    end
  end

  describe 'instance methods' do
    let(:employee) { build(:user, role: :employee) }
    let(:admin) { build(:user, role: :admin) }

    describe '#admin?' do
      it 'returns true for admin users' do
        expect(admin.admin?).to be true
      end

      it 'returns false for employee users' do
        expect(employee.admin?).to be false
      end
    end

    describe '#employee?' do
      it 'returns true for employee users' do
        expect(employee.employee?).to be true
      end

      it 'returns false for admin users' do
        expect(admin.employee?).to be false
      end
    end

    describe '#full_name' do
      it 'returns the name' do
        user = build(:user, name: 'John Doe')
        expect(user.full_name).to eq('John Doe')
      end
    end
  end
end
