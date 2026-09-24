export default function DashboardLoading() {
  return (
    <div className="p-4">
      <div className="h-12 w-64 rounded-lg bg-default-200 animate-pulse mb-1" />
      <div className="h-4 w-80 rounded bg-default-200 animate-pulse mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 flex flex-col gap-3 rounded-xl bg-white border border-grey-300">
            <div className="h-5 w-32 rounded bg-default-200 animate-pulse" />
            <div className="h-9 w-24 rounded bg-default-200 animate-pulse" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <div className="lg:col-span-2 bg-white border border-grey-300 rounded-xl p-4">
          <div className="h-5 w-40 rounded bg-default-200 animate-pulse mb-4" />
          <div className="h-[220px] rounded-lg bg-default-200 animate-pulse" />
        </div>
        <div className="bg-white border border-grey-300 rounded-xl p-4">
          <div className="h-5 w-32 rounded bg-default-200 animate-pulse mb-4" />
          <div className="h-[220px] rounded-lg bg-default-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
