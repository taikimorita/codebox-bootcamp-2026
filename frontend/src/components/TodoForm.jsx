import { Plus } from "lucide-react";
import { useState } from "react";
import { fieldBase } from "../styles.js";
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
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs doing?"
        maxLength={200}
        aria-label="New todo"
        className={`${fieldBase} min-w-48 flex-1 border-line bg-surface px-3 py-2 text-sm`}
      />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        aria-label="Language for new todo"
        className={`${fieldBase} border-line bg-surface px-3 py-2 text-sm`}
      >
        <option value="">No language</option>
        {languages.map((l) => (
          <option key={l.code} value={l.code} lang={l.code}>
            {l.native_name}
          </option>
        ))}
      </select>
      <Button type="submit" disabled={saving || !title.trim()}>
        <Plus className="size-4" aria-hidden="true" />
        {saving ? "Adding…" : "Add"}
      </Button>
    </form>
  );
}
