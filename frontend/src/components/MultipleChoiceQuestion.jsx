// result: null until answered, then { given, correct, expected }
export default function MultipleChoiceQuestion({
  question,
  result,
  disabled,
  onAnswer,
}) {
  function optionClass(option) {
    if (!result)
      return "border-zinc-800 bg-zinc-900 hover:border-zinc-600";
    if (option === result.expected)
      return "border-emerald-500 bg-emerald-500/10 text-emerald-200";
    if (option === result.given)
      return "border-red-500 bg-red-500/10 text-red-200";
    return "border-zinc-800 bg-zinc-900 opacity-50";
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {question.options.map((option, i) => (
        <button
          key={option}
          onClick={() => onAnswer(option)}
          disabled={disabled || Boolean(result)}
          className={`flex items-start gap-2 rounded-lg border px-3 py-3 text-left text-sm whitespace-pre-wrap transition focus-visible:outline-2 focus-visible:outline-emerald-400 disabled:cursor-default ${optionClass(option)}`}
        >
          <kbd className="text-xs text-zinc-500">{i + 1}</kbd>
          <span>{option}</span>
        </button>
      ))}
    </div>
  );
}
