import { Router } from "express";
import * as todos from "../services/todoService.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth); // every route below needs a valid token

const handle = (fn) => (req, res, next) => fn(req, res).catch(next);

router.get(
  "/",
  handle(async (req, res) => {
    res.json(await todos.list(req.userId));
  }),
);

router.get(
  "/:id",
  handle(async (req, res) => {
    res.json(await todos.getOne(req.userId, req.params.id));
  }),
);

router.post(
  "/",
  handle(async (req, res) => {
    res.status(201).json(await todos.create(req.userId, req.body ?? {}));
  }),
);

router.patch(
  "/:id",
  handle(async (req, res) => {
    res.json(await todos.update(req.userId, req.params.id, req.body ?? {}));
  }),
);

router.delete(
  "/:id",
  handle(async (req, res) => {
    await todos.remove(req.userId, req.params.id);
    res.status(204).end();
  }),
);

export default router;
