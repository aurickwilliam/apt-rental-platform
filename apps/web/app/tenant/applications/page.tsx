import ApplicationsList from "@/app/tenant/my-rental/components/ApplicationsList";
import Footer from "@/app/components/layout/Footer";

export default function ApplicationsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
        <ApplicationsList />
      </div>
      <Footer />
    </div>
  );
}
