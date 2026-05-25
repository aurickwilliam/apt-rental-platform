import dynamic from "next/dynamic";

const TenantNavbar = dynamic(() => import("../components/layout/TenantNavbar"));

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TenantNavbar />
      <main className="bg-white">
        {children}
      </main>
    </>
  );
}