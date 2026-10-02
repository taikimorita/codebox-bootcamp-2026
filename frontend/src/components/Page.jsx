// Every page uses the same width as the header, so everything lines up.
// narrow: focused screens (study, practice, onboarding) get a centred column instead.
export default function Page({ narrow = false, children }) {
  return (
    <main
      className={`mx-auto w-full px-4 pt-8 pb-28 sm:px-6 sm:pb-16 ${narrow ? "max-w-xl" : "max-w-4xl"}`}
    >
      {children}
    </main>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  );
}
