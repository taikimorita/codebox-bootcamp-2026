import { useState } from "react";
import Button from "./Button.jsx";

export default function TodoForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onAdd(title.trim());
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
      <Button type="submit" disabled={saving || !title.trim()}>
        {saving ? "Adding…" : "Add"}
      </Button>
    </form>
  );
}
