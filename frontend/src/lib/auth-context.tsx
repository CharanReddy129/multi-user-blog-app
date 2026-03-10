'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'USER' | 'ADMIN';
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = async () => {
        try {
            const me = await api.me();
            setUser(me);
        } catch {
            setUser(null);
        }
    };

    useEffect(() => {
        refresh().finally(() => setLoading(false));
    }, []);

    const login = async (email: string, password: string) => {
        const u = await api.login({ email, password });
        setUser(u);
    };

    const register = async (name: string, email: string, password: string) => {
        const u = await api.register({ name, email, password });
        setUser(u);
    };

    const logout = async () => {
        await api.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
