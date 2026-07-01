import React, { createContext, useContext, useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { COOKIE_KEY } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // isLoading is true only during the initial AsyncStorage check on app launch.
  // Prevents a flash of the Login screen before we know the auth state.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const cookie = await AsyncStorage.getItem(COOKIE_KEY);
        if (!cookie) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Validate session via backend route
        await apiClient.get('/auth/me');
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Session validation failed:', e?.response?.status || e.message);
        await AsyncStorage.removeItem(COOKIE_KEY);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();

    // Listen for global 401 Unauthorized events from the API client interceptor
    const authSubscription = DeviceEventEmitter.addListener('AUTH_EXPIRED', () => {
      console.warn('Session expired, forcing logout.');
      logout();
    });

    return () => {
      authSubscription.remove();
    };
  }, []);

  // Passport-local expects 'username' and 'password' as body fields.
  // The axios response interceptor in client.js automatically stores Set-Cookie.
  const login = async (username, password) => {
    // Support common Passport local login paths used across builds.
    let response;
    try {
      response = await apiClient.post('/auth/m/login', { email: username, password });
    } catch (err) {
      if (err.response?.status && err.response.status !== 404) throw err;
      response = await apiClient.post('/auth/login', { email: username, password });
    }

    // Primary path: response interceptor stored Set-Cookie automatically.
    let storedCookie = await AsyncStorage.getItem(COOKIE_KEY);
    if (storedCookie) {
      setIsAuthenticated(true);
      return;
    }

    // Fallback for Android — OkHttp strips Set-Cookie from JS-visible headers.
    // Requires the backend login success handler to include the cookie string:
    //   const raw = res.getHeader('set-cookie');
    //   const cookieValue = (Array.isArray(raw) ? raw[0] : raw)?.split(';')[0] ?? null;
    //   res.json({ ok: true, cookie: cookieValue });
    if (response.data?.cookie) {
      await AsyncStorage.setItem(COOKIE_KEY, response.data.cookie);
      setIsAuthenticated(true);
      return;
    }

    throw new Error('Login succeeded but session was not established');
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Clear local session state even if server logout endpoint is unavailable.
    }
    await AsyncStorage.removeItem(COOKIE_KEY);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
