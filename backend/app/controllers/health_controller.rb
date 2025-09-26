class HealthController < ApplicationController
  skip_before_action :authenticate_request

  def check
    render json: {
      status: 'ok',
      message: 'Attendance Management API is running',
      timestamp: Time.current,
    }
  end

  # Test endpoint for error handling (development only)
  def test_error
    return render json: { error: 'Not available in production' }, status: :forbidden if Rails.env.production?

    error_type = params[:type]

    case error_type
    when 'not_found'
      raise ActiveRecord::RecordNotFound, 'Test record not found'
    when 'validation'
      user = User.new
      user.save!
    when 'authentication'
      raise ServiceErrors::GoogleAuthError, 'Test authentication error'
    when 'business_logic'
      raise ServiceErrors::InvalidStateError, 'Test business logic error'
    when 'external_service'
      raise ServiceErrors::GoogleApiError, 'Test external service error'
    else
      raise StandardError, 'Test internal server error'
    end
  end
end
