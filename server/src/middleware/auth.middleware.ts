import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors.js";
import { StatusCodes } from "http-status-codes";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    // If theres no auth header (means: unauthorized)
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(StatusCodes.UNAUTHORIZED, "Unauthorized");
    }

    const token = authHeader.split(" ")[1];
  } catch (error) {}
};
