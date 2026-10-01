export default function Button({
  variant = "primary",
  className = "",
  ...props
}) {
  const styles = {
    primary: "bg-emerald-500 text-zinc-950 hover:bg-emerald-400",
    ghost: "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800",
    danger: "text-zinc-500 hover:text-red-400 hover:bg-red-500/10",
  };
  return (
    <button
      className={`rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-emerald-400 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
