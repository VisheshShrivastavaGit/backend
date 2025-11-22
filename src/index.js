const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const healthRouter = require("./routes/health");
const attendanceRouter = require("./routes/attendance");
const authRouter = require("./routes/auth");

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const prisma = new PrismaClient();
app.locals.prisma = prisma;

// --- ROUTES ---

// 1. Root Route (To fix Vercel 404s)
app.get("/", (req, res) => {
  res.send(`
    <h1>Attendance Backend is Running! 🚀</h1>
    <p>Available routes:</p>
    <ul>
      <li>/health</li>
      <li>/auth/google</li>
      <li>/attendance</li>
    </ul>
  `);
});

// 2. App Routes
app.use("/health", healthRouter);
app.use("/attendance", attendanceRouter);
app.use("/auth", authRouter);

// --- START SERVER ---
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend listening on ${port}`);
});

// --- EXPORT FOR VERCEL ---
module.exports = app;