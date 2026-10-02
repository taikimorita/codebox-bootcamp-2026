import {
  ArrowLeft,
  CircleCheck,
  Pencil,
  Target,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../components/Button.jsx";
import CardForm from "../components/CardForm.jsx";
import CardRow from "../components/CardRow.jsx";
import CsvImportPanel from "../components/CsvImportPanel.jsx";
import DeckForm from "../components/DeckForm.jsx";
import IconButton from "../components/IconButton.jsx";
import Page from "../components/Page.jsx";
import {
  EmptyState,
  ErrorState,
  InlineError,
  LoadingRows,
  Skeleton,
} from "../components/States.jsx";
import { api } from "../api.js";
import { localeFor, useVoice } from "../speech.js";
import { cardClass, textLinkClass } from "../styles.js";

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
  // Looked up once here, not in every row (hooks must also run before the early returns below)
  const voice = useVoice(deck ? localeFor(languages, deck.language_code) : null);

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

  const backLink = (
    <Link
      to="/decks"
      className="inline-flex items-center gap-1 text-sm text-muted transition hover:text-fg"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      Decks
    </Link>
  );

  if (status === "loading")
    return (
      <Page>
        {backLink}
        <Skeleton className="mt-4 mb-6 h-12 w-2/3" />
        <LoadingRows rows={5} />
      </Page>
    );

  if (status === "notfound")
    return (
      <Page narrow>
        <EmptyState title="That deck doesn't exist">
          <Link to="/decks" className={textLinkClass}>
            Back to your decks
          </Link>
        </EmptyState>
      </Page>
    );

  if (status === "error")
    return (
      <Page>
        {backLink}
        <div className="mt-4">
          <ErrorState message={error} onRetry={retry} />
        </div>
      </Page>
    );

  // The deck may be in a language the user has since stopped studying
  const languageOptions = languages.some((l) => l.code === deck.language_code)
    ? languages
    : [
        ...languages,
        { code: deck.language_code, native_name: deck.language_native_name },
      ];

  return (
    <Page>
      {backLink}

      {editingDeck ? (
        <div className={`mt-4 mb-6 p-4 ${cardClass}`}>
          <p className="mb-3 text-sm font-medium">Edit deck</p>
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
        <header className="mt-4 mb-6 flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {deck.name}
            </h1>
            <p className="mt-1 text-sm text-muted">
              <span lang={deck.language_code}>{deck.language_native_name}</span>{" "}
              · {cards.length === 1 ? "1 card" : `${cards.length} cards`}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Link
              to={`/practice?deck=${deck.id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-on-accent shadow-sm transition hover:bg-accent/85"
            >
              <Target className="size-4" aria-hidden="true" />
              Practice
            </Link>
            <Button
              variant="secondary"
              className="ml-1"
              onClick={() => {
                setNotice("");
                setImporting(true);
              }}
            >
              <Upload className="size-4" aria-hidden="true" />
              Import CSV
            </Button>
            <IconButton
              icon={Pencil}
              label="Edit deck"
              onClick={() => setEditingDeck(true)}
            />
            <IconButton
              icon={Trash2}
              variant="danger"
              label="Delete deck"
              onClick={deleteDeck}
            />
          </div>
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
        <p
          role="status"
          className="mb-4 flex animate-fade-in items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent-ink"
        >
          <CircleCheck className="size-4" aria-hidden="true" />
          {notice}
        </p>
      )}

      <CardForm lang={deck.language_code} onAdd={addCard} />

      <InlineError className="mt-3">{error}</InlineError>

      <div className="mt-6">
        {cards.length === 0 ? (
          <EmptyState title="No cards yet">
            Add your first one above, or import a CSV.
          </EmptyState>
        ) : (
          <div className={`overflow-x-auto ${cardClass}`}>
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-line bg-surface-2/50 text-xs text-subtle">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Front</th>
                  <th className="px-4 py-2.5 font-medium">Reading</th>
                  <th className="px-4 py-2.5 font-medium">Back</th>
                  <th className="px-4 py-2.5 font-medium">Notes</th>
                  <th className="px-4 py-2.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {cards.map((card) => (
                  <CardRow
                    key={card.id}
                    card={card}
                    lang={deck.language_code}
                    voice={voice}
                    onUpdate={updateCard}
                    onDelete={deleteCard}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Page>
  );
}
