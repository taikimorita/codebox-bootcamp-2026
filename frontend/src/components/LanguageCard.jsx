import { Check } from "lucide-react";

export default function LanguageCard({ language, selected, onToggle }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`relative rounded-2xl border p-5 text-left transition focus-visible:outline-2 focus-visible:outline-accent ${selected ? "border-accent bg-accent/5 shadow-sm" : "border-line bg-surface hover:-translate-y-0.5 hover:border-line-strong hover:shadow-sm"}`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-3 right-3 grid size-5 place-items-center rounded-full transition ${selected ? "bg-accent text-on-accent" : "border border-line-strong"}`}
      >
        {selected && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      <span lang={language.code} className="block text-2xl font-semibold">
        {language.native_name}
      </span>
      <span className="mt-1 block text-sm text-muted">{language.name}</span>
    </button>
  );
}
