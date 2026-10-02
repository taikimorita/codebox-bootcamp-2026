import { ArrowRight, Clock, Flame, Layers, ListTodo, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import Page, { PageHeader } from "../components/Page.jsx";
import StatTile from "../components/StatTile.jsx";
import {
  EmptyState,
  ErrorState,
  InlineError,
  Skeleton,
} from "../components/States.jsx";
import { api } from "../api.js";
import { cardClass, textLinkClass } from "../styles.js";

// The browser's IANA time zone, so "today" and the streak match the user's day
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

function streakHint(streak) {
  if (streak.days === 0) return "Review a card to start one";
  if (!streak.reviewed_today) return "Review today to keep it going";
  return "Done for today";
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

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
  const dueNow = countsFor(current).due;

  return (
    <Page>
      <PageHeader
        title="Today"
        subtitle={new Date().toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      />

      {status === "loading" && (
        <div role="status" aria-label="Loading" className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <Skeleton className="h-40" />
        </div>
      )}

      {status === "error" && <ErrorState message={error} onRetry={retry} />}

      {status === "success" && (
        <div className="space-y-8">
          {/* Call to action: the one thing to do next */}
          {language && (
            <section
              className={`flex flex-wrap items-center gap-4 p-5 ${cardClass}`}
            >
              <span
                lang={language.code}
                aria-hidden="true"
                className="grid size-12 place-items-center rounded-xl bg-accent/10 text-lg font-semibold text-accent-ink"
              >
                {language.native_name.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {dueNow > 0
                    ? `${plural(dueNow, "card")} ready to review`
                    : "You're all caught up"}
                </p>
                <p className="text-sm text-muted">
                  <span lang={language.code}>{language.native_name}</span> ·{" "}
                  {language.name}
                </p>
              </div>
              {dueNow > 0 ? (
                <Button onClick={() => study(current)}>
                  Start review
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => navigate("/practice")}>
                  Practice instead
                </Button>
              )}
            </section>
          )}

          <div className="grid grid-cols-3 gap-3">
            <StatTile icon={Clock} label="Due now" value={dueNow} />
            <StatTile
              icon={Sparkles}
              tone="info"
              label="Reviews today"
              value={stats.reviews_today}
            />
            <StatTile
              icon={Flame}
              tone="warn"
              label="Streak"
              value={plural(stats.streak.days, "day")}
              hint={streakHint(stats.streak)}
            />
          </div>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-muted">
              Your languages
            </h2>
            <ul className={`divide-y divide-line ${cardClass}`}>
              {languages.map((l) => {
                const { due, total } = countsFor(l.code);
                return (
                  <li key={l.code} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p lang={l.code} className="font-medium">
                        {l.native_name}
                      </p>
                      <p className="text-xs text-subtle">
                        {l.name} · {plural(total, "card")}
                      </p>
                    </div>
                    {due > 0 && (
                      <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent-ink tabular-nums">
                        {due} due
                      </span>
                    )}
                    {total === 0 ? (
                      <Link to="/decks" className={`text-sm ${textLinkClass}`}>
                        Add cards
                      </Link>
                    ) : (
                      <Button
                        variant={due > 0 ? "primary" : "secondary"}
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

          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-muted">
                Today's todos
                {language && (
                  <>
                    {" "}
                    for <span lang={language.code}>{language.native_name}</span>
                  </>
                )}
              </h2>
              <Link to="/todos" className={`text-sm ${textLinkClass}`}>
                All todos
              </Link>
            </div>
            <InlineError className="mb-2">{error}</InlineError>
            {todos.length === 0 ? (
              <EmptyState icon={ListTodo} title="Nothing open">
                Add one like “Watch 1 episode” on the todos page.
              </EmptyState>
            ) : (
              <ul className={`divide-y divide-line ${cardClass}`}>
                {todos.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => completeTodo(t.id)}
                      aria-label={`Mark "${t.title}" complete`}
                      className="size-4 accent-accent"
                    />
                    <span className="text-sm">{t.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {stats.by_language.length === 0 && (
            <EmptyState icon={Layers} title="No cards yet">
              Create a deck or{" "}
              <Link to="/import" className={textLinkClass}>
                import one from Anki
              </Link>{" "}
              to start studying.
            </EmptyState>
          )}
        </div>
      )}
    </Page>
  );
}
