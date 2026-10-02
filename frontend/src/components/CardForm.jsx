import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import { cardClass, inputClass } from "../styles.js";
import Button from "./Button.jsx";

const EMPTY = { front: "", reading: "", back: "", notes: "" };

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
      className={`grid gap-3 p-4 sm:grid-cols-2 ${cardClass}`}
    >
      <p className="text-sm font-medium sm:col-span-2">Add a card</p>
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
          <Plus className="size-4" aria-hidden="true" />
          {saving ? "Adding…" : "Add card"}
        </Button>
      </div>
    </form>
  );
}
