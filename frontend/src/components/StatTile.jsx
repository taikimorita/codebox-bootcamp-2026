import { cardClass } from "../styles.js";

export default function StatTile({ icon: Icon, label, value, hint, tone = "accent" }) {
  const tones = {
    accent: "bg-accent/10 text-accent-ink",
    warn: "bg-warn/10 text-warn-ink",
    info: "bg-info/10 text-info-ink",
  };
  return (
    <div className={`p-4 ${cardClass}`}>
      <div className="flex items-center gap-2">
        {Icon && (
          <span
            className={`grid size-7 place-items-center rounded-lg ${tones[tone]}`}
          >
            <Icon className="size-4" aria-hidden="true" />
          </span>
        )}
        <p className="min-w-0 truncate text-xs font-medium text-muted">
          {label}
        </p>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-subtle">{hint}</p>}
    </div>
  );
}
