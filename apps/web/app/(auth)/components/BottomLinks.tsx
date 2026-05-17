"use client";

import { Link } from "@heroui/react";
import { useAuth } from './AuthContext';

export default function BottomLinks() {
  const { type } = useAuth();
  return (
    <>
      {
        type === 'sign-in' ? (
          <p>
            New Here? <Link href="/sign-up" className="text-primary underline cursor-pointer">Create an account</Link>
          </p>
        ) : (
          <p>
            Already have an account? <Link href="/sign-in" className="text-primary underline cursor-pointer">Sign In</Link>
          </p>
        )
      }
    </>
  );
}