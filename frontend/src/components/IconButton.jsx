// A square button with just an icon. The label is read by screen readers and shown on hover.
export default function IconButton({
  icon: Icon,
  label,
  variant = "ghost",
  className = "",
  ...props
}) {
  const styles = {
    ghost: "text-muted hover:bg-surface-2 hover:text-fg",
    danger: "text-subtle hover:bg-danger/10 hover:text-danger-ink",
  };
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-grid size-9 shrink-0 place-items-center rounded-lg transition focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      <Icon className="size-[18px]" aria-hidden="true" />
    </button>
  );
}
