"use client";

import BottomLinks from "./BottomLinks";
import ThirdPartySignIn from "./ThirdPartySignIn";
import AuthForm from "./AuthForm";
import { AuthProvider, useAuth } from "./AuthContext";

import { Separator, Button } from "@heroui/react";

import { ArrowLeft, UserRoundKey, Building } from "lucide-react";

import Link from "next/link";

interface AuthWrapperProps {
  type: 'sign-in' | 'sign-up';
  initialRole?: 'tenant' | 'landlord';
}

function AuthContent() {
  const { type, role } = useAuth();

  const description = type === 'sign-up'
    ? role === 'tenant' ? "Join as tenant to start renting." : "Join us and start listing your properties in minutes."
    : role === 'tenant' ? "Log in to continue your apartment journey." : "Access your listings and manage your tenants easily.";

  return (
    <div className="w-full shrink-0 bg-white p-10 flex flex-col md:w-[600px] md:p-20">
      <div className="flex items-center justify-between">
        {/* Back Button */}
        <Button
          isIconOnly
          variant="ghost"
          className="-ml-2"
        >
          <Link href="/">
            <ArrowLeft size={20} />
          </Link>
        </Button>

        <div className={`flex items-center gap-2 border-2 rounded-xl px-3 py-1 
          ${role === "tenant" ? "bg-light-blue border-primary" : "bg-yellow-100 border-secondary"}`}
        >
          {
            role === "tenant" 
            ? <UserRoundKey size={24} className="text-primary" /> 
            : <Building size={24} className="text-secondary" />
          }
          <p className={`font-semibold ${role === "tenant" ? "text-primary" : "text-secondary"}`}>
            {role === "tenant" ? "Tenant" : "Landlord"}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <h1 className="text-4xl font-noto-serif font-semibold tracking-wide">
          {type === 'sign-up' ? 'Join Us!' : 'Welcome Back!'}
        </h1>
        <h3 className="text-base text-black mt-3">
          {description}
        </h3>
      </div>

      <AuthForm />

      {/* Divider */}
      <div className="flex items-center gap-3 mt-5">
        <Separator className="flex-1" />
        <p className="text-sm text-gray-400 whitespace-nowrap">or sign {type === "sign-in" ? "in" : "up"} with</p>
        <Separator className="flex-1" />
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

export default function AuthWrapper({ type, initialRole }: AuthWrapperProps) {
  return (
    <AuthProvider type={type} initialRole={initialRole}>
      <AuthContent />
    </AuthProvider>
  );
}
