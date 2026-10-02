# Kioku

Kioku (記憶, "memory") is a flashcard app for learning languages. It supports Japanese, Korean, Mandarin Chinese, Russian, German, Swedish and Turkish.

**Live app:** https://codebox-bootcamp-2026.vercel.app

The backend runs on Render's free tier and sleeps when no one is using it, so the first load can take up to a minute.

## Features

- **Flashcards with spaced repetition:** each review is scheduled using SM-2, graded Again / Hard / Good / Easy.
- **Practice:** multiple-choice and typed-answer questions, checked on the server. Turk handled correctly.
- **Import:** load CSV/TSV files or Anki `.apkg` decks (text only, up to 20 MB and 5,000 cards).
- **Study todos:** tag tasks with a language.
- **Dashboard:** due cards, reviews today and a streak.
- **Light and dark mode**, text-to-speech, and the correct CJK fonts for each language.

## Tech

- **Backend:** Express and PostgreSQL (Supabase).
- **Frontend:** React, Vite and Tailwind CSS.
- **Hosting:** Render (backend) and Vercel (frontend).

## Running locally

You'll need Node.js 22 or newer and a Supabase (or any Postgres) database with the app'

### Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```
PORT=3000
DATABASE_URL=postgresql://...your Supabase connection string...
JWT_SECRET=any-long-random-string
CLIENT_ORIGIN=http://localhost:5173
```

Then start it:

```bash
npm run dev
```

The API runs at http://localhost:3000.

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```
VITE_API_URL=http://localhost:3000
```

Then start it:

```bash
npm run dev
```

Open http://localhost:5173.

## Tests

```bash
cd backend
npm test
```

These cover the scheduling algorithm, answer checking, import parsing, Anki file reading and streak counting.

## Deployment

### Backend (Render)

Create a **Web Service** from this repo with:

- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

Set these environment variables. Render sets `PORT` itself.

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase **pooler** connection string (`…pooler.supabase.com`) |
| `JWT_SECRET` | Long random string. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `CLIENT_ORIGIN` | The Vercel URL only, e.g. `https://codebox-bootcamp-2026.vercel.app`. No path and no trailing slash. |

Check it's working at `https://<your-app>.onrender.com/api/health`.

### Frontend (Vercel)

Import the repo with **Root Directory** set to `frontend`. Vercel detects Vite automatically.

| Variable | Value |
|---|---|
| `VITE_API_URL` | The Render URL, e.g. `https://codebox-bootcamp-2026.onrender.com`. No trailing slash. |

`frontend/vercel.json` sends every route to `index.html`, so refreshing a page works.

### Gotchas

- **Redeploy the frontend after changing `VITE_API_URL`.** Vite builds the value into t
- **CORS errors on login usually mean `CLIENT_ORIGIN` doesn't exactly match the Vercel URL.**
- **Vercel may warn that `VITE_API_URL` is public.** That's expected: the browser needs secrets in `VITE_` variables.
