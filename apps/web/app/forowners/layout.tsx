import NavbarSwitcher from "../components/layout/NavbarSwitcher";
import Footer from "../components/layout/Footer";
import AppNavbar from "../components/layout/AppNavbar";

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppNavbar />

      <main className=" min-h-screen">
        {children}
      </main>

      <Footer />
    </>
  );
}
