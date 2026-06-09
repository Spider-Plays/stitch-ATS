/** Lightweight fallback while lazy route chunks load */
export function PageLoader() {
  return (
    <div
      className="flex min-h-[40vh] w-full items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="size-9 animate-spin rounded-full border-2 border-primary/20 border-t-primary dark:border-white/20 dark:border-t-white" />
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Loading…</p>
      </div>
    </div>
  )
}
