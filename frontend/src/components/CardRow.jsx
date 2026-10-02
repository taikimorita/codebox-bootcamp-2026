import { useState } from "react";
import Button from "./Button.jsx";

const fieldClass =
  "w-full rounded bg-zinc-800 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500";

const toDraft = (card) => ({
  front: card.front,
  reading: card.reading ?? "",
  back: card.back,
  notes: card.notes ?? "",
});

export default function CardRow({ card, lang, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => toDraft(card));
  const [saving, setSaving] = useState(false);
  const canSave = draft.front.trim() && draft.back.trim();

  const set = (field) => (e) => setDraft({ ...draft, [field]: e.target.value });

  function startEditing() {
    setDraft(toDraft(card));
    setEditing(true);
  }

  async function save() {
    if (!canSave) return;
    setSaving(true);
    try {
      if (await onUpdate(card.id, draft)) setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") setEditing(false);
  }

  if (editing)
    return (
      <tr className="border-t border-zinc-800 align-top">
        <td className="p-2">
          <input
            autoFocus
            lang={lang}
            value={draft.front}
            onChange={set("front")}
            onKeyDown={handleKeyDown}
            maxLength={1000}
            aria-label="Front"
            className={fieldClass}
          />
        </td>
        <td className="p-2">
          <input
            lang={lang}
            value={draft.reading}
            onChange={set("reading")}
            onKeyDown={handleKeyDown}
            maxLength={1000}
            aria-label="Reading"
            className={fieldClass}
          />
        </td>
        <td className="p-2">
          <textarea
            rows={2}
            value={draft.back}
            onChange={set("back")}
            onKeyDown={handleKeyDown}
            maxLength={1000}
            aria-label="Back"
            className={fieldClass}
          />
        </td>
        <td className="p-2">
          <textarea
            rows={2}
            value={draft.notes}
            onChange={set("notes")}
            onKeyDown={handleKeyDown}
            maxLength={1000}
            aria-label="Notes"
            className={fieldClass}
          />
        </td>
        <td className="p-2 whitespace-nowrap">
          <Button onClick={save} disabled={saving || !canSave}>
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </td>
      </tr>
    );

  return (
    <tr className="border-t border-zinc-800 align-top">
      <td lang={lang} className="p-2 text-base whitespace-pre-wrap">
        {card.front}
      </td>
      <td lang={lang} className="p-2 whitespace-pre-wrap text-zinc-400">
        {card.reading || "—"}
      </td>
      <td className="p-2 whitespace-pre-wrap">{card.back}</td>
      <td className="p-2 whitespace-pre-wrap text-zinc-400">
        {card.notes || "—"}
      </td>
      <td className="p-2 whitespace-nowrap">
        <Button
          variant="ghost"
          onClick={startEditing}
          aria-label={`Edit "${card.front}"`}
        >
          Edit
        </Button>
        <Button
          variant="danger"
          onClick={() => onDelete(card.id)}
          aria-label={`Delete "${card.front}"`}
        >
          Delete
        </Button>
      </td>
    </tr>
  );
}
