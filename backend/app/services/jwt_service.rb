# JWT Service for token generation and verification
class JwtService
  class << self
    # Generate JWT token for user
    def encode(payload, exp = JwtConfig::JWT_EXPIRATION.from_now)
      payload[:exp] = exp.to_i
      JWT.encode(payload, JwtConfig::JWT_SECRET, JwtConfig::JWT_ALGORITHM)
    end

    # Decode JWT token
    def decode(token)
      decoded = JWT.decode(token, JwtConfig::JWT_SECRET, true, { algorithm: JwtConfig::JWT_ALGORITHM })
      decoded[0]
    rescue JWT::DecodeError => e
      Rails.logger.error "JWT Decode Error: #{e.message}"
      nil
    end

    # Generate access token for user
    def generate_access_token(user)
      payload = {
        user_id: user.id,
        email: user.email,
        role: user.role,
        type: 'access',
      }
      encode(payload)
    end

    # Generate refresh token for user
    def generate_refresh_token(user)
      payload = {
        user_id: user.id,
        type: 'refresh',
      }
      encode(payload, JwtConfig::REFRESH_TOKEN_EXPIRATION.from_now)
    end

    # Verify token and return user
    def verify_token(token)
      decoded_token = decode(token)
      return nil unless decoded_token

      user_id = decoded_token['user_id']
      User.find_by(id: user_id)
    rescue ActiveRecord::RecordNotFound
      nil
    end

    # Check if token is expired
    def token_expired?(token)
      decoded_token = decode(token)
      return true unless decoded_token

      exp = decoded_token['exp']
      Time.current.to_i > exp
    end
  end
end
