"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface User {
    id: string;
    phone: string;
    name: string;
    role: 'member' | 'admin' | 'treasurer' | 'secretary';
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    loading: boolean;
    login: (phone: string, password: string) => Promise<void>;
    register: (phone: string, password: string, name: string) => Promise<void>;
    logout: () => void;
    isAdmin: () => boolean;
    isTreasurer: () => boolean;
    isSecretary: () => boolean;
    hasRole: (role: string) => boolean;
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

    const login = async (phone: string, password: string) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Login failed');

        const { user: userData, accessToken: token, refreshToken } = data.data;
        saveSession(userData, token, refreshToken);

        // Role-based redirect
        router.push(userData.role === 'admin' ? '/dashboard/admin' : '/dashboard');
    };

    const register = async (phone: string, password: string, name: string) => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password, name }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Registration failed');

        const { user: userData, accessToken: token, refreshToken } = data.data;
        saveSession(userData, token, refreshToken);

        router.push('/dashboard');
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

    const isAdmin = () => user?.role === 'admin';
    const isTreasurer = () => user?.role === 'treasurer';
    const isSecretary = () => user?.role === 'secretary';
    const hasRole = (role: string) => user?.role === role;

    return (
        <AuthContext.Provider value={{
            user, accessToken, loading,
            login, register, logout,
            isAdmin, isTreasurer, isSecretary, hasRole,
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
