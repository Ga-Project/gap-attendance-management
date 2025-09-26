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
    return render_production_error if Rails.env.production?

    trigger_test_error(params[:type])
  end

  private

  def render_production_error
    render json: { error: 'Not available in production' }, status: :forbidden
  end

  def trigger_test_error(error_type)
    case error_type
    when 'not_found'
      raise ActiveRecord::RecordNotFound, 'Test record not found'
    when 'validation'
      trigger_validation_error
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

  def trigger_validation_error
    user = User.new
    user.save!
  end
end
