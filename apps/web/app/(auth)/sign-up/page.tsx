import Image from "next/image";
import AuthWrapper from "../components/AuthWrapper";

interface SignUpPageProps {
  searchParams: Promise<{ role?: string }>;
}

export default async function SignUp({ searchParams }: SignUpPageProps) {
  const { role } = await searchParams;
  const initialRole = role === 'landlord' ? 'landlord' : 'tenant';

  return (
    <main className="flex w-screen h-screen overflow-hidden">
      {/* Left Panel */}
      <div className="w-1/2">
        <AuthWrapper
          type="sign-up"
          initialRole={initialRole}
        />
      </div>
      
      {/* Right Panel */}
      <div
        className="w-1/2 bg-primary relative hidden md:flex"
        style={{backgroundImage: "url('/building-bg2.jpg')"}}
      >
        {/* Content */}
        <div className="relative z-10 p-5 h-full flex flex-col justify-between items-end">
          <Image
            src="/logo/logo-name.svg"
            alt="Logo"
            width={150}
            height={100}
          />

          {/* Can add Information or Testimonials here */}
        </div>
      </div>
    </main>
  );
}
