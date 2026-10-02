import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Button from "../components/Button.jsx";
import MultipleChoiceQuestion from "../components/MultipleChoiceQuestion.jsx";
import PracticeResults from "../components/PracticeResults.jsx";
import PracticeSetup from "../components/PracticeSetup.jsx";
import TypingQuestion from "../components/TypingQuestion.jsx";
import SpeakButton from "../components/SpeakButton.jsx";
import { api } from "../api.js";
import { localeFor, useVoice } from "../speech.js";

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

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <header className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Practice</h1>
        {phase === "question" && (
          <span className="text-sm text-zinc-500">
            {index + 1} / {practice.questions.length}
          </span>
        )}
      </header>

      {phase === "setup" && status === "loading" && (
        <p className="py-16 text-center text-sm text-zinc-500">Loading…</p>
      )}

      {phase === "setup" && status === "error" && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm">
          <p className="text-red-300">{error}</p>
          <Button variant="ghost" className="mt-2" onClick={retry}>
            Try again
          </Button>
        </div>
      )}

      {phase === "setup" && status === "success" && decks.length === 0 && (
        <p className="py-16 text-center text-sm text-zinc-500">
          You don't have any decks yet.{" "}
          <Link to="/decks" className="text-emerald-400">
            Create one first.
          </Link>
        </p>
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
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-400">
              {error}
            </p>
          )}
        </>
      )}

      {phase === "question" && question && (
        <>
          <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            <p className="mb-4 text-xs text-zinc-500">{practice.deck.name}</p>
            <div className="flex items-start justify-center gap-2">
              <p
                lang={lang}
                className="text-4xl font-medium whitespace-pre-wrap"
              >
                {question.front}
              </p>
              <SpeakButton
                text={question.front}
                voice={voice}
                className="mt-1 text-lg"
              />
            </div>
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

          {error && (
            <p role="alert" className="mt-3 text-sm text-red-400">
              {error}
            </p>
          )}

          {result && (
            <div className="mt-4 flex items-center gap-3">
              <p
                className={`flex-1 text-sm ${result.correct ? "text-emerald-300" : "text-red-300"}`}
              >
                {result.correct ? "Correct!" : "Not quite."}
                {(!result.correct || practice.type === "typing") && (
                  <>
                    {" "}
                    <span className="text-zinc-300">{result.expected}</span>
                    {result.reading && (
                      <span lang={lang} className="ml-2 text-zinc-400">
                        {result.reading}
                      </span>
                    )}
                  </>
                )}
              </p>
              <Button autoFocus onClick={next}>
                {index + 1 < practice.questions.length ? "Next" : "See results"}
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
    </main>
  );
}
