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

// Middlewares
const allowedOrigins = [
  "http://localhost:5173", // Vite local
  "http://localhost:3000", // CRA local (if used)
  "https://bookshare-backend-p1eo.onrender.com/" // 🔥 replace with your real Vercel URL
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow Postman / mobile apps

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads (correct path)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("❌ MONGO_URI is not defined in environment variables");
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/chat", chatRoutes);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/leaderboard", leaderboardRoutes);


// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "📚 BookShare API is running..." });
});

// --- FIX STARTS HERE ---

// Create HTTP server for socket + express
const server = http.createServer(app);

// Create socket instance
const io = new Server(server, {
  cors: { origin: "*" }
});

// Socket logic
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

// --- ONLY THIS LISTENS ---
server.listen(PORT, () => {
  console.clear();
  console.log(`🚀 Server + Socket running at http://localhost:${PORT}`);
});
