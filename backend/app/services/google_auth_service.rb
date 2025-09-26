# Google OAuth Authentication Service
class GoogleAuthService
  class << self
    # Authenticate user with Google OAuth data
    def authenticate(auth_data)
      raise ServiceErrors::GoogleAuthError, 'Invalid authentication data' unless valid_auth_data?(auth_data)

      user = find_or_create_user(auth_data['uid'], auth_data['info'])
      generate_auth_response(user)
    rescue ServiceErrors::GoogleAuthError
      raise
    rescue StandardError => e
      Rails.logger.error "Google Auth Error: #{e.message}"
      raise ServiceErrors::GoogleAuthError.new('Authentication failed', details: e.message)
    end

    # Verify Google ID token (for client-side authentication)
    def verify_id_token(id_token)
      raise ServiceErrors::GoogleAuthError, 'ID token is required' if id_token.blank?

      begin
        token_data = decode_google_token(id_token)
        validate_token_audience(token_data)
        build_auth_data(token_data)
      rescue JWT::DecodeError => e
        handle_jwt_decode_error(e)
      rescue StandardError => e
        handle_verification_error(e)
      end
    end

    private

    def decode_google_token(id_token)
      # This would typically use Google's API to verify the token
      # For now, we'll implement a basic structure
      # In production, you'd use Google::Auth::IDTokens.verify_oidc
      decoded_token = JWT.decode(id_token, nil, false)
      decoded_token[0]
    end

    def validate_token_audience(token_data)
      return if token_data['aud'] == ENV['GOOGLE_CLIENT_ID']

      raise ServiceErrors::GoogleAuthError, 'Invalid token audience'
    end

    def build_auth_data(token_data)
      {
        'uid' => token_data['sub'],
        'info' => {
          'email' => token_data['email'],
          'name' => token_data['name'],
          'image' => token_data['picture'],
        },
      }
    end

    def handle_jwt_decode_error(error)
      Rails.logger.error "Google ID Token verification failed: #{error.message}"
      raise ServiceErrors::GoogleAuthError.new('Invalid Google ID token', details: error.message)
    end

    def handle_verification_error(error)
      Rails.logger.error "Google token verification error: #{error.message}"
      raise ServiceErrors::GoogleApiError.new('Google service unavailable', details: error.message)
    end

    def valid_auth_data?(auth_data)
      auth_data&.dig('info')
    end

    def generate_auth_response(user)
      unless user.persisted?
        raise ServiceErrors::GoogleAuthError.new('Failed to create user',
                                                 details: user.errors.full_messages)
      end

      {
        user: user,
        access_token: JwtService.generate_access_token(user),
        refresh_token: JwtService.generate_refresh_token(user),
      }
    end

    def find_or_create_user(google_id, user_info)
      user = User.find_by(google_id: google_id)

      if user
        # Update user info if it has changed
        user.update!(
          email: user_info['email'],
          name: user_info['name']
        )
        user
      else
        # Create new user
        User.create!(
          google_id: google_id,
          email: user_info['email'],
          name: user_info['name'],
          role: :employee # Default role
        )
      end
    end
  end
end
