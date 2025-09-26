import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import googleAuthService from '../services/googleAuth';
import api, { apiCall, silentApiCall } from '../services/api';
import errorHandler from '../services/errorHandler';
import notificationService from '../services/notificationService';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    isAuthenticated: boolean;
    error: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async (): Promise<void> => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setLoading(false);
                return;
            }

            // Try to get current user info (silent call to avoid showing error notifications)
            const userData = await silentApiCall(
                () => api.get('/auth/me'),
                'Auth verification',
            );
            
            setUser(userData.user);
            setError(null);
        } catch (error) {
            const appError = errorHandler.parseError(error);
            
            // Only set error state for non-authentication errors
            if (!errorHandler.shouldLogout(appError)) {
                setError(appError.message);
            }
            
            // Clear tokens for authentication errors
            if (errorHandler.shouldLogout(appError)) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('refreshToken');
            }
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            
            const googleUser = await googleAuthService.signIn();

            // Send Google ID token to backend for authentication
            const authData = await apiCall(
                () => api.post('/auth/google', {
                    id_token: (googleUser as any).credential || googleUser.id,
                }),
                'Google Sign-in',
            );

            const { access_token, refresh_token, user: backendUser } = authData;
            
            localStorage.setItem('authToken', access_token);
            localStorage.setItem('refreshToken', refresh_token);
            setUser(backendUser);
            
            notificationService.authSuccess('login');
        } catch (error) {
            const appError = errorHandler.parseError(error);
            setError(appError.message);
            throw appError;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            
            // Call backend logout endpoint (silent to avoid error notifications)
            try {
                await silentApiCall(
                    () => api.delete('/auth/logout'),
                    'Logout',
                );
            } catch {
                // Ignore logout API errors - we'll clear local state anyway
            }
            
            // Sign out from Google
            await googleAuthService.signOut();
            
            // Clear local storage
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
            
            notificationService.authSuccess('logout');
        } catch (error) {
            const appError = errorHandler.parseError(error);
            setError(appError.message);
            
            // Still clear local state even if sign out fails
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const value: AuthContextType = {
        user,
        loading,
        signIn,
        signOut,
        isAuthenticated: !!user,
        error,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};