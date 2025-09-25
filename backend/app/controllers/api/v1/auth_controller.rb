# Authentication Controller for Google OAuth and JWT
module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :authenticate_request, only: [:google]
      # Google OAuth authentication
      def google
        if params[:id_token].present?
          # Handle client-side Google Sign-In
          handle_client_side_auth
        elsif params[:code].present?
          # Handle server-side OAuth flow
          handle_server_side_auth
        else
          render json: { error: 'Missing authentication parameters' }, status: :bad_request
        end
      end

      # Refresh JWT token
      def refresh
        refresh_token = params[:refresh_token]
        return render json: { error: 'Refresh token required' }, status: :bad_request unless refresh_token

        user = validate_and_find_user(refresh_token)
        return unless user

        new_access_token = JwtService.generate_access_token(user)
        render json: { access_token: new_access_token, user: user_response(user) }
      rescue JWT::DecodeError
        render json: { error: 'Invalid refresh token' }, status: :unauthorized
      end

      # Logout (client-side token invalidation)
      def logout
        # In a more sophisticated setup, you might maintain a blacklist of tokens
        # For now, we'll just return success and let the client handle token removal
        render json: { message: 'Logged out successfully' }
      end

      private

      def validate_and_find_user(refresh_token)
        decoded_token = JwtService.decode(refresh_token)

        unless decoded_token && decoded_token['type'] == 'refresh'
          render json: { error: 'Invalid refresh token' }, status: :unauthorized
          return nil
        end

        user = User.find_by(id: decoded_token['user_id'])
        unless user
          render json: { error: 'User not found' }, status: :unauthorized
          return nil
        end

        user
      end

      def handle_client_side_auth
        auth_data = GoogleAuthService.verify_id_token(params[:id_token])

        return render json: { error: 'Invalid Google ID token' }, status: :unauthorized unless auth_data

        result = GoogleAuthService.authenticate(auth_data)

        if result[:error]
          render json: { error: result[:error], details: result[:details] }, status: :unauthorized
        else
          render json: {
            access_token: result[:access_token],
            refresh_token: result[:refresh_token],
            user: user_response(result[:user]),
          }
        end
      end

      def handle_server_side_auth
        # This would handle the OAuth callback flow
        # For now, we'll implement a basic structure
        render json: { error: 'Server-side OAuth flow not implemented yet' }, status: :not_implemented
      end

      def user_response(user)
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      end
    end
  end
end
