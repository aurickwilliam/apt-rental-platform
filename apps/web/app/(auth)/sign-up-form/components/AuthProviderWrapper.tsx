"use client";

import { AuthProvider } from "../../components/AuthContext";

interface AuthProviderWrapperProps {
  initialRole: 'tenant' | 'landlord';
  initialEmail?: string;
  children: React.ReactNode;
}

export default function AuthProviderWrapper({ initialRole, initialEmail, children }: AuthProviderWrapperProps) {
  return (
    <AuthProvider type="sign-up" initialRole={initialRole} initialEmail={initialEmail}>
      {children}
    </AuthProvider>
  );
}
