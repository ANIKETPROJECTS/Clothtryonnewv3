const fs = require("node:fs");
const path = require("node:path");

// Node.js 20.12+ can load a private .env file without another dependency.
const envFile = path.join(__dirname, ".env");
if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required. Copy .env.example to .env and set your VPS PostgreSQL connection.",
  );
}

module.exports = {
  apps: [
    {
      name: "v-tryon",
      cwd: __dirname,
      script: "dist/index.cjs",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        PORT: "3021",
        HOST: "127.0.0.1",
        DATABASE_URL: databaseUrl,
      },
    },
  ],
};