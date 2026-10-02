import { Router } from "express";
import * as practice from "../services/practiceService.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth); // every route below needs a valid token

const handle = (fn) => (req, res, next) => fn(req, res).catch(next);

router.get(
  "/",
  handle(async (req, res) => {
    res.json(
      await practice.getQuestions(req.userId, {
        deck: req.query.deck,
        type: req.query.type,
        count: req.query.count,
      }),
    );
  }),
);

router.post(
  "/answer",
  handle(async (req, res) => {
    res.json(await practice.answer(req.userId, req.body ?? {}));
  }),
);

export default router;
