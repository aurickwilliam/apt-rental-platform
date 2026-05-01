import AppNavbar from "../components/layout/AppNavbar";
import Footer from "../components/layout/Footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNavbar />
      {children}
      <Footer />
    </>
  );
}