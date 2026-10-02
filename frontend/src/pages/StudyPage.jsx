import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";
import Flashcard from "../components/Flashcard.jsx";
import GradeButtons from "../components/GradeButtons.jsx";
import { api } from "../api.js";
import { localeFor, useVoice } from "../speech.js";

export default function StudyPage({ languages, current, onLogout }) {
  const [cards, setCards] = useState([]); // the batch the server sent, first one is showing
  const [totalDue, setTotalDue] = useState(0); // due right now, including ones not in this batch
  const [status, setStatus] = useState("loading"); // loading | error | success
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0); // bump to fetch the queue again
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const card = cards[0];
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
      setReviewed((n) => n + 1);
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

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <header className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">
          Study{" "}
          {language && (
            <span lang={language.code} className="text-zinc-400">
              {language.native_name}
            </span>
          )}
        </h1>
        {status === "success" && card && (
          <span className="text-sm text-zinc-500">{totalDue} due</span>
        )}
      </header>

      {status === "loading" && (
        <p className="py-16 text-center text-sm text-zinc-500">Loading…</p>
      )}

      {status === "error" && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm">
          <p className="text-red-300">{error}</p>
          <Button variant="ghost" className="mt-2" onClick={reload}>
            Try again
          </Button>
        </div>
      )}

      {status === "success" && !card && (
        <div className="py-16 text-center">
          <p className="text-lg">All done 🎉</p>
          <p className="mt-1 text-sm text-zinc-500">
            {reviewed > 0
              ? `You reviewed ${reviewed} ${reviewed === 1 ? "card" : "cards"}. Cards you marked Again come back in about 10 minutes.`
              : "Nothing is due right now. New cards you add show up here straight away."}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="ghost" onClick={reload}>
              Check again
            </Button>
            <Link
              to="/decks"
              className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            >
              Go to decks
            </Link>
          </div>
        </div>
      )}

      {status === "success" && card && (
        <>
          <Flashcard card={card} revealed={revealed} voice={voice} />

          <div className="mt-6">
            {revealed ? (
              <GradeButtons onGrade={grade} disabled={submitting} />
            ) : (
              <Button className="w-full py-3" onClick={() => setRevealed(true)}>
                Show answer <kbd className="ml-1.5 text-xs opacity-60">Space</kbd>
              </Button>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-3 text-sm text-red-400">
              {error}
            </p>
          )}
        </>
      )}
    </main>
  );
}
