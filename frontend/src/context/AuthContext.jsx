// frontend/src/context/AuthContext.jsx

/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../api/axios";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  async function checkAuth() {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const response = await authAPI.getMe();
        setUser(response.data);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setIsAuthenticated(false);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      checkAuth();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { access_token, user } = response.data;

      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(user));

      setUser(user);
      setIsAuthenticated(true);
      toast.success(`Welcome back, ${user.full_name || user.email}!`);

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || "Login failed";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (email, password, fullName) => {
    try {
      const response = await authAPI.register({
        email,
        password,
        full_name: fullName,
      });
      const { access_token, user } = response.data;

      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(user));

      setUser(user);
      setIsAuthenticated(true);
      toast.success("Account created successfully!");

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || "Registration failed";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
    toast.success("Logged out successfully");
  };

  const updatePreferences = async (preferences) => {
    try {
      await authAPI.updatePreferences(preferences);
      setUser((prev) => ({ ...prev, ...preferences }));
      toast.success("Preferences updated");
      return { success: true };
    } catch {
      toast.error("Failed to update preferences");
      return { success: false };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updatePreferences,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
