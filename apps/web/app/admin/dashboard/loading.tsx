import AdminDestinationLoading from "../_components/AdminDestinationLoading";

/** The page already streams each region; don't preface it with another body skeleton. */
export default function AdminDashboardLoading() {
  return (
    <AdminDestinationLoading title="Admin Overview">
      <p className="py-6 text-sm text-muted-foreground">Loading dashboard…</p>
    </AdminDestinationLoading>
  );
}
