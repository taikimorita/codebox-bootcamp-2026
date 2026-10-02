import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import StatTile from "../components/StatTile.jsx";
import { api } from "../api.js";

// The browser's IANA time zone, so "today" and the streak match the user's day
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

function streakHint(streak) {
  if (streak.days === 0) return "Review a card to start one";
  if (!streak.reviewed_today) return "Review today to keep it going";
  return "Done for today";
}

export default function DashboardPage({
  languages,
  current,
  onChangeLanguage,
  onLogout,
}) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [todos, setTodos] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | error | success
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0); // bump to load again after an error
  const language = languages.find((l) => l.code === current);

  useEffect(() => {
    let stale = false; // ignore an answer that arrives after this effect is replaced
    Promise.all([api.getDashboard(timeZone), api.listTodos(current)])
      .then(([statsData, todoData]) => {
        if (stale) return;
        setStats(statsData);
        setTodos(todoData.filter((t) => !t.completed));
        setStatus("success");
      })
      .catch((err) => {
        if (stale) return;
        if (err.status === 401) return onLogout(); // token expired
        setError(err.message);
        setStatus("error");
      });
    return () => {
      stale = true;
    };
  }, [current, attempt, onLogout]);

  function retry() {
    setStatus("loading");
    setAttempt((n) => n + 1);
  }

  function study(code) {
    onChangeLanguage(code);
    navigate("/study");
  }

  async function completeTodo(id) {
    setError("");
    try {
      await api.updateTodo(id, { completed: true });
      setTodos((t) => t.filter((x) => x.id !== id));
    } catch (err) {
      if (err.status === 401) return onLogout();
      setError(err.message);
    }
  }

  const countsFor = (code) =>
    stats?.by_language.find((l) => l.language_code === code) ?? {
      due: 0,
      total: 0,
    };

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {status === "loading" && (
        <p className="py-16 text-center text-sm text-zinc-500">Loading…</p>
      )}

      {status === "error" && (
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm">
          <p className="text-red-300">{error}</p>
          <Button variant="ghost" className="mt-2" onClick={retry}>
            Try again
          </Button>
        </div>
      )}

      {status === "success" && (
        <>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <StatTile
              label={
                language ? (
                  <>
                    Due in{" "}
                    <span lang={language.code}>{language.native_name}</span>
                  </>
                ) : (
                  "Due now"
                )
              }
              value={countsFor(current).due}
            />
            <StatTile label="Reviews today" value={stats.reviews_today} />
            <StatTile
              label="Streak"
              value={`${stats.streak.days} ${stats.streak.days === 1 ? "day" : "days"}`}
              hint={streakHint(stats.streak)}
            />
          </div>

          <section className="mt-8">
            <h2 className="mb-2 text-sm font-medium text-zinc-400">
              Your languages
            </h2>
            <ul className="space-y-2">
              {languages.map((l) => {
                const { due, total } = countsFor(l.code);
                return (
                  <li
                    key={l.code}
                    className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2"
                  >
                    <span lang={l.code} className="text-base">
                      {l.native_name}
                    </span>
                    <span className="flex-1 text-sm text-zinc-500">
                      {due} due · {total} {total === 1 ? "card" : "cards"}
                    </span>
                    {total === 0 ? (
                      <Link
                        to="/decks"
                        className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                      >
                        Add cards
                      </Link>
                    ) : (
                      <Button
                        variant={due > 0 ? "primary" : "ghost"}
                        onClick={() => study(l.code)}
                      >
                        Study
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="mt-8">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-sm font-medium text-zinc-400">
                Today's todos
                {language && (
                  <>
                    {" "}
                    for <span lang={language.code}>{language.native_name}</span>
                  </>
                )}
              </h2>
              <Link to="/todos" className="text-sm text-emerald-400">
                All todos →
              </Link>
            </div>
            {error && (
              <p role="alert" className="mb-2 text-sm text-red-400">
                {error}
              </p>
            )}
            {todos.length === 0 ? (
              <p className="rounded-lg border border-dashed border-zinc-800 px-3 py-4 text-center text-sm text-zinc-500">
                Nothing open. Add one like “Watch 1 episode” on the todos page.
              </p>
            ) : (
              <ul className="space-y-2">
                {todos.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => completeTodo(t.id)}
                      aria-label={`Mark "${t.title}" complete`}
                      className="size-4 accent-emerald-500"
                    />
                    <span className="text-sm">{t.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
