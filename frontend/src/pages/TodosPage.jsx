import { ListTodo } from "lucide-react";
import { useEffect, useState } from "react";
import Page, { PageHeader } from "../components/Page.jsx";
import {
  EmptyState,
  ErrorState,
  InlineError,
  LoadingRows,
} from "../components/States.jsx";
import TodoForm from "../components/TodoForm.jsx";
import TodoItem from "../components/TodoItem.jsx";
import { api } from "../api.js";
import { cardClass } from "../styles.js";

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

  // Segmented control: the active option is a raised "pill"
  const tabClass = (active) =>
    `rounded-md px-3 py-1 transition ${active ? "bg-surface font-medium text-fg shadow-sm" : "text-muted hover:text-fg"}`;

  return (
    <Page>
      <PageHeader
        title="Study todos"
        subtitle="Things to do outside the app, like “Watch 1 episode in Korean”."
      />

      <div className={`p-4 ${cardClass}`}>
        {/* key: start the form over with the new default when the language changes */}
        <TodoForm
          key={current}
          languages={languages}
          defaultLanguage={current}
          onAdd={addTodo}
        />
      </div>

      {status !== "error" && <InlineError className="mt-3">{error}</InlineError>}

      <div className="mt-6 mb-3 flex flex-wrap items-center gap-2 text-sm">
        <div className="inline-flex rounded-lg bg-surface-2 p-1">
          {["all", "active", "done"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`capitalize ${tabClass(filter === f)}`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-lg bg-surface-2 p-1">
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
              Only{" "}
              <span lang={currentLanguage.code}>
                {currentLanguage.native_name}
              </span>
            </button>
          )}
        </div>
        <span className="ml-auto text-subtle tabular-nums">
          {remaining} left
        </span>
      </div>

      {status === "loading" && <LoadingRows rows={4} rowClassName="h-12" />}

      {status === "error" && <ErrorState message={error} onRetry={retry} />}

      {status === "success" && visible.length === 0 && (
        <EmptyState icon={ListTodo} title={inScope.length === 0 ? "No todos yet" : "Nothing here"}>
          {inScope.length === 0
            ? "Add your first one above."
            : "No todos match this filter."}
        </EmptyState>
      )}

      {status === "success" && visible.length > 0 && (
        <ul className={`divide-y divide-line ${cardClass}`}>
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
    </Page>
  );
}
