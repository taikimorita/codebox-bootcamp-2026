import { Router } from "express";
import * as study from "../services/studyService.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth); // every route below needs a valid token

const handle = (fn) => (req, res, next) => fn(req, res).catch(next);

router.get(
  "/queue",
  handle(async (req, res) => {
    res.json(
      await study.queue(req.userId, {
        language: req.query.language,
        limit: req.query.limit,
      }),
    );
  }),
);

export default router;
