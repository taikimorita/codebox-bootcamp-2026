// Order matches the grade numbers the API expects: 0 again, 1 hard, 2 good, 3 easy
const GRADES = [
  { label: "Again", style: "border-red-500/40 text-red-300 hover:bg-red-500/10" },
  {
    label: "Hard",
    style: "border-amber-500/40 text-amber-300 hover:bg-amber-500/10",
  },
  {
    label: "Good",
    style: "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10",
  },
  { label: "Easy", style: "border-sky-500/40 text-sky-300 hover:bg-sky-500/10" },
];

export default function GradeButtons({ onGrade, disabled }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {GRADES.map((g, grade) => (
        <button
          key={g.label}
          onClick={() => onGrade(grade)}
          disabled={disabled}
          className={`rounded-lg border px-3 py-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 ${g.style}`}
        >
          {g.label}
          <kbd className="ml-1.5 text-xs text-zinc-500">{grade + 1}</kbd>
        </button>
      ))}
    </div>
  );
}
