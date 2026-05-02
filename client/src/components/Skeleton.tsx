import type { CSSProperties } from "react";

export function Skeleton({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <span className={`skeleton ${className}`.trim()} style={style} aria-hidden />;
}

export function SkeletonCard() {
  return (
    <div className="card skeleton-card" aria-busy="true" aria-label="Loading">
      <Skeleton className="sk-line sk-w-40" />
      <Skeleton className="sk-line sk-w-80" />
      <Skeleton className="sk-line sk-w-60" />
    </div>
  );
}
