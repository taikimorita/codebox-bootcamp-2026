import { Router } from "express";
import * as dashboard from "../services/dashboardService.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth); // every route below needs a valid token

const handle = (fn) => (req, res, next) => fn(req, res).catch(next);

// ?tz=Europe/Berlin decides where "today" starts
router.get(
  "/",
  handle(async (req, res) => {
    res.json(await dashboard.summary(req.userId, { tz: req.query.tz }));
  }),
);

export default router;
