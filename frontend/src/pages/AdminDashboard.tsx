import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  AppBar,
  Toolbar,
  Button,
} from '@mui/material';
import { Logout, Dashboard as DashboardIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import UserList from '../components/admin/UserList';
import AttendanceManagement from '../components/admin/AttendanceManagement';
import AuditLogs from '../components/admin/AuditLogs';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

const AdminDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            管理者ダッシュボード
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.name} (管理者)
          </Typography>
          <Button color="inherit" onClick={handleSignOut} startIcon={<Logout />}>
            ログアウト
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin dashboard tabs">
              <Tab label="社員一覧" {...a11yProps(0)} />
              <Tab label="勤怠管理" {...a11yProps(1)} />
              <Tab label="監査ログ" {...a11yProps(2)} />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <UserList />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <AttendanceManagement />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <AuditLogs />
          </TabPanel>
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminDashboard;