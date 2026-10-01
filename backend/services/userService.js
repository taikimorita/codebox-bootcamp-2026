import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../db/database.js";
import { HttpError } from "../utils/HttpError.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCredentials(email, password) {
  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    throw new HttpError(400, "A valid email is required");
  }
  if (typeof password !== "string" || password.length < 8) {
    throw new HttpError(400, "Password must be at least 8 characters");
  }
}

function signToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "1h",
  });
}

export async function register(email, password) {
  validateCredentials(email, password);
  const hash = await bcrypt.hash(password, 10);
  try {
    const { rows } = await query(
      "insert into users (email, password_hash) values ($1, $2) returning id, email, created_at",
      [email.trim().toLowerCase(), hash],
    );
    return { user: rows[0], token: signToken(rows[0]) };
  } catch (err) {
    // 23505 = Postgres "unique violation" (email already taken)
    if (err.code === "23505")
      throw new HttpError(409, "An account with that email already exists");
    throw err;
  }
}

export async function login(email, password) {
  validateCredentials(email, password);
  const { rows } = await query("select * from users where email = $1", [
    email.trim().toLowerCase(),
  ]);
  const user = rows[0];
  // Same message for "no such user" and "wrong password" so attackers can't tell which emails exist
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new HttpError(401, "Invalid email or password");
  }
  const safeUser = {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
  };
  return { user: safeUser, token: signToken(safeUser) };
}

export async function getById(id) {
  const { rows } = await query(
    "select id, email, created_at from users where id = $1",
    [id],
  );
  return rows[0] ?? null;
}
