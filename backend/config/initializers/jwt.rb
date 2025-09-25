# JWT Configuration
module JwtConfig
  # JWT secret key - in production this should be set via environment variable
  JWT_SECRET = Rails.application.credentials.secret_key_base || ENV['JWT_SECRET'] || 'your-secret-key'
  
  # JWT algorithm
  JWT_ALGORITHM = 'HS256'
  
  # Token expiration time (24 hours)
  JWT_EXPIRATION = 24.hours
  
  # Refresh token expiration time (7 days)
  REFRESH_TOKEN_EXPIRATION = 7.days
end