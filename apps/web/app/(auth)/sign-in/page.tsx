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
    // min-h-screen (not h-screen) + no overflow-hidden: the page grows
    // instead of clipping when the viewport gets short or wide.
    <main className="flex min-h-screen w-full bg-surface">
      {/* Form Panel — full width below lg, half above. min-w-0 lets the
          inner scroll container shrink; min-h-0 lets it actually scroll. */}
      <section className="flex w-full min-w-0 flex-1 flex-col lg:w-1/2 lg:flex-none">
        {/* Vertical padding is vh-clamped so short viewports (4:3, 1:1,
            letterboxed windows) reclaim height for the form; horizontal
            padding is vw-clamped so ultra-wide (21:9) doesn't over-pad. */}
        <div className="mx-auto flex w-full min-w-0 max-w-xl flex-1 flex-col justify-center px-[clamp(1.25rem,4vw,4rem)] py-[clamp(1rem,4vh,2.5rem)] lg:max-w-none">
          <AuthWrapper type="sign-in" portalError={portalError} next={resumeTo} />
        </div>
      </section>

      {/* Branding Panel — lg and up only. Splitting earlier starves the
          form of horizontal room (50% of 768px = 384px). */}
      <aside
        aria-hidden="true"
        className="relative hidden w-1/2 shrink-0 overflow-hidden bg-primary bg-cover bg-center lg:block lg:min-h-screen"
        style={{ backgroundImage: "url('/building-bg2.jpg')" }}
      >
        <div className="relative z-10 flex h-full w-full flex-col items-end justify-between p-5">
          <Image
            src="/logo/logo-name.svg"
            alt="APT Logo"
            width={150}
            height={100}
          />
        </div>
      </aside>
    </main>
  );
}
