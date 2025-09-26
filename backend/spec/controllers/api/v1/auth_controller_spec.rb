# spec/controllers/api/v1/auth_controller_spec.rb
require 'rails_helper'

RSpec.describe Api::V1::AuthController, type: :controller do
  # Skip authentication for auth controller tests
  before do
    allow(controller).to receive(:authenticate_request)
  end

  describe 'POST #google' do
    context 'with valid id_token' do
      let(:unique_email) { "test_#{SecureRandom.hex(4)}@example.com" }
      let(:valid_token_payload) do
        {
          'sub' => 'google_123456',
          'email' => unique_email,
          'name' => 'Test User',
          'picture' => 'https://example.com/photo.jpg',
          'aud' => 'test-client-id',
        }
      end

      before do
        allow(ENV).to receive(:[]).with('GOOGLE_CLIENT_ID').and_return('test-client-id')
      end

      it 'authenticates user with valid Google ID token' do
        token = JWT.encode(valid_token_payload, 'secret', 'HS256')

        post :google, params: { id_token: token }

        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        expect(json_response['access_token']).to be_present
        expect(json_response['refresh_token']).to be_present
        expect(json_response['user']['email']).to eq(unique_email)
      end

      it 'creates new user for first-time Google authentication' do
        token = JWT.encode(valid_token_payload, 'secret', 'HS256')

        expect do
          post :google, params: { id_token: token }
        end.to change(User, :count).by(1)

        user = User.last
        expect(user.google_id).to eq('google_123456')
        expect(user.email).to eq(unique_email)
        expect(user.name).to eq('Test User')
      end

      it 'authenticates existing user' do
        existing_user = create(:user, google_id: 'google_123456')
        token = JWT.encode(valid_token_payload, 'secret', 'HS256')

        expect do
          post :google, params: { id_token: token }
        end.not_to change(User, :count)

        post :google, params: { id_token: token }

        json_response = JSON.parse(response.body)
        expect(json_response['user']['id']).to eq(existing_user.id)
      end
    end

    context 'with invalid id_token' do
      it 'returns error for invalid token' do
        post :google, params: { id_token: 'invalid_token' }

        expect(response).to have_http_status(:unauthorized)
        json_response = JSON.parse(response.body)
        expect(json_response['error']['message']).to eq('Invalid Google ID token')
      end
    end

    context 'with OAuth code' do
      it 'returns not implemented for server-side OAuth flow' do
        post :google, params: { code: 'oauth_code' }

        expect(response).to have_http_status(:not_implemented)
        json_response = JSON.parse(response.body)
        expect(json_response['error']['message']).to eq('Server-side OAuth flow not implemented yet')
      end
    end

    context 'with missing parameters' do
      it 'returns bad request when no authentication parameters provided' do
        post :google

        expect(response).to have_http_status(:bad_request)
        json_response = JSON.parse(response.body)
        expect(json_response['error']['message']).to eq('Missing authentication parameters')
      end
    end
  end

  describe 'POST #refresh' do
    let(:user) { create(:user) }

    context 'with valid refresh token' do
      it 'returns new access token' do
        refresh_token = JwtService.generate_refresh_token(user)

        post :refresh, params: { refresh_token: refresh_token }

        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        expect(json_response['access_token']).to be_present
        expect(json_response['user']['id']).to eq(user.id)
      end
    end

    context 'with invalid refresh token' do
      it 'returns unauthorized for invalid token' do
        post :refresh, params: { refresh_token: 'invalid_token' }

        expect(response).to have_http_status(:unauthorized)
        json_response = JSON.parse(response.body)
        expect(json_response['error']['message']).to eq('Invalid refresh token')
      end

      it 'returns unauthorized for access token instead of refresh token' do
        access_token = JwtService.generate_access_token(user)

        post :refresh, params: { refresh_token: access_token }

        expect(response).to have_http_status(:unauthorized)
        json_response = JSON.parse(response.body)
        expect(json_response['error']['message']).to eq('Invalid refresh token')
      end
    end

    context 'with missing refresh token' do
      it 'returns bad request' do
        post :refresh

        expect(response).to have_http_status(:bad_request)
        json_response = JSON.parse(response.body)
        expect(json_response['error']['message']).to eq('Refresh token required')
      end
    end
  end

  describe 'DELETE #logout' do
    it 'returns success message' do
      delete :logout

      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)
      expect(json_response['message']).to eq('Logged out successfully')
    end
  end
end
