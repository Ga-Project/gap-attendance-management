Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Health check endpoint
  get '/health', to: 'health#check'

  namespace :api do
    namespace :v1 do
      # Authentication routes
      post '/auth/google', to: 'auth#google'
      post '/auth/refresh', to: 'auth#refresh'
      delete '/auth/logout', to: 'auth#logout'

      # User attendance routes
      resources :attendances, only: %i[index show] do
        collection do
          post :clock_in
          post :clock_out
          post :break_start
          post :break_end
          get :today
          get :statistics
          get 'monthly/:year/:month', to: 'attendances#monthly'
        end
      end

      # Admin routes
      get 'admin/users', to: 'admin#users'
      get 'admin/attendances', to: 'admin#attendances'
      put 'admin/attendances/:id', to: 'admin#update_attendance'
      get 'admin/audit_logs', to: 'admin#audit_logs'
      get 'admin/export_csv', to: 'admin#export_csv'
    end
  end
end
