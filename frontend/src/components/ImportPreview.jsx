const SKIP_REASONS = [
  ["existing", "already in the deck"],
  ["duplicate", "duplicated in the file"],
  ["empty", "missing a front or back"],
  ["tooLong", "over 1,000 characters"],
];

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// result: { total, skipped: { existing, duplicate, empty, tooLong }, preview: [{ front, back, reading }] }
export default function ImportPreview({ result, lang }) {
  const skipped = SKIP_REASONS.filter(([key]) => result.skipped[key] > 0);

  return (
    <div>
      <p className="text-sm">
        <span className="font-semibold text-accent-ink">
          {plural(result.total, "card")}
        </span>{" "}
        ready to import.
      </p>
      {skipped.length > 0 && (
        <ul className="mt-1 text-xs text-subtle">
          {skipped.map(([key, reason]) => (
            <li key={key}>
              Skipping {plural(result.skipped[key], "row")} {reason}
            </li>
          ))}
        </ul>
      )}

      {result.preview.length > 0 && (
        <div className="mt-3 overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-surface-2/50 text-xs text-subtle">
              <tr>
                <th className="px-3 py-2 font-medium">Front</th>
                <th className="px-3 py-2 font-medium">Reading</th>
                <th className="px-3 py-2 font-medium">Back</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {result.preview.map((card, i) => (
                <tr key={i} className="align-top">
                  <td lang={lang} className="px-3 py-2 whitespace-pre-wrap">
                    {card.front}
                  </td>
                  <td
                    lang={lang}
                    className="px-3 py-2 whitespace-pre-wrap text-muted"
                  >
                    {card.reading || "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-pre-wrap">{card.back}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.total > result.preview.length && (
            <p className="border-t border-line px-3 py-2 text-xs text-subtle">
              Showing the first {result.preview.length}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
