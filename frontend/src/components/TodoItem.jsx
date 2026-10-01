import { useState } from "react";
import Button from "./Button.jsx";

export default function TodoItem({ todo, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);

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
