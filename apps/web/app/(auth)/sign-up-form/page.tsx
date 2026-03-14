import Image from "next/image";
import BackBtn from "./components/BackBtn";
import SignUpForm from "./components/SignUpForm";
import AuthProviderWrapper from "./components/AuthProviderWrapper";

interface SignUpFormPageProps {
  searchParams: Promise<{ role?: string; email?: string }>;
}

export default async function SignUpFormPage({ searchParams }: SignUpFormPageProps) {
  const { role, email } = await searchParams;
  const initialRole = role === 'landlord' ? 'landlord' : 'tenant';
  const initialEmail = email ?? '';

  return (
    <AuthProviderWrapper initialRole={initialRole} initialEmail={initialEmail}>
      <div className="bg-white min-h-screen">
        <main className="max-w-7xl min-h-screen mx-auto px-4 pt-4 flex flex-col">
          <section className="flex flex-col">
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
            <div className="mt-10">
              <h1 className="text-3xl font-medium font-noto-serif">
                Complete the {initialRole === 'landlord' ? 'Landlord' : 'Tenant'} Form
              </h1>
              <p className="mt-2">Join us and start your apartment rental journey today!</p>
            </div>

            {/* Form */}
            <SignUpForm />
          </section>
        </main>
      </div>
    </AuthProviderWrapper>
  );
}
