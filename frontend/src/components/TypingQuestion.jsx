import { useState } from "react";
import { fieldBase } from "../styles.js";
import Button from "./Button.jsx";

// result: null until answered, then { given, correct, expected }
export default function TypingQuestion({ result, disabled, onAnswer }) {
  const [text, setText] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (text.trim() && !result) onAnswer(text);
  }

  const feedback = !result
    ? "border-line bg-surface"
    : result.correct
      ? "animate-pop border-accent bg-accent/5"
      : "animate-shake border-danger bg-danger/5";

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
        className={`${fieldBase} w-full px-3 py-3 text-base ${feedback}`}
      />
      {!result && (
        <Button type="submit" disabled={disabled || !text.trim()}>
          Check
        </Button>
      )}
    </form>
  );
}
