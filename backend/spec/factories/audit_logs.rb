FactoryBot.define do
  factory :audit_log do
    association :user, factory: %i[user admin]
    association :target_user, factory: :user
    action { 'update_attendance' }
    change_data { { 'clock_in_time' => ['09:00', '08:30'] } }
    reason { 'Employee requested time correction due to traffic delay' }

    trait :attendance_update do
      action { 'update_attendance' }
      change_data { { 'clock_in_time' => ['09:00', '08:30'], 'clock_out_time' => ['17:00', '17:30'] } }
    end

    trait :attendance_deletion do
      action { 'delete_attendance' }
      change_data { { 'deleted_record' => { 'date' => '2025-09-25', 'total_work_minutes' => 480 } } }
      reason { 'Duplicate entry removal' }
    end

    trait :user_role_change do
      action { 'update_user_role' }
      change_data { { 'role' => %w[employee admin] } }
      reason { 'Promoted to administrator role' }
    end
  end
end
