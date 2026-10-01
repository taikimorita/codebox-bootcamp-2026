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
  listTodos: () => request("/api/todos"),
  createTodo: (title) =>
    request("/api/todos", { method: "POST", body: { title } }),
  updateTodo: (id, changes) =>
    request(`/api/todos/${id}`, { method: "PATCH", body: changes }),
  deleteTodo: (id) => request(`/api/todos/${id}`, { method: "DELETE" }),
};
