import { Volume2 } from "lucide-react";
import { speak } from "../speech.js";

// Hidden when there's no voice for the language
export default function SpeakButton({ text, voice, size = "md", className = "" }) {
  if (!voice) return null;
  const sizes = { sm: "size-7 [&>svg]:size-4", md: "size-9 [&>svg]:size-5" };
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation(); // e.g. don't also flip the flashcard it sits on
        speak(text, voice);
      }}
      aria-label={`Listen to "${text}"`}
      title="Listen"
      className={`inline-grid shrink-0 place-items-center rounded-full text-muted transition hover:bg-accent/10 hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent ${sizes[size]} ${className}`}
    >
      <Volume2 aria-hidden="true" />
    </button>
  );
}
