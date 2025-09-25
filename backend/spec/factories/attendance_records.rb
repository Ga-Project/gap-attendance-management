FactoryBot.define do
  factory :attendance_record do
    association :attendance
    record_type { :clock_in }
    timestamp { Time.current }

    trait :clock_in do
      record_type { :clock_in }
    end

    trait :clock_out do
      record_type { :clock_out }
    end

    trait :break_start do
      record_type { :break_start }
    end

    trait :break_end do
      record_type { :break_end }
    end

    trait :morning do
      timestamp { Time.current.beginning_of_day + 9.hours }
    end

    trait :afternoon do
      timestamp { Time.current.beginning_of_day + 13.hours }
    end

    trait :evening do
      timestamp { Time.current.beginning_of_day + 17.hours }
    end
  end
end
