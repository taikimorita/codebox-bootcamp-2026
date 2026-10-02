import { ArrowRight, CircleCheck, CircleX, Layers } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Button from "../components/Button.jsx";
import MultipleChoiceQuestion from "../components/MultipleChoiceQuestion.jsx";
import Page from "../components/Page.jsx";
import PracticeResults from "../components/PracticeResults.jsx";
import PracticeSetup from "../components/PracticeSetup.jsx";
import SpeakButton from "../components/SpeakButton.jsx";
import {
  EmptyState,
  ErrorState,
  InlineError,
  Skeleton,
} from "../components/States.jsx";
import TypingQuestion from "../components/TypingQuestion.jsx";
import { api } from "../api.js";
import { localeFor, useVoice } from "../speech.js";
import { cardClass, textLinkClass } from "../styles.js";

export default function PracticePage({ languages, current, onLogout }) {
  const [searchParams] = useSearchParams();
  const [decks, setDecks] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | error | success (the deck list)
  const [attempt, setAttempt] = useState(0); // bump to load the decks again
  const [phase, setPhase] = useState("setup"); // setup | question | results
  const [settings, setSettings] = useState({
    deckId: Number(searchParams.get("deck")) || null, // from the deck page's Practice link
    type: "multiple_choice",
    count: 10,
  });
  const [practice, setPractice] = useState(null); // { deck, type, questions }
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState([]); // one per answered question
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const question = practice?.questions[index];
  const result = results[index] ?? null;
  const voice = useVoice(
    practice ? localeFor(languages, practice.deck.language_code) : null,
  );

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
    setError("");
    setStatus("loading");
    setAttempt((n) => n + 1);
  }

  async function start(chosen) {
    setSettings(chosen);
    setError("");
    setStarting(true);
    try {
      setPractice(await api.getPractice(chosen.deckId, chosen.type, chosen.count));
      setIndex(0);
      setResults([]);
      setPhase("question");
    } catch (err) {
      if (err.status === 401) return onLogout();
      setError(err.message);
      setPhase("setup");
    } finally {
      setStarting(false);
    }
  }

  async function answer(given) {
    if (!question || result || submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await api.answerPractice(question.card_id, practice.type, given);
      setResults((r) => [...r, { front: question.front, given, ...res }]);
    } catch (err) {
      if (err.status === 401) return onLogout();
      setError(err.message); // the question stays, so they can answer again
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    if (index + 1 < practice.questions.length) setIndex(index + 1);
    else setPhase("results");
  }

  // Keys 1-4 pick a multiple choice option. (Enter on the focused Next button moves on.)
  // No dependency array: it re-subscribes after each render so it always sees the current question.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (phase !== "question" || practice?.type !== "multiple_choice") return;
      const option = question?.options[Number(e.key) - 1];
      if (option !== undefined && !result) {
        e.preventDefault();
        answer(option);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const lang = practice?.deck.language_code;
  const total = practice?.questions.length ?? 0;
  // Answered questions count as done, so the bar moves as soon as you answer
  const progress = total ? results.length / total : 0;

  return (
    <Page narrow>
      <header className="mb-6">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Practice</h1>
          {phase === "question" && (
            <span className="text-sm text-muted tabular-nums">
              {index + 1} / {total}
            </span>
          )}
        </div>
        {phase === "question" && (
          <div
            role="progressbar"
            aria-label="Practice progress"
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

      {phase === "setup" && status === "loading" && (
        <Skeleton className="h-96" />
      )}

      {phase === "setup" && status === "error" && (
        <ErrorState message={error} onRetry={retry} />
      )}

      {phase === "setup" && status === "success" && decks.length === 0 && (
        <EmptyState icon={Layers} title="No decks yet">
          <Link to="/decks" className={textLinkClass}>
            Create a deck
          </Link>{" "}
          to start practising.
        </EmptyState>
      )}

      {phase === "setup" && status === "success" && decks.length > 0 && (
        <>
          <PracticeSetup
            decks={decks}
            current={current}
            initial={settings}
            starting={starting}
            onStart={start}
          />
          <InlineError className="mt-3">{error}</InlineError>
        </>
      )}

      {phase === "question" && question && (
        <>
          <div
            className={`mb-6 flex min-h-48 flex-col items-center justify-center p-8 text-center shadow-sm ${cardClass}`}
          >
            <p className="mb-5 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted">
              {practice.deck.name}
            </p>
            <p
              lang={lang}
              className="text-4xl font-medium break-words whitespace-pre-wrap sm:text-5xl"
            >
              {question.front}
            </p>
            <SpeakButton text={question.front} voice={voice} className="mt-3" />
          </div>

          {/* key: a fresh, empty question each time */}
          {practice.type === "multiple_choice" ? (
            <MultipleChoiceQuestion
              key={index}
              question={question}
              result={result}
              disabled={submitting}
              onAnswer={answer}
            />
          ) : (
            <TypingQuestion
              key={index}
              result={result}
              disabled={submitting}
              onAnswer={answer}
            />
          )}

          <InlineError className="mt-3">{error}</InlineError>

          {result && (
            <div
              className={`mt-4 flex animate-fade-in items-center gap-3 rounded-xl border p-4 ${result.correct ? "border-accent/30 bg-accent/5" : "border-danger/30 bg-danger/5"}`}
            >
              {result.correct ? (
                <CircleCheck
                  className="size-6 shrink-0 text-accent-ink"
                  aria-hidden="true"
                />
              ) : (
                <CircleX
                  className="size-6 shrink-0 text-danger-ink"
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0 flex-1 text-sm">
                <p
                  className={`font-semibold ${result.correct ? "text-accent-ink" : "text-danger-ink"}`}
                >
                  {result.correct ? "Correct!" : "Not quite"}
                </p>
                {(!result.correct || practice.type === "typing") && (
                  <p className="whitespace-pre-wrap">
                    {result.expected}
                    {result.reading && (
                      <span lang={lang} className="ml-2 text-muted">
                        {result.reading}
                      </span>
                    )}
                  </p>
                )}
              </div>
              <Button autoFocus onClick={next}>
                {index + 1 < total ? "Next" : "See results"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          )}
        </>
      )}

      {phase === "results" && (
        <PracticeResults
          results={results}
          lang={lang}
          onAgain={() => start(settings)}
          onSetup={() => setPhase("setup")}
        />
      )}
    </Page>
  );
}
