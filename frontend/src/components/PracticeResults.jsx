import Button from "./Button.jsx";

// results: [{ front, given, correct, expected, reading }]
export default function PracticeResults({ results, lang, onAgain, onSetup }) {
  const score = results.filter((r) => r.correct).length;
  const missed = results.filter((r) => !r.correct);
  const percent = Math.round((score / results.length) * 100);

  return (
    <div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <p className="text-4xl font-semibold">
          {score} / {results.length}
        </p>
        <p className="mt-1 text-sm text-zinc-400">{percent}% correct</p>
      </div>

      {missed.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-zinc-400">
            Cards you missed
          </h2>
          <ul className="space-y-2">
            {missed.map((r, i) => (
              <li
                key={i}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm"
              >
                <p lang={lang} className="text-base whitespace-pre-wrap">
                  {r.front}
                </p>
                <p className="mt-1 text-emerald-300 whitespace-pre-wrap">
                  {r.expected}
                  {r.reading && (
                    <span lang={lang} className="ml-2 text-zinc-400">
                      {r.reading}
                    </span>
                  )}
                </p>
                <p className="text-red-300 whitespace-pre-wrap">
                  You answered: {r.given}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 flex gap-2">
        <Button onClick={onAgain}>Practice again</Button>
        <Button variant="ghost" onClick={onSetup}>
          Change settings
        </Button>
      </div>
    </div>
  );
}
