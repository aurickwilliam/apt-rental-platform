"use client";

import BottomLinks from "./BottomLinks";
import ThirdPartySignIn from "./ThirdPartySignIn";
import AuthForm from "./AuthForm";
import { AuthProvider, useAuth } from "./AuthContext";

import { Separator, Button, Tabs } from "@heroui/react";

import { ArrowLeft, UserRoundKey, Building } from "lucide-react";

import Link from "next/link";

interface AuthWrapperProps {
  type: 'sign-in' | 'sign-up';
  initialRole?: 'tenant' | 'landlord';
}

function AuthContent() {
  const { type, role, setRole } = useAuth();

  const description = type === 'sign-up'
    ? role === 'tenant' ? "Join as tenant to start renting." : "Join us and start listing your properties in minutes."
    : role === 'tenant' ? "Log in to continue your apartment journey." : "Access your listings and manage your tenants easily.";

  return (
    <div className="flex-1 min-w-0 bg-white flex flex-col md:px-16 md:py-5 overflow-y-auto h-full">
      <div className="w-full max-w-lg mx-auto px-10 py-5 flex flex-col flex-1 min-h-full">
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
        </div>

        <div className="mt-5">
          <h1 className="text-4xl font-nunito font-semibold">
            {type === 'sign-up' ? 'Join Us!' : 'Welcome Back!'}
          </h1>
          <h3 className="text-base text-black mt-3">
            {description}
          </h3>
        </div>

        <Tabs
          selectedKey={role}
          onSelectionChange={(key) => setRole(key as 'tenant' | 'landlord')}
          className="mt-5"
        >
          <Tabs.ListContainer>
            <Tabs.List 
              aria-label="Select role"
              className="*:text-black"
            >
              {/* Tenant Tab */}
              <Tabs.Tab id="tenant" className="data-[selected=true]:text-primary">
                <span className="flex items-center gap-1.5">
                  <UserRoundKey size={15} />
                  Tenant
                </span>
                <Tabs.Indicator />
              </Tabs.Tab>

              {/* Landlord Tab */}              
              <Tabs.Tab id="landlord" className="data-[selected=true]:text-secondary">
                <Tabs.Separator />
                <span className="flex items-center gap-1.5">
                  <Building size={15} />
                  Landlord
                </span>
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>


        <AuthForm />

        {/* Divider */}
        <div className="flex items-center gap-3 mt-5">
          <Separator className="flex-1" />
          <p className="text-sm text-gray-400 whitespace-nowrap">or sign {type === "sign-in" ? "in" : "up"} with</p>
          <Separator className="flex-1" />
        </div>

        <ThirdPartySignIn />

        <div className="mt-auto flex flex-col items-center gap-5 pt-8">
          <BottomLinks />

          <div className="text-center text-sm text-default-500">
            APT Rental Platform &copy; {new Date().getFullYear()}
          </div>
        </div>
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
