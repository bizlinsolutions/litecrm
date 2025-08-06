'use client';

import { useAuth } from '@/context/AuthContext';
import { useCallback } from 'react';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1994';

interface FetchOptions extends RequestInit {
    skipAuth?: boolean;
}

export const useAuthenticatedFetch = () => {
    const { token, logout, refreshToken } = useAuth();

    const authenticatedFetch = useCallback(async (
        url: string,
        options: FetchOptions = {}
    ): Promise<Response> => {
        const { skipAuth = false, ...fetchOptions } = options;

        // Prepare headers
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(fetchOptions.headers as Record<string, string>),
        };

        // Add authorization header if not skipping auth and token exists
        if (!skipAuth && token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Make the request
        let response = await fetch(`${apiBaseUrl}${url}`, {
            ...fetchOptions,
            headers,
        });

        // Handle 401 Unauthorized
        if (response.status === 401 && !skipAuth) {
            console.log('Received 401, attempting token refresh...');

            // Try to refresh the token
            const refreshSuccess = await refreshToken();

            if (refreshSuccess) {
                // Retry the original request with new token
                const newToken = localStorage.getItem('token');
                if (newToken) {
                    headers['Authorization'] = `Bearer ${newToken}`;
                    response = await fetch(`${apiBaseUrl}${url}`, {
                        ...fetchOptions,
                        headers,
                    });
                }
            } else {
                // Refresh failed, logout user
                logout();
                throw new Error('Authentication failed. Please login again.');
            }
        }

        return response;
    }, [token, logout, refreshToken]);

    return authenticatedFetch;
};

// Convenience hook for common API operations
export const useApi = () => {
    const fetch = useAuthenticatedFetch();

    const get = useCallback(async (url: string) => {
        const response = await fetch(url);
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || 'Request failed');
        }
        return response.json();
    }, [fetch]);

    const post = useCallback(async (url: string, data: any) => {
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || 'Request failed');
        }
        return response.json();
    }, [fetch]);

    const put = useCallback(async (url: string, data: any) => {
        const response = await fetch(url, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || 'Request failed');
        }
        return response.json();
    }, [fetch]);

    const del = useCallback(async (url: string) => {
        const response = await fetch(url, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || 'Request failed');
        }
        return response.json();
    }, [fetch]);

    return { get, post, put, delete: del, fetch };
};
