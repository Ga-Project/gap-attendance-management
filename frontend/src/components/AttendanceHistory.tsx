import React, { useState, useEffect, useCallback } from 'react';
import {
    Paper,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Grid,
    Card,
    CardContent,
    Alert,
    CircularProgress,
    Tabs,
    Tab,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AttendanceService from '../services/attendance';
import { Attendance, MonthlyAttendanceResponse, DateRangeStatistics } from '../types';

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
            id={`attendance-tabpanel-${index}`}
            aria-labelledby={`attendance-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const AttendanceHistory: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Date range view state
    const [startDate, setStartDate] = useState<Date | null>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // 7 days ago
    const [endDate, setEndDate] = useState<Date | null>(new Date());
    const [dateRangeAttendances, setDateRangeAttendances] = useState<Attendance[]>([]);
    const [dateRangeStatistics, setDateRangeStatistics] = useState<DateRangeStatistics | null>(null);
    
    // Monthly view state
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [monthlyData, setMonthlyData] = useState<MonthlyAttendanceResponse | null>(null);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
        setError(null);
    };

    const fetchDateRangeData = useCallback(async () => {
        if (!startDate || !endDate) {
return;
}

        setLoading(true);
        setError(null);

        try {
            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];

            const [attendancesResponse, statisticsResponse] = await Promise.all([
                AttendanceService.getAttendances(startDateStr, endDateStr),
                AttendanceService.getStatistics(startDateStr, endDateStr),
            ]);

            setDateRangeAttendances(attendancesResponse.attendances);
            setDateRangeStatistics(statisticsResponse.date_range_statistics);
        } catch (err) {
            setError('データの取得に失敗しました。');
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    const fetchMonthlyData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await AttendanceService.getMonthlyAttendances(selectedYear, selectedMonth);
            setMonthlyData(response);
        } catch (err) {
            setError('月次データの取得に失敗しました。');
        } finally {
            setLoading(false);
        }
    }, [selectedYear, selectedMonth]);

    useEffect(() => {
        if (tabValue === 0) {
            fetchDateRangeData();
        }
    }, [startDate, endDate, tabValue, fetchDateRangeData]);

    useEffect(() => {
        if (tabValue === 1) {
            fetchMonthlyData();
        }
    }, [selectedYear, selectedMonth, tabValue, fetchMonthlyData]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'short',
        });
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

    const getStatusText = (status: string) => {
        switch (status) {
            case 'not_started': return '未開始';
            case 'clocked_in': return '出勤中';
            case 'on_break': return '休憩中';
            case 'clocked_out': return '退勤済み';
            default: return status;
        }
    };

    const renderAttendanceTable = (attendances: Attendance[]) => (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>日付</TableCell>
                        <TableCell>状態</TableCell>
                        <TableCell>出勤時刻</TableCell>
                        <TableCell>退勤時刻</TableCell>
                        <TableCell>勤務時間</TableCell>
                        <TableCell>休憩時間</TableCell>
                        <TableCell>在社時間</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {attendances.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} align="center">
                                <Typography color="text.secondary">
                                    データがありません
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ) : (
                        attendances.map((attendance) => (
                            <TableRow key={attendance.id}>
                                <TableCell>{formatDate(attendance.date)}</TableCell>
                                <TableCell>{getStatusText(attendance.status)}</TableCell>
                                <TableCell>{formatTime(attendance.clock_in_time || null)}</TableCell>
                                <TableCell>{formatTime(attendance.clock_out_time || null)}</TableCell>
                                <TableCell>{attendance.formatted_work_time}</TableCell>
                                <TableCell>{attendance.formatted_break_time}</TableCell>
                                <TableCell>{attendance.formatted_total_office_time}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );

    const renderStatisticsCard = (statistics: DateRangeStatistics | MonthlyAttendanceResponse['statistics']) => (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    統計情報
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                            勤務日数
                        </Typography>
                        <Typography variant="h6">
                            {statistics.working_days}日
                        </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                            総勤務時間
                        </Typography>
                        <Typography variant="h6">
                            {statistics.formatted_total_work_time}
                        </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                            総休憩時間
                        </Typography>
                        <Typography variant="h6">
                            {statistics.formatted_total_break_time}
                        </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                            平均勤務時間/日
                        </Typography>
                        <Typography variant="h6">
                            {statistics.formatted_average_work_time_per_day}
                        </Typography>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                勤怠実績
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="期間指定" />
                    <Tab label="月次表示" />
                </Tabs>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <TabPanel value={tabValue} index={0}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Box sx={{ mb: 3 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item>
                                <DatePicker
                                    label="開始日"
                                    value={startDate}
                                    onChange={setStartDate}
                                    slotProps={{ textField: { fullWidth: true } }}
                                />
                            </Grid>
                            <Grid item>
                                <DatePicker
                                    label="終了日"
                                    value={endDate}
                                    onChange={setEndDate}
                                    slotProps={{ textField: { fullWidth: true } }}
                                />
                            </Grid>
                            <Grid item>
                                <Button
                                    variant="contained"
                                    onClick={fetchDateRangeData}
                                    disabled={loading || !startDate || !endDate}
                                >
                                    検索
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </LocalizationProvider>

                {loading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {dateRangeStatistics && (
                            <Box sx={{ mb: 3 }}>
                                {renderStatisticsCard(dateRangeStatistics)}
                            </Box>
                        )}
                        {renderAttendanceTable(dateRangeAttendances)}
                    </>
                )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <Box sx={{ mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item>
                            <FormControl sx={{ minWidth: 120 }}>
                                <InputLabel>年</InputLabel>
                                <Select
                                    value={selectedYear}
                                    label="年"
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                >
                                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                        <MenuItem key={year} value={year}>{year}年</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item>
                            <FormControl sx={{ minWidth: 120 }}>
                                <InputLabel>月</InputLabel>
                                <Select
                                    value={selectedMonth}
                                    label="月"
                                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                        <MenuItem key={month} value={month}>{month}月</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Box>

                {loading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {monthlyData && (
                            <>
                                <Box sx={{ mb: 3 }}>
                                    {renderStatisticsCard(monthlyData.statistics)}
                                </Box>
                                {renderAttendanceTable(monthlyData.attendances)}
                            </>
                        )}
                    </>
                )}
            </TabPanel>
        </Paper>
    );
};

export default AttendanceHistory;