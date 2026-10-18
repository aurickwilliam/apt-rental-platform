import { IconHeart } from "@tabler/icons-react";

export function FavoritesPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="@container/favorites mx-auto w-full min-w-0 max-w-7xl space-y-6 px-4 py-6 sm:py-8">
      {children}
    </div>
  );
}

export function FavoritesPageHeader() {
  return (
    <header>
      <h1 className="flex items-center gap-2 font-nunito text-3xl font-bold text-primary">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <IconHeart size={28} aria-hidden="true" />
        </span>
        Favorites
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Keep your saved apartments in one place.</p>
    </header>
  );
}
