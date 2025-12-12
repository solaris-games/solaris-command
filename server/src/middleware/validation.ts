import { ERROR_CODES } from "@solaris-command/core";
import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

export const validateRequest =
  (schema: z.ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          errorCode: ERROR_CODES.REQUEST_VALIDATION_FAILED,
          details: error.issues.map((e) => ({
            // TODO: Is this `errors` or `issues`?
            path: e.path.join("."),
            message: e.message,
          })),
        });
      }

      return res
        .status(400)
        .json({ errorCode: ERROR_CODES.REQUEST_VALIDATION_FAILED });
    }
  };
