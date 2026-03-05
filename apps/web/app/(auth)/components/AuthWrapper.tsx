"use client";

import BottomLinks from "./BottomLinks";
import SignInForm from "./SignInForm";
import ThirdPartySignIn from "./ThirdPartySignIn";
import { AuthProvider, useAuth } from "./AuthContext";

import { Divider } from "@heroui/react";

interface AuthWrapperProps {
  type: 'sign-in' | 'sign-up';
}

function AuthContent() {
  const { type, role } = useAuth();

  const description = type === 'sign-up'
    ? role === 'tenant' ? "Join as tenant to start renting." : "Join us and start listing your properties in minutes."
    : role === 'tenant' ? "Log in to continue your apartment journey." : "Access your listings and manage your tenants easily.";

  return (
    <div className="w-full shrink-0 bg-white p-10 flex flex-col md:w-[600px] md:p-20">
      <div>
        <h1 className="text-4xl font-poppins font-semibold">
          {type === 'sign-up' ? 'Join Us!' : 'Welcome Back!'}
        </h1>
        <h3 className="text-base text-black mt-3">
          {description}
        </h3>
      </div>

      <SignInForm />

      {/* Divider */}
      <div className="flex items-center gap-3 mt-5">
        <Divider className="flex-1" />
        <p className="text-sm text-gray-400 whitespace-nowrap">or sign {type === "sign-in" ? "in" : "up"} with</p>
        <Divider className="flex-1" />
      </div>

      <ThirdPartySignIn />

      <div className="flex flex-col items-center gap-3 mt-auto">
        <BottomLinks />
      </div>

      <div className="items-center flex flex-col mt-5">
        APT Rental Platform &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
}

export default function AuthWrapper({ type }: AuthWrapperProps) {
  return (
    <AuthProvider type={type}>
      <AuthContent />
    </AuthProvider>
  );
}