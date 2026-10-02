import Button from "./Button.jsx";
import FileDrop from "./FileDrop.jsx";
import ImportPreview from "./ImportPreview.jsx";

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
    <section className="mb-6 space-y-4 rounded-xl border border-zinc-800 p-4">
      <div>
        <h2 className="font-medium">Import from CSV</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Columns: front, back, and an optional reading. Comma or tab
          separated. From Anki: File → Export → “Notes in Plain Text”.
        </p>
      </div>

      <FileDrop
        accept=".csv,.tsv,.txt"
        label={file ? file.name : "Drop a CSV/TSV file here, or click to choose"}
        hint={file ? "Drop or click to choose a different file" : "Up to 5,000 rows"}
        disabled={busy}
        onFile={onFile}
      />

      {busy && !preview && (
        <p className="text-sm text-zinc-500">Reading the file…</p>
      )}

      {preview && <ImportPreview result={preview} lang={lang} />}

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

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
