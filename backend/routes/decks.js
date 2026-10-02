import { Router } from "express";
import * as decks from "../services/deckService.js";
import * as cards from "../services/cardService.js";
import * as imports from "../services/importService.js";
import { singleFile } from "../middleware/upload.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth); // every route below needs a valid token

const handle = (fn) => (req, res, next) => fn(req, res).catch(next);

router.get(
  "/",
  handle(async (req, res) => {
    res.json(await decks.list(req.userId));
  }),
);

router.post(
  "/",
  handle(async (req, res) => {
    res.status(201).json(await decks.create(req.userId, req.body ?? {}));
  }),
);

router.get(
  "/:id",
  handle(async (req, res) => {
    res.json(await decks.getOne(req.userId, req.params.id));
  }),
);

router.patch(
  "/:id",
  handle(async (req, res) => {
    res.json(await decks.update(req.userId, req.params.id, req.body ?? {}));
  }),
);

router.delete(
  "/:id",
  handle(async (req, res) => {
    await decks.remove(req.userId, req.params.id);
    res.status(204).end();
  }),
);

router.get(
  "/:id/cards",
  handle(async (req, res) => {
    res.json(await cards.listForDeck(req.userId, req.params.id));
  }),
);

router.post(
  "/:id/cards",
  handle(async (req, res) => {
    res
      .status(201)
      .json(await cards.create(req.userId, req.params.id, req.body ?? {}));
  }),
);

// Both imports take multipart/form-data with a "file" field.
// ?preview=true returns what would be imported without saving anything.
router.post(
  "/import/anki",
  singleFile("file"),
  handle(async (req, res) => {
    const preview = req.query.preview === "true";
    const result = await imports.importAnki(req.userId, req.file, {
      name: req.body?.name,
      language_code: req.body?.language_code,
      preview,
    });
    res.status(preview ? 200 : 201).json(result);
  }),
);

router.post(
  "/:id/import/csv",
  singleFile("file"),
  handle(async (req, res) => {
    res.json(
      await imports.importCsv(req.userId, req.params.id, req.file, {
        preview: req.query.preview === "true",
      }),
    );
  }),
);

export default router;
