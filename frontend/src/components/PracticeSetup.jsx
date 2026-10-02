import { CircleCheck, PencilLine } from "lucide-react";
import { useState } from "react";
import { cardClass, inputClass } from "../styles.js";
import Button from "./Button.jsx";

const TYPES = [
  {
    value: "multiple_choice",
    label: "Multiple choice",
    hint: "Pick from 4 answers",
    icon: CircleCheck,
  },
  {
    value: "typing",
    label: "Type the answer",
    hint: "Meaning or reading",
    icon: PencilLine,
  },
];

// Groups decks by language for <optgroup>, current language first
function groupDecks(decks, current) {
  const groups = new Map();
  for (const d of decks) {
    if (!groups.has(d.language_code))
      groups.set(d.language_code, { name: d.language_name, decks: [] });
    groups.get(d.language_code).decks.push(d);
  }
  return [...groups.entries()].sort(
    ([a, ga], [b, gb]) =>
      (b === current) - (a === current) || ga.name.localeCompare(gb.name),
  );
}

function pickDeck(decks, preferredId, current) {
  return (
    decks.find((d) => d.id === preferredId) ??
    decks.find((d) => d.language_code === current) ??
    decks[0]
  );
}

export default function PracticeSetup({
  decks,
  current,
  initial, // { deckId, type, count }
  starting,
  onStart,
}) {
  const [deckId, setDeckId] = useState(
    () => pickDeck(decks, initial.deckId, current)?.id ?? "",
  );
  const [type, setType] = useState(initial.type);
  const [count, setCount] = useState(initial.count);
  const deck = decks.find((d) => d.id === deckId);
  const tooFewForChoice = type === "multiple_choice" && deck?.card_count < 4;

  function handleSubmit(e) {
    e.preventDefault();
    if (deck) onStart({ deckId: deck.id, type, count });
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 p-6 ${cardClass}`}>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Deck</span>
        <select
          value={deckId}
          onChange={(e) => setDeckId(Number(e.target.value))}
          className={inputClass}
        >
          {groupDecks(decks, current).map(([code, group]) => (
            <optgroup key={code} label={group.name}>
              {group.decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.card_count})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Question type</legend>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map(({ value, label, hint, icon: Icon }) => (
            <label
              key={value}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${type === value ? "border-accent bg-accent/5" : "border-line hover:border-line-strong"}`}
            >
              <input
                type="radio"
                name="type"
                value={value}
                checked={type === value}
                onChange={() => setType(value)}
                className="sr-only"
              />
              <Icon
                aria-hidden="true"
                className={`mt-0.5 size-5 shrink-0 ${type === value ? "text-accent-ink" : "text-subtle"}`}
              />
              <span>
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs text-subtle">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Questions</legend>
        <div className="inline-flex rounded-lg bg-surface-2 p-1">
          {[5, 10, 20].map((n) => (
            <label
              key={n}
              className={`cursor-pointer rounded-md px-4 py-1.5 text-sm tabular-nums transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${count === n ? "bg-surface font-medium shadow-sm" : "text-muted hover:text-fg"}`}
            >
              <input
                type="radio"
                name="count"
                value={n}
                checked={count === n}
                onChange={() => setCount(n)}
                className="sr-only"
              />
              {n}
            </label>
          ))}
        </div>
      </fieldset>

      {tooFewForChoice && (
        <p className="text-sm text-warn-ink">
          Multiple choice needs at least 4 cards in the deck.
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={starting || !deck || deck.card_count === 0 || tooFewForChoice}
      >
        {starting ? "Starting…" : "Start practice"}
      </Button>
    </form>
  );
}
