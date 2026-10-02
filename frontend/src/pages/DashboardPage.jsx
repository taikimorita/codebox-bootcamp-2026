import { Link } from "react-router-dom";

export default function DashboardPage({ languages, current }) {
  const language = languages.find((l) => l.code === current);

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {language && (
        <p className="mt-2 text-zinc-300">
          Studying now:{" "}
          <span lang={language.code} className="font-medium">
            {language.native_name}
          </span>{" "}
          <span className="text-zinc-500">({language.name})</span>
        </p>
      )}
      <p className="mt-4 text-sm text-zinc-500">
        Reviews and streaks will show up here in later stages.
      </p>
      <div className="mt-6 flex gap-6 text-sm">
        <Link to="/study" className="text-emerald-400 hover:text-emerald-300">
          Study now →
        </Link>
        <Link
          to="/practice"
          className="text-emerald-400 hover:text-emerald-300"
        >
          Practice →
        </Link>
        <Link to="/decks" className="text-emerald-400 hover:text-emerald-300">
          Your decks →
        </Link>
        <Link to="/todos" className="text-emerald-400 hover:text-emerald-300">
          Your study todos →
        </Link>
      </div>
    </main>
  );
}
