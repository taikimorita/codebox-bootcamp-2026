import { CircleCheck, CircleX } from "lucide-react";

// result: null until answered, then { given, correct, expected }
export default function MultipleChoiceQuestion({
  question,
  result,
  disabled,
  onAnswer,
}) {
  function optionState(option) {
    if (!result) return "idle";
    if (option === result.expected) return "right";
    if (option === result.given) return "wrong";
    return "other";
  }

  const styles = {
    idle: "border-line bg-surface hover:border-accent/50 hover:bg-accent/5",
    right: "animate-pop border-accent bg-accent/10 text-accent-ink",
    wrong: "animate-shake border-danger bg-danger/10 text-danger-ink",
    other: "border-line bg-surface opacity-50",
  };

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {question.options.map((option, i) => {
        const state = optionState(option);
        return (
          <button
            key={option}
            onClick={() => onAnswer(option)}
            disabled={disabled || Boolean(result)}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-default ${styles[state]}`}
          >
            <kbd className="grid size-6 shrink-0 place-items-center rounded-md bg-surface-2 font-sans text-xs text-muted">
              {i + 1}
            </kbd>
            <span className="flex-1 whitespace-pre-wrap">{option}</span>
            {state === "right" && (
              <CircleCheck className="size-5 shrink-0" aria-label="Correct" />
            )}
            {state === "wrong" && (
              <CircleX className="size-5 shrink-0" aria-label="Your answer" />
            )}
          </button>
        );
      })}
    </div>
  );
}
