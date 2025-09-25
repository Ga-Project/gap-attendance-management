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
  Chip,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import api from '../../services/api';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'employee' | 'admin';
  created_at: string;
  total_attendances: number;
}

interface UserDetailsDialogProps {
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

const UserList: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/users');
      setUsers(response.data.users);
    } catch (err: any) {
      setError(err.response?.data?.error || '社員一覧の取得に失敗しました');
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (user: AdminUser) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        社員一覧
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        登録されている全社員の一覧です。
      </Typography>

      <TableContainer component={Paper} sx={{ mt: 2 }}>
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
                  >
                    詳細
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

      <UserDetailsDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        user={selectedUser}
      />
    </Box>
  );
};

export default UserList;