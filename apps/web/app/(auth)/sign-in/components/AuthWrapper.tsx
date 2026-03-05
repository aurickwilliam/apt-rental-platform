"use client";

import { useState } from "react";

import BottomLinks from "./BottomLinks";
import SignInForm from "./SignInForm";
import ThirdPartySignIn from "./ThirdPartySignIn";

import { Divider } from "@heroui/react";

export default function AuthWrapper() {
  const [role, setRole] = useState<'tenant' | 'landlord'>('tenant');

  return (
    <div className="w-[600px] shrink-0 bg-white p-20 flex flex-col">
      <div>
        <h1 className="text-4xl font-poppins font-semibold">
          Welcome Back!
        </h1>
        <h3 className="text-base text-black">
          {
            role === 'tenant'
            ? "Log in to continue your apartment journey."
            : "Access your listings and manage your tenants easily."
          }
        </h3>
      </div>

      <SignInForm />

      {/* Divider */}
      <div className="flex items-center gap-3 mt-5">
        <Divider className="flex-1" />
        <p className="text-sm text-gray-400 whitespace-nowrap">or sign in with</p>
        <Divider className="flex-1" />
      </div>

      <ThirdPartySignIn />

      <div className="flex flex-col items-center gap-3 mt-auto">
        <BottomLinks role={role} onRoleChange={setRole} />
      </div>

      <div className="items-center flex flex-col mt-5">
        APT Rental Platform &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
}