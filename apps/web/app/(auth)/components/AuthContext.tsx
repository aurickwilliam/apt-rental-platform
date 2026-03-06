"use client";

import { createContext, useContext, useState } from "react";

interface AuthContextValue {
  type: 'sign-in' | 'sign-up';
  role: 'tenant' | 'landlord';
  setRole: (role: 'tenant' | 'landlord') => void;
  email: string;
  setEmail: (email: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ 
  type, initialRole = 'tenant', 
  initialEmail = '', children 
}: { type: 'sign-in' | 'sign-up'; initialRole?: 'tenant' | 'landlord'; initialEmail?: string; children: React.ReactNode }) {
  
  const [role, setRole] = useState<'tenant' | 'landlord'>(initialRole);
  const [email, setEmail] = useState<string>(initialEmail);

  return (
    <AuthContext.Provider value={{ type, role, setRole, email, setEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
