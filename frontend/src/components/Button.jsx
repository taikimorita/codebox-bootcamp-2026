export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  // Sizes are a prop, not className overrides: two clashing padding classes have no reliable winner
  const sizes = { md: "px-3.5 py-2", lg: "px-5 py-3" };
  const styles = {
    primary: "bg-accent text-on-accent shadow-sm hover:bg-accent/85",
    secondary: "border border-line bg-surface text-fg hover:bg-surface-2",
    ghost: "text-muted hover:text-fg hover:bg-surface-2",
    danger: "text-subtle hover:text-danger-ink hover:bg-danger/10",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg ${sizes[size]} text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
