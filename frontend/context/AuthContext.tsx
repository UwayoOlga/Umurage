"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface User {
    id: string;
    phone: string;
    name: string;
    role: 'member' | 'admin' | 'treasurer' | 'secretary';
    admin_level?: 'none' | 'national' | 'province' | 'district' | 'sector';
    managed_location?: string | null;
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    loading: boolean;
    login: (phone: string, password: string) => Promise<string>;
    register: (phone: string, password: string, name: string, nationalId: string) => Promise<string>;
    setupAccount: (setupToken: string, password: string) => Promise<string>;
    logout: () => void;
    isAdmin: () => boolean;
    isSystemAdmin: () => boolean;
    isRCAAdmin: () => boolean;
    isSaccoAdmin: () => boolean;
    isTreasurer: () => boolean;
    isSecretary: () => boolean;
    hasRole: (role: string) => boolean;
    changePassword: (currentPassword: string, newPassword: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function setCookie(name: string, value: string, days = 7) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Load auth data from localStorage on mount
    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user');
            const storedToken = localStorage.getItem('accessToken');
            if (storedUser && storedToken) {
                setUser(JSON.parse(storedUser));
                setAccessToken(storedToken);
            }
        } catch {
            // ignore parse errors
        } finally {
            setLoading(false);
        }
    }, []);

    const saveSession = (userData: User, token: string, refresh: string) => {
        setUser(userData);
        setAccessToken(token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', refresh);
        // Set cookies for middleware
        setCookie('auth_token', token);
        setCookie('user_role', userData.role);
    };

    const login = async (phone: string, password: string): Promise<string> => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Login failed. Please check your credentials.');
            }

            const { user: userData, accessToken: token, refreshToken } = data.data;
            saveSession(userData, token, refreshToken);

            return data.message || 'Login successful';
        } catch (error: any) {
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                throw new Error('Unable to connect to the server. Please check your internet connection.');
            }
            throw error;
        }
    };

    const register = async (phone: string, password: string, name: string, nationalId: string): Promise<string> => {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password, name, nationalId }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed. Please try again.');
            }

            const { user: userData, accessToken: token, refreshToken } = data.data;
            saveSession(userData, token, refreshToken);

            return data.message || 'Account created successfully';
        } catch (error: any) {
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                throw new Error('Unable to connect to the server. Please check your internet connection.');
            }
            throw error;
        }
    };

    const logout = useCallback(() => {
        const refreshToken = localStorage.getItem('refreshToken');
        // Fire-and-forget logout request
        if (refreshToken) {
            fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            }).catch(() => { });
        }

        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        deleteCookie('auth_token');
        deleteCookie('user_role');

        router.push('/login');
    }, [router]);

    const setupAccount = async (setupToken: string, password: string): Promise<string> => {
        try {
            const response = await fetch(`${API_URL}/auth/setup-account`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ setupToken, password }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Account setup failed. Please check your token.');
            }

            const { user: userData, accessToken: token, refreshToken } = data.data;
            saveSession(userData, token, refreshToken);

            return data.message || 'Account setup successful';
        } catch (error: any) {
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                throw new Error('Unable to connect to the server. Please check your internet connection.');
            }
            throw error;
        }
    };

    const isAdmin = useCallback(() => user?.role === 'admin', [user]);

    // System Admin = National level but without RCA specifier (or root phone)
    const isSystemAdmin = useCallback(() => {
        return user?.role === 'admin' && user?.admin_level === 'national' && (!user?.managed_location || user?.managed_location === 'System' || user?.phone === '0730000001');
    }, [user]);

    // RCA Admin = National level but strictly restricted to RCA operations
    const isRCAAdmin = useCallback(() => {
        return user?.role === 'admin' && user?.admin_level === 'national' && user?.managed_location === 'RCA';
    }, [user]);

    // SACCO Admin = Below national level (Province, District, Sector)
    const isSaccoAdmin = useCallback(() => {
        return user?.role === 'admin' && ['province', 'district', 'sector'].includes(user?.admin_level || '');
    }, [user]);

    const isTreasurer = useCallback(() => user?.role === 'treasurer', [user]);
    const isSecretary = () => user?.role === 'secretary';
    const hasRole = (role: string) => user?.role === role;

    const changePassword = async (currentPassword: string, newPassword: string): Promise<string> => {
        try {
            const response = await fetch(`${API_URL}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to change password.');
            }

            return data.message || 'Password changed successfully';
        } catch (error: any) {
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            user, accessToken, loading,
            login, register, logout, setupAccount,
            isAdmin, isSystemAdmin, isRCAAdmin, isSaccoAdmin,
            isTreasurer, isSecretary, hasRole,
            changePassword,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
