import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
    Container,
    Paper,
    Box,
    Typography,
    Button,
    Alert,
    CircularProgress,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
    const { signIn, isAuthenticated, loading } = useAuth();
    const [error, setError] = useState<string>('');
    const [isSigningIn, setIsSigningIn] = useState(false);
    const location = useLocation();

    const from = (location.state as any)?.from?.pathname || '/dashboard';

    if (isAuthenticated) {
        return <Navigate to={from} replace />;
    }

    const handleGoogleSignIn = async (): Promise<void> => {
        try {
            setError('');
            setIsSigningIn(true);
            await signIn();
        } catch (err) {
            setError('ログインに失敗しました。もう一度お試しください。');
            // eslint-disable-next-line no-console
            console.error('Login error:', err);
        } finally {
            setIsSigningIn(false);
        }
    };

    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container component="main" maxWidth="sm">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <Typography component="h1" variant="h4" gutterBottom>
                            勤怠管理システム
                        </Typography>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            ログイン
                        </Typography>

                        {error && (
                            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            startIcon={isSigningIn ? <CircularProgress size={20} /> : <GoogleIcon />}
                            onClick={handleGoogleSignIn}
                            disabled={isSigningIn}
                            sx={{ mt: 3, mb: 2, py: 1.5 }}
                        >
                            {isSigningIn ? 'サインイン中...' : 'Googleでサインイン'}
                        </Button>

                        <Typography variant="body2" color="text.secondary" align="center">
                            Googleアカウントを使用してサインインしてください
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default LoginPage;