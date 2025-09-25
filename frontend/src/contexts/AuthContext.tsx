import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import googleAuthService from '../services/googleAuth';
import api from '../services/api';
import { User, AuthResponse } from '../types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

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

            // Verify token with backend
            const response = await api.get('/auth/verify');
            setUser(response.data.user);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Auth verification failed:', error);
            localStorage.removeItem('authToken');
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (): Promise<void> => {
        try {
            setLoading(true);
            const googleUser = await googleAuthService.signIn();

            // Send Google user data to backend for authentication
            const response = await api.post('/auth/google', {
                google_id: googleUser.id,
                email: googleUser.email,
                name: googleUser.name,
                picture: googleUser.picture,
            });

            const { token, user: backendUser }: AuthResponse = response.data;
            localStorage.setItem('authToken', token);
            setUser(backendUser);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Sign-in failed:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async (): Promise<void> => {
        try {
            setLoading(true);
            await googleAuthService.signOut();
            localStorage.removeItem('authToken');
            setUser(null);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Sign-out failed:', error);
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