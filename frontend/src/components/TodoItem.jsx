import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { fieldBase } from "../styles.js";
import IconButton from "./IconButton.jsx";

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
    <li className="group flex items-center gap-3 px-4 py-2.5 transition hover:bg-surface-2/40">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onUpdate(todo.id, { completed: !todo.completed })}
        aria-label={`Mark "${todo.title}" ${todo.completed ? "incomplete" : "complete"}`}
        className="size-4 accent-accent"
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
          className={`${fieldBase} flex-1 border-line bg-surface px-2 py-1 text-sm`}
        />
      ) : (
        <span
          onDoubleClick={() => setEditing(true)}
          className={`flex-1 text-sm ${todo.completed ? "text-subtle line-through" : ""}`}
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
        className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 ${todo.language_code ? "border-accent/30 bg-accent/10 text-accent-ink" : "border-line bg-surface text-subtle"}`}
      >
        <option value="">—</option>
        {tagOptions.map((l) => (
          <option key={l.code} value={l.code} lang={l.code}>
            {l.native_name}
          </option>
        ))}
      </select>

      <div className="flex opacity-60 transition group-hover:opacity-100 focus-within:opacity-100">
        {!editing && (
          <IconButton
            icon={Pencil}
            label={`Edit "${todo.title}"`}
            onClick={() => setEditing(true)}
          />
        )}
        <IconButton
          icon={Trash2}
          variant="danger"
          label={`Delete "${todo.title}"`}
          onClick={() => onDelete(todo.id)}
        />
      </div>
    </li>
  );
}
