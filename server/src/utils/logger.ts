import winston from "winston";
import path from "path";
import fs from "fs";

// Log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Colors for each level
const colors = {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "blue",
};

winston.addColors(colors);

// Format for output in the console
const consoleFormat = winston.format.combine(
    winston.format.timestamp({format: "YYYY-MM-DD HH:mm:ss:ms"}),
    winston.format.colorize({all: true}),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
);

// Format for output in file (JSON)
const fileFormat = winston.format.combine(
    winston.format.timestamp({format: "YYYY-MM-DD HH:mm:ss:ms"}),
    winston.format.json(),
);

// Log level based on environment
const level = () => {
    const env = process.env.NODE_ENV || "development";

    return env === "development" ? "debug" : "info";
};

// Log directory and files
const logDir = "logs";
const errorLog = path.join(logDir, "error.log");
const combinedLog = path.join(logDir, "combined.log");

// Create directory if not exist
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, {recursive: true});
}

// Create instance for logger
const logger = winston.createLogger({
    level: level(),
    levels,
    format: fileFormat,
    transports: [
        // Write all "error" level log to file named "error.log"
        new winston.transports.File({filename: errorLog, level: "error"}),

        // Write all logs to a combined file
        new winston.transports.File({filename: combinedLog}),
    ],
});

// Print the log to the console only in development
// Never print log to the console if its on production
if (process.env.NODE_ENV !== "production") {
    logger.add(
        new winston.transports.Console({
            format: consoleFormat,
        }),
    );
}

// Create stream object for middleware
// Morgan is used for middleware handle
export const stream = {
    write: (message: string) => {
        logger.http(message.trim());
    },
};

export default logger;
