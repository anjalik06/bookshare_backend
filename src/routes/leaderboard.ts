import { Router } from "express";
import { User } from "../models/User";

const router = Router();

// 📌 LEADERBOARD API — Returns users sorted by highest points
router.get("/", async (req, res) => {
  try {
    const users = await User.find()
      .sort({ points: -1 })               // ⭐ Highest points first
      .select("name points booksShared profilePic"); // Send only needed fields

    res.json(users);
  } catch (err) {
    console.error("Leaderboard API Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
