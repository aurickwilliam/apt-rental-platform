import { Suspense } from "react";
import AppNavbar from "../components/layout/AppNavbar";
import Footer from "../components/layout/Footer";
import SettingsOverlay from "../components/settings/SettingsOverlay";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <AppNavbar />
      </Suspense>
      {children}
      <Footer />
      <Suspense fallback={null}>
        <SettingsOverlay />
      </Suspense>
    </>
  );
}
