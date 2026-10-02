import multer from "multer";
import { HttpError } from "../utils/HttpError.js";

export const MAX_UPLOAD_MB = 20;

// Memory storage: the upload is only ever a Buffer in req.file, never written to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024, files: 1, fields: 10 },
});

// Accepts one file in the given form field, and turns multer's errors into our { error } responses
export function singleFile(field) {
  const middleware = upload.single(field);
  return (req, res, next) =>
    middleware(req, res, (err) => {
      if (!err) return next();
      if (err.code === "LIMIT_FILE_SIZE")
        return next(
          new HttpError(413, `File is too large (max ${MAX_UPLOAD_MB} MB)`),
        );
      if (err instanceof multer.MulterError)
        return next(new HttpError(400, err.message));
      next(err);
    });
}
