module ErrorHandler
  extend ActiveSupport::Concern

  included do
    rescue_from ActiveRecord::RecordNotFound, with: :handle_not_found
    rescue_from ActiveRecord::RecordInvalid, with: :handle_validation_error
    rescue_from ActionController::ParameterMissing, with: :handle_parameter_missing
    rescue_from JWT::DecodeError, JWT::ExpiredSignature, with: :handle_jwt_error
    rescue_from ServiceErrors::InvalidStateError, ServiceErrors::AttendanceError, with: :handle_business_logic_error
    rescue_from ServiceErrors::GoogleAuthError, ServiceErrors::TokenError, with: :handle_authentication_error
    rescue_from ServiceErrors::GoogleApiError, with: :handle_external_service_error
    rescue_from StandardError, with: :handle_internal_error
  end

  private

  def handle_not_found(exception)
    log_and_render_error(exception, 'Resource not found', :not_found)
  end

  def handle_validation_error(exception)
    log_and_render_error(exception, 'Validation failed', :unprocessable_entity,
                         details: exception.record.errors.full_messages)
  end

  def handle_parameter_missing(exception)
    log_and_render_error(exception, "Missing required parameter: #{exception.param}", :bad_request)
  end

  def handle_jwt_error(exception)
    message = jwt_error_message(exception)
    log_and_render_error(exception, message, :unauthorized)
  end

  def jwt_error_message(exception)
    exception.is_a?(JWT::ExpiredSignature) ? 'Authentication token has expired' : 'Invalid authentication token'
  end

  def handle_business_logic_error(exception)
    log_and_render_error(exception, exception.message, :unprocessable_entity)
  end

  def handle_authentication_error(exception)
    log_and_render_error(exception, exception.message, :unauthorized, details: exception.details)
  end

  def handle_external_service_error(exception)
    log_and_render_error(exception, exception.message, :service_unavailable, details: exception.details)
  end

  def handle_internal_error(exception)
    message = Rails.env.production? ? 'An unexpected error occurred' : 'Internal server error'
    details = Rails.env.production? ? nil : exception.message
    log_and_render_error(exception, message, :internal_server_error, details: details)
  end

  def log_and_render_error(exception, message, status, details: nil)
    log_error(exception, status)
    render_error(message, status, details: details)
  end

  def render_error(message, status, details: nil)
    error_response = build_error_response(message, status, details)
    render json: error_response, status: status
  end

  def build_error_response(message, status, details)
    response = {
      error: {
        message: message,
        status: Rack::Utils::SYMBOL_TO_STATUS_CODE[status],
        timestamp: Time.current.iso8601,
      },
    }
    response[:error][:details] = details if details.present?
    response
  end

  def log_error(exception, status)
    Rails.logger.error(build_error_log_data(exception, status).to_json)
  end

  def build_error_log_data(exception, status)
    {
      error_class: exception.class.name,
      error_message: exception.message,
      status: status,
      controller: self.class.name,
      action: action_name,
      params: params.except(:password, :token, :id_token).to_unsafe_h,
      user_id: @current_user&.id,
      timestamp: Time.current.iso8601,
      backtrace: exception.backtrace&.first(10),
    }
  end
end
