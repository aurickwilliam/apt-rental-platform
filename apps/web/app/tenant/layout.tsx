import TenantNavbar from "../components/layout/TenantNavbar";

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
