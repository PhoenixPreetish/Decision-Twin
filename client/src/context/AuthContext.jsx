import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [digitalTwin, setDigitalTwin] = useState(null);
  const [isTwinComplete, setIsTwinComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    const token = localStorage.getItem('dt_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      if (res.data && res.data.success) {
        setUser(res.data.user);
        await fetchDigitalTwin();
      }
    } catch (err) {
      console.error('Auth verification failed', err);
      localStorage.removeItem('dt_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchDigitalTwin = async () => {
    try {
      const res = await api.get('/digital-twin');
      if (res.data && res.data.success) {
        setDigitalTwin(res.data.digitalTwin);
        setIsTwinComplete(res.data.isComplete);
      }
    } catch (err) {
      console.error('Failed to fetch digital twin', err);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data && res.data.success) {
      localStorage.setItem('dt_token', res.data.token);
      setUser(res.data.user);
      await fetchDigitalTwin();
      return res.data;
    }
  };

  const register = async (fullName, email, password) => {
    const res = await api.post('/auth/register', { fullName, email, password });
    if (res.data && res.data.success) {
      localStorage.setItem('dt_token', res.data.token);
      setUser(res.data.user);
      await fetchDigitalTwin();
      return res.data;
    }
  };

  const logout = () => {
    localStorage.removeItem('dt_token');
    setUser(null);
    setDigitalTwin(null);
    setIsTwinComplete(false);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      digitalTwin,
      isTwinComplete,
      loading,
      login,
      register,
      logout,
      refreshDigitalTwin: fetchDigitalTwin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
