import { useState } from "react";
import Button from "./Button.jsx";

export default function TodoItem({ todo, languages, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);

  // A todo can be tagged with a language the user has since stopped studying
  const tagOptions =
    !todo.language_code || languages.some((l) => l.code === todo.language_code)
      ? languages
      : [
          ...languages,
          {
            code: todo.language_code,
            native_name: todo.language_code.toUpperCase(),
          },
        ];

  async function saveEdit() {
    const next = draft.trim();
    if (next && next !== todo.title) await onUpdate(todo.id, { title: next });
    else setDraft(todo.title); // empty or unchanged: put the old title back
    setEditing(false);
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onUpdate(todo.id, { completed: !todo.completed })}
        aria-label={`Mark "${todo.title}" ${todo.completed ? "incomplete" : "complete"}`}
        className="size-4 accent-emerald-500"
      />

      {editing ? (
        <input
          autoFocus
          value={draft}
          maxLength={200}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveEdit();
            if (e.key === "Escape") {
              setDraft(todo.title);
              setEditing(false);
            }
          }}
          aria-label="Edit todo"
          className="flex-1 rounded bg-zinc-800 px-2 py-1 text-sm focus:outline-none"
        />
      ) : (
        <span
          onDoubleClick={() => setEditing(true)}
          className={`flex-1 text-sm ${todo.completed ? "text-zinc-500 line-through" : ""}`}
        >
          {todo.title}
        </span>
      )}

      <select
        value={todo.language_code ?? ""}
        onChange={(e) =>
          onUpdate(todo.id, { language_code: e.target.value || null })
        }
        aria-label={`Language for "${todo.title}"`}
        className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300 focus:outline-none"
      >
        <option value="">—</option>
        {tagOptions.map((l) => (
          <option key={l.code} value={l.code} lang={l.code}>
            {l.native_name}
          </option>
        ))}
      </select>

      {!editing && (
        <Button
          variant="ghost"
          onClick={() => setEditing(true)}
          aria-label={`Edit "${todo.title}"`}
        >
          Edit
        </Button>
      )}
      <Button
        variant="danger"
        onClick={() => onDelete(todo.id)}
        aria-label={`Delete "${todo.title}"`}
      >
        Delete
      </Button>
    </li>
  );
}
