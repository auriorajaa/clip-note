import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import express, { type Express } from "express";
import logger from "./utils/logger.js";
import { AppDataSource } from "./config/database.js";

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

initialize().catch((error) => {
  logger.error("[SERVER ERROR]: Error starting server", error);
  process.exit(1);
});
