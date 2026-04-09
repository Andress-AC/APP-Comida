export default function PageSkeleton({ title }: { title?: string }) {
  return (
    <div className="space-y-4 animate-pulse">
      {title ? (
        <h1 className="heading-display text-2xl text-white/20">{title}</h1>
      ) : (
        <div className="h-8 w-32 rounded-lg bg-white/10" />
      )}
      <div className="glass-card-static p-5 space-y-3">
        <div className="h-4 w-2/3 rounded bg-white/10" />
        <div className="h-4 w-full rounded bg-white/10" />
        <div className="h-4 w-4/5 rounded bg-white/10" />
      </div>
      <div className="glass-card-static p-5 space-y-3">
        <div className="h-4 w-1/2 rounded bg-white/10" />
        <div className="h-4 w-full rounded bg-white/10" />
        <div className="h-4 w-3/4 rounded bg-white/10" />
      </div>
      <div className="glass-card-static p-5 space-y-3">
        <div className="h-4 w-2/5 rounded bg-white/10" />
        <div className="h-4 w-full rounded bg-white/10" />
      </div>
    </div>
  );
}
