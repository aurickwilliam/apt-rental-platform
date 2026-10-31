import { Suspense } from "react";
import AppNavbar from "../components/layout/AppNavbar";
import Footer from "../components/layout/Footer";
import SettingsOverlay from "../components/settings/SettingsOverlay";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <noscript>
        <style>{`[data-landing-reveal] { opacity: 1 !important; transform: none !important; }`}</style>
      </noscript>
      <Suspense fallback={<div aria-hidden="true" className="box-content h-20 border-b border-transparent" />}>
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
