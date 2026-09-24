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
      },
    },
  ],
};