import { createRequire } from "node:module";
import { defineConfig } from "drizzle-kit";

const require = createRequire(import.meta.url);
const databaseUrl =
  (process.env.REPL_ID && process.env.DATABASE_URL) ||
  (require("./ecosystem.config.cjs") as {
    apps: { env: { DATABASE_URL: string } }[];
  }).apps[0].env.DATABASE_URL;

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
