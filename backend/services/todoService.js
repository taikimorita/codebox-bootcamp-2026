import { query } from "../db/database.js";
import { HttpError } from "../utils/HttpError.js";
import { validateCode } from "./languageService.js";

function validateTitle(title) {
  if (typeof title !== "string" || !title.trim()) {
    throw new HttpError(400, "Title is required");
  }
  return title.trim();
}

function parseId(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1)
    throw new HttpError(400, "Invalid todo id");
  return n;
}

export async function list(userId, language) {
  if (language === undefined) {
    const { rows } = await query(
      "select * from todos where user_id = $1 order by created_at desc",
      [userId],
    );
    return rows;
  }
  const { rows } = await query(
    "select * from todos where user_id = $1 and language_code = $2 order by created_at desc",
    [userId, await validateCode(language)],
  );
  return rows;
}

export async function getOne(userId, id) {
  const { rows } = await query(
    "select * from todos where id = $1 and user_id = $2",
    [parseId(id), userId],
  );
  if (!rows[0]) throw new HttpError(404, "Todo not found");
  return rows[0];
}

export async function create(userId, { title, language_code }) {
  const { rows } = await query(
    "insert into todos (user_id, title, language_code) values ($1, $2, $3) returning *",
    [userId, validateTitle(title), await validateCode(language_code)],
  );
  return rows[0];
}

export async function update(userId, id, body) {
  const todo = await getOne(userId, id);
  const title =
    body.title !== undefined ? validateTitle(body.title) : todo.title;
  let completed = todo.completed;
  if (body.completed !== undefined) {
    if (typeof body.completed !== "boolean")
      throw new HttpError(400, "completed must be true or false");
    completed = body.completed;
  }
  const languageCode =
    body.language_code !== undefined
      ? await validateCode(body.language_code)
      : todo.language_code;
  const { rows } = await query(
    "update todos set title = $1, completed = $2, language_code = $3 where id = $4 and user_id = $5 returning *",
    [title, completed, languageCode, todo.id, userId],
  );
  return rows[0];
}

export async function remove(userId, id) {
  const { rowCount } = await query(
    "delete from todos where id = $1 and user_id = $2",
    [parseId(id), userId],
  );
  if (rowCount === 0) throw new HttpError(404, "Todo not found");
}
