"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { authAPI } from "./api";

const AuthContext = createContext();
const AUTH_STORAGE_KEY = "ims-auth-user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.email) {
          setUser(parsed);
        }
      }
    } catch (err) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setAuthReady(true);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.login(email, password);
      const nextUser = {
        id: response.user?.id,
        email: response.user?.email,
        username: email.split("@")[0],
      };
      setUser(nextUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (username, email, password) => {
    setLoading(true);
    setError(null);
    try {
      await authAPI.signup(username, email, password);
      const nextUser = {
        id: crypto.randomUUID(),
        username,
        email,
      };
      setUser(nextUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setError(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        isAuthenticated: user !== null,
        login,
        register,
        logout,
        error,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
