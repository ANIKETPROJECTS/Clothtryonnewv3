// Replace this with the PostgreSQL connection string for the VPS.
// URL-encode special characters in the username or password.
const databaseUrl =
  "postgresql://REPLACE_WITH_USER:REPLACE_WITH_PASSWORD@127.0.0.1:5432/REPLACE_WITH_DATABASE";

if (databaseUrl.includes("REPLACE_WITH_")) {
  throw new Error(
    "Set the VPS PostgreSQL connection string in ecosystem.config.cjs before starting the app.",
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