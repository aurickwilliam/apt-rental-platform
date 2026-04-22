"use client";
import { Button } from "@heroui/react";
import Image from "next/image";
import { useState } from "react";

import { signInWithGoogle } from "../actions/oauth";

export default function ThirdPartySignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithGoogle();
      if (result?.error) setError(result.error);
    } catch {
      // redirect() throws NEXT_REDIRECT — expected
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 mt-5">
      {error && (
        <div className="w-full p-3 bg-danger-50 border border-danger-200 rounded-lg">
          <p className="text-sm text-danger text-center">{error}</p>
        </div>
      )}
      <Button
        variant="flat"
        isIconOnly
        radius="full"
        className="size-12 p-1 bg-darker-white"
        isLoading={loading}
        onPress={handleGoogleSignIn}
      >
        {!loading && (
          <Image
            src="/third-party/google-logo.svg"
            alt="Google"
            width={45}
            height={45}
          />
        )}
      </Button>
    </div>
  );
}
