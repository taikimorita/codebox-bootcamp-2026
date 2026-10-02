import { useState } from "react";
import Button from "./Button.jsx";

// result: null until answered, then { given, correct, expected }
export default function TypingQuestion({ result, disabled, onAnswer }) {
  const [text, setText] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (text.trim() && !result) onAnswer(text);
  }

  const border = !result
    ? "border-zinc-800 focus:border-emerald-500"
    : result.correct
      ? "border-emerald-500"
      : "border-red-500";

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        readOnly={Boolean(result)}
        placeholder="Type the meaning or the reading"
        maxLength={1000}
        aria-label="Your answer"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        className={`flex-1 rounded-lg border bg-zinc-900 px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none ${border}`}
      />
      {!result && (
        <Button type="submit" disabled={disabled || !text.trim()}>
          Check
        </Button>
      )}
    </form>
  );
}
