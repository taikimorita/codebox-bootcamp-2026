import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";
import LanguageCard from "../components/LanguageCard.jsx";
import Page from "../components/Page.jsx";
import { ErrorState, InlineError, Skeleton } from "../components/States.jsx";
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
    <Page>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">
          {isFirstTime ? "What are you studying?" : "Your study languages"}
        </h1>
        <p className="mt-2 mb-8 text-muted">
          Pick one or more. You can change this any time.
        </p>

        {status === "loading" && (
          <div
            role="status"
            aria-label="Loading"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3"
          >
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        )}

        {status === "error" && <ErrorState message={error} onRetry={retry} />}

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

            <InlineError className="mt-4">{error}</InlineError>

            <div className="mt-8 flex items-center gap-3">
              <Button
                size="lg"
                onClick={save}
                disabled={saving || picked.size === 0}
              >
                {saving
                  ? "Saving…"
                  : isFirstTime
                    ? "Start studying"
                    : "Save"}
              </Button>
              <span className="text-sm text-subtle">
                {picked.size === 0
                  ? "Pick at least one"
                  : `${picked.size} selected`}
              </span>
              {!isFirstTime && (
                <Link
                  to="/"
                  className="ml-auto text-sm text-muted hover:text-fg"
                >
                  Cancel
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </Page>
  );
}
