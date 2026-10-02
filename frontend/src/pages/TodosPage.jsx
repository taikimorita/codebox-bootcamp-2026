import { useEffect, useState } from "react";
import Button from "../components/Button.jsx";
import TodoForm from "../components/TodoForm.jsx";
import TodoItem from "../components/TodoItem.jsx";
import { api } from "../api.js";

export default function TodosPage({ languages, current, onLogout }) {
  const [todos, setTodos] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | error | success
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [onlyCurrent, setOnlyCurrent] = useState(false); // only todos tagged with the current language
  const [attempt, setAttempt] = useState(0); // bump to load again after an error
  const currentLanguage = languages.find((l) => l.code === current);

  useEffect(() => {
    // Switching language quickly can leave an older request still in flight.
    // This flag makes sure its answer doesn't overwrite the newer list.
    let stale = false;
    api
      .listTodos(onlyCurrent ? current : undefined)
      .then((data) => {
        if (stale) return;
        setTodos(data);
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
  }, [onlyCurrent, current, attempt, onLogout]);

  function retry() {
    setStatus("loading");
    setAttempt((n) => n + 1);
  }

  // Runs any API change and shows an error message instead of crashing
  async function run(fn) {
    setError("");
    try {
      await fn();
    } catch (err) {
      if (err.status === 401) return onLogout();
      setError(err.message);
    }
  }

  const addTodo = (title, languageCode) =>
    run(async () => {
      const created = await api.createTodo(title, languageCode);
      setTodos((t) => [created, ...t]);
    });

  const updateTodo = (id, changes) =>
    run(async () => {
      const updated = await api.updateTodo(id, changes);
      setTodos((t) => t.map((x) => (x.id === id ? updated : x)));
    });

  const deleteTodo = (id) =>
    run(async () => {
      await api.deleteTodo(id);
      setTodos((t) => t.filter((x) => x.id !== id));
    });

  // The server filters by language on load; this keeps the list right after adds and re-tags
  const inScope = todos.filter(
    (t) => !onlyCurrent || t.language_code === current,
  );
  const visible = inScope.filter((t) =>
    filter === "active" ? !t.completed : filter === "done" ? t.completed : true,
  );
  const remaining = inScope.filter((t) => !t.completed).length;

  const tabClass = (active) =>
    `rounded-md px-2.5 py-1 ${active ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-100"}`;

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Study todos</h1>

      {/* key: start the form over with the new default when the language changes */}
      <TodoForm
        key={current}
        languages={languages}
        defaultLanguage={current}
        onAdd={addTodo}
      />

      {error && status !== "error" && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <nav className="mt-6 mb-3 flex flex-wrap items-center gap-1 text-sm">
        {["all", "active", "done"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`capitalize ${tabClass(filter === f)}`}
          >
            {f}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-zinc-800" aria-hidden="true" />
        <button
          onClick={() => setOnlyCurrent(false)}
          aria-pressed={!onlyCurrent}
          className={tabClass(!onlyCurrent)}
        >
          Any language
        </button>
        {currentLanguage && (
          <button
            onClick={() => setOnlyCurrent(true)}
            aria-pressed={onlyCurrent}
            className={tabClass(onlyCurrent)}
          >
            Only <span lang={currentLanguage.code}>{currentLanguage.native_name}</span>
          </button>
        )}
        <span className="ml-auto text-zinc-500">{remaining} left</span>
      </nav>

      {status === "loading" && (
        <p className="py-8 text-center text-sm text-zinc-500">Loading…</p>
      )}

      {status === "error" && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm">
          <p className="text-red-300">{error}</p>
          <Button variant="ghost" className="mt-2" onClick={retry}>
            Try again
          </Button>
        </div>
      )}

      {status === "success" && visible.length === 0 && (
        <p className="py-8 text-center text-sm text-zinc-500">
          {inScope.length === 0
            ? "Nothing yet — add your first todo above."
            : "No todos in this filter."}
        </p>
      )}

      {status === "success" && visible.length > 0 && (
        <ul className="space-y-2">
          {visible.map((t) => (
            <TodoItem
              key={t.id}
              todo={t}
              languages={languages}
              onUpdate={updateTodo}
              onDelete={deleteTodo}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
