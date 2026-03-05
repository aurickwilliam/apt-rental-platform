"use client";

import { Link } from "@heroui/react";
import { useAuth } from './AuthContext';

export default function BottomLinks() {
  const { type, role, setRole } = useAuth();
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

      {
        role === 'tenant' ? (
          <p>
            Want to list your property? <Link onClick={() => setRole('landlord')} className="text-primary underline cursor-pointer">Continue as Landlord</Link>
          </p>
        ) : (
          <p>
            Here to find a place? <Link onClick={() => setRole('tenant')} className="text-primary underline cursor-pointer">Continue as Tenant</Link>
          </p>
        )
      }
    </>
  );
}