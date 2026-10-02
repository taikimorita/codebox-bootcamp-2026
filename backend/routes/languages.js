import { Router } from "express";
import * as languages from "../services/languageService.js";

const router = Router(); // public: no login needed to see the language list

const handle = (fn) => (req, res, next) => fn(req, res).catch(next);

router.get(
  "/",
  handle(async (req, res) => {
    res.json(await languages.listAll());
  }),
);

export default router;
