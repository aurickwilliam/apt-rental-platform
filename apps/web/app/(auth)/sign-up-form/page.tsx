import Image from "next/image";

import { translate } from "@repo/i18n";

import { getServerLocale } from "@/lib/i18n/locale";

import BackBtn from "./components/BackBtn";
import SignUpForm from "./components/SignUpForm";
import AuthProviderWrapper from "./components/AuthProviderWrapper";

interface SignUpFormPageProps {
  searchParams: Promise<{ role?: string; email?: string }>;
}

export default async function SignUpFormPage({
  searchParams,
}: SignUpFormPageProps) {
  const { role, email } = await searchParams;
  const language = await getServerLocale();
  const initialRole = role === "landlord" ? "landlord" : "tenant";
  const initialEmail = email ?? "";
  const roleLabel = translate(
    language,
    initialRole === "landlord" ? "auth.role.landlord" : "auth.role.tenant",
  );

  return (
    <AuthProviderWrapper initialRole={initialRole} initialEmail={initialEmail}>
      {/* min-h-screen + fluid padding: grows at short aspect ratios,
          never clips. w-full + max-w-* keeps the measure comfortable
          from 320px phones through ultrawide monitors. */}
      <div className="min-h-screen w-full bg-card">
        <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-[clamp(1rem,4vw,2rem)] py-[clamp(1rem,3vh,2rem)]">
          <section className="flex min-w-0 flex-1 flex-col">
            {/* Back button left, logo centered on the same row */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center">
              <div className="justify-self-start">
                <BackBtn />
              </div>
              <Image
                src="/logo/logo.svg"
                alt="APT Logo"
                width={64}
                height={64}
                priority
              />
              <div aria-hidden />
            </div>

            {/* Title Description */}
            <div className="mt-[clamp(1.5rem,5vh,2.5rem)]">
              <h1 className="text-[clamp(1.5rem,4vw,1.875rem)] font-bold font-nunito text-foreground">
                {translate(language, "auth.signUpForm.title", { role: roleLabel })}
              </h1>
              <p className="mt-2 text-foreground">
                {translate(language, "auth.signUpForm.description")}
              </p>
            </div>

            {/* Form */}
            <SignUpForm />
          </section>
        </main>
      </div>
    </AuthProviderWrapper>
  );
}