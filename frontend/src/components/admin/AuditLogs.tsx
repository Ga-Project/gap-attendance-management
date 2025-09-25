import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Alert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import { Visibility, Refresh } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';
import api from '../../services/api';

interface AuditLog {
  id: number;
  admin_user: {
    id: number;
    name: string;
    email: string;
  };
  target_user: {
    id: number;
    name: string;
    email: string;
  };
  action: string;
  changes: Record<string, { from: any; to: any }>;
  reason: string;
  created_at: string;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
}

interface AuditLogDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  auditLog: AuditLog | null;
}

const AuditLogDetailsDialog: React.FC<AuditLogDetailsDialogProps> = ({
  open,
  onClose,
  auditLog,
}) => {
  if (!auditLog) {
return null;
}

  const formatValue = (value: any) => {
    if (value === null || value === undefined) {
return '未設定';
}
    if (typeof value === 'string' && value.includes('T')) {
      // ISO date string
      return new Date(value).toLocaleString('ja-JP');
    }
    return String(value);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>監査ログ詳細</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Typography variant="body1" gutterBottom>
              <strong>実行者:</strong> {auditLog.admin_user.name}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>対象者:</strong> {auditLog.target_user.name}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>操作:</strong> {auditLog.action}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>実行日時:</strong>{' '}
              {new Date(auditLog.created_at).toLocaleString('ja-JP')}
            </Typography>
          </Box>

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            変更内容
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>項目</TableCell>
                  <TableCell>変更前</TableCell>
                  <TableCell>変更後</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(auditLog.changes).map(([field, change]) => (
                  <TableRow key={field}>
                    <TableCell>{field}</TableCell>
                    <TableCell>{formatValue(change.from)}</TableCell>
                    <TableCell>{formatValue(change.to)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
            修正理由
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2">{auditLog.reason}</Typography>
          </Paper>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
};

const AuditLogs: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchAuditLogs();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      if (selectedUserId) {
params.target_user_id = selectedUserId;
}
      if (startDate) {
params.start_date = startDate.toISOString().split('T')[0];
}
      if (endDate) {
params.end_date = endDate.toISOString().split('T')[0];
}

      const response = await api.get('/admin/audit_logs', { params });
      setAuditLogs(response.data.audit_logs);
    } catch (err: any) {
      setError(err.response?.data?.error || '監査ログの取得に失敗しました');
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (auditLog: AuditLog) => {
    setSelectedAuditLog(auditLog);
    setDetailsDialogOpen(true);
  };

  const getActionChip = (action: string) => {
    const actionMap: Record<string, { label: string; color: any }> = {
      update_attendance: { label: '勤怠修正', color: 'primary' },
      create_user: { label: 'ユーザー作成', color: 'success' },
      update_user: { label: 'ユーザー更新', color: 'warning' },
      delete_attendance: { label: '勤怠削除', color: 'error' },
    };
    
    const actionInfo = actionMap[action] || { label: action, color: 'default' };
    return <Chip label={actionInfo.label} color={actionInfo.color} size="small" />;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Box>
        <Typography variant="h5" gutterBottom>
          監査ログ
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          管理者による変更履歴を確認できます。
        </Typography>

        {/* Filters */}
        <Paper sx={{ p: 2, mt: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>対象者</InputLabel>
              <Select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value as number | '')}
                label="対象者"
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
            <Button
              variant="contained"
              onClick={fetchAuditLogs}
              startIcon={<Refresh />}
            >
              検索
            </Button>
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
                  <TableCell>実行日時</TableCell>
                  <TableCell>実行者</TableCell>
                  <TableCell>対象者</TableCell>
                  <TableCell>操作</TableCell>
                  <TableCell>理由</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      {new Date(log.created_at).toLocaleString('ja-JP')}
                    </TableCell>
                    <TableCell>{log.admin_user.name}</TableCell>
                    <TableCell>{log.target_user.name}</TableCell>
                    <TableCell>{getActionChip(log.action)}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {log.reason}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => handleViewDetails(log)}
                      >
                        詳細
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {auditLogs.length === 0 && !loading && (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary">
              指定された条件の監査ログがありません。
            </Typography>
          </Box>
        )}

        <AuditLogDetailsDialog
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          auditLog={selectedAuditLog}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default AuditLogs;