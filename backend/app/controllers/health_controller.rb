class HealthController < ApplicationController
  skip_before_action :authenticate_request

  def check
    render json: {
      status: 'ok',
      message: 'Attendance Management API is running',
      timestamp: Time.current,
    }
  end
end
