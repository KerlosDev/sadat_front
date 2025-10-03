'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const AuthContext = createContext({});

// Configure axios defaults
axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://sadat-backend-og1p.onrender.com';
axios.defaults.withCredentials = true;

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is authenticated on app load
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            // Check localStorage first, then cookies
            let token = localStorage.getItem('token');
            
            // If no token in localStorage, check cookies
            if (!token) {
                const cookies = document.cookie.split(';');
                const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
                if (tokenCookie) {
                    token = tokenCookie.split('=')[1];
                    // Sync with localStorage
                    localStorage.setItem('token', token);
                }
            }
            
            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const response = await axios.get('/api/auth/me');
                setUser(response.data.user);
            }
        } catch (error) {
            localStorage.removeItem('token');
            // Clear the cookie on error
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            delete axios.defaults.headers.common['Authorization'];
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password, rememberMe = false) => {
        try {
            const response = await axios.post('/api/auth/login', {
                email,
                password,
                rememberMe
            });

            const { token, user } = response.data;

            // Store token in localStorage for client-side access
            localStorage.setItem('token', token);
            
            // Store token in cookie for server-side middleware access
            document.cookie = `token=${token}; path=/; ${rememberMe ? 'max-age=2592000;' : ''} SameSite=Lax`;
            
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            setUser(user);
            toast.success('Login successful!');

            return { success: true, user };
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            toast.error(message);
            return { success: false, message };
        }
    };

    const logout = async () => {
        try {
            await axios.post('/api/auth/logout');
        } catch (error) {
            // Even if logout fails on server, we still clear local storage
        } finally {
            localStorage.removeItem('token');
            // Clear the cookie
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
            toast.success('Logged out successfully');
        }
    };

    const changePassword = async (currentPassword, newPassword) => {
        try {
            await axios.post('/api/auth/change-password', {
                currentPassword,
                newPassword
            });
            toast.success('Password changed successfully');
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to change password';
            toast.error(message);
            return { success: false, message };
        }
    };

    const updateProfile = async (profileData) => {
        try {
            // This would be implemented based on specific profile update endpoints
            const response = await axios.put(`/api/${user.role}s/${user.id}`, profileData);
            setUser({ ...user, ...response.data.data });
            toast.success('Profile updated successfully');
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to update profile';
            toast.error(message);
            return { success: false, message };
        }
    };

    const value = {
        user,
        loading,
        login,
        logout,
        checkAuth,
        changePassword,
        updateProfile,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
        isDoctor: user?.role === 'doctor',
        isStudent: user?.role === 'student',
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};