import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    (async () => {
      const cached = await AsyncStorage.getItem('auth_user');
      if (cached) setUser(JSON.parse(cached));
      setInitializing(false);
    })();
  }, []);

  const persist = async (data) => {
    await AsyncStorage.setItem('auth_token', data.token);
    await AsyncStorage.setItem('auth_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const login = useCallback(async (email, password) => persist(await AuthApi.login(email, password)), []);
  const signup = useCallback(async (payload) => persist(await AuthApi.signup(payload)), []);
  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, initializing, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
