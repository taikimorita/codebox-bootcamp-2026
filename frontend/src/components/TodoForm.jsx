import { useState } from "react";
import Button from "./Button.jsx";

export default function TodoForm({ languages, defaultLanguage, onAdd }) {
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState(defaultLanguage ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onAdd(title.trim(), language || null);
      setTitle(""); // only clear the box if it saved
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs doing?"
        maxLength={200}
        aria-label="New todo"
        className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
      />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        aria-label="Language for new todo"
        className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 text-sm focus:border-emerald-500 focus:outline-none"
      >
        <option value="">No language</option>
        {languages.map((l) => (
          <option key={l.code} value={l.code} lang={l.code}>
            {l.native_name}
          </option>
        ))}
      </select>
      <Button type="submit" disabled={saving || !title.trim()}>
        {saving ? "Adding…" : "Add"}
      </Button>
    </form>
  );
}
