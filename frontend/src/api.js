const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const TOKEN_KEY = "codebox_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Is the backend running?");
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new ApiError(
      res.status,
      data.error || `Request failed (${res.status})`,
    );
  return data;
}

export const api = {
  health: () => request("/api/health"),
  register: (email, password) =>
    request("/api/auth/register", {
      method: "POST",
      body: { email, password },
    }),
  login: (email, password) =>
    request("/api/auth/login", { method: "POST", body: { email, password } }),
  me: () => request("/api/auth/me"),
  listLanguages: () => request("/api/languages"),
  getMyLanguages: () => request("/api/me/languages"),
  setMyLanguages: (codes) =>
    request("/api/me/languages", { method: "PUT", body: { codes } }),
  listTodos: (language) =>
    request(
      language
        ? `/api/todos?language=${encodeURIComponent(language)}`
        : "/api/todos",
    ),
  createTodo: (title, language_code) =>
    request("/api/todos", { method: "POST", body: { title, language_code } }),
  updateTodo: (id, changes) =>
    request(`/api/todos/${id}`, { method: "PATCH", body: changes }),
  deleteTodo: (id) => request(`/api/todos/${id}`, { method: "DELETE" }),
  listDecks: () => request("/api/decks"),
  getDeck: (id) => request(`/api/decks/${id}`),
  createDeck: (name, language_code) =>
    request("/api/decks", { method: "POST", body: { name, language_code } }),
  updateDeck: (id, changes) =>
    request(`/api/decks/${id}`, { method: "PATCH", body: changes }),
  deleteDeck: (id) => request(`/api/decks/${id}`, { method: "DELETE" }),
  listCards: (deckId) => request(`/api/decks/${deckId}/cards`),
  createCard: (deckId, card) =>
    request(`/api/decks/${deckId}/cards`, { method: "POST", body: card }),
  updateCard: (id, changes) =>
    request(`/api/cards/${id}`, { method: "PATCH", body: changes }),
  deleteCard: (id) => request(`/api/cards/${id}`, { method: "DELETE" }),
  getStudyQueue: (language) =>
    request(`/api/study/queue?language=${encodeURIComponent(language)}`),
  reviewCard: (id, grade, mode) =>
    request(`/api/cards/${id}/review`, {
      method: "POST",
      body: { grade, mode },
    }),
  getPractice: (deckId, type, count) =>
    request(
      `/api/practice?deck=${encodeURIComponent(deckId)}&type=${encodeURIComponent(type)}&count=${encodeURIComponent(count)}`,
    ),
  answerPractice: (cardId, type, answer) =>
    request("/api/practice/answer", {
      method: "POST",
      body: { card_id: cardId, type, answer },
    }),
};
