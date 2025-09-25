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
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
    const { user, signOut } = useAuth();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

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

                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            機能（開発中）
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Button variant="outlined" disabled>
                                出勤打刻
                            </Button>
                            <Button variant="outlined" disabled>
                                退勤打刻
                            </Button>
                            <Button variant="outlined" disabled>
                                休憩開始
                            </Button>
                            <Button variant="outlined" disabled>
                                休憩終了
                            </Button>
                            <Button variant="outlined" disabled>
                                実績確認
                            </Button>
                            {user?.role === 'admin' && (
                                <Button variant="outlined" disabled>
                                    管理者機能
                                </Button>
                            )}
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </>
    );
};

export default Dashboard;