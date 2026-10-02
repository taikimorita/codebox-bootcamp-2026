// Order matches the grade numbers the API expects: 0 again, 1 hard, 2 good, 3 easy
const GRADES = [
  {
    label: "Again",
    hint: "Forgot",
    style: "border-danger/30 bg-danger/5 text-danger-ink hover:bg-danger/15",
  },
  {
    label: "Hard",
    hint: "Barely",
    style: "border-warn/30 bg-warn/5 text-warn-ink hover:bg-warn/15",
  },
  {
    label: "Good",
    hint: "Got it",
    style: "border-accent/30 bg-accent/5 text-accent-ink hover:bg-accent/15",
  },
  {
    label: "Easy",
    hint: "Instantly",
    style: "border-info/30 bg-info/5 text-info-ink hover:bg-info/15",
  },
];

export default function GradeButtons({ onGrade, disabled }) {
  return (
    <div className="grid animate-fade-in grid-cols-4 gap-2">
      {GRADES.map((g, grade) => (
        <button
          key={g.label}
          onClick={() => onGrade(grade)}
          disabled={disabled}
          className={`flex flex-col items-center rounded-xl border px-2 py-3 transition focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 ${g.style}`}
        >
          <span className="text-sm font-semibold">{g.label}</span>
          <span className="mt-0.5 hidden text-xs opacity-75 sm:block">
            {g.hint}
          </span>
          <kbd className="mt-1 hidden rounded border border-current/20 px-1.5 font-sans text-[10px] opacity-60 sm:block">
            {grade + 1}
          </kbd>
        </button>
      ))}
    </div>
  );
}
