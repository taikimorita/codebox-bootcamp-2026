import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../components/Button.jsx";
import CardForm from "../components/CardForm.jsx";
import CardRow from "../components/CardRow.jsx";
import CsvImportPanel from "../components/CsvImportPanel.jsx";
import DeckForm from "../components/DeckForm.jsx";
import { api } from "../api.js";

export default function DeckPage({ languages, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | notfound | error | success
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0); // bump to load again after an error
  const [editingDeck, setEditingDeck] = useState(false);
  // CSV import: pick a file, the server previews it, then confirm
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importBusy, setImportBusy] = useState(false);
  const [importError, setImportError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let stale = false; // ignore an answer that arrives after this effect is replaced
    Promise.all([api.getDeck(id), api.listCards(id)])
      .then(([deckData, cardData]) => {
        if (stale) return;
        setDeck(deckData);
        setCards(cardData);
        setStatus("success");
      })
      .catch((err) => {
        if (stale) return;
        if (err.status === 401) return onLogout(); // token expired
        // Someone else's deck is a 404 too, so it looks the same as a missing one
        if (err.status === 404 || err.status === 400) return setStatus("notfound");
        setError(err.message);
        setStatus("error");
      });
    return () => {
      stale = true;
    };
  }, [id, attempt, onLogout]);

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

  function closeImport() {
    setImporting(false);
    setImportFile(null);
    setImportPreview(null);
    setImportError("");
  }

  async function previewImport(file) {
    setImportFile(file);
    setImportPreview(null);
    setImportError("");
    setImportBusy(true);
    try {
      setImportPreview(await api.importCsv(deck.id, file, true));
    } catch (err) {
      if (err.status === 401) return onLogout();
      setImportError(err.message);
    } finally {
      setImportBusy(false);
    }
  }

  async function confirmImport() {
    setImportError("");
    setImportBusy(true);
    try {
      const { imported } = await api.importCsv(deck.id, importFile, false);
      closeImport();
      setNotice(`Imported ${imported} ${imported === 1 ? "card" : "cards"}.`);
      setAttempt((n) => n + 1); // reload the card list
    } catch (err) {
      if (err.status === 401) return onLogout();
      setImportError(err.message);
    } finally {
      setImportBusy(false);
    }
  }

  const saveDeck = (name, language_code) =>
    run(async () => {
      setDeck(await api.updateDeck(deck.id, { name, language_code }));
      setEditingDeck(false);
    });

  function deleteDeck() {
    const count = cards.length === 1 ? "1 card" : `${cards.length} cards`;
    if (!window.confirm(`Delete "${deck.name}" and its ${count}?`)) return;
    run(async () => {
      await api.deleteDeck(deck.id);
      navigate("/decks");
    });
  }

  const addCard = (card) =>
    run(async () => {
      const created = await api.createCard(deck.id, card);
      setCards((c) => [...c, created]);
    });

  const updateCard = (cardId, changes) =>
    run(async () => {
      const updated = await api.updateCard(cardId, changes);
      setCards((c) => c.map((x) => (x.id === cardId ? updated : x)));
    });

  const deleteCard = (cardId) =>
    run(async () => {
      await api.deleteCard(cardId);
      setCards((c) => c.filter((x) => x.id !== cardId));
    });

  if (status === "loading")
    return <p className="py-16 text-center text-sm text-zinc-500">Loading…</p>;

  if (status === "notfound")
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center text-sm">
        <p className="text-zinc-300">That deck doesn't exist.</p>
        <Link to="/decks" className="mt-2 inline-block text-emerald-400">
          ← Back to decks
        </Link>
      </main>
    );

  if (status === "error")
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm">
          <p className="text-red-300">{error}</p>
          <Button variant="ghost" className="mt-2" onClick={retry}>
            Try again
          </Button>
        </div>
      </main>
    );

  // The deck may be in a language the user has since stopped studying
  const languageOptions = languages.some((l) => l.code === deck.language_code)
    ? languages
    : [
        ...languages,
        { code: deck.language_code, native_name: deck.language_native_name },
      ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/decks" className="text-sm text-zinc-400 hover:text-zinc-100">
        ← Decks
      </Link>

      {editingDeck ? (
        <div className="mt-3 mb-6">
          <DeckForm
            languages={languageOptions}
            initialName={deck.name}
            initialLanguage={deck.language_code}
            submitLabel="Save"
            onSubmit={saveDeck}
            onCancel={() => setEditingDeck(false)}
          />
        </div>
      ) : (
        <header className="mt-3 mb-6 flex flex-wrap items-center gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">{deck.name}</h1>
            <p className="text-sm text-zinc-400">
              <span lang={deck.language_code}>{deck.language_native_name}</span>{" "}
              · {cards.length === 1 ? "1 card" : `${cards.length} cards`}
            </p>
          </div>
          <Link
            to={`/practice?deck=${deck.id}`}
            className="rounded-lg px-3 py-2 text-sm font-medium text-emerald-400 hover:bg-zinc-800"
          >
            Practice
          </Link>
          <Button
            variant="ghost"
            onClick={() => {
              setNotice("");
              setImporting(true);
            }}
          >
            Import CSV
          </Button>
          <Button variant="ghost" onClick={() => setEditingDeck(true)}>
            Edit deck
          </Button>
          <Button variant="danger" onClick={deleteDeck}>
            Delete deck
          </Button>
        </header>
      )}

      {importing && (
        <CsvImportPanel
          file={importFile}
          preview={importPreview}
          busy={importBusy}
          error={importError}
          lang={deck.language_code}
          onFile={previewImport}
          onConfirm={confirmImport}
          onCancel={closeImport}
        />
      )}

      {notice && (
        <p role="status" className="mb-4 text-sm text-emerald-300">
          {notice}
        </p>
      )}

      <CardForm lang={deck.language_code} onAdd={addCard} />

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {cards.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          No cards yet — add your first one above.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-xs text-zinc-500 uppercase">
              <tr>
                <th className="p-2 font-medium">Front</th>
                <th className="p-2 font-medium">Reading</th>
                <th className="p-2 font-medium">Back</th>
                <th className="p-2 font-medium">Notes</th>
                <th className="p-2">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => (
                <CardRow
                  key={card.id}
                  card={card}
                  lang={deck.language_code}
                  onUpdate={updateCard}
                  onDelete={deleteCard}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
