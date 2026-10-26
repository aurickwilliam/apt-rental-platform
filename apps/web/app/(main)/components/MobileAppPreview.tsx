/** Sample illustration approved for use until the final Canva artwork is ready. */
export default function MobileAppPreview() {
  return (
    <div role="img" aria-label="Sample APT mobile interface with a rent overview and messages" className="mx-auto w-48 rounded-[2rem] border border-border bg-card p-2 sm:w-52">
      <div aria-hidden="true" className="rounded-[1.5rem] bg-background px-4 pb-5 pt-3">
        <div className="mx-auto mb-7 h-1 w-10 rounded-full bg-muted" />
        <p className="font-nunito text-lg font-bold text-secondary-foreground">APT</p>
        <p className="mt-1 text-xs text-foreground/75">Your rentals</p>
        <div className="mt-6 rounded-xl bg-secondary p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">Rent overview</p>
          <p className="mt-1 font-nunito text-xl font-bold text-foreground">₱12,500</p>
          <p className="mt-1 text-[10px] text-foreground/75">Sample interface</p>
        </div>
        <div className="mt-3 rounded-xl border border-border bg-card p-3">
          <p className="text-xs font-semibold text-foreground">Messages</p>
          <p className="mt-1 text-[10px] leading-4 text-foreground/75">Stay connected with your owner</p>
        </div>
        <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-muted" />
      </div>
    </div>
  );
}
