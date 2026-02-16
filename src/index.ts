import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { Server } from "socket.io";
import http from "http";

// Load models
import "./models/User";
import "./models/Book";

// Load routes
import authRoutes from "./routes/auth";
import bookRoutes from "./routes/book";
import communityRoutes from "./routes/community";
import postRoutes from "./routes/post";
import chatRoutes from "./routes/chat";
import leaderboardRoutes from "./routes/leaderboard";

dotenv.config();

const app = express();

/* ==============================
   ✅ CORS CONFIG (FINAL FIX)
============================== */

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://bookshare-khaki.vercel.app" // 🔥 YOUR FRONTEND URL
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow Postman/mobile

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false); // ❌ do NOT throw error
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Explicit preflight handler
app.options("*", cors());

/* ==============================
   ✅ MIDDLEWARES
============================== */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

/* ==============================
   ✅ DATABASE CONNECTION
============================== */

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("❌ MONGO_URI is not defined in environment variables");
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

/* ==============================
   ✅ ROUTES
============================== */

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

// Root test endpoint
app.get("/", (req, res) => {
  res.json({ message: "📚 BookShare API is running..." });
});

/* ==============================
   ✅ SOCKET.IO SETUP
============================== */

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://bookshare-khaki.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`🔵 User joined chat ${chatId}`);
  });

  socket.on("sendMessage", (data) => {
    io.to(data.chatId).emit("newMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

/* ==============================
   ✅ SERVER START
============================== */

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
