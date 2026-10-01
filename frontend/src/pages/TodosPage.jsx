import { useEffect, useState } from "react";
import Button from "../components/Button.jsx";
import TodoForm from "../components/TodoForm.jsx";
import TodoItem from "../components/TodoItem.jsx";
import { api } from "../api.js";

export default function TodosPage({ user, onLogout }) {
  const [todos, setTodos] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | error | success
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  async function load() {
    setStatus("loading");
    try {
      setTodos(await api.listTodos());
      setStatus("success");
    } catch (err) {
      if (err.status === 401) return onLogout(); // token expired
      setError(err.message);
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
  }, []);

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

  const addTodo = (title) =>
    run(async () => {
      const created = await api.createTodo(title);
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

  const visible = todos.filter((t) =>
    filter === "active" ? !t.completed : filter === "done" ? t.completed : true,
  );
  const remaining = todos.filter((t) => !t.completed).length;

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your todos</h1>
          <p className="text-sm text-zinc-400">{user.email}</p>
        </div>
        <Button variant="ghost" onClick={onLogout}>
          Log out
        </Button>
      </header>

      <TodoForm onAdd={addTodo} />

      {error && status !== "error" && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <nav className="mt-6 mb-3 flex items-center gap-1 text-sm">
        {["all", "active", "done"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-2.5 py-1 capitalize ${filter === f ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-100"}`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-zinc-500">{remaining} left</span>
      </nav>

      {status === "loading" && (
        <p className="py-8 text-center text-sm text-zinc-500">Loading…</p>
      )}

      {status === "error" && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm">
          <p className="text-red-300">{error}</p>
          <Button variant="ghost" className="mt-2" onClick={load}>
            Try again
          </Button>
        </div>
      )}

      {status === "success" && visible.length === 0 && (
        <p className="py-8 text-center text-sm text-zinc-500">
          {todos.length === 0
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
              onUpdate={updateTodo}
              onDelete={deleteTodo}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
