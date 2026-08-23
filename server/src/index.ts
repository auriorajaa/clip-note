import "./config/env.js";

import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import logger, { stream } from "./utils/logger.js";
import { AppDataSource } from "./config/database.js";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";
import { errorResponse } from "./utils/response.js";
import { handleError } from "./utils/errors.js";

// Initialize server
const app: Express = express();
const port = process.env.PORT || 6000;

const initialize = async () => {
  try {
    // Initialize database first
    await AppDataSource.initialize();
    logger.info("[SERVER]: Database connected");

    // Start backend server
    app.listen(port, () => {
      logger.info(
        `[SERVER]: Server is currently running at http://localhost:${port}`,
      );
      logger.info(`[SERVER]: Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error("[SERVER ERROR]: Error starting server", error);
    process.exit(1);
  }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(
  morgan(process.env.NODE_ENV === "development" ? "dev" : "combined", {
    stream,
  }),
);

// PREFIX for API Versioning
const API_VERSION = "/api/v1";

// Routes for mounting
app.use(API_VERSION, routes);

// Handling page not found (404 Code)
app.use((req: Request, res: Response) => {
  res
    .status(404)
    .json(
      errorResponse(
        `The url ${req.originalUrl} you're looking for is not existed`,
      ),
    );
});

// Handling middleware error
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(error.stack || error.message);
  const errorDetails = handleError(error);

  res
    .status(errorDetails.statusCode)
    .json(errorResponse(errorDetails.message, error));
});

initialize().catch((error) => {
  logger.error("[SERVER ERROR]: Error starting server", error);
  process.exit(1);
});
