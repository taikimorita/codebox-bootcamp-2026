import "dotenv/config";
import express from "express";
import authRoutes from "./routes/auth.js";
import todoRoutes from "./routes/todos.js";
import languageRoutes from "./routes/languages.js";
import meRoutes from "./routes/me.js";
import deckRoutes from "./routes/decks.js";
import cardRoutes from "./routes/cards.js";
import studyRoutes from "./routes/study.js";
import practiceRoutes from "./routes/practice.js";
import { pool } from "./db/database.js";
import cors from "cors";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing. Add it to .env.");
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/languages", languageRoutes);
app.use("/api/me", meRoutes);
app.use("/api/decks", deckRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/study", studyRoutes);
app.use("/api/practice", practiceRoutes);

app.get("/", (req, res) => {
  res.send("Hello from Kioku!");
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("select 1");
    res.json({ ok: true, db: "connected" });
  } catch {
    res.status(500).json({ ok: false, db: "unreachable" });
  }
});

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed")
    return res.status(400).json({ error: "Invalid JSON body" });
  if (err.status) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
