import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage.jsx";
import TodosPage from "./pages/TodosPage.jsx";
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

  return <TodosPage user={user} onLogout={logout} />;
}
