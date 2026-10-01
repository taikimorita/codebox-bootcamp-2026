import { Router } from "express";
import * as todos from "../services/todoService.js";

const router = Router();

const handle = (fn) => (req, res, next) => fn(req, res).catch(next);

router.get(
  "/",
  handle(async (req, res) => {
    res.json(await todos.list());
  }),
);

router.get(
  "/:id",
  handle(async (req, res) => {
    res.json(await todos.getOne(req.params.id));
  }),
);

router.post(
  "/",
  handle(async (req, res) => {
    res.status(201).json(await todos.create(req.body ?? {}));
  }),
);

router.patch(
  "/:id",
  handle(async (req, res) => {
    res.json(await todos.update(req.params.id, req.body ?? {}));
  }),
);

router.delete(
  "/:id",
  handle(async (req, res) => {
    await todos.remove(req.params.id);
    res.status(204).end();
  }),
);

export default router;
