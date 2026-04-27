import TenantNavbar from "../components/layout/TenantNavbar";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TenantNavbar />
      <main className="bg-white h-[calc(100svh-var(--navbar-height,4rem))] overflow-hidden">
        {children}
      </main>
    </>
  );
}
