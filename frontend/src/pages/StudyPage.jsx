import { Inbox, PartyPopper, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";
import Flashcard from "../components/Flashcard.jsx";
import GradeButtons from "../components/GradeButtons.jsx";
import Page from "../components/Page.jsx";
import {
  EmptyState,
  ErrorState,
  InlineError,
  Skeleton,
} from "../components/States.jsx";
import { api } from "../api.js";
import { localeFor, useVoice } from "../speech.js";
import { cardClass, textLinkClass } from "../styles.js";

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default function StudyPage({ languages, current, onLogout }) {
  const [cards, setCards] = useState([]); // the batch the server sent, first one is showing
  const [totalDue, setTotalDue] = useState(0); // due right now, including ones not in this batch
  const [status, setStatus] = useState("loading"); // loading | error | success
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0); // bump to fetch the queue again
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tally, setTally] = useState([0, 0, 0, 0]); // this session: again, hard, good, easy
  const card = cards[0];
  const reviewed = tally.reduce((a, b) => a + b, 0);
  const language = languages.find((l) => l.code === current);
  const voice = useVoice(localeFor(languages, current));

  useEffect(() => {
    let stale = false; // ignore an answer that arrives after this effect is replaced
    api
      .getStudyQueue(current)
      .then((data) => {
        if (stale) return;
        setCards(data.cards);
        setTotalDue(data.total_due);
        setRevealed(false);
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
  }, [current, attempt, onLogout]);

  function reload() {
    setStatus("loading");
    setAttempt((n) => n + 1);
  }

  async function grade(value) {
    if (!card || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await api.reviewCard(card.id, value, "flashcard");
      const rest = cards.slice(1);
      const left = Math.max(0, totalDue - 1); // "Again" cards aren't due for 10 minutes
      setCards(rest);
      setTotalDue(left);
      setTally((t) => t.map((n, i) => (i === value ? n + 1 : n)));
      setRevealed(false);
      if (rest.length === 0 && left > 0) reload(); // this batch is done but more are due
    } catch (err) {
      if (err.status === 401) return onLogout();
      setError(err.message); // keep the card on screen so they can try again
    } finally {
      setSubmitting(false);
    }
  }

  // Keyboard: Space shows the answer, 1-4 grade it.
  // No dependency array: it re-subscribes after each render so it always sees the current card.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (status !== "success" || !card) return;
      if (e.code === "Space") {
        e.preventDefault(); // don't scroll, and don't also "click" a focused button
        setRevealed(true);
      } else if (revealed && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        grade(Number(e.key) - 1);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const progress = reviewed + totalDue > 0 ? reviewed / (reviewed + totalDue) : 0;

  return (
    <Page narrow>
      <header className="mb-6">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Study{" "}
            {language && (
              <span lang={language.code} className="text-muted">
                {language.native_name}
              </span>
            )}
          </h1>
          {status === "success" && card && (
            <span className="text-sm text-muted tabular-nums">
              {totalDue} left
            </span>
          )}
        </div>
        {status === "success" && card && (
          <div
            role="progressbar"
            aria-label="Session progress"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2"
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}
      </header>

      {status === "loading" && (
        <div role="status" aria-label="Loading" className="space-y-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-12" />
        </div>
      )}

      {status === "error" && <ErrorState message={error} onRetry={reload} />}

      {status === "success" && !card && reviewed > 0 && (
        <div className={`animate-fade-in p-8 text-center ${cardClass}`}>
          <span className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-accent/10 text-accent-ink">
            <PartyPopper className="size-7" aria-hidden="true" />
          </span>
          <h2 className="text-xl font-semibold">Session complete</h2>
          <p className="mt-1 text-sm text-muted">
            You reviewed {plural(reviewed, "card")}.
          </p>
          <dl className="mx-auto mt-6 grid max-w-sm grid-cols-4 gap-2 text-center">
            {[
              ["Again", tally[0], "text-danger-ink"],
              ["Hard", tally[1], "text-warn-ink"],
              ["Good", tally[2], "text-accent-ink"],
              ["Easy", tally[3], "text-info-ink"],
            ].map(([label, n, color]) => (
              <div key={label} className="rounded-xl bg-surface-2 py-2">
                <dt className="text-xs text-subtle">{label}</dt>
                <dd className={`text-lg font-semibold tabular-nums ${color}`}>
                  {n}
                </dd>
              </div>
            ))}
          </dl>
          {tally[0] > 0 && (
            <p className="mt-4 text-xs text-subtle">
              Cards you marked Again come back in about 10 minutes.
            </p>
          )}
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="secondary" onClick={reload}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Check again
            </Button>
            <Link
              to="/"
              className="inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-fg"
            >
              Back home
            </Link>
          </div>
        </div>
      )}

      {status === "success" && !card && reviewed === 0 && (
        <EmptyState icon={Inbox} title="Nothing due right now">
          New cards show up here straight away.{" "}
          <Link to="/decks" className={textLinkClass}>
            Add some
          </Link>{" "}
          or{" "}
          <Link to="/practice" className={textLinkClass}>
            practice
          </Link>{" "}
          instead.
        </EmptyState>
      )}

      {status === "success" && card && (
        <>
          <Flashcard
            key={card.id}
            card={card}
            revealed={revealed}
            voice={voice}
            onReveal={() => setRevealed(true)}
          />

          <div className="mt-6">
            {revealed ? (
              <GradeButtons onGrade={grade} disabled={submitting} />
            ) : (
              <Button size="lg" className="w-full" onClick={() => setRevealed(true)}>
                Show answer
                <kbd className="hidden rounded border border-current/30 px-1.5 font-sans text-[10px] opacity-70 sm:inline">
                  Space
                </kbd>
              </Button>
            )}
          </div>

          <InlineError className="mt-3">{error}</InlineError>
        </>
      )}
    </Page>
  );
}
