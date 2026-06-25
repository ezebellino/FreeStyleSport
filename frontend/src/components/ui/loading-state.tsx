export function LoadingState({
  label = "Cargando...",
}: Readonly<{
  label?: string
}>) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-secondary/40 p-4 text-sm text-muted-foreground">
      <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span>{label}</span>
    </div>
  )
}

export function SkeletonBlock({ className = "" }: Readonly<{ className?: string }>) {
  return <div className={`animate-pulse rounded-2xl bg-secondary/60 ${className}`} />
}
