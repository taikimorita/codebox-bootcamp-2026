import { FileUp, Layers, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DeckForm from "../components/DeckForm.jsx";
import IconButton from "../components/IconButton.jsx";
import Page, { PageHeader } from "../components/Page.jsx";
import {
  EmptyState,
  ErrorState,
  InlineError,
  LoadingRows,
} from "../components/States.jsx";
import { api } from "../api.js";
import { cardClass } from "../styles.js";

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
    <Page>
      <PageHeader title="Decks" subtitle="Your flashcards, grouped by language.">
        <Link
          to="/import"
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium transition hover:bg-surface-2"
        >
          <FileUp className="size-4" aria-hidden="true" />
          Import from Anki
        </Link>
      </PageHeader>

      <div className={`p-4 ${cardClass}`}>
        <p className="mb-3 text-sm font-medium">New deck</p>
        {/* key: start the form over with the new default when the language changes */}
        <DeckForm
          key={current}
          languages={languages}
          initialLanguage={current}
          onSubmit={addDeck}
        />
      </div>

      {status !== "error" && <InlineError className="mt-3">{error}</InlineError>}

      <div className="mt-8">
        {status === "loading" && (
          <LoadingRows rows={4} rowClassName="h-20" />
        )}

        {status === "error" && <ErrorState message={error} onRetry={retry} />}

        {status === "success" && decks.length === 0 && (
          <EmptyState icon={Layers} title="No decks yet">
            Create your first one above, or import a deck from Anki.
          </EmptyState>
        )}

        {status === "success" &&
          groups.map((g) => (
            <section key={g.code} className="mb-8">
              <h2 className="mb-3 flex items-baseline gap-2">
                <span lang={g.code} className="text-lg font-semibold">
                  {g.native_name}
                </span>
                <span className="text-sm text-subtle">{g.name}</span>
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {g.decks.map((deck) => (
                  <li
                    key={deck.id}
                    className={`group relative flex items-center gap-3 p-4 transition hover:border-accent/50 hover:shadow-sm ${cardClass}`}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent-ink">
                      <Layers className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      {/* The link's ::after covers the whole card, so the card is clickable */}
                      <Link
                        to={`/decks/${deck.id}`}
                        className="block truncate font-medium after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-accent"
                      >
                        {deck.name}
                      </Link>
                      <p className="text-xs text-subtle">
                        {deck.card_count === 1
                          ? "1 card"
                          : `${deck.card_count} cards`}
                        {deck.source !== "manual" && ` · from ${deck.source.toUpperCase()}`}
                      </p>
                    </div>
                    <IconButton
                      icon={Trash2}
                      variant="danger"
                      label={`Delete deck "${deck.name}"`}
                      onClick={() => deleteDeck(deck)}
                      className="relative z-10 opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
      </div>
    </Page>
  );
}
