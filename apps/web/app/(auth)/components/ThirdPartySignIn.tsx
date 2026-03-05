"use client";

import { Button } from "@heroui/react";
import Image from "next/image";

export default function ThirdPartySignIn() {
  return (
    <div className="flex gap-5 items-center justify-center mt-5">
      {/* Google */}
      <Button
        variant="flat"
        isIconOnly
        radius="full"
        className="size-12 p-1 bg-darker-white"
      >
        <Image
          src="/third-party/google-logo.svg"
          alt="Google"
          width={45}
          height={45}
        />
      </Button>

      {/* Facebook */}
      <Button
        variant="flat"
        isIconOnly
        radius="full"
        className="size-12 p-1 bg-darker-white"
      >
        <Image
          src="/third-party/facebook-logo.svg"
          alt="Facebook"
          width={45}
          height={45}
        />
      </Button>

      {/* Apple */}
      <Button
        variant="flat"
        isIconOnly
        radius="full"
        className="size-12 p-1 bg-darker-white"
      >
        <Image
          src="/third-party/apple-logo.svg"
          alt="Apple"
          width={35}
          height={35}
        />
      </Button>
    </div>
  );
}