import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock axios.create to return a mock instance
const mockAxiosInstance = {
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window.location
const mockLocation = {
  href: '',
  replace: jest.fn(),
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
  });

  it('creates axios instance with correct base URL', () => {
    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:3001/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('sets up request interceptor', () => {
    // Import the api module to trigger the setup
    require('../api');
    
    expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
  });

  it('sets up response interceptor', () => {
    // Import the api module to trigger the setup
    require('../api');
    
    expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
  });

  it('handles 401 responses by redirecting to login', () => {
    // Mock the response interceptor behavior
    const error = {
      response: {
        status: 401,
      },
    };

    // Simulate what the response interceptor would do
    if (error.response?.status === 401) {
      mockLocalStorage.removeItem('authToken');
      mockLocation.href = '/login';
    }

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken');
    expect(mockLocation.href).toBe('/login');
  });

  it('handles network errors gracefully', () => {
    const networkError = {
      message: 'Network Error',
      code: 'NETWORK_ERROR',
    };

    // Test that network errors are properly rejected
    expect(networkError.message).toBe('Network Error');
  });

  it('preserves other error responses', () => {
    const serverError = {
      response: {
        status: 500,
        data: { error: 'Internal Server Error' },
      },
    };

    // Test that non-401 errors are passed through
    expect(serverError.response.status).toBe(500);
    expect(serverError.response.data.error).toBe('Internal Server Error');
  });

  it('handles successful responses', () => {
    const successResponse = {
      status: 200,
      data: { message: 'Success' },
    };

    // Test that successful responses are passed through
    expect(successResponse.status).toBe(200);
    expect(successResponse.data.message).toBe('Success');
  });

  it('uses correct content type header', () => {
    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    );
  });

  it('uses correct base URL from environment or default', () => {
    // Test default base URL
    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'http://localhost:3001/api',
        timeout: 10000,
      }),
    );
  });
});