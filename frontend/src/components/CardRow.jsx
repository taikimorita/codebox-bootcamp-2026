import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { inputClass } from "../styles.js";
import Button from "./Button.jsx";
import IconButton from "./IconButton.jsx";
import SpeakButton from "./SpeakButton.jsx";

const toDraft = (card) => ({
  front: card.front,
  reading: card.reading ?? "",
  back: card.back,
  notes: card.notes ?? "",
});

export default function CardRow({ card, lang, voice, onUpdate, onDelete }) {
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
      <tr className="bg-accent/5 align-top">
        <td className="px-3 py-2">
          <input
            autoFocus
            lang={lang}
            value={draft.front}
            onChange={set("front")}
            onKeyDown={handleKeyDown}
            maxLength={1000}
            aria-label="Front"
            className={inputClass}
          />
        </td>
        <td className="px-3 py-2">
          <input
            lang={lang}
            value={draft.reading}
            onChange={set("reading")}
            onKeyDown={handleKeyDown}
            maxLength={1000}
            aria-label="Reading"
            className={inputClass}
          />
        </td>
        <td className="px-3 py-2">
          <textarea
            rows={2}
            value={draft.back}
            onChange={set("back")}
            onKeyDown={handleKeyDown}
            maxLength={1000}
            aria-label="Back"
            className={inputClass}
          />
        </td>
        <td className="px-3 py-2">
          <textarea
            rows={2}
            value={draft.notes}
            onChange={set("notes")}
            onKeyDown={handleKeyDown}
            maxLength={1000}
            aria-label="Notes"
            className={inputClass}
          />
        </td>
        <td className="space-x-1 px-3 py-2 whitespace-nowrap">
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
    <tr className="align-top transition hover:bg-surface-2/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <span lang={lang} className="text-base font-medium whitespace-pre-wrap">
            {card.front}
          </span>
          <SpeakButton text={card.front} voice={voice} size="sm" />
        </div>
      </td>
      <td lang={lang} className="px-4 py-3 whitespace-pre-wrap text-muted">
        {card.reading || <span className="text-subtle">—</span>}
      </td>
      <td className="px-4 py-3 whitespace-pre-wrap">{card.back}</td>
      <td className="px-4 py-3 whitespace-pre-wrap text-muted">
        {card.notes || <span className="text-subtle">—</span>}
      </td>
      <td className="px-2 py-2 whitespace-nowrap">
        <IconButton
          icon={Pencil}
          label={`Edit "${card.front}"`}
          onClick={startEditing}
        />
        <IconButton
          icon={Trash2}
          variant="danger"
          label={`Delete "${card.front}"`}
          onClick={() => onDelete(card.id)}
        />
      </td>
    </tr>
  );
}
