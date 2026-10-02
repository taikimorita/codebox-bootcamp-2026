import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";
import DeckForm from "../components/DeckForm.jsx";
import { api } from "../api.js";

// [{ code, name, native_name, decks: [...] }], current language first
function groupByLanguage(decks, current) {
  const groups = [];
  for (const deck of decks) {
    let group = groups.find((g) => g.code === deck.language_code);
    if (!group) {
      group = {
        code: deck.language_code,
        name: deck.language_name,
        native_name: deck.language_native_name,
        decks: [],
      };
      groups.push(group);
    }
    group.decks.push(deck);
  }
  for (const g of groups) g.decks.sort((a, b) => a.name.localeCompare(b.name));
  return groups.sort(
    (a, b) =>
      (b.code === current) - (a.code === current) ||
      a.name.localeCompare(b.name),
  );
}

export default function DecksPage({ languages, current, onLogout }) {
  const [decks, setDecks] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | error | success
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0); // bump to load again after an error

  useEffect(() => {
    let stale = false; // ignore an answer that arrives after this effect is replaced
    api
      .listDecks()
      .then((data) => {
        if (stale) return;
        setDecks(data);
        setStatus("success");
      })
      .catch((err) => {
        if (stale) return;
        if (err.status === 401) return onLogout(); // token expired
        setError(err.message);
        setStatus("error");
      });
    return () => {
      stale = true;
    };
  }, [attempt, onLogout]);

  function retry() {
    setStatus("loading");
    setAttempt((n) => n + 1);
  }

  // Runs any API change, shows an error instead of crashing, and reports whether it worked
  async function run(fn) {
    setError("");
    try {
      await fn();
      return true;
    } catch (err) {
      if (err.status === 401) onLogout();
      else setError(err.message);
      return false;
    }
  }

  const addDeck = (name, languageCode) =>
    run(async () => {
      const created = await api.createDeck(name, languageCode);
      setDecks((d) => [...d, created]);
    });

  function deleteDeck(deck) {
    const cards = deck.card_count === 1 ? "1 card" : `${deck.card_count} cards`;
    if (!window.confirm(`Delete "${deck.name}" and its ${cards}?`)) return;
    run(async () => {
      await api.deleteDeck(deck.id);
      setDecks((d) => d.filter((x) => x.id !== deck.id));
    });
  }

  const groups = groupByLanguage(decks, current);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Decks</h1>
        <Link
          to="/import"
          className="rounded-lg px-3 py-2 text-sm font-medium text-emerald-400 hover:bg-zinc-800"
        >
          Import from Anki
        </Link>
      </header>

      {/* key: start the form over with the new default when the language changes */}
      <DeckForm
        key={current}
        languages={languages}
        initialLanguage={current}
        onSubmit={addDeck}
      />

      {error && status !== "error" && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {status === "loading" && (
        <p className="py-8 text-center text-sm text-zinc-500">Loading…</p>
      )}

      {status === "error" && (
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm">
          <p className="text-red-300">{error}</p>
          <Button variant="ghost" className="mt-2" onClick={retry}>
            Try again
          </Button>
        </div>
      )}

      {status === "success" && decks.length === 0 && (
        <p className="py-8 text-center text-sm text-zinc-500">
          No decks yet — create your first one above.
        </p>
      )}

      {status === "success" &&
        groups.map((g) => (
          <section key={g.code} className="mt-8">
            <h2 className="mb-2 text-sm font-medium text-zinc-400">
              <span lang={g.code} className="text-base text-zinc-100">
                {g.native_name}
              </span>{" "}
              {g.name}
            </h2>
            <ul className="space-y-2">
              {g.decks.map((deck) => (
                <li
                  key={deck.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2"
                >
                  <Link
                    to={`/decks/${deck.id}`}
                    className="flex-1 text-sm hover:text-emerald-400"
                  >
                    {deck.name}
                  </Link>
                  <span className="text-xs text-zinc-500">
                    {deck.card_count === 1
                      ? "1 card"
                      : `${deck.card_count} cards`}
                  </span>
                  <Button
                    variant="danger"
                    onClick={() => deleteDeck(deck)}
                    aria-label={`Delete deck "${deck.name}"`}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ))}
    </main>
  );
}
