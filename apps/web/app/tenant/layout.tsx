import dynamic from "next/dynamic";
import Footer from "../components/layout/Footer";

const TenantNavbar = dynamic(() => import("../components/layout/TenantNavbar"));

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TenantNavbar />
        {children}
    </>
    
  );
}