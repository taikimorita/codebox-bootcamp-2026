import { useState } from "react";
import Button from "../components/Button.jsx";
import Logo from "../components/Logo.jsx";
import { InlineError } from "../components/States.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import { api, setToken } from "../api.js";
import { cardClass, inputClass } from "../styles.js";

// A quiet row of the supported languages under the form
const GREETINGS = [
  ["ja", "こんにちは"],
  ["ko", "안녕하세요"],
  ["zh", "你好"],
  ["ru", "Привет"],
  ["de", "Hallo"],
  ["sv", "Hej"],
  ["tr", "Merhaba"],
];

export default function LoginPage({ onAuthed }) {
  const [mode, setMode] = useState("login"); // "login" or "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); // stop the browser from reloading the page
    setError("");
    if (password.length < 8)
      return setError("Password must be at least 8 characters");
    setLoading(true);
    try {
      const { user, token } =
        mode === "login"
          ? await api.login(email, password)
          : await api.register(email, password);
      setToken(token);
      onAuthed(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">
          <h1 className="text-center text-3xl font-semibold tracking-tight">
            {mode === "login" ? "Welcome back" : "Start remembering"}
          </h1>
          <p className="mt-2 mb-8 text-center text-sm text-muted">
            {mode === "login"
              ? "Log in to keep studying."
              : "Flashcards, spaced repetition and practice for seven languages."}
          </p>

          <form
            onSubmit={handleSubmit}
            className={`space-y-4 p-6 shadow-sm ${cardClass}`}
          >
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8+ characters"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                className={inputClass}
              />
            </label>
            <InlineError>{error}</InlineError>
            <Button type="submit" size="lg" disabled={loading} className="w-full">
              {loading ? "One sec…" : mode === "login" ? "Log in" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {mode === "login" ? "New here? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
              className="font-medium text-accent-ink underline-offset-4 hover:underline"
            >
              {mode === "login" ? "Create an account" : "Log in"}
            </button>
          </p>

          <p className="mt-10 flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm text-subtle">
            {GREETINGS.map(([code, word]) => (
              <span key={code} lang={code}>
                {word}
              </span>
            ))}
          </p>
        </div>
      </main>
    </div>
  );
}
