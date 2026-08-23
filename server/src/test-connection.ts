import { Client } from "pg";

const client = new Client({
  host: "127.0.0.1",
  port: 5432,
  user: "postgres",
  password: "postgres",
  database: "clip-note-db",
  connectionTimeoutMillis: 5000,
});

client
  .connect()
  .then(() => {
    console.log("Connected!");
    return client.end();
  })
  .catch((err) => {
    console.error("Failed:", err);
  });
