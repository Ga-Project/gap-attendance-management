import AttendanceService from '../attendance';

// Mock the apiCall helper
jest.mock('../api', () => ({
  apiCall: jest.fn(),
}));

// Get the mocked function
const { apiCall: mockApiCall } = require('../api');

const mockTodayAttendanceResponse = {
  attendance: {
    id: 1,
    date: '2025-01-15',
    status: 'clocked_in',
    clock_in_time: '2025-01-15T09:00:00Z',
    clock_out_time: null,
    total_work_minutes: 120,
    total_break_minutes: 0,
    formatted_work_time: '02:00',
    formatted_break_time: '00:00',
    formatted_total_office_time: '02:00',
    complete: false,
    in_progress: true,
    records: [],
  },
  can_clock_in: false,
  can_clock_out: true,
  can_start_break: true,
  can_end_break: false,
};

const mockAttendancesResponse = {
  attendances: [
    {
      id: 1,
      date: '2025-01-15',
      status: 'clocked_out',
      clock_in_time: '2025-01-15T09:00:00Z',
      clock_out_time: '2025-01-15T17:00:00Z',
      total_work_minutes: 480,
      total_break_minutes: 60,
      formatted_work_time: '08:00',
      formatted_break_time: '01:00',
      formatted_total_office_time: '09:00',
      complete: true,
      in_progress: false,
      records: [],
    },
  ],
  pagination: {
    current_page: 1,
    total_pages: 1,
    total_count: 1,
  },
};

const mockStatisticsResponse = {
  total_work_minutes: 2400,
  total_break_minutes: 300,
  total_days: 5,
  average_work_minutes: 480,
  formatted_total_work_time: '40:00',
  formatted_total_break_time: '05:00',
  formatted_average_work_time: '08:00',
};

const mockMonthlyResponse = {
  attendances: [
    {
      id: 1,
      date: '2025-01-15',
      status: 'clocked_out',
      clock_in_time: '2025-01-15T09:00:00Z',
      clock_out_time: '2025-01-15T17:00:00Z',
      total_work_minutes: 480,
      total_break_minutes: 60,
      formatted_work_time: '08:00',
      formatted_break_time: '01:00',
      formatted_total_office_time: '09:00',
      complete: true,
      in_progress: false,
      records: [],
    },
  ],
  statistics: mockStatisticsResponse,
};

const mockClockActionResponse = {
  message: 'Successfully clocked in',
  attendance: {
    id: 1,
    user_id: 1,
    date: '2025-01-15',
    status: 'clocked_in',
    clock_in_time: '09:00:00',
    total_work_time: 0,
    total_break_time: 0,
  },
};

describe('AttendanceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTodayAttendance', () => {
    it('fetches today attendance successfully', async () => {
      mockApiCall.mockResolvedValue(mockTodayAttendanceResponse);

      const result = await AttendanceService.getTodayAttendance();

      expect(mockApiCall).toHaveBeenCalledWith(
        expect.any(Function),
        'Get today attendance',
        false,
      );
      expect(result).toEqual(mockTodayAttendanceResponse);
    });

    it('handles API errors', async () => {
      mockApiCall.mockResolvedValue(null);

      const result = await AttendanceService.getTodayAttendance();
      expect(result).toBeNull();
    });
  });

  describe('getAttendances', () => {
    it('fetches attendances without parameters', async () => {
      mockApiCall.mockResolvedValue(mockAttendancesResponse);

      const result = await AttendanceService.getAttendances();

      expect(mockApiCall).toHaveBeenCalledWith(
        expect.any(Function),
        'Get attendances',
      );
      expect(result).toEqual(mockAttendancesResponse);
    });

    it('fetches attendances with date range parameters', async () => {
      const startDate = '2025-01-01';
      const endDate = '2025-01-31';
      mockApiCall.mockResolvedValue(mockAttendancesResponse);

      const result = await AttendanceService.getAttendances(startDate, endDate);

      expect(mockApiCall).toHaveBeenCalledWith(
        expect.any(Function),
        'Get attendances',
      );
      expect(result).toEqual(mockAttendancesResponse);
    });

    it('handles API errors', async () => {
      mockApiCall.mockResolvedValue(null);

      const result = await AttendanceService.getAttendances();
      expect(result).toBeNull();
    });
  });

  describe('getStatistics', () => {
    it('fetches statistics with date range parameters', async () => {
      mockApiCall.mockResolvedValue(mockStatisticsResponse);

      const result = await AttendanceService.getStatistics('2025-01-01', '2025-01-31');

      expect(mockApiCall).toHaveBeenCalledWith(
        expect.any(Function),
        'Get date range statistics',
      );
      expect(result).toEqual(mockStatisticsResponse);
    });

    it('fetches statistics with year and month parameters', async () => {
      mockApiCall.mockResolvedValue(mockStatisticsResponse);

      const result = await AttendanceService.getMonthlyStatistics(2025, 1);

      expect(mockApiCall).toHaveBeenCalledWith(
        expect.any(Function),
        'Get monthly statistics',
      );
      expect(result).toEqual(mockStatisticsResponse);
    });

    it('handles API errors', async () => {
      mockApiCall.mockResolvedValue(null);

      const result = await AttendanceService.getStatistics('2025-01-01', '2025-01-31');
      expect(result).toBeNull();
    });
  });

  describe('getMonthlyAttendances', () => {
    it('fetches monthly attendances successfully', async () => {
      mockApiCall.mockResolvedValue(mockMonthlyResponse);

      const result = await AttendanceService.getMonthlyAttendances(2025, 1);

      expect(mockApiCall).toHaveBeenCalledWith(
        expect.any(Function),
        'Get monthly attendances',
      );
      expect(result).toEqual(mockMonthlyResponse);
    });

    it('handles API errors', async () => {
      mockApiCall.mockResolvedValue(null);

      const result = await AttendanceService.getMonthlyAttendances(2025, 1);
      expect(result).toBeNull();
    });
  });

  describe('clockIn', () => {
    it('performs clock in successfully', async () => {
      mockApiCall.mockResolvedValue(mockClockActionResponse);

      const result = await AttendanceService.clockIn();

      expect(mockApiCall).toHaveBeenCalledWith(
        expect.any(Function),
        'Clock in',
      );
      expect(result).toEqual(mockClockActionResponse);
    });

    it('handles API errors', async () => {
      mockApiCall.mockResolvedValue(null);

      const result = await AttendanceService.clockIn();
      expect(result).toBeNull();
    });
  });

  describe('clockOut', () => {
    const clockOutResponse = {
      message: 'Successfully clocked out',
      attendance: {
        id: 1,
        user_id: 1,
        date: '2025-01-15',
        status: 'clocked_out',
        clock_in_time: '09:00:00',
        clock_out_time: '18:00:00',
        total_work_time: 480,
        total_break_time: 60,
      },
    };

    it('performs clock out successfully', async () => {
      mockApiCall.mockResolvedValue(clockOutResponse);

      const result = await AttendanceService.clockOut();

      expect(mockApiCall).toHaveBeenCalledWith(
        expect.any(Function),
        'Clock out',
      );
      expect(result).toEqual(clockOutResponse);
    });

    it('handles API errors', async () => {
      mockApiCall.mockResolvedValue(null);

      const result = await AttendanceService.clockOut();
      expect(result).toBeNull();
    });
  });

  describe('startBreak', () => {
    const breakResponse = {
      message: 'Break started',
      attendance: {
        id: 1,
        user_id: 1,
        date: '2025-01-15',
        status: 'on_break',
        clock_in_time: '09:00:00',
        total_work_time: 240,
        total_break_time: 0,
      },
    };

    it('starts break successfully', async () => {
      mockApiCall.mockResolvedValue(breakResponse);

      const result = await AttendanceService.startBreak();

      expect(mockApiCall).toHaveBeenCalledWith(
        expect.any(Function),
        'Start break',
      );
      expect(result).toEqual(breakResponse);
    });

    it('handles API errors', async () => {
      mockApiCall.mockResolvedValue(null);

      const result = await AttendanceService.startBreak();
      expect(result).toBeNull();
    });
  });

  describe('endBreak', () => {
    const breakEndResponse = {
      message: 'Break ended',
      attendance: {
        id: 1,
        user_id: 1,
        date: '2025-01-15',
        status: 'clocked_in',
        clock_in_time: '09:00:00',
        total_work_time: 240,
        total_break_time: 30,
      },
    };

    it('ends break successfully', async () => {
      mockApiCall.mockResolvedValue(breakEndResponse);

      const result = await AttendanceService.endBreak();

      expect(mockApiCall).toHaveBeenCalledWith(
        expect.any(Function),
        'End break',
      );
      expect(result).toEqual(breakEndResponse);
    });

    it('handles API errors', async () => {
      mockApiCall.mockResolvedValue(null);

      const result = await AttendanceService.endBreak();
      expect(result).toBeNull();
    });
  });

  describe('error handling', () => {
    it('preserves error response data', async () => {
      mockApiCall.mockResolvedValue(null);

      const result = await AttendanceService.clockIn();
      expect(result).toBeNull();
    });

    it('handles network errors', async () => {
      mockApiCall.mockResolvedValue(null);

      const result = await AttendanceService.getTodayAttendance();
      expect(result).toBeNull();
    });
  });
});