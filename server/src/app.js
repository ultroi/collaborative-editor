const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const env = require("./config/env");
const { requireAuth } = require("./middleware/auth");

const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");

const projectRoutes = require("./routes/projectRoutes");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(cookieParser());

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "ok",
    uptime: process.uptime(),
  });
});

app.use("/api/auth", authRoutes);

app.use("/api/projects", requireAuth, projectRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

module.exports = app;
