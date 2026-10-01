import { useEffect, useState } from "react";
import { api } from "./api.js";

export default function App() {
  const [status, setStatus] = useState("Checking…");

  useEffect(() => {
    api
      .health()
      .then((data) => setStatus(`Backend says: db ${data.db}`))
      .catch((err) => setStatus(`Error: ${err.message}`));
  }, []);

  return (
    <main className="p-10">
      <h1 className="text-2xl font-semibold text-emerald-400">CodeBox Todos</h1>
      <p className="mt-2 text-zinc-400">{status}</p>
    </main>
  );
}
