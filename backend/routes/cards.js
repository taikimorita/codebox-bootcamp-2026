import { Router } from "express";
import * as cards from "../services/cardService.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth); // every route below needs a valid token

const handle = (fn) => (req, res, next) => fn(req, res).catch(next);

router.patch(
  "/:id",
  handle(async (req, res) => {
    res.json(await cards.update(req.userId, req.params.id, req.body ?? {}));
  }),
);

router.delete(
  "/:id",
  handle(async (req, res) => {
    await cards.remove(req.userId, req.params.id);
    res.status(204).end();
  }),
);

export default router;
