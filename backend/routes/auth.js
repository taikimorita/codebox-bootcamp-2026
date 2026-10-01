import { Router } from "express";
import * as users from "../services/userService.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const handle = (fn) => (req, res, next) => fn(req, res).catch(next);

router.post(
  "/register",
  handle(async (req, res) => {
    const { email, password } = req.body ?? {};
    res.status(201).json(await users.register(email, password));
  }),
);

router.post(
  "/login",
  handle(async (req, res) => {
    const { email, password } = req.body ?? {};
    res.json(await users.login(email, password));
  }),
);

router.get(
  "/me",
  requireAuth,
  handle(async (req, res) => {
    const user = await users.getById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  }),
);

export default router;
