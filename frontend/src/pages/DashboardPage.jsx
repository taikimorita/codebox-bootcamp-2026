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
        Decks, reviews and streaks will show up here in later stages.
      </p>
      <Link
        to="/todos"
        className="mt-6 inline-block text-sm text-emerald-400 hover:text-emerald-300"
      >
        Go to your study todos →
      </Link>
    </main>
  );
}
