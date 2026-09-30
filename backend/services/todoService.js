export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

let todos = [
  { id: 1, title: "Buy milk", completed: false },
  { id: 2, title: "Walk the dog", completed: true },
];
let nextId = 3;

function findOrThrow(id) {
  const todo = todos.find((t) => t.id === Number(id));
  if (!todo) throw new HttpError(404, "Todo not found");
  return todo;
}

function validateTitle(title) {
  if (typeof title !== "string" || !title.trim()) {
    throw new HttpError(400, "Title is required");
  }
  return title.trim();
}

export async function list() {
  return todos;
}

export async function getOne(id) {
  return findOrThrow(id);
}

export async function create({ title }) {
  const todo = { id: nextId++, title: validateTitle(title), completed: false };
  todos.push(todo);
  return todo;
}

export async function update(id, body) {
  const todo = findOrThrow(id);
  if (body.title !== undefined) todo.title = validateTitle(body.title);
  if (body.completed !== undefined) {
    if (typeof body.completed !== "boolean")
      throw new HttpError(400, "completed must be true or false");
    todo.completed = body.completed;
  }
  return todo;
}

export async function remove(id) {
  findOrThrow(id);
  todos = todos.filter((t) => t.id !== Number(id));
}
