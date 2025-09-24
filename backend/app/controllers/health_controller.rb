class HealthController < ApplicationController
  def check
    render json: { 
      status: 'ok', 
      message: 'Attendance Management API is running',
      timestamp: Time.current 
    }
  end
end