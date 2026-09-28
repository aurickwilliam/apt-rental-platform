import Image from "next/image";
import AuthWrapper from "../components/AuthWrapper";

type SignInPageProps = {
  searchParams: Promise<{
    error?: string;
    role?: string;
  }>;
};

export default async function SignIn({ searchParams }: SignInPageProps) {
  const { error, role } = await searchParams;

  // Surfaced by app/auth/callback when a complete Google profile signs in
  // via the wrong portal (session already signed out there).
  const portalError =
    error === "wrong_portal"
      ? role === "landlord"
        ? "This account is not registered as a landlord."
        : "This account is not registered as a tenant."
      : null;

  return (
    <main className="flex w-screen h-screen overflow-hidden">
      {/* Left Panel */}
      <div className="w-1/2">
        <AuthWrapper type="sign-in" portalError={portalError} />
      </div>

      {/* Right Panel */}
      <div 
        className="w-1/2 bg-primary relative hidden md:flex"
        style={{backgroundImage: "url('/building-bg2.jpg')"}}
      >
        <div className="relative z-10 p-5 h-full w-full flex flex-col justify-between items-end">
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