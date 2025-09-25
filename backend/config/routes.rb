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
        end
      end

      # Admin routes
      namespace :admin do
        resources :users, only: %i[index show]
        resources :attendances, only: %i[index show update]
        get :export, to: 'attendances#export'
        resources :audit_logs, only: [:index]
      end
    end
  end
end
