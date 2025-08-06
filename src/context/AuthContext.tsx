'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1994';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    refreshToken: () => Promise<boolean>;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Logout function
    const logout = useCallback(async () => {
        const currentToken = localStorage.getItem('token');
        const currentRefreshToken = localStorage.getItem('refreshToken');

        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        setUser(null);
        setToken(null);

        // Notify server about logout
        if (currentToken) {
            try {
                await fetch(`${apiBaseUrl}/api/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${currentToken}`,
                    },
                    body: JSON.stringify({
                        refreshToken: currentRefreshToken,
                    }),
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
        }

        router.push('/login');
    }, [router]);

    // Refresh token function
    const refreshToken = useCallback(async (): Promise<boolean> => {
        const storedRefreshToken = localStorage.getItem('refreshToken');

        if (!storedRefreshToken) {
            logout();
            return false;
        }

        try {
            const response = await fetch(`${apiBaseUrl}/api/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refreshToken: storedRefreshToken,
                }),
            });

            if (response.ok) {
                const data = await response.json();

                // Update tokens and user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                setToken(data.token);
                setUser(data.user);

                return true;
            } else {
                // Refresh token invalid or expired
                logout();
                return false;
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            logout();
            return false;
        }
    }, [logout]);

    // Login function
    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store tokens and user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('user', JSON.stringify(data.user));

                setToken(data.token);
                setUser(data.user);

                return { success: true };
            } else {
                return { success: false, error: data.error || 'Login failed' };
            }
        } catch (error) {
            return { success: false, error: 'Network error. Please try again.' };
        }
    };

    // Initialize auth state
    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            const storedRefreshToken = localStorage.getItem('refreshToken');

            if (storedToken && storedUser && storedRefreshToken) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setToken(storedToken);
                    setUser(parsedUser);

                    // Verify token is still valid by making a test request
                    const testResponse = await fetch(`${apiBaseUrl}/api/users/me`, {
                        headers: {
                            'Authorization': `Bearer ${storedToken}`,
                        },
                    });

                    if (!testResponse.ok) {
                        // Token might be expired, try to refresh
                        const refreshSuccess = await refreshToken();
                        if (!refreshSuccess) {
                            logout();
                        }
                    }
                } catch (error) {
                    console.error('Error parsing stored user data:', error);
                    logout();
                }
            }

            setIsLoading(false);
        };

        initializeAuth();
    }, [refreshToken, logout]);

    // Set up automatic token refresh
    useEffect(() => {
        let refreshInterval: NodeJS.Timeout;

        if (token) {
            // Refresh token every 10 minutes (tokens expire in 15 minutes)
            refreshInterval = setInterval(() => {
                refreshToken();
            }, 10 * 60 * 1000);
        }

        return () => {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        };
    }, [token, refreshToken]);

    const value: AuthContextType = {
        user,
        token,
        login,
        logout,
        refreshToken,
        isAuthenticated: !!user && !!token,
        isLoading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
