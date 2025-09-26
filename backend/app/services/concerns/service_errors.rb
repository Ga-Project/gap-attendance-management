# Custom exception classes for service layer errors
module ServiceErrors
  # Base service error class
  class ServiceError < StandardError
    attr_reader :details, :status

    def initialize(message, details: nil, status: :unprocessable_entity)
      super(message)
      @details = details
      @status = status
    end
  end

  # Authentication related errors
  class AuthenticationError < ServiceError
    def initialize(message = 'Authentication failed', details: nil)
      super(message, details: details, status: :unauthorized)
    end
  end

  # Google OAuth specific errors
  class GoogleAuthError < AuthenticationError
    def initialize(message = 'Google authentication failed', details: nil)
      super
    end
  end

  # JWT token errors
  class TokenError < AuthenticationError
    def initialize(message = 'Token error', details: nil)
      super
    end
  end

  # Business logic errors
  class BusinessLogicError < ServiceError
    def initialize(message, details: nil)
      super(message, details: details, status: :unprocessable_entity)
    end
  end

  # Attendance specific errors
  class AttendanceError < BusinessLogicError
    def initialize(message = 'Attendance operation failed', details: nil)
      super
    end
  end

  # Invalid state errors (e.g., trying to clock out without clocking in)
  class InvalidStateError < BusinessLogicError
    def initialize(message = 'Invalid operation for current state', details: nil)
      super
    end
  end

  # External service errors
  class ExternalServiceError < ServiceError
    def initialize(message = 'External service error', details: nil)
      super(message, details: details, status: :service_unavailable)
    end
  end

  # Google API errors
  class GoogleApiError < ExternalServiceError
    def initialize(message = 'Google API error', details: nil)
      super
    end
  end
end
