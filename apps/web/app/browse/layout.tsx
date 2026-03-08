import AppNavbar from "../components/layout/AppNavbar";
import Footer from "../components/layout/Footer";

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

      <Footer />
    </>
  );
}
