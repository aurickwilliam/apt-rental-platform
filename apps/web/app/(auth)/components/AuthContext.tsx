"use client";

import { createContext, useContext, useState } from "react";

interface AuthContextValue {
  type: 'sign-in' | 'sign-up';
  role: 'tenant' | 'landlord';
  setRole: (role: 'tenant' | 'landlord') => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ type, children }: { type: 'sign-in' | 'sign-up'; children: React.ReactNode }) {
  const [role, setRole] = useState<'tenant' | 'landlord'>('tenant');

  return (
    <AuthContext.Provider value={{ type, role, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
