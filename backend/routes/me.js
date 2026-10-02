import { Router } from "express";
import * as languages from "../services/languageService.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth); // every route below needs a valid token

const handle = (fn) => (req, res, next) => fn(req, res).catch(next);

router.get(
  "/languages",
  handle(async (req, res) => {
    res.json(await languages.listForUser(req.userId));
  }),
);

router.put(
  "/languages",
  handle(async (req, res) => {
    res.json(await languages.setForUser(req.userId, req.body?.codes));
  }),
);

export default router;
