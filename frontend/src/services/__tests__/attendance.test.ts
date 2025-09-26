import AttendanceService from '../attendance';
import api from '../api';

// Mock the API
jest.mock('../api');
const mockedApi = api as jest.Mocked<typeof api>;

const mockTodayAttendanceResponse = {
  data: {
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
  },
};

const mockAttendancesResponse = {
  data: {
    attendances: [
      {
        id: 1,
        date: '2025-01-14',
        status: 'clocked_out',
        clock_in_time: '2025-01-14T09:00:00Z',
        clock_out_time: '2025-01-14T17:00:00Z',
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
  },
};

const mockStatisticsResponse = {
  data: {
    date_range_statistics: {
      start_date: '2025-01-01',
      end_date: '2025-01-31',
      total_days: 31,
      working_days: 20,
      total_work_minutes: 9600,
      total_break_minutes: 1200,
      formatted_total_work_time: '160:00',
      formatted_total_break_time: '20:00',
      average_work_minutes_per_day: 480,
      formatted_average_work_time_per_day: '08:00',
    },
  },
};

const mockMonthlyResponse = {
  data: {
    attendances: mockAttendancesResponse.data.attendances,
    statistics: {
      year: 2025,
      month: 1,
      working_days: 20,
      total_work_minutes: 9600,
      total_break_minutes: 1200,
      formatted_total_work_time: '160:00',
      formatted_total_break_time: '20:00',
      average_work_minutes_per_day: 480,
      formatted_average_work_time_per_day: '08:00',
    },
  },
};

const mockClockActionResponse = {
  data: {
    message: 'Successfully clocked in',
    attendance: mockTodayAttendanceResponse.data.attendance,
  },
};

describe('AttendanceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTodayAttendance', () => {
    it('fetches today attendance successfully', async () => {
      mockedApi.get.mockResolvedValue(mockTodayAttendanceResponse);

      const result = await AttendanceService.getTodayAttendance();

      expect(mockedApi.get).toHaveBeenCalledWith('/v1/attendances/today');
      expect(result).toEqual(mockTodayAttendanceResponse.data);
    });

    it('handles API errors', async () => {
      const error = new Error('API Error');
      mockedApi.get.mockRejectedValue(error);

      await expect(AttendanceService.getTodayAttendance()).rejects.toThrow('API Error');
    });
  });

  describe('getAttendances', () => {
    it('fetches attendances without parameters', async () => {
      mockedApi.get.mockResolvedValue(mockAttendancesResponse);

      const result = await AttendanceService.getAttendances();

      expect(mockedApi.get).toHaveBeenCalledWith('/v1/attendances', { params: {} });
      expect(result).toEqual(mockAttendancesResponse.data);
    });

    it('fetches attendances with date range parameters', async () => {
      mockedApi.get.mockResolvedValue(mockAttendancesResponse);

      const startDate = '2025-01-01';
      const endDate = '2025-01-31';

      const result = await AttendanceService.getAttendances(startDate, endDate);

      expect(mockedApi.get).toHaveBeenCalledWith('/v1/attendances', { 
        params: { start_date: startDate, end_date: endDate }, 
      });
      expect(result).toEqual(mockAttendancesResponse.data);
    });

    it('handles API errors', async () => {
      const error = new Error('API Error');
      mockedApi.get.mockRejectedValue(error);

      await expect(AttendanceService.getAttendances()).rejects.toThrow('API Error');
    });
  });

  describe('getStatistics', () => {
    it('fetches statistics with date range parameters', async () => {
      mockedApi.get.mockResolvedValue(mockStatisticsResponse);

      const result = await AttendanceService.getStatistics('2025-01-01', '2025-01-31');

      expect(mockedApi.get).toHaveBeenCalledWith('/v1/attendances/statistics', { 
        params: { start_date: '2025-01-01', end_date: '2025-01-31' }, 
      });
      expect(result).toEqual(mockStatisticsResponse.data);
    });

    it('fetches statistics with year and month parameters', async () => {
      mockedApi.get.mockResolvedValue(mockStatisticsResponse);

      const result = await AttendanceService.getMonthlyStatistics(2025, 1);

      expect(mockedApi.get).toHaveBeenCalledWith('/v1/attendances/statistics', { 
        params: { year: '2025', month: '1' }, 
      });
      expect(result).toEqual(mockStatisticsResponse.data);
    });

    it('handles API errors', async () => {
      const error = new Error('API Error');
      mockedApi.get.mockRejectedValue(error);

      await expect(AttendanceService.getStatistics('2025-01-01', '2025-01-31')).rejects.toThrow('API Error');
    });
  });

  describe('getMonthlyAttendances', () => {
    it('fetches monthly attendances successfully', async () => {
      mockedApi.get.mockResolvedValue(mockMonthlyResponse);

      const result = await AttendanceService.getMonthlyAttendances(2025, 1);

      expect(mockedApi.get).toHaveBeenCalledWith('/v1/attendances/monthly/2025/1');
      expect(result).toEqual(mockMonthlyResponse.data);
    });

    it('handles API errors', async () => {
      const error = new Error('API Error');
      mockedApi.get.mockRejectedValue(error);

      await expect(AttendanceService.getMonthlyAttendances(2025, 1)).rejects.toThrow('API Error');
    });
  });

  describe('clockIn', () => {
    it('performs clock in successfully', async () => {
      mockedApi.post.mockResolvedValue(mockClockActionResponse);

      const result = await AttendanceService.clockIn();

      expect(mockedApi.post).toHaveBeenCalledWith('/v1/attendances/clock_in');
      expect(result).toEqual(mockClockActionResponse.data);
    });

    it('handles API errors', async () => {
      const error = new Error('Already clocked in');
      mockedApi.post.mockRejectedValue(error);

      await expect(AttendanceService.clockIn()).rejects.toThrow('Already clocked in');
    });
  });

  describe('clockOut', () => {
    it('performs clock out successfully', async () => {
      const clockOutResponse = {
        data: {
          message: 'Successfully clocked out',
          attendance: {
            ...mockTodayAttendanceResponse.data.attendance,
            status: 'clocked_out',
            clock_out_time: '2025-01-15T17:00:00Z',
          },
        },
      };

      mockedApi.post.mockResolvedValue(clockOutResponse);

      const result = await AttendanceService.clockOut();

      expect(mockedApi.post).toHaveBeenCalledWith('/v1/attendances/clock_out');
      expect(result).toEqual(clockOutResponse.data);
    });

    it('handles API errors', async () => {
      const error = new Error('Cannot clock out');
      mockedApi.post.mockRejectedValue(error);

      await expect(AttendanceService.clockOut()).rejects.toThrow('Cannot clock out');
    });
  });

  describe('startBreak', () => {
    it('starts break successfully', async () => {
      const breakResponse = {
        data: {
          message: 'Break started',
          attendance: {
            ...mockTodayAttendanceResponse.data.attendance,
            status: 'on_break',
          },
        },
      };

      mockedApi.post.mockResolvedValue(breakResponse);

      const result = await AttendanceService.startBreak();

      expect(mockedApi.post).toHaveBeenCalledWith('/v1/attendances/break_start');
      expect(result).toEqual(breakResponse.data);
    });

    it('handles API errors', async () => {
      const error = new Error('Cannot start break');
      mockedApi.post.mockRejectedValue(error);

      await expect(AttendanceService.startBreak()).rejects.toThrow('Cannot start break');
    });
  });

  describe('endBreak', () => {
    it('ends break successfully', async () => {
      const breakEndResponse = {
        data: {
          message: 'Break ended',
          attendance: {
            ...mockTodayAttendanceResponse.data.attendance,
            status: 'clocked_in',
            total_break_minutes: 30,
            formatted_break_time: '00:30',
          },
        },
      };

      mockedApi.post.mockResolvedValue(breakEndResponse);

      const result = await AttendanceService.endBreak();

      expect(mockedApi.post).toHaveBeenCalledWith('/v1/attendances/break_end');
      expect(result).toEqual(breakEndResponse.data);
    });

    it('handles API errors', async () => {
      const error = new Error('Cannot end break');
      mockedApi.post.mockRejectedValue(error);

      await expect(AttendanceService.endBreak()).rejects.toThrow('Cannot end break');
    });
  });

  describe('error handling', () => {
    it('preserves error response data', async () => {
      const errorResponse = {
        response: {
          data: {
            error: 'Validation failed',
            details: ['Clock in time is required'],
          },
        },
      };

      mockedApi.post.mockRejectedValue(errorResponse);

      await expect(AttendanceService.clockIn()).rejects.toMatchObject({
        response: {
          data: {
            error: 'Validation failed',
            details: ['Clock in time is required'],
          },
        },
      });
    });

    it('handles network errors', async () => {
      const networkError = new Error('Network Error');
      mockedApi.get.mockRejectedValue(networkError);

      await expect(AttendanceService.getTodayAttendance()).rejects.toThrow('Network Error');
    });
  });
});