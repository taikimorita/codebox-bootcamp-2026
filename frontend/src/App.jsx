import { useCallback, useEffect, useState } from "react";
import { Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import Button from "./components/Button.jsx";
import Header from "./components/Header.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import DeckPage from "./pages/DeckPage.jsx";
import DecksPage from "./pages/DecksPage.jsx";
import ImportPage from "./pages/ImportPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import PracticePage from "./pages/PracticePage.jsx";
import StudyPage from "./pages/StudyPage.jsx";
import TodosPage from "./pages/TodosPage.jsx";
import { api, clearToken, getToken } from "./api.js";

const LANGUAGE_KEY = "codebox_language";

function rememberLanguage(code) {
  if (code) localStorage.setItem(LANGUAGE_KEY, code);
}

// Keep the saved language if the user still studies it, otherwise use their first one
function pickLanguage(languages) {
  const saved = localStorage.getItem(LANGUAGE_KEY);
  const code = languages.some((l) => l.code === saved)
    ? saved
    : (languages[0]?.code ?? null);
  rememberLanguage(code);
  return code;
}

export default function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [myLanguages, setMyLanguages] = useState([]);
  const [current, setCurrent] = useState(null);
  const [status, setStatus] = useState(getToken() ? "loading" : "success"); // loading | error | success
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0); // bump to load the session again

  // Ask the backend who the saved token belongs to, and which languages they study
  useEffect(() => {
    if (!getToken()) return;
    let stale = false; // StrictMode runs effects twice; only the latest answer counts
    (async () => {
      try {
        const { user } = await api.me();
        const languages = await api.getMyLanguages();
        if (stale) return;
        setMyLanguages(languages);
        setCurrent(pickLanguage(languages));
        setUser(user);
        setStatus("success");
      } catch (err) {
        if (stale) return;
        if (err.status === 401 || err.status === 404) {
          clearToken(); // expired or invalid, so throw it away
          setStatus("success");
        } else {
          setError(err.message);
          setStatus("error");
        }
      }
    })();
    return () => {
      stale = true;
    };
  }, [attempt]);

  function reloadSession() {
    setStatus("loading");
    setAttempt((n) => n + 1);
  }

  function changeLanguage(code) {
    setCurrent(code);
    rememberLanguage(code);
  }

  // Stable across renders, so pages can list it as an effect dependency
  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setMyLanguages([]);
  }, []);

  function handleLanguagesSaved(languages) {
    setMyLanguages(languages);
    setCurrent(pickLanguage(languages));
    navigate("/");
  }

  if (status === "loading")
    return <p className="p-10 text-center text-sm text-zinc-500">Loading…</p>;

  if (status === "error")
    return (
      <main className="mx-auto max-w-sm px-4 py-20 text-center text-sm">
        <p className="text-red-300">{error}</p>
        <Button variant="ghost" className="mt-2" onClick={reloadSession}>
          Try again
        </Button>
      </main>
    );

  const needsOnboarding = myLanguages.length === 0;

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/" replace />
          ) : (
            <LoginPage onAuthed={reloadSession} />
          )
        }
      />

      {/* Everything below needs a logged-in user */}
      <Route
        element={
          user ? (
            <>
              <Header
                user={user}
                languages={myLanguages}
                current={current}
                onChangeLanguage={changeLanguage}
                onLogout={logout}
              />
              <Outlet />
            </>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route
          path="/onboarding"
          element={
            <OnboardingPage
              selected={myLanguages}
              onSaved={handleLanguagesSaved}
              onLogout={logout}
            />
          }
        />

        {/* A user with no languages yet has to pick some first */}
        <Route
          element={
            needsOnboarding ? <Navigate to="/onboarding" replace /> : <Outlet />
          }
        >
          <Route
            path="/"
            element={<DashboardPage languages={myLanguages} current={current} />}
          />
          <Route
            path="/decks"
            element={
              <DecksPage
                languages={myLanguages}
                current={current}
                onLogout={logout}
              />
            }
          />
          <Route
            path="/import"
            element={
              <ImportPage
                languages={myLanguages}
                current={current}
                onLogout={logout}
              />
            }
          />
          <Route
            path="/decks/:id"
            element={<DeckPage languages={myLanguages} onLogout={logout} />}
          />
          <Route
            path="/study"
            element={
              <StudyPage
                languages={myLanguages}
                current={current}
                onLogout={logout}
              />
            }
          />
          <Route
            path="/practice"
            element={<PracticePage current={current} onLogout={logout} />}
          />
          <Route
            path="/todos"
            element={
              <TodosPage
                languages={myLanguages}
                current={current}
                onLogout={logout}
              />
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
