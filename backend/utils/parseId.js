import { HttpError } from "./HttpError.js";

// Route params arrive as strings. Anything that isn't a positive Postgres integer is a bad request.
export function parseId(id, what = "id") {
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1 || n > 2147483647)
    throw new HttpError(400, `Invalid ${what}`);
  return n;
}
