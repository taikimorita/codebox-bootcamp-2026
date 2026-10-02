import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";
import LanguageCard from "../components/LanguageCard.jsx";
import { api } from "../api.js";

export default function OnboardingPage({ selected, onSaved, onLogout }) {
  const [languages, setLanguages] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | error | success
  const [error, setError] = useState("");
  const [picked, setPicked] = useState(
    () => new Set(selected.map((l) => l.code)),
  );
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0); // bump to load again after an error
  const isFirstTime = selected.length === 0;

  useEffect(() => {
    let stale = false; // ignore an answer that arrives after this effect is replaced
    api
      .listLanguages()
      .then((data) => {
        if (stale) return;
        setLanguages(data);
        setStatus("success");
      })
      .catch((err) => {
        if (stale) return;
        setError(err.message);
        setStatus("error");
      });
    return () => {
      stale = true;
    };
  }, [attempt]);

  function retry() {
    setStatus("loading");
    setAttempt((n) => n + 1);
  }

  function toggle(code) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  async function save() {
    setError("");
    setSaving(true);
    try {
      const codes = languages
        .filter((l) => picked.has(l.code))
        .map((l) => l.code);
      onSaved(await api.setMyLanguages(codes));
    } catch (err) {
      if (err.status === 401) return onLogout(); // token expired
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">
        {isFirstTime ? "What are you studying?" : "Your study languages"}
      </h1>
      <p className="mt-1 mb-6 text-sm text-zinc-400">
        Pick one or more. You can change this any time.
      </p>

      {status === "loading" && (
        <p className="py-8 text-center text-sm text-zinc-500">Loading…</p>
      )}

      {status === "error" && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm">
          <p className="text-red-300">{error}</p>
          <Button variant="ghost" className="mt-2" onClick={retry}>
            Try again
          </Button>
        </div>
      )}

      {status === "success" && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {languages.map((l) => (
              <LanguageCard
                key={l.code}
                language={l}
                selected={picked.has(l.code)}
                onToggle={() => toggle(l.code)}
              />
            ))}
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center gap-3">
            <Button onClick={save} disabled={saving || picked.size === 0}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <span className="text-sm text-zinc-500">
              {picked.size === 0
                ? "Pick at least one"
                : `${picked.size} selected`}
            </span>
            {!isFirstTime && (
              <Link
                to="/"
                className="ml-auto text-sm text-zinc-400 hover:text-zinc-100"
              >
                Cancel
              </Link>
            )}
          </div>
        </>
      )}
    </main>
  );
}
