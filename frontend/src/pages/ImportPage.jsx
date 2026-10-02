import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import FileDrop from "../components/FileDrop.jsx";
import ImportPreview from "../components/ImportPreview.jsx";
import Page, { PageHeader } from "../components/Page.jsx";
import { InlineError } from "../components/States.jsx";
import { api } from "../api.js";
import { cardClass, inputClass } from "../styles.js";

export default function ImportPage({ languages, current, onLogout }) {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [language, setLanguage] = useState(current ?? languages[0]?.code ?? "");
  const [preview, setPreview] = useState(null); // null until the server has read the file
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function chooseFile(chosen) {
    setFile(chosen);
    setName(chosen.name.replace(/\.apkg$/i, "").slice(0, 100));
    setPreview(null);
    setError("");
    setBusy(true);
    try {
      setPreview(await api.importAnki(chosen, {}, true));
    } catch (err) {
      if (err.status === 401) return onLogout();
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirm(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { deck_id } = await api.importAnki(
        file,
        { name: name.trim(), language_code: language },
        false,
      );
      navigate(`/decks/${deck_id}`);
    } catch (err) {
      if (err.status === 401) return onLogout();
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Page>
      <Link
        to="/decks"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted transition hover:text-fg"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Decks
      </Link>
      <PageHeader
        title="Import an Anki deck"
        subtitle="In Anki: File → Export → “Anki Deck Package (.apkg)”. The first field becomes the front and the second the back. Media and audio aren't imported."
      />

      <div className="space-y-5">
        <FileDrop
          accept=".apkg"
          label={file ? file.name : "Drop an .apkg file here, or click to choose"}
          hint={
            file
              ? "Drop or click to choose a different file"
              : "Up to 20 MB and 5,000 notes"
          }
          disabled={busy}
          onFile={chooseFile}
        />

        {busy && !preview && (
          <p role="status" className="animate-pulse text-sm text-subtle">
            Reading the deck…
          </p>
        )}

        <InlineError>{error}</InlineError>

        {preview && (
          <form
            onSubmit={confirm}
            className={`animate-fade-in space-y-5 p-5 ${cardClass}`}
          >
            <ImportPreview result={preview} lang={language} />

            <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">
                  New deck name
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">
                  Language
                </span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={inputClass}
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code} lang={l.code}>
                      {l.native_name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <Button
              type="submit"
              disabled={
                busy || preview.total === 0 || !name.trim() || !language
              }
            >
              {busy
                ? "Importing…"
                : `Import ${preview.total} ${preview.total === 1 ? "card" : "cards"}`}
            </Button>
          </form>
        )}

        <p className="text-xs text-subtle">
          To add a CSV to an existing deck, use Import CSV on the deck's page.
        </p>
      </div>
    </Page>
  );
}
