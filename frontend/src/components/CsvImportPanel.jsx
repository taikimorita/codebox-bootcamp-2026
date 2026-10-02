import { X } from "lucide-react";
import { cardClass } from "../styles.js";
import Button from "./Button.jsx";
import FileDrop from "./FileDrop.jsx";
import IconButton from "./IconButton.jsx";
import ImportPreview from "./ImportPreview.jsx";
import { InlineError } from "./States.jsx";

export default function CsvImportPanel({
  file,
  preview, // null until the server has read the file
  busy,
  error,
  lang,
  onFile,
  onConfirm,
  onCancel,
}) {
  return (
    <section className={`mb-6 animate-fade-in space-y-4 p-5 ${cardClass}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h2 className="font-semibold">Import from CSV</h2>
          <p className="mt-1 text-xs text-subtle">
            Columns: front, back, and an optional reading. Comma or tab
            separated. From Anki: File → Export → “Notes in Plain Text”.
          </p>
        </div>
        <IconButton icon={X} label="Close import" onClick={onCancel} disabled={busy} />
      </div>

      <FileDrop
        accept=".csv,.tsv,.txt"
        label={file ? file.name : "Drop a CSV/TSV file here, or click to choose"}
        hint={file ? "Drop or click to choose a different file" : "Up to 5,000 rows"}
        disabled={busy}
        onFile={onFile}
      />

      {busy && !preview && (
        <p role="status" className="animate-pulse text-sm text-subtle">
          Reading the file…
        </p>
      )}

      {preview && <ImportPreview result={preview} lang={lang} />}

      <InlineError>{error}</InlineError>

      <div className="flex gap-2">
        <Button
          onClick={onConfirm}
          disabled={busy || !preview || preview.total === 0}
        >
          {busy && preview
            ? "Importing…"
            : preview
              ? `Import ${preview.total} ${preview.total === 1 ? "card" : "cards"}`
              : "Import"}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
    </section>
  );
}
