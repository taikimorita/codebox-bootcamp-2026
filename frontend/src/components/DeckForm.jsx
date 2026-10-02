import { useState } from "react";
import Button from "./Button.jsx";

// Used both to create a deck and to rename / re-language one
export default function DeckForm({
  languages,
  initialName = "",
  initialLanguage,
  submitLabel = "Add deck",
  onSubmit, // (name, languageCode) => Promise<boolean saved>
  onCancel,
}) {
  const [name, setName] = useState(initialName);
  const [language, setLanguage] = useState(
    initialLanguage ?? languages[0]?.code ?? "",
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !language) return;
    setSaving(true);
    try {
      if (await onSubmit(name.trim(), language)) setName(initialName);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Deck name"
        maxLength={100}
        aria-label="Deck name"
        className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
      />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        aria-label="Deck language"
        className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 text-sm focus:border-emerald-500 focus:outline-none"
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code} lang={l.code}>
            {l.native_name}
          </option>
        ))}
      </select>
      <Button type="submit" disabled={saving || !name.trim() || !language}>
        {saving ? "Saving…" : submitLabel}
      </Button>
      {onCancel && (
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </form>
  );
}
