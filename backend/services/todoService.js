import { query } from "../db/database.js";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

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

export async function list() {
  const { rows } = await query("select * from todos order by created_at desc");
  return rows;
}

export async function getOne(id) {
  const { rows } = await query("select * from todos where id = $1", [
    parseId(id),
  ]);
  if (!rows[0]) throw new HttpError(404, "Todo not found");
  return rows[0];
}

export async function create({ title }) {
  const { rows } = await query(
    "insert into todos (title) values ($1) returning *",
    [validateTitle(title)],
  );
  return rows[0];
}

export async function update(id, body) {
  const todo = await getOne(id);
  const title =
    body.title !== undefined ? validateTitle(body.title) : todo.title;
  let completed = todo.completed;
  if (body.completed !== undefined) {
    if (typeof body.completed !== "boolean")
      throw new HttpError(400, "completed must be true or false");
    completed = body.completed;
  }
  const { rows } = await query(
    "update todos set title = $1, completed = $2 where id = $3 returning *",
    [title, completed, todo.id],
  );
  return rows[0];
}

export async function remove(id) {
  const { rowCount } = await query("delete from todos where id = $1", [
    parseId(id),
  ]);
  if (rowCount === 0) throw new HttpError(404, "Todo not found");
}
