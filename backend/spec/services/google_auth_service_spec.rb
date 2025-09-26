# spec/services/google_auth_service_spec.rb
require 'rails_helper'

RSpec.describe GoogleAuthService, type: :service do
  describe '.authenticate' do
    let(:unique_email) { "test_#{SecureRandom.hex(4)}@example.com" }
    let(:valid_auth_data) do
      {
        'uid' => 'google_123456',
        'info' => {
          'email' => unique_email,
          'name' => 'Test User',
        },
      }
    end

    context 'with valid auth data' do
      it 'creates a new user when user does not exist' do
        expect do
          GoogleAuthService.authenticate(valid_auth_data)
        end.to change(User, :count).by(1)
      end

      it 'returns user and tokens for new user' do
        result = GoogleAuthService.authenticate(valid_auth_data)

        expect(result[:user]).to be_a(User)
        expect(result[:access_token]).to be_present
        expect(result[:refresh_token]).to be_present
        expect(result[:access_token]).to be_present
        expect(result[:refresh_token]).to be_present
      end

      it 'finds existing user when user already exists' do
        existing_user = create(:user, google_id: 'google_123456')

        expect do
          GoogleAuthService.authenticate(valid_auth_data)
        end.not_to change(User, :count)

        result = GoogleAuthService.authenticate(valid_auth_data)
        expect(result[:user].id).to eq(existing_user.id)
      end

      it 'updates existing user info' do
        existing_user = create(:user, google_id: 'google_123456', name: 'Old Name')

        GoogleAuthService.authenticate(valid_auth_data)

        existing_user.reload
        expect(existing_user.email).to eq(unique_email)
        expect(existing_user.name).to eq('Test User')
      end
    end

    context 'with invalid auth data' do
      it 'raises GoogleAuthError for nil auth data' do
        expect do
          GoogleAuthService.authenticate(nil)
        end.to raise_error(ServiceErrors::GoogleAuthError, 'Invalid authentication data')
      end

      it 'raises GoogleAuthError for auth data without info' do
        expect do
          GoogleAuthService.authenticate({ 'uid' => '123' })
        end.to raise_error(ServiceErrors::GoogleAuthError,
                           'Invalid authentication data')
      end
    end
  end

  describe '.verify_id_token' do
    let(:valid_token_payload) do
      {
        'sub' => 'google_123456',
        'email' => 'test@example.com',
        'name' => 'Test User',
        'picture' => 'https://example.com/photo.jpg',
        'aud' => ENV['GOOGLE_CLIENT_ID'] || 'test-client-id',
      }
    end

    before do
      allow(ENV).to receive(:[]).with('GOOGLE_CLIENT_ID').and_return('test-client-id')
    end

    context 'with valid token' do
      it 'returns user data for valid token' do
        token = JWT.encode(valid_token_payload, 'secret', 'HS256')

        result = GoogleAuthService.verify_id_token(token)

        expect(result['uid']).to eq('google_123456')
        expect(result['info']['email']).to eq('test@example.com')
        expect(result['info']['name']).to eq('Test User')
      end
    end

    context 'with invalid token' do
      it 'raises GoogleAuthError for invalid token' do
        expect { GoogleAuthService.verify_id_token('invalid_token') }.to raise_error(ServiceErrors::GoogleAuthError)
      end

      it 'raises GoogleApiError for token with wrong audience' do
        payload = valid_token_payload.merge('aud' => 'wrong-client-id')
        token = JWT.encode(payload, 'secret', 'HS256')

        expect { GoogleAuthService.verify_id_token(token) }.to raise_error(ServiceErrors::GoogleApiError)
      end
    end
  end
end
