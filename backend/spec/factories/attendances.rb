FactoryBot.define do
  factory :attendance do
    association :user
    date { Date.current }
    status { :not_started }
    total_work_minutes { 0 }
    total_break_minutes { 0 }

    trait :clocked_in do
      status { :clocked_in }
      clock_in_time { Time.current.beginning_of_day + 9.hours }
    end

    trait :on_break do
      status { :on_break }
      clock_in_time { Time.current.beginning_of_day + 9.hours }
    end

    trait :clocked_out do
      status { :clocked_out }
      clock_in_time { Time.current.beginning_of_day + 9.hours }
      clock_out_time { Time.current.beginning_of_day + 18.hours }
      total_work_minutes { 480 } # 8 hours
      total_break_minutes { 60 } # 1 hour
    end

    trait :with_break do
      total_break_minutes { 60 } # 1 hour break
    end

    trait :yesterday do
      date { 1.day.ago.to_date }
    end

    trait :last_week do
      date { 1.week.ago.to_date }
    end
  end
end
