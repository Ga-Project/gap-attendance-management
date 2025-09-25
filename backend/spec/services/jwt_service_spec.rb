# spec/services/jwt_service_spec.rb
require 'rails_helper'

RSpec.describe JwtService, type: :service do
  let(:user) { create(:user) }

  describe '.encode' do
    it 'encodes payload into JWT token' do
      payload = { user_id: user.id, email: user.email }
      token = JwtService.encode(payload)

      expect(token).to be_a(String)
      expect(token.split('.').length).to eq(3) # JWT has 3 parts
    end

    it 'includes expiration time in payload' do
      payload = { user_id: user.id }
      exp_time = 2.hours.from_now
      token = JwtService.encode(payload, exp_time)

      decoded = JWT.decode(token, JwtConfig::JWT_SECRET, true, { algorithm: JwtConfig::JWT_ALGORITHM })
      expect(decoded[0]['exp']).to eq(exp_time.to_i)
    end
  end

  describe '.decode' do
    it 'decodes valid JWT token' do
      payload = { user_id: user.id, email: user.email }
      token = JwtService.encode(payload)

      decoded = JwtService.decode(token)

      expect(decoded['user_id']).to eq(user.id)
      expect(decoded['email']).to eq(user.email)
    end

    it 'returns nil for invalid token' do
      result = JwtService.decode('invalid_token')
      expect(result).to be_nil
    end

    it 'returns nil for expired token' do
      payload = { user_id: user.id }
      expired_token = JwtService.encode(payload, 1.hour.ago)

      result = JwtService.decode(expired_token)
      expect(result).to be_nil
    end
  end

  describe '.generate_access_token' do
    it 'generates access token with user information' do
      token = JwtService.generate_access_token(user)
      decoded = JwtService.decode(token)

      expect(decoded['user_id']).to eq(user.id)
      expect(decoded['email']).to eq(user.email)
      expect(decoded['role']).to eq(user.role)
      expect(decoded['type']).to eq('access')
    end
  end

  describe '.generate_refresh_token' do
    it 'generates refresh token with minimal information' do
      token = JwtService.generate_refresh_token(user)
      decoded = JwtService.decode(token)

      expect(decoded['user_id']).to eq(user.id)
      expect(decoded['type']).to eq('refresh')
      expect(decoded['email']).to be_nil
    end
  end

  describe '.verify_token' do
    it 'returns user for valid token' do
      token = JwtService.generate_access_token(user)
      verified_user = JwtService.verify_token(token)

      expect(verified_user).to eq(user)
    end

    it 'returns nil for invalid token' do
      result = JwtService.verify_token('invalid_token')
      expect(result).to be_nil
    end

    it 'returns nil for token with non-existent user' do
      payload = { user_id: 99_999, email: 'nonexistent@example.com' }
      token = JwtService.encode(payload)

      result = JwtService.verify_token(token)
      expect(result).to be_nil
    end
  end

  describe '.token_expired?' do
    it 'returns false for valid token' do
      token = JwtService.generate_access_token(user)
      expect(JwtService.token_expired?(token)).to be_falsey
    end

    it 'returns true for expired token' do
      payload = { user_id: user.id }
      expired_token = JwtService.encode(payload, 1.hour.ago)

      expect(JwtService.token_expired?(expired_token)).to be_truthy
    end

    it 'returns true for invalid token' do
      expect(JwtService.token_expired?('invalid_token')).to be_truthy
    end
  end
end
