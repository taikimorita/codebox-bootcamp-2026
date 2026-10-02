import { useState } from "react";
import Button from "../components/Button.jsx";
import { api, setToken } from "../api.js";

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

  const input =
    "w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none";

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="text-2xl font-semibold">Kioku</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-400">
        {mode === "login"
          ? "Log in to keep studying."
          : "Create an account to get started."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          aria-label="Email"
          autoComplete="email"
          className={input}
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (8+ characters)"
          aria-label="Password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className={input}
        />
        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "One sec…" : mode === "login" ? "Log in" : "Sign up"}
        </Button>
      </form>

      <button
        onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setError("");
        }}
        className="mt-4 text-sm text-zinc-400 hover:text-emerald-400"
      >
        {mode === "login" ? "No account? Sign up" : "Have an account? Log in"}
      </button>
    </main>
  );
}
