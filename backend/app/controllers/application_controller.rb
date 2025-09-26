class ApplicationController < ActionController::API
  include ErrorHandler

  before_action :authenticate_request, except: [:health_check]

  protected

  # Authenticate JWT token from request headers
  def authenticate_request
    token = extract_token_from_header

    if token
      @current_user = JwtService.verify_token(token)

      render_error('Invalid or expired token', :unauthorized) unless @current_user
    else
      render_error('Authorization token required', :unauthorized)
    end
  end

  # Skip authentication for specific actions
  def skip_authentication
    # This method can be called in controllers that don't require authentication
  end

  # Check if current user is admin
  def require_admin
    return if @current_user&.admin?

    render_error('Admin access required', :forbidden)
  end

  # Get current authenticated user
  attr_reader :current_user

  private

  def extract_token_from_header
    auth_header = request.headers['Authorization']
    return nil unless auth_header

    # Expected format: "Bearer <token>"
    token = auth_header.split.last
    token if auth_header.start_with?('Bearer ')
  end
end
