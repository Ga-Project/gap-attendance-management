import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Grid,
    Chip,
    Alert,
    Snackbar,
    CircularProgress,
    Divider,
} from '@mui/material';
import {
    AccessTime,
    PlayArrow,
    Stop,
    PauseCircle,
    PlayCircle,
} from '@mui/icons-material';
import AttendanceService from '../services/attendance';
import { TodayAttendanceResponse, AttendanceActionResponse } from '../types';

interface TimeClockWidgetProps {
    onAttendanceUpdate?: (attendance: TodayAttendanceResponse) => void;
}

interface SnackbarState {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
}

const TimeClockWidget: React.FC<TimeClockWidgetProps> = ({ onAttendanceUpdate }) => {
    const [attendanceData, setAttendanceData] = useState<TodayAttendanceResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState<SnackbarState>({
        open: false,
        message: '',
        severity: 'success',
    });

    useEffect(() => {
        loadTodayAttendance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadTodayAttendance = async (): Promise<void> => {
        try {
            setLoading(true);
            const data = await AttendanceService.getTodayAttendance();
            setAttendanceData(data);
            onAttendanceUpdate?.(data);
        } catch (error) {
            showSnackbar('勤怠データの取得に失敗しました', 'error');
            // eslint-disable-next-line no-console
            console.error('Failed to load today attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (
        action: () => Promise<AttendanceActionResponse>,
        actionType: string,
    ): Promise<void> => {
        try {
            setActionLoading(actionType);
            const response = await action();
            showSnackbar(response.message, 'success');

            // Reload attendance data to get updated state
            await loadTodayAttendance();
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || `${actionType}に失敗しました`;
            showSnackbar(errorMessage, 'error');
            // eslint-disable-next-line no-console
            console.error(`${actionType} failed:`, error);
        } finally {
            setActionLoading(null);
        }
    };

    const showSnackbar = (message: string, severity: SnackbarState['severity']): void => {
        setSnackbar({
            open: true,
            message,
            severity,
        });
    };

    const handleCloseSnackbar = (): void => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
        switch (status) {
            case 'not_started':
                return 'default';
            case 'clocked_in':
                return 'success';
            case 'on_break':
                return 'warning';
            case 'clocked_out':
                return 'info';
            default:
                return 'default';
        }
    };

    const getStatusText = (status: string): string => {
        switch (status) {
            case 'not_started':
                return '未出勤';
            case 'clocked_in':
                return '勤務中';
            case 'on_break':
                return '休憩中';
            case 'clocked_out':
                return '退勤済み';
            default:
                return '不明';
        }
    };

    const formatTime = (timeString?: string): string => {
        if (!timeString) {
            return '--:--';
        }
        const date = new Date(timeString);
        return date.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    };

    if (loading) {
        return (
            <Card>
                <CardContent>
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                        <CircularProgress />
                    </Box>
                </CardContent>
            </Card>
        );
    }

    if (!attendanceData) {
        return (
            <Card>
                <CardContent>
                    <Alert severity="error">
                        勤怠データを読み込めませんでした
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    const { attendance } = attendanceData;

    return (
        <>
            <Card>
                <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                        <AccessTime sx={{ mr: 1 }} />
                        <Typography variant="h6" component="h2">
                            勤怠打刻
                        </Typography>
                        <Box ml="auto">
                            <Chip
                                label={getStatusText(attendance.status)}
                                color={getStatusColor(attendance.status)}
                                size="small"
                            />
                        </Box>
                    </Box>

                    {/* Current Status Display */}
                    <Grid container spacing={2} mb={3}>
                        <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">
                                出勤時刻
                            </Typography>
                            <Typography variant="h6">
                                {formatTime(attendance.clock_in_time)}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">
                                退勤時刻
                            </Typography>
                            <Typography variant="h6">
                                {formatTime(attendance.clock_out_time)}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">
                                勤務時間
                            </Typography>
                            <Typography variant="h6">
                                {attendance.formatted_work_time}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">
                                休憩時間
                            </Typography>
                            <Typography variant="h6">
                                {attendance.formatted_break_time}
                            </Typography>
                        </Grid>
                    </Grid>

                    <Divider sx={{ mb: 3 }} />

                    {/* Action Buttons */}
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Button
                                fullWidth
                                variant={attendanceData.can_clock_in ? 'contained' : 'outlined'}
                                color="primary"
                                startIcon={<PlayArrow />}
                                disabled={!attendanceData.can_clock_in || actionLoading !== null}
                                onClick={() => handleAction(AttendanceService.clockIn, '出勤打刻')}
                            >
                                {actionLoading === '出勤打刻' ? (
                                    <CircularProgress size={20} />
                                ) : (
                                    '出勤'
                                )}
                            </Button>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Button
                                fullWidth
                                variant={attendanceData.can_clock_out ? 'contained' : 'outlined'}
                                color="error"
                                startIcon={<Stop />}
                                disabled={!attendanceData.can_clock_out || actionLoading !== null}
                                onClick={() => handleAction(AttendanceService.clockOut, '退勤打刻')}
                            >
                                {actionLoading === '退勤打刻' ? (
                                    <CircularProgress size={20} />
                                ) : (
                                    '退勤'
                                )}
                            </Button>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Button
                                fullWidth
                                variant={attendanceData.can_start_break ? 'contained' : 'outlined'}
                                color="warning"
                                startIcon={<PauseCircle />}
                                disabled={!attendanceData.can_start_break || actionLoading !== null}
                                onClick={() => handleAction(AttendanceService.startBreak, '休憩開始')}
                            >
                                {actionLoading === '休憩開始' ? (
                                    <CircularProgress size={20} />
                                ) : (
                                    '休憩開始'
                                )}
                            </Button>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Button
                                fullWidth
                                variant={attendanceData.can_end_break ? 'contained' : 'outlined'}
                                color="success"
                                startIcon={<PlayCircle />}
                                disabled={!attendanceData.can_end_break || actionLoading !== null}
                                onClick={() => handleAction(AttendanceService.endBreak, '休憩終了')}
                            >
                                {actionLoading === '休憩終了' ? (
                                    <CircularProgress size={20} />
                                ) : (
                                    '休憩終了'
                                )}
                            </Button>
                        </Grid>
                    </Grid>

                    {/* Today's Summary */}
                    {attendance.in_progress && (
                        <Box mt={3}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                本日の在社時間: {attendance.formatted_total_office_time}
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default TimeClockWidget;