import Image from "next/image";
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
  const initialRole = role === "landlord" ? "landlord" : "tenant";
  const initialEmail = email ?? "";

  return (
    <AuthProviderWrapper initialRole={initialRole} initialEmail={initialEmail}>
      {/* min-h-screen + fluid padding: grows at short aspect ratios,
          never clips. w-full + max-w-* keeps the measure comfortable
          from 320px phones through ultrawide monitors. */}
      <div className="min-h-screen w-full bg-card">
        <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-[clamp(1rem,4vw,2rem)] py-[clamp(1rem,3vh,2rem)]">
          <section className="flex min-w-0 flex-1 flex-col">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <Image
                src="/logo/logo.svg"
                alt="APT Logo"
                width={75}
                height={75}
              />
            </div>

            {/* Back Button */}
            <div className="mt-4">
              <BackBtn />
            </div>

            {/* Title Description */}
            <div className="mt-[clamp(1.5rem,5vh,2.5rem)]">
              <h1 className="text-[clamp(1.5rem,4vw,1.875rem)] font-medium font-noto-serif text-foreground">
                Complete the{" "}
                {initialRole === "landlord" ? "Landlord" : "Tenant"} Form
              </h1>
              <p className="mt-2 text-foreground">
                Join us and start your apartment rental journey today!
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