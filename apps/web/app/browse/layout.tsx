import NavbarSwitcher from "../components/layout/NavbarSwitcher";
import Footer from "../components/layout/Footer";

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavbarSwitcher />

      <main className="bg-white min-h-screen">
        {children}
      </main>

      <Footer />
    </>
  );
}
