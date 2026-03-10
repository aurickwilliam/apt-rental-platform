"use client";

import { Button } from "@heroui/react";
import Image from "next/image";
import { signInWithGoogle, signInWithFacebook, signInWithApple } from "../actions/oauth";
import { useState } from "react";

export default function ThirdPartySignIn() {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOAuthSignIn = async (provider: "google" | "facebook" | "apple") => {
    setLoadingProvider(provider);
    setError(null);

    try {
      let result;

      switch (provider) {
        case "google":
          result = await signInWithGoogle();
          break;
        case "facebook":
          result = await signInWithFacebook();
          break;
        case "apple":
          result = await signInWithApple();
          break;
      }

      // If we get here (no redirect happened), there was an error
      if (result?.error) {
        setError(result.error);
      }
    } catch {
      // redirect() from server actions throws a NEXT_REDIRECT error — this is expected behavior
      // If it's an actual error, it will be caught here
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 mt-5">
      {error && (
        <div className="w-full p-3 bg-danger-50 border border-danger-200 rounded-lg">
          <p className="text-sm text-danger text-center">{error}</p>
        </div>
      )}

      <div className="flex gap-5 items-center justify-center">
        {/* Google */}
        <Button
          variant="flat"
          isIconOnly
          radius="full"
          className="size-12 p-1 bg-darker-white"
          isLoading={loadingProvider === "google"}
          isDisabled={loadingProvider !== null}
          onPress={() => handleOAuthSignIn("google")}
        >
          {loadingProvider !== "google" && (
            <Image
              src="/third-party/google-logo.svg"
              alt="Google"
              width={45}
              height={45}
            />
          )}
        </Button>

        {/* Facebook */}
        <Button
          variant="flat"
          isIconOnly
          radius="full"
          className="size-12 p-1 bg-darker-white"
          isLoading={loadingProvider === "facebook"}
          isDisabled={loadingProvider !== null}
          onPress={() => handleOAuthSignIn("facebook")}
        >
          {loadingProvider !== "facebook" && (
            <Image
              src="/third-party/facebook-logo.svg"
              alt="Facebook"
              width={45}
              height={45}
            />
          )}
        </Button>

        {/* Apple */}
        <Button
          variant="flat"
          isIconOnly
          radius="full"
          className="size-12 p-1 bg-darker-white"
          isLoading={loadingProvider === "apple"}
          isDisabled={loadingProvider !== null}
          onPress={() => handleOAuthSignIn("apple")}
        >
          {loadingProvider !== "apple" && (
            <Image
              src="/third-party/apple-logo.svg"
              alt="Apple"
              width={35}
              height={35}
            />
          )}
        </Button>
      </div>
    </div>
  );
}
