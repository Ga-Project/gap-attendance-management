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
          render_error('Missing authentication parameters', :bad_request)
        end
      end

      # Refresh JWT token
      def refresh
        refresh_token = params[:refresh_token]

        if refresh_token.blank?
          render_error('Refresh token required', :bad_request)
          return
        end

        user = validate_and_find_user(refresh_token)
        return unless user # validate_and_find_user already rendered error response

        new_access_token = JwtService.generate_access_token(user)

        render json: { access_token: new_access_token, user: user_response(user) }
      end

      # Logout (client-side token invalidation)
      def logout
        # In a more sophisticated setup, you might maintain a blacklist of tokens
        # For now, we'll just return success and let the client handle token removal
        render json: { message: 'Logged out successfully' }
      end

      private

      def validate_and_find_user(refresh_token)
        decoded_token = decode_refresh_token(refresh_token)
        return nil unless decoded_token

        validated_token = validate_token_type(decoded_token)
        return nil unless validated_token

        find_user_from_token(validated_token)
      end

      def decode_refresh_token(refresh_token)
        JwtService.decode(refresh_token)
      rescue JWT::DecodeError, JWT::ExpiredSignature
        render_error('Invalid refresh token', :unauthorized)
        nil
      end

      def validate_token_type(decoded_token)
        return decoded_token if decoded_token && decoded_token['type'] == 'refresh'

        render_error('Invalid refresh token', :unauthorized)
        nil
      end

      def find_user_from_token(decoded_token)
        user = User.find_by(id: decoded_token['user_id'])
        return user if user

        render_error('User not found', :unauthorized)
        nil
      end

      def handle_client_side_auth
        auth_data = GoogleAuthService.verify_id_token(params[:id_token])
        result = GoogleAuthService.authenticate(auth_data)

        render json: {
          access_token: result[:access_token],
          refresh_token: result[:refresh_token],
          user: user_response(result[:user]),
        }
      rescue ServiceErrors::GoogleAuthError, ServiceErrors::GoogleApiError => e
        render_error(e.message, :unauthorized)
      end

      def handle_server_side_auth
        # This would handle the OAuth callback flow
        # For now, we'll implement a basic structure
        render_error('Server-side OAuth flow not implemented yet', :not_implemented)
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
