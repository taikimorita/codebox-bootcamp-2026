# Kioku

Kioku (記憶, "memory") is a flashcard app for learning languages. It supports Japanese, Korean, Mandarin Chinese, Russian, German, Swedish and Turkish.

## Features

- **Flashcards with spaced repetition:** each review is scheduled using SM-2, graded Again / Hard / Good / Easy.
- **Practice:** multiple-choice and typed-answer questions, checked on the server. Turkish İ/ı and kana readings are handled correctly.
- **Import:** load CSV/TSV files or Anki `.apkg` decks (text only).
- **Study todos:** tag tasks with a language.
- **Dashboard:** due cards, reviews today and a streak.
- **Light and dark mode**, text-to-speech, and the correct CJK fonts for each language.

## Tech

- **Backend:** Express and PostgreSQL (Supabase).
- **Frontend:** React, Vite and Tailwind CSS.

## Setup

You'll need Node.js 22 or newer and a Supabase (or any Postgres) database.

### 1. Database

Create the tables in the Supabase SQL Editor. The SQL is in `PLAN.md`.

### 2. Backend

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

### 3. Frontend

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
