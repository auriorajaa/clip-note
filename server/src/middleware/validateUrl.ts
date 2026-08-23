import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors.js";
import { StatusCodes } from "http-status-codes";
import validator from "validator";

export const validateYoutubeUrl = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { url } = req.body;

  // If url is not provided
  if (!url) {
    return next(
      new AppError(StatusCodes.BAD_REQUEST, "URL is required to proceed"),
    );
  }

  // If url is invalid
  if (!validator.isURL(url)) {
    return next(new AppError(StatusCodes.BAD_REQUEST, "Invalid URL"));
  }

  // Checking if the url provided is a youtube url
  const youtubeUrlRegex =
    /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}(\S*)?$/;
  if (!youtubeUrlRegex.test(url)) {
    return next(new AppError(StatusCodes.BAD_REQUEST, "Invalid Youtube URL"));
  }

  next();
};
