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
        <span className="font-medium">{plural(result.total, "card")}</span>{" "}
        ready to import.
      </p>
      {skipped.length > 0 && (
        <ul className="mt-1 text-xs text-zinc-500">
          {skipped.map(([key, reason]) => (
            <li key={key}>
              Skipping {plural(result.skipped[key], "row")} {reason}
            </li>
          ))}
        </ul>
      )}

      {result.preview.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-zinc-500 uppercase">
              <tr>
                <th className="p-2 font-medium">Front</th>
                <th className="p-2 font-medium">Reading</th>
                <th className="p-2 font-medium">Back</th>
              </tr>
            </thead>
            <tbody>
              {result.preview.map((card, i) => (
                <tr key={i} className="border-t border-zinc-800 align-top">
                  <td lang={lang} className="p-2 whitespace-pre-wrap">
                    {card.front}
                  </td>
                  <td
                    lang={lang}
                    className="p-2 whitespace-pre-wrap text-zinc-400"
                  >
                    {card.reading || "—"}
                  </td>
                  <td className="p-2 whitespace-pre-wrap">{card.back}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.total > result.preview.length && (
            <p className="mt-1 text-xs text-zinc-500">
              Showing the first {result.preview.length}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
