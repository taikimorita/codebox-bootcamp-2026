import { speak } from "../speech.js";

// Hidden when there's no voice for the language
export default function SpeakButton({ text, voice, className = "" }) {
  if (!voice) return null;
  return (
    <button
      type="button"
      onClick={() => speak(text, voice)}
      aria-label={`Listen to "${text}"`}
      title="Listen"
      className={`rounded-md px-1.5 py-0.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-400 ${className}`}
    >
      🔊
    </button>
  );
}
