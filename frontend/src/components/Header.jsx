import { NavLink } from "react-router-dom";
import Button from "./Button.jsx";

const linkClass = ({ isActive }) =>
  `rounded-md px-2.5 py-1 ${isActive ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-100"}`;

export default function Header({
  user,
  languages,
  current,
  onChangeLanguage,
  onLogout,
}) {
  return (
    <header className="border-b border-zinc-800">
      <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-sm">
        <nav className="flex gap-1">
          <NavLink to="/" end className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/study" className={linkClass}>
            Study
          </NavLink>
          <NavLink to="/decks" className={linkClass}>
            Decks
          </NavLink>
          <NavLink to="/todos" className={linkClass}>
            Todos
          </NavLink>
        </nav>

        {languages.length > 0 && (
          <div
            role="group"
            aria-label="Study language"
            className="flex flex-wrap items-center gap-1"
          >
            {languages.map((l) => (
              <button
                key={l.code}
                type="button"
                aria-pressed={l.code === current}
                title={l.name}
                onClick={() => onChangeLanguage(l.code)}
                className={`rounded-md px-2.5 py-1 ${l.code === current ? "bg-emerald-500/15 text-emerald-300" : "text-zinc-400 hover:text-zinc-100"}`}
              >
                <span lang={l.code}>{l.native_name}</span>
              </button>
            ))}
            <NavLink
              to="/onboarding"
              aria-label="Edit study languages"
              className="px-1.5 text-zinc-500 hover:text-zinc-100"
            >
              Edit
            </NavLink>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-zinc-500">{user.email}</span>
          <Button variant="ghost" onClick={onLogout}>
            Log out
          </Button>
        </div>
      </div>
    </header>
  );
}
