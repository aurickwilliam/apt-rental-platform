"use client";

import { createContext, useContext, useState } from "react";

interface AuthContextValue {
  type: 'sign-in' | 'sign-up';
  role: 'tenant' | 'landlord';
  setRole: (role: 'tenant' | 'landlord') => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  type, initialRole = 'tenant',
  initialEmail = '', children
}: { type: 'sign-in' | 'sign-up'; initialRole?: 'tenant' | 'landlord'; initialEmail?: string; children: React.ReactNode }) {

  const [role, setRole] = useState<'tenant' | 'landlord'>(initialRole);
  const [email, setEmail] = useState<string>(initialEmail);
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <AuthContext.Provider value={{
      type, role, setRole,
      email, setEmail,
      password, setPassword,
      error, setError,
      loading, setLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
