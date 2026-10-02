import { RotateCcw, Settings2 } from "lucide-react";
import { cardClass } from "../styles.js";
import Button from "./Button.jsx";

function scoreMessage(percent) {
  if (percent === 100) return "Perfect round!";
  if (percent >= 80) return "Great work.";
  if (percent >= 50) return "Getting there.";
  return "These need more practice.";
}

// results: [{ front, given, correct, expected, reading }]
export default function PracticeResults({ results, lang, onAgain, onSetup }) {
  const score = results.filter((r) => r.correct).length;
  const missed = results.filter((r) => !r.correct);
  const percent = Math.round((score / results.length) * 100);

  return (
    <div className="animate-fade-in space-y-6">
      <div className={`flex flex-col items-center p-8 text-center ${cardClass}`}>
        {/* A ring that fills to the score */}
        <div
          className="grid size-32 place-items-center rounded-full"
          style={{
            background: `conic-gradient(var(--accent) ${percent}%, var(--surface-2) 0)`,
          }}
        >
          <div className="grid size-26 place-items-center rounded-full bg-surface">
            <span className="text-3xl font-semibold tabular-nums">
              {percent}%
            </span>
          </div>
        </div>
        <p className="mt-4 text-lg font-semibold">{scoreMessage(percent)}</p>
        <p className="text-sm text-muted">
          {score} of {results.length} correct
        </p>
        <div className="mt-6 flex gap-2">
          <Button onClick={onAgain}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Practice again
          </Button>
          <Button variant="secondary" onClick={onSetup}>
            <Settings2 className="size-4" aria-hidden="true" />
            Change settings
          </Button>
        </div>
      </div>

      {missed.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted">
            Cards you missed
          </h2>
          <ul className={`divide-y divide-line ${cardClass}`}>
            {missed.map((r, i) => (
              <li key={i} className="px-4 py-3 text-sm">
                <p lang={lang} className="text-lg font-medium whitespace-pre-wrap">
                  {r.front}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-accent-ink">
                  {r.expected}
                  {r.reading && (
                    <span lang={lang} className="ml-2 text-muted">
                      {r.reading}
                    </span>
                  )}
                </p>
                <p className="whitespace-pre-wrap text-subtle">
                  You answered: <span className="text-danger-ink">{r.given}</span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
