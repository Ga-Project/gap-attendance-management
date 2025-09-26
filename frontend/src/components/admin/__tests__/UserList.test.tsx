import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import UserList from '../UserList';
import api from '../../../services/api';

// Mock the API
jest.mock('../../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>,
  );
};

const mockUsers = [
  {
    id: 'id: 1',
    name: 'Test User 1',
    email: 'test1@example.com',
    role: 'employee' as const,
    created_at: '2023-01-01T00:00:00Z',
    total_attendances: 5,
  },
  {
    id: 'id: 2',
    name: 'Test Admin',
    email: 'admin@example.com',
    role: 'admin' as const,
    created_at: '2023-01-01T00:00:00Z',
    total_attendances: 10,
  },
];

const mockAttendances = [
  {
    id: 'id: 1',
    user: {
      id: 'id: 1',
      name: 'Test User 1',
      email: 'test1@example.com',
    },
    date: '2023-12-01',
    clock_in_time: '2023-12-01T09:00:00Z',
    clock_out_time: '2023-12-01T17:00:00Z',
    total_work_minutes: 480,
    total_break_minutes: 60,
    status: 'clocked_out',
  },
];

describe('UserList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user list tab by default', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { users: mockUsers },
    });

    renderWithTheme(<UserList />);

    expect(screen.getByText('全社員勤怠管理')).toBeInTheDocument();
    expect(screen.getByText('社員一覧')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Test User 1')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Test Admin')).toBeInTheDocument();
  });

  it('displays attendance records when switching to attendance tab', async () => {
    mockedApi.get
      .mockResolvedValueOnce({ data: { users: mockUsers } })
      .mockResolvedValueOnce({ data: { attendances: mockAttendances } });

    renderWithTheme(<UserList />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Test User 1')).toBeInTheDocument();
    });

    // Click on attendance tab
    const attendanceTab = screen.getByText('勤怠実績');
    fireEvent.click(attendanceTab);

    await waitFor(() => {
      expect(screen.getByText('CSV エクスポート')).toBeInTheDocument();
    });
  });

  it('displays monthly report when switching to monthly report tab', async () => {
    mockedApi.get
      .mockResolvedValueOnce({ data: { users: mockUsers } })
      .mockResolvedValueOnce({ data: { attendances: mockAttendances } });

    renderWithTheme(<UserList />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Test User 1')).toBeInTheDocument();
    });

    // Click on monthly report tab
    const monthlyTab = screen.getByText('月次レポート');
    fireEvent.click(monthlyTab);

    await waitFor(() => {
      expect(screen.getAllByText('対象月')).toHaveLength(2); // Label and legend
    });
  });

  it('displays user action buttons', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { users: mockUsers },
    });

    renderWithTheme(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('Test User 1')).toBeInTheDocument();
    });

    // Check that action buttons are present
    expect(screen.getAllByText('詳細')).toHaveLength(2);
    expect(screen.getAllByText('勤怠履歴')).toHaveLength(2);
  });

  it('displays user information correctly', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { users: mockUsers },
    });

    renderWithTheme(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('Test User 1')).toBeInTheDocument();
    });

    expect(screen.getByText('test1@example.com')).toBeInTheDocument();
    expect(screen.getByText('Test Admin')).toBeInTheDocument();
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
  });

  it('displays CSV export button in attendance tab', async () => {
    mockedApi.get
      .mockResolvedValueOnce({ data: { users: mockUsers } })
      .mockResolvedValueOnce({ data: { attendances: mockAttendances } });

    renderWithTheme(<UserList />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Test User 1')).toBeInTheDocument();
    });

    // Switch to attendance tab
    const attendanceTab = screen.getByText('勤怠実績');
    fireEvent.click(attendanceTab);

    // Wait for CSV export button to appear
    await waitFor(() => {
      expect(screen.getByText('CSV エクスポート')).toBeInTheDocument();
    });

    // Verify the button is clickable
    const exportButton = screen.getByText('CSV エクスポート');
    expect(exportButton).toBeEnabled();
  });

  it('handles API errors gracefully', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('API Error'));

    renderWithTheme(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('社員一覧の取得に失敗しました')).toBeInTheDocument();
    });
  });
});