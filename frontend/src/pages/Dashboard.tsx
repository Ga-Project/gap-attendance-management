import React from 'react';
import {
    Container,
    Paper,
    Box,
    Typography,
    Button,
    AppBar,
    Toolbar,
    Avatar,
    Menu,
    MenuItem,
    Grid,
} from '@mui/material';
import { AdminPanelSettings } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TimeClockWidget from '../components/TimeClockWidget';
import AttendanceHistory from '../components/AttendanceHistory';
import { TodayAttendanceResponse } from '../types';

const Dashboard: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [showAttendanceHistory, setShowAttendanceHistory] = React.useState(false);

    const handleMenu = (event: React.MouseEvent<HTMLElement>): void => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (): void => {
        setAnchorEl(null);
    };

    const handleSignOut = async (): Promise<void> => {
        try {
            await signOut();
            handleClose();
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Sign out error:', error);
        }
    };

    const handleAttendanceUpdate = (data: TodayAttendanceResponse): void => {
        // Handle attendance updates if needed in the future
        // eslint-disable-next-line no-console
        console.log('Attendance updated:', data);
    };

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        勤怠管理システム
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1" sx={{ mr: 2 }}>
                            {user?.name}
                        </Typography>
                        <Button
                            onClick={handleMenu}
                            color="inherit"
                        >
                            <Avatar
                                src={user?.picture}
                                alt={user?.name}
                                sx={{ width: 32, height: 32 }}
                            >
                                {user?.name?.charAt(0)}
                            </Avatar>
                        </Button>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                        >
                            <MenuItem onClick={handleSignOut}>サインアウト</MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Grid container spacing={3}>
                    {/* Welcome Section */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h4" gutterBottom>
                                ダッシュボード
                            </Typography>
                            <Typography variant="body1" color="text.secondary" paragraph>
                                ようこそ、{user?.name}さん
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                権限: {user?.role === 'admin' ? '管理者' : '従業員'}
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Time Clock Widget */}
                    <Grid item xs={12}>
                        <TimeClockWidget onAttendanceUpdate={handleAttendanceUpdate} />
                    </Grid>

                    {/* Additional Features */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                その他の機能
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Button 
                                    variant={showAttendanceHistory ? 'contained' : 'outlined'}
                                    onClick={() => setShowAttendanceHistory(!showAttendanceHistory)}
                                >
                                    実績確認
                                </Button>
                                <Button variant="outlined" disabled>
                                    月次レポート
                                </Button>
                                {user?.role === 'admin' && (
                                    <Button 
                                        variant="contained" 
                                        color="secondary"
                                        startIcon={<AdminPanelSettings />}
                                        onClick={() => navigate('/admin')}
                                    >
                                        管理者画面
                                    </Button>
                                )}
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Attendance History */}
                    {showAttendanceHistory && (
                        <Grid item xs={12}>
                            <AttendanceHistory />
                        </Grid>
                    )}
                </Grid>
            </Container>
        </>
    );
};

export default Dashboard;