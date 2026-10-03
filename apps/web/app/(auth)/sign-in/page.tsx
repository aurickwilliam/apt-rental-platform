import Image from "next/image";
import AuthWrapper from "../components/AuthWrapper";

type SignInPageProps = {
  searchParams: Promise<{
    error?: string;
    role?: string;
    next?: string;
  }>;
};

// Only the verification handoff may resume after login. Anything else is
// ignored here (and re-validated in the sign-in action / OAuth callback)
// so `next` can never become an open redirect.
function safeVerifyNext(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (value === "/verify") return value;
  if (/^\/verify\/mobile\?token=[A-Za-z0-9_-]{43}$/.test(value)) return value;
  return undefined;
}

export default async function SignIn({ searchParams }: SignInPageProps) {
  const { error, role, next } = await searchParams;
  const resumeTo = safeVerifyNext(next);

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
        <AuthWrapper type="sign-in" portalError={portalError} next={resumeTo} />
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