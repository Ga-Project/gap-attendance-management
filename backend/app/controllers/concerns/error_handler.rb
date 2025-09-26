# Centralized error handling for API controllers
module ErrorHandler
  extend ActiveSupport::Concern

  included do
    # Handle standard Rails exceptions first
    rescue_from ActiveRecord::RecordNotFound, with: :handle_not_found
    rescue_from ActiveRecord::RecordInvalid, with: :handle_validation_error
    rescue_from ActionController::ParameterMissing, with: :handle_parameter_missing
    rescue_from JWT::DecodeError, with: :handle_jwt_error
    rescue_from JWT::ExpiredSignature, with: :handle_expired_token

    # Handle custom business logic errors
    rescue_from ServiceErrors::InvalidStateError, with: :handle_business_logic_error
    rescue_from ServiceErrors::AttendanceError, with: :handle_business_logic_error
    rescue_from ServiceErrors::GoogleAuthError, with: :handle_authentication_error
    rescue_from ServiceErrors::TokenError, with: :handle_authentication_error
    rescue_from ServiceErrors::GoogleApiError, with: :handle_external_service_error

    # Handle all other errors (least specific last)
    rescue_from StandardError, with: :handle_internal_error
  end

  private

  # Handle 404 errors
  def handle_not_found(exception)
    log_error(exception, :not_found)
    render_error('Resource not found', :not_found)
  end

  # Handle validation errors
  def handle_validation_error(exception)
    log_error(exception, :unprocessable_entity)
    render_error(
      'Validation failed',
      :unprocessable_entity,
      details: exception.record.errors.full_messages
    )
  end

  # Handle missing parameters
  def handle_parameter_missing(exception)
    log_error(exception, :bad_request)
    render_error("Missing required parameter: #{exception.param}", :bad_request)
  end

  # Handle JWT decode errors
  def handle_jwt_error(exception)
    log_error(exception, :unauthorized)
    render_error('Invalid authentication token', :unauthorized)
  end

  # Handle expired JWT tokens
  def handle_expired_token(exception)
    log_error(exception, :unauthorized)
    render_error('Authentication token has expired', :unauthorized)
  end

  # Handle business logic errors
  def handle_business_logic_error(exception)
    Rails.logger.error "Handling business logic error: #{exception.class.name} - #{exception.message}"
    log_error(exception, :unprocessable_entity)
    render_error(exception.message, :unprocessable_entity)
  end

  # Handle authentication errors
  def handle_authentication_error(exception)
    log_error(exception, :unauthorized)
    render_error(
      exception.message,
      :unauthorized,
      details: exception.details
    )
  end

  # Handle external service errors
  def handle_external_service_error(exception)
    log_error(exception, :service_unavailable)
    render_error(
      exception.message,
      :service_unavailable,
      details: exception.details
    )
  end

  # Handle unexpected errors
  def handle_internal_error(exception)
    log_error(exception, :internal_server_error)

    # Don't expose internal error details in production
    if Rails.env.production?
      render_error('An unexpected error occurred', :internal_server_error)
    else
      render_error(
        'Internal server error',
        :internal_server_error,
        details: exception.message
      )
    end
  end

  # Standardized error response format
  def render_error(message, status, details: nil)
    error_response = {
      error: {
        message: message,
        status: Rack::Utils::SYMBOL_TO_STATUS_CODE[status],
        timestamp: Time.current.iso8601,
      },
    }

    error_response[:error][:details] = details if details.present?

    render json: error_response, status: status
  end

  # Log errors with context
  def log_error(exception, status)
    Rails.logger.error({
      error_class: exception.class.name,
      error_message: exception.message,
      status: status,
      controller: self.class.name,
      action: action_name,
      params: params.except(:password, :token, :id_token).to_unsafe_h,
      user_id: @current_user&.id,
      timestamp: Time.current.iso8601,
      backtrace: exception.backtrace&.first(10),
    }.to_json)
  end
end
