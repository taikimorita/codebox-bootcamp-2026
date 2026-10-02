import { useState } from "react";
import Button from "./Button.jsx";

const selectClass =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none";

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
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block">
        <span className="mb-1 block text-sm text-zinc-400">Deck</span>
        <select
          value={deckId}
          onChange={(e) => setDeckId(Number(e.target.value))}
          className={selectClass}
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
        <legend className="mb-1 text-sm text-zinc-400">Question type</legend>
        <div className="flex gap-2">
          {[
            ["multiple_choice", "Multiple choice"],
            ["typing", "Type the answer"],
          ].map(([value, label]) => (
            <label
              key={value}
              className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-sm ${type === value ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"}`}
            >
              <input
                type="radio"
                name="type"
                value={value}
                checked={type === value}
                onChange={() => setType(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="mb-1 block text-sm text-zinc-400">Questions</span>
        <select
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className={selectClass}
        >
          {[5, 10, 20].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      {tooFewForChoice && (
        <p className="text-sm text-amber-300">
          Multiple choice needs at least 4 cards in the deck.
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={starting || !deck || deck.card_count === 0 || tooFewForChoice}
      >
        {starting ? "Starting…" : "Start"}
      </Button>
    </form>
  );
}
