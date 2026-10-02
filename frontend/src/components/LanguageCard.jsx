export default function LanguageCard({ language, selected, onToggle }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`rounded-xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-emerald-400 ${selected ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"}`}
    >
      <span lang={language.code} className="block text-xl font-medium">
        {language.native_name}
      </span>
      <span className="mt-1 block text-sm text-zinc-400">{language.name}</span>
    </button>
  );
}
