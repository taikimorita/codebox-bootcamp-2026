import { useRef, useState } from "react";
import Button from "./Button.jsx";

const EMPTY = { front: "", reading: "", back: "", notes: "" };

const inputClass =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none";

export default function CardForm({ lang, onAdd }) {
  const [card, setCard] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const frontRef = useRef(null);
  const canSave = card.front.trim() && card.back.trim();

  const set = (field) => (e) => setCard({ ...card, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      if (await onAdd(card)) {
        setCard(EMPTY); // only clear the form if it saved
        frontRef.current?.focus(); // ready for the next card
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-2 rounded-xl border border-zinc-800 p-3 sm:grid-cols-2"
    >
      <input
        ref={frontRef}
        lang={lang}
        value={card.front}
        onChange={set("front")}
        placeholder="Front (required)"
        maxLength={1000}
        aria-label="Front"
        className={inputClass}
      />
      <input
        lang={lang}
        value={card.reading}
        onChange={set("reading")}
        placeholder="Reading (furigana, pinyin…)"
        maxLength={1000}
        aria-label="Reading"
        className={inputClass}
      />
      <textarea
        rows={2}
        value={card.back}
        onChange={set("back")}
        placeholder="Back (required)"
        maxLength={1000}
        aria-label="Back"
        className={inputClass}
      />
      <textarea
        rows={2}
        value={card.notes}
        onChange={set("notes")}
        placeholder="Notes"
        maxLength={1000}
        aria-label="Notes"
        className={inputClass}
      />
      <div className="sm:col-span-2">
        <Button type="submit" disabled={saving || !canSave}>
          {saving ? "Adding…" : "Add card"}
        </Button>
      </div>
    </form>
  );
}
