import { DataSource } from "typeorm";
import { User } from "../entities/user.entity.js";
import { Video } from "../entities/video.entity.js";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "127.0.0.1",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_DATABASE || "clip-note-db",
  synchronize: process.env.NODE_ENV === "development",
  connectTimeoutMS: 5000,
  logging: ["query", "error"],
  entities: [User, Video],
  migrations: [],
  subscribers: [],
});
