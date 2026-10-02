import { Router } from "express";
import * as decks from "../services/deckService.js";
import * as cards from "../services/cardService.js";
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

export default router;
