import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage.jsx";
import Button from "./components/Button.jsx";
import { api, clearToken, getToken } from "./api.js";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(getToken()));

  // If a token was saved last time, ask the backend who it belongs to
  useEffect(() => {
    if (!getToken()) return;
    api
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => clearToken()) // expired or invalid, so throw it away
      .finally(() => setChecking(false));
  }, []);

  function logout() {
    clearToken();
    setUser(null);
  }

  if (checking)
    return <p className="p-10 text-center text-sm text-zinc-500">Loading…</p>;
  if (!user) return <LoginPage onAuthed={setUser} />;

  // Temporary: replaced by the todo page in Part 3
  return (
    <main className="p-10">
      <p>
        Logged in as <span className="text-emerald-400">{user.email}</span>
      </p>
      <Button variant="ghost" className="mt-4" onClick={logout}>
        Log out
      </Button>
    </main>
  );
}
