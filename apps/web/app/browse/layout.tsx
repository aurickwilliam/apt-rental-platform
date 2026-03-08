import AppNavbar from "../components/layout/AppNavbar";

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppNavbar />
      <main className="bg-white">
        {children}
      </main>
    </>
  );
}
