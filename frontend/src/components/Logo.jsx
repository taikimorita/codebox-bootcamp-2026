import { Link } from "react-router-dom";

// 記 is the first character of 記憶 (kioku), "memory"
export default function Logo() {
  return (
    <Link
      to="/"
      className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-accent"
    >
      <span
        lang="ja"
        aria-hidden="true"
        className="grid size-8 place-items-center rounded-lg bg-accent text-base font-bold text-on-accent"
      >
        記
      </span>
      <span className="text-lg font-semibold tracking-tight">Kioku</span>
    </Link>
  );
}
