"use client";

import { Link } from "@heroui/react";

interface BottomLinksProps {
  role?: 'tenant' | 'landlord';
  onRoleChange?: (role: 'tenant' | 'landlord') => void;
}

export default function BottomLinks({ role, onRoleChange }: BottomLinksProps) {
  return (
    <>
      <p>
        New Here? <Link href="/sign-up" className="text-primary underline cursor-pointer">Create an account</Link>
      </p>
      {
        role === 'tenant' ? (
          <p>
            Want to list your property? <Link onClick={() => onRoleChange?.('landlord')} className="text-primary underline cursor-pointer">Continue as Landlord</Link>
          </p>
        ) : (
          <p>
            Here to find a place? <Link onClick={() => onRoleChange?.('tenant')} className="text-primary underline cursor-pointer">Continue as Tenant</Link>
          </p>
        )
      }
    </>
  );
}