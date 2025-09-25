# OmniAuth Configuration for Google OAuth2
Rails.application.config.middleware.use OmniAuth::Builder do
  provider :google_oauth2,
           ENV['GOOGLE_CLIENT_ID'] || 'your-google-client-id',
           ENV['GOOGLE_CLIENT_SECRET'] || 'your-google-client-secret',
           {
             scope: 'email,profile',
             prompt: 'select_account',
             image_aspect_ratio: 'square',
             image_size: 50,
             access_type: 'offline',
             name: 'google'
           }
end

# Configure OmniAuth to handle CSRF protection
OmniAuth.config.allowed_request_methods = %i[post get]
OmniAuth.config.silence_get_warning = true