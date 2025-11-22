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

// Enhanced CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL, 
      "http://localhost:5173", 
      "https://attendance-tracker-frontend-three.vercel.app", // Hardcoded production frontend
      "https://attendance-tracker-frontend-8ce2219bab3d8f0bdc296e2d81be95cc8d50c90c.vercel.app" // Your specific deployment URL if needed
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || !process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin); // Log blocked origins for debugging
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Essential for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Handle preflight requests explicitly
app.options('*', cors());

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