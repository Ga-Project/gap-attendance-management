FactoryBot.define do
  factory :user do
    sequence(:google_id) { |n| "google_#{n}_#{SecureRandom.hex(8)}" }
    sequence(:email) { |n| "user#{n}@example.com" }
    name { 'Test User' }
    role { :employee }

    trait :admin do
      role { :admin }
      name { 'Admin User' }
    end

    trait :employee do
      role { :employee }
      name { 'Employee User' }
    end

    factory :admin_user, traits: [:admin]
    factory :employee_user, traits: [:employee]
  end
end
