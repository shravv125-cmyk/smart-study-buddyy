import React, { createContext, useContext, useState, ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getStoredUsers = () => {
  const stored = localStorage.getItem("study-planner-users");
  return stored ? JSON.parse(stored) as User[] : [];
};

const saveStoredUsers = (users: User[]) => {
  localStorage.setItem("study-planner-users", JSON.stringify(users));
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("study-planner-user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = (email: string, _password: string) => {
    const normalizedEmail = normalizeEmail(email);
    const users = getStoredUsers();
    const existingUser = users.find(u => normalizeEmail(u.email) === normalizedEmail);

    if (existingUser) {
      setUser(existingUser);
      localStorage.setItem("study-planner-user", JSON.stringify(existingUser));
      return true;
    }

    return false;
  };

  const signup = (name: string, email: string, _password: string) => {
    const normalizedEmail = normalizeEmail(email);
    const users = getStoredUsers();
    const existingUser = users.find(u => normalizeEmail(u.email) === normalizedEmail);

    if (existingUser) {
      setUser(existingUser);
      localStorage.setItem("study-planner-user", JSON.stringify(existingUser));
      return true;
    }

    const newUser: User = {
      id: normalizedEmail,
      name,
      email: normalizedEmail,
    };

    saveStoredUsers([...users, newUser]);
    setUser(newUser);
    localStorage.setItem("study-planner-user", JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("study-planner-user");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
