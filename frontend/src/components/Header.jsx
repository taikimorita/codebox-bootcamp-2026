import {
  Check,
  ChevronDown,
  GraduationCap,
  Layers,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Settings2,
  Target,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { menuItemClass } from "../styles.js";
import Dropdown from "./Dropdown.jsx";
import Logo from "./Logo.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/study", label: "Study", icon: GraduationCap },
  { to: "/practice", label: "Practice", icon: Target },
  { to: "/decks", label: "Decks", icon: Layers },
  { to: "/todos", label: "Todos", icon: ListTodo },
];

// Desktop/tablet: links in the header. Labels appear once there's room (md and up).
function TopNav() {
  return (
    <nav className="ml-2 hidden items-center gap-0.5 sm:flex">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          title={label}
          className={({ isActive }) =>
            `flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition ${isActive ? "bg-surface-2 font-medium text-fg" : "text-muted hover:bg-surface-2 hover:text-fg"}`
          }
        >
          <Icon className="size-4" aria-hidden="true" />
          <span className="sr-only md:not-sr-only">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

// Phones: a tab bar along the bottom of the screen
function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
      <div className="grid grid-cols-5">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 text-[11px] transition ${isActive ? "text-accent-ink" : "text-subtle"}`
            }
          >
            <Icon className="size-5" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function LanguageMenu({ languages, current, onChangeLanguage }) {
  const active = languages.find((l) => l.code === current);
  if (!active) return null;
  return (
    <Dropdown
      label={`Study language: ${active.name}`}
      buttonClassName="h-9 px-2.5 text-sm font-medium"
      button={
        <>
          <span lang={active.code}>{active.native_name}</span>
          <ChevronDown className="size-4 text-subtle" aria-hidden="true" />
        </>
      }
    >
      <p className="px-3 pt-1.5 pb-1 text-xs text-subtle">Study language</p>
      {languages.map((l) => (
        <button
          key={l.code}
          type="button"
          role="menuitemradio"
          aria-checked={l.code === current}
          onClick={() => onChangeLanguage(l.code)}
          className={menuItemClass}
        >
          <span lang={l.code} className="flex-1">
            {l.native_name}
          </span>
          <span className="text-xs text-subtle">{l.name}</span>
          <Check
            aria-hidden="true"
            className={`size-4 text-accent-ink ${l.code === current ? "" : "invisible"}`}
          />
        </button>
      ))}
      <div className="my-1 border-t border-line" />
      <Link to="/onboarding" role="menuitem" className={menuItemClass}>
        <Settings2 className="size-4 text-subtle" aria-hidden="true" />
        Edit languages
      </Link>
    </Dropdown>
  );
}

function UserMenu({ email, onLogout }) {
  return (
    <Dropdown
      label="Account"
      buttonClassName="p-0.5"
      button={
        <span className="grid size-8 place-items-center rounded-full bg-accent/15 text-sm font-semibold text-accent-ink uppercase">
          {email[0]}
        </span>
      }
    >
      <p className="truncate px-3 pt-1.5 pb-2 text-xs text-subtle">{email}</p>
      <button
        type="button"
        role="menuitem"
        onClick={onLogout}
        className={menuItemClass}
      >
        <LogOut className="size-4 text-subtle" aria-hidden="true" />
        Log out
      </button>
    </Dropdown>
  );
}

export default function Header({
  user,
  languages,
  current,
  onChangeLanguage,
  onLogout,
}) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-2 px-4 sm:px-6">
          <Logo />
          <TopNav />
          <div className="ml-auto flex items-center gap-1">
            <LanguageMenu
              languages={languages}
              current={current}
              onChangeLanguage={onChangeLanguage}
            />
            <ThemeToggle />
            <UserMenu email={user.email} onLogout={onLogout} />
          </div>
        </div>
      </header>
      <BottomNav />
    </>
  );
}
