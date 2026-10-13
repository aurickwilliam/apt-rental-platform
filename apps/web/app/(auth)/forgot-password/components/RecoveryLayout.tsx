import Image from "next/image";

interface RecoveryLayoutProps {
  children: React.ReactNode;
}

// Page shell shared by the password-recovery pages; mirrors the sign-in page
// (form panel + branding panel from lg up).
export default function RecoveryLayout({ children }: RecoveryLayoutProps) {
  return (
    <main className="flex min-h-screen w-full bg-surface">
      <section className="flex w-full min-w-0 flex-1 flex-col lg:w-1/2 lg:flex-none">
        <div className="mx-auto flex w-full min-w-0 max-w-xl flex-1 flex-col justify-center px-[clamp(1.25rem,4vw,4rem)] py-[clamp(1rem,4vh,2.5rem)] lg:max-w-none">
          <div className="flex min-w-0 flex-1 flex-col bg-card">
            <div className="mx-auto flex w-full min-w-0 max-w-lg flex-1 flex-col py-[clamp(0.5rem,2vh,1.25rem)]">
              {children}

              <div className="mt-auto pt-[clamp(1.5rem,4vh,2rem)] text-center text-sm text-default-500">
                APT Rental Platform &copy; {new Date().getFullYear()}
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside
        aria-hidden="true"
        className="relative hidden w-1/2 shrink-0 overflow-hidden bg-primary bg-cover bg-center lg:block lg:min-h-screen"
        style={{ backgroundImage: "url('/building-bg2.jpg')" }}
      >
        <div className="relative z-10 flex h-full w-full flex-col items-end justify-between p-5">
          <Image src="/logo/logo-name.svg" alt="APT Logo" width={150} height={100} />
        </div>
      </aside>
    </main>
  );
}
