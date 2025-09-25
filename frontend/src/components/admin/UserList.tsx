import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
} from '@mui/material';
import { 
  Visibility, 
  DateRange, 
  Assessment,
  Download,
} from '@mui/icons-material';
import api from '../../services/api';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'employee' | 'admin';
  created_at: string;
  total_attendances: number;
}

interface AttendanceRecord {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  date: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  total_work_minutes: number | null;
  total_break_minutes: number | null;
  status: string;
}

interface MonthlyStats {
  user_id: number;
  user_name: string;
  total_work_days: number;
  total_work_hours: number;
  total_break_hours: number;
  average_work_hours: number;
}

interface UserDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  user: AdminUser | null;
}

interface AttendanceDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  user: AdminUser | null;
}

const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({ 
  open, 
  onClose, 
  user,
}) => {
  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>社員詳細情報</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" gutterBottom>
            <strong>名前:</strong> {user.name}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>メールアドレス:</strong> {user.email}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>権限:</strong>{' '}
            <Chip
              label={user.role === 'admin' ? '管理者' : '従業員'}
              color={user.role === 'admin' ? 'secondary' : 'primary'}
              size="small"
            />
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>登録日:</strong> {new Date(user.created_at).toLocaleDateString('ja-JP')}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>勤怠記録数:</strong> {user.total_attendances}件
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
};

const AttendanceDetailsDialog: React.FC<AttendanceDetailsDialogProps> = ({ 
  open, 
  onClose, 
  user,
}) => {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Default to last 30 days
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const fetchUserAttendances = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/attendances', {
        params: {
          user_id: user.id,
          start_date: startDate,
          end_date: endDate,
        },
      });
      setAttendances(response.data.attendances);
    } catch (err: any) {
      setError(err.response?.data?.error || '勤怠データの取得に失敗しました');
      // eslint-disable-next-line no-console
      console.error('Failed to fetch user attendances:', err);
    } finally {
      setLoading(false);
    }
  }, [user, startDate, endDate]);

  useEffect(() => {
    if (open && user) {
      fetchUserAttendances();
    }
  }, [open, user, startDate, endDate, fetchUserAttendances]);

  const formatTime = (timeString: string | null) => {
    if (!timeString) {
      return '-';
    }
    return new Date(timeString).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatWorkHours = (minutes: number | null) => {
    if (!minutes) {
      return '-';
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}時間${mins}分`;
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{user.name}さんの勤怠履歴</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Date Range Filter */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <TextField
                label="開始日"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="終了日"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          {loading && (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>日付</TableCell>
                    <TableCell>出勤時刻</TableCell>
                    <TableCell>退勤時刻</TableCell>
                    <TableCell>勤務時間</TableCell>
                    <TableCell>休憩時間</TableCell>
                    <TableCell>ステータス</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendances.map((attendance) => (
                    <TableRow key={attendance.id}>
                      <TableCell>
                        {new Date(attendance.date).toLocaleDateString('ja-JP')}
                      </TableCell>
                      <TableCell>{formatTime(attendance.clock_in_time)}</TableCell>
                      <TableCell>{formatTime(attendance.clock_out_time)}</TableCell>
                      <TableCell>{formatWorkHours(attendance.total_work_minutes)}</TableCell>
                      <TableCell>{formatWorkHours(attendance.total_break_minutes)}</TableCell>
                      <TableCell>
                        <Chip
                          label={attendance.status}
                          size="small"
                          color={attendance.status === 'clocked_out' ? 'success' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {!loading && !error && attendances.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                指定期間内に勤怠データがありません。
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
};

const UserList: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [startDate, setStartDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/users');
      setUsers(response.data.users);
    } catch (err: any) {
      setError(err.response?.data?.error || '社員一覧の取得に失敗しました');
      // eslint-disable-next-line no-console
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllAttendances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/attendances', {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });
      setAttendances(response.data.attendances);
    } catch (err: any) {
      setError(err.response?.data?.error || '勤怠データの取得に失敗しました');
      // eslint-disable-next-line no-console
      console.error('Failed to fetch attendances:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const fetchMonthlyStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Calculate month start and end dates
      const [year, month] = selectedMonth.split('-');
      const monthStart = `${year}-${month}-01`;
      const monthEnd = new Date(parseInt(year, 10), parseInt(month, 10), 0).toISOString().split('T')[0];
      
      const response = await api.get('/admin/attendances', {
        params: {
          start_date: monthStart,
          end_date: monthEnd,
        },
      });
      
      // Calculate monthly statistics from attendance data
      const attendanceData = response.data.attendances;
      const statsMap = new Map<number, MonthlyStats>();
      
      attendanceData.forEach((attendance: AttendanceRecord) => {
        const userId = attendance.user.id;
        const userName = attendance.user.name;
        
        if (!statsMap.has(userId)) {
          statsMap.set(userId, {
            user_id: userId,
            user_name: userName,
            total_work_days: 0,
            total_work_hours: 0,
            total_break_hours: 0,
            average_work_hours: 0,
          });
        }
        
        const stats = statsMap.get(userId)!;
        
        if (attendance.total_work_minutes && attendance.total_work_minutes > 0) {
          stats.total_work_days += 1;
          stats.total_work_hours += attendance.total_work_minutes / 60;
        }
        
        if (attendance.total_break_minutes) {
          stats.total_break_hours += attendance.total_break_minutes / 60;
        }
      });
      
      // Calculate averages
      statsMap.forEach((stats) => {
        if (stats.total_work_days > 0) {
          stats.average_work_hours = stats.total_work_hours / stats.total_work_days;
        }
      });
      
      setMonthlyStats(Array.from(statsMap.values()));
    } catch (err: any) {
      setError(err.response?.data?.error || '月次統計の取得に失敗しました');
      // eslint-disable-next-line no-console
      console.error('Failed to fetch monthly stats:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (tabValue === 1) {
      fetchAllAttendances();
    } else if (tabValue === 2) {
      fetchMonthlyStats();
    }
  }, [tabValue, startDate, endDate, selectedMonth, fetchAllAttendances, fetchMonthlyStats]);

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/admin/export_csv', {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.error || 'CSVエクスポートに失敗しました');
      // eslint-disable-next-line no-console
      console.error('Failed to export CSV:', err);
    }
  };

  const handleViewUser = (user: AdminUser) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleViewAttendance = (user: AdminUser) => {
    setSelectedUser(user);
    setAttendanceDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  const handleCloseAttendanceDialog = () => {
    setAttendanceDialogOpen(false);
    setSelectedUser(null);
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) {
      return '-';
    }
    return new Date(timeString).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatWorkHours = (minutes: number | null) => {
    if (!minutes) {
      return '-';
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}時間${mins}分`;
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        全社員勤怠管理
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        全社員の勤怠状況を管理できます。
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="社員一覧" />
          <Tab label="勤怠実績" icon={<DateRange />} />
          <Tab label="月次レポート" icon={<Assessment />} />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tab 0: User List */}
      {tabValue === 0 && (
        <Box>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>名前</TableCell>
                      <TableCell>メールアドレス</TableCell>
                      <TableCell>権限</TableCell>
                      <TableCell>勤怠記録数</TableCell>
                      <TableCell>登録日</TableCell>
                      <TableCell align="center">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.role === 'admin' ? '管理者' : '従業員'}
                            color={user.role === 'admin' ? 'secondary' : 'primary'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{user.total_attendances}件</TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString('ja-JP')}
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() => handleViewUser(user)}
                            sx={{ mr: 1 }}
                          >
                            詳細
                          </Button>
                          <Button
                            size="small"
                            startIcon={<DateRange />}
                            onClick={() => handleViewAttendance(user)}
                            variant="outlined"
                          >
                            勤怠履歴
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {users.length === 0 && (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="text.secondary">
                    登録されている社員がいません。
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>
      )}

      {/* Tab 1: All Attendances */}
      {tabValue === 1 && (
        <Box>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <TextField
                label="開始日"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="終了日"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={handleExportCSV}
                fullWidth
                sx={{ height: '56px' }}
              >
                CSV エクスポート
              </Button>
            </Grid>
          </Grid>

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>日付</TableCell>
                      <TableCell>社員名</TableCell>
                      <TableCell>出勤時刻</TableCell>
                      <TableCell>退勤時刻</TableCell>
                      <TableCell>勤務時間</TableCell>
                      <TableCell>休憩時間</TableCell>
                      <TableCell>ステータス</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendances.map((attendance) => (
                      <TableRow key={attendance.id} hover>
                        <TableCell>
                          {new Date(attendance.date).toLocaleDateString('ja-JP')}
                        </TableCell>
                        <TableCell>{attendance.user.name}</TableCell>
                        <TableCell>{formatTime(attendance.clock_in_time)}</TableCell>
                        <TableCell>{formatTime(attendance.clock_out_time)}</TableCell>
                        <TableCell>{formatWorkHours(attendance.total_work_minutes)}</TableCell>
                        <TableCell>{formatWorkHours(attendance.total_break_minutes)}</TableCell>
                        <TableCell>
                          <Chip
                            label={attendance.status}
                            size="small"
                            color={attendance.status === 'clocked_out' ? 'success' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {attendances.length === 0 && (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="text.secondary">
                    指定期間内に勤怠データがありません。
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>
      )}

      {/* Tab 2: Monthly Report */}
      {tabValue === 2 && (
        <Box>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="対象月"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Grid container spacing={2}>
                {monthlyStats.map((stats) => (
                  <Grid item xs={12} md={6} lg={4} key={stats.user_id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {stats.user_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          出勤日数: {stats.total_work_days}日
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          総勤務時間: {stats.total_work_hours.toFixed(1)}時間
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          総休憩時間: {stats.total_break_hours.toFixed(1)}時間
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          平均勤務時間: {stats.average_work_hours.toFixed(1)}時間/日
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {monthlyStats.length === 0 && (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="text.secondary">
                    選択した月に勤怠データがありません。
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>
      )}

      <UserDetailsDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        user={selectedUser}
      />

      <AttendanceDetailsDialog
        open={attendanceDialogOpen}
        onClose={handleCloseAttendanceDialog}
        user={selectedUser}
      />
    </Box>
  );
};

export default UserList;