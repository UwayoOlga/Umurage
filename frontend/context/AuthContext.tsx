"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    id: string;
    phone: string;
    name: string;
    role: 'member' | 'admin' | 'treasurer' | 'secretary';
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    login: (phone: string, password: string) => Promise<void>;
    register: (phone: string, password: string, name: string) => Promise<void>;
    logout: () => void;
    isAdmin: () => boolean;
    isTreasurer: () => boolean;
    isSecretary: () => boolean;
    hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);

    // Load auth data from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedAccessToken = localStorage.getItem('accessToken');
        const storedRefreshToken = localStorage.getItem('refreshToken');

        if (storedUser && storedAccessToken && storedRefreshToken) {
            setUser(JSON.parse(storedUser));
            setAccessToken(storedAccessToken);
            setRefreshToken(storedRefreshToken);
        }
    }, []);

    const login = async (phone: string, password: string) => {
        try {
            const response = await fetch('http://localhost:4000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            const { user, accessToken, refreshToken } = data.data;

            setUser(user);
            setAccessToken(accessToken);
            setRefreshToken(refreshToken);

            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const register = async (phone: string, password: string, name: string) => {
        try {
            const response = await fetch('http://localhost:4000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone, password, name }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            const { user, accessToken, refreshToken } = data.data;

            setUser(user);
            setAccessToken(accessToken);
            setRefreshToken(refreshToken);

            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);

        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    };

    const isAdmin = () => user?.role === 'admin';
    const isTreasurer = () => user?.role === 'treasurer';
    const isSecretary = () => user?.role === 'secretary';
    const hasRole = (role: string) => user?.role === role;

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                refreshToken,
                login,
                register,
                logout,
                isAdmin,
                isTreasurer,
                isSecretary,
                hasRole,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
