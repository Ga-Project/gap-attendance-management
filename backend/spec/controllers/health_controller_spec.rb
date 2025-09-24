require 'rails_helper'

RSpec.describe HealthController, type: :controller do
  describe 'GET #check' do
    it 'returns a success response' do
      get :check
      expect(response).to be_successful
    end

    it 'returns JSON with status ok' do
      get :check
      json_response = JSON.parse(response.body)
      expect(json_response['status']).to eq('ok')
    end
  end
end
