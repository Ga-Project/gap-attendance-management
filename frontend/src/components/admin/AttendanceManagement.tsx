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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { Edit, Download, Refresh } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';
import api from '../../services/api';

interface AdminAttendance {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  date: string;
  clock_in_time?: string;
  clock_out_time?: string;
  total_work_minutes: number;
  total_break_minutes: number;
  status: 'not_started' | 'clocked_in' | 'on_break' | 'clocked_out';
  records: Array<{
    id: number;
    record_type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
    timestamp: string;
  }>;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
}

interface EditAttendanceDialogProps {
  open: boolean;
  onClose: () => void;
  attendance: AdminAttendance | null;
  onSave: (id: number, data: any, reason: string) => Promise<void>;
}

const EditAttendanceDialog: React.FC<EditAttendanceDialogProps> = ({
  open,
  onClose,
  attendance,
  onSave,
}) => {
  const [clockInTime, setClockInTime] = useState('');
  const [clockOutTime, setClockOutTime] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (attendance) {
      setClockInTime(
        attendance.clock_in_time
          ? new Date(attendance.clock_in_time).toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '',
      );
      setClockOutTime(
        attendance.clock_out_time
          ? new Date(attendance.clock_out_time).toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '',
      );
      setReason('');
    }
  }, [attendance]);

  const handleSave = async () => {
    if (!attendance || !reason.trim()) {
      return;
    }

    try {
      setSaving(true);
      
      const clockInDateTime = clockInTime
        ? new Date(`${attendance.date}T${clockInTime}:00`)
        : null;
      const clockOutDateTime = clockOutTime
        ? new Date(`${attendance.date}T${clockOutTime}:00`)
        : null;

      await onSave(
        attendance.id,
        {
          clock_in_time: clockInDateTime?.toISOString(),
          clock_out_time: clockOutDateTime?.toISOString(),
        },
        reason,
      );
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to save attendance:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!attendance) {
return null;
}

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>勤怠データ修正</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" gutterBottom>
            <strong>社員:</strong> {attendance.user.name}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>日付:</strong> {new Date(attendance.date).toLocaleDateString('ja-JP')}
          </Typography>

          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="出勤時刻"
              type="time"
              value={clockInTime}
              onChange={(e) => setClockInTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="退勤時刻"
              type="time"
              value={clockOutTime}
              onChange={(e) => setClockOutTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <TextField
            fullWidth
            label="修正理由"
            multiline
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            sx={{ mt: 2 }}
            required
            helperText="修正理由は必須です"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          キャンセル
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || !reason.trim()}
        >
          {saving ? <CircularProgress size={20} /> : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const AttendanceManagement: React.FC = () => {
  const [attendances, setAttendances] = useState<AdminAttendance[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [editingAttendance, setEditingAttendance] = useState<AdminAttendance | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.users);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchAttendances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      if (selectedUserId) {
params.user_id = selectedUserId;
}
      if (startDate) {
params.start_date = startDate.toISOString().split('T')[0];
}
      if (endDate) {
params.end_date = endDate.toISOString().split('T')[0];
}

      const response = await api.get('/admin/attendances', { params });
      setAttendances(response.data.attendances);
    } catch (err: any) {
      setError(err.response?.data?.error || '勤怠データの取得に失敗しました');
      // eslint-disable-next-line no-console
      console.error('Failed to fetch attendances:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, startDate, endDate]);

  useEffect(() => {
    fetchUsers();
    fetchAttendances();
  }, [fetchAttendances]);

  const handleEditAttendance = (attendance: AdminAttendance) => {
    setEditingAttendance(attendance);
    setEditDialogOpen(true);
  };

  const handleSaveAttendance = async (id: number, data: any, reason: string) => {
    try {
      await api.put(`/admin/attendances/${id}`, {
        attendance: data,
        reason,
      });
      
      // Refresh the attendances list
      await fetchAttendances();
    } catch (error) {
      throw error;
    }
  };

  const handleExportCSV = async () => {
    try {
      const params: any = {};
      if (selectedUserId) {
params.user_id = selectedUserId;
}
      if (startDate) {
params.start_date = startDate.toISOString().split('T')[0];
}
      if (endDate) {
params.end_date = endDate.toISOString().split('T')[0];
}

      const response = await api.get('/admin/export_csv', {
        params,
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.error || 'CSVエクスポートに失敗しました');
      // eslint-disable-next-line no-console
      console.error('Failed to export CSV:', err);
    }
  };

  const formatTime = (timeString?: string | null) => {
    if (!timeString) {
      return '-';
    }
    return new Date(timeString).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const getStatusChip = (status: string) => {
    const statusMap = {
      not_started: { label: '未開始', color: 'default' as const },
      clocked_in: { label: '出勤中', color: 'primary' as const },
      on_break: { label: '休憩中', color: 'warning' as const },
      clocked_out: { label: '退勤済み', color: 'success' as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.not_started;
    return <Chip label={statusInfo.label} color={statusInfo.color} size="small" />;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Box>
        <Typography variant="h5" gutterBottom>
          勤怠管理
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          全社員の勤怠データを管理できます。
        </Typography>

        {/* Filters */}
        <Paper sx={{ p: 2, mt: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>社員</InputLabel>
              <Select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value as number | '')}
                label="社員"
              >
                <MenuItem value="">全員</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <DatePicker
              label="開始日"
              value={startDate}
              onChange={setStartDate}
              slotProps={{ textField: { sx: { minWidth: 150 } } }}
            />
            <DatePicker
              label="終了日"
              value={endDate}
              onChange={setEndDate}
              slotProps={{ textField: { sx: { minWidth: 150 } } }}
            />
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                onClick={fetchAttendances}
                startIcon={<Refresh />}
              >
                検索
              </Button>
              <Button
                variant="outlined"
                onClick={handleExportCSV}
                startIcon={<Download />}
              >
                CSV
              </Button>
            </Box>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>社員名</TableCell>
                  <TableCell>日付</TableCell>
                  <TableCell>出勤時刻</TableCell>
                  <TableCell>退勤時刻</TableCell>
                  <TableCell>勤務時間</TableCell>
                  <TableCell>休憩時間</TableCell>
                  <TableCell>ステータス</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendances.map((attendance) => (
                  <TableRow key={attendance.id} hover>
                    <TableCell>{attendance.user.name}</TableCell>
                    <TableCell>
                      {new Date(attendance.date).toLocaleDateString('ja-JP')}
                    </TableCell>
                    <TableCell>{formatTime(attendance.clock_in_time || null)}</TableCell>
                    <TableCell>{formatTime(attendance.clock_out_time || null)}</TableCell>
                    <TableCell>{formatMinutes(attendance.total_work_minutes)}</TableCell>
                    <TableCell>{formatMinutes(attendance.total_break_minutes)}</TableCell>
                    <TableCell>{getStatusChip(attendance.status)}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleEditAttendance(attendance)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {attendances.length === 0 && !loading && (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary">
              指定された条件の勤怠データがありません。
            </Typography>
          </Box>
        )}

        <EditAttendanceDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          attendance={editingAttendance}
          onSave={handleSaveAttendance}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default AttendanceManagement;