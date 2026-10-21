export default function PlatformLoading() {
  return (
    <div className="space-y-4 p-4" role="status" aria-live="polite">
      <span className="sr-only">Chargement en cours</span>
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}
