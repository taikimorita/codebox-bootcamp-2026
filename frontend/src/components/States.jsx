// Loading, empty and error states, so every page shows them the same way
import { CircleX, RotateCcw } from "lucide-react";
import Button from "./Button.jsx";

export function Skeleton({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-surface-2 ${className}`}
    />
  );
}

// A few grey placeholder rows while data loads
export function LoadingRows({ rows = 3, rowClassName = "h-14" }) {
  return (
    <div role="status" aria-label="Loading" className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className={rowClassName} />
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-12 text-center">
      {Icon && (
        <span className="mb-3 grid size-12 place-items-center rounded-full bg-accent/10 text-accent-ink">
          <Icon className="size-6" aria-hidden="true" />
        </span>
      )}
      <p className="font-medium">{title}</p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm"
    >
      <CircleX className="mt-0.5 size-5 shrink-0 text-danger-ink" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-danger-ink">{message}</p>
        {onRetry && (
          <Button variant="secondary" className="mt-3" onClick={onRetry}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}

// Small inline error under a form or list
export function InlineError({ children, className = "" }) {
  if (!children) return null;
  return (
    <p role="alert" className={`text-sm text-danger-ink ${className}`}>
      {children}
    </p>
  );
}
