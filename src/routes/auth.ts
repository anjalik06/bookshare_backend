import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/User";
import { protect, AuthRequest } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

/* --------------------------- REGISTER --------------------------- */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      profilePic: "",
    });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ user, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ----------------------------- LOGIN ----------------------------- */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ user, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------ GET AUTH USER ------------------------- */
router.get("/me", protect, async (req: AuthRequest, res) => {
  try {
    res.json({ user: req.user });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

/* ------------------- UPLOAD PROFILE PICTURE --------------------- */
router.post(
  "/profile-picture/:userId",
  upload.single("profilePic"),
  async (req, res) => {
    const { userId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    // Must have a file
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePic: `/uploads/${req.file.filename}` },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "Profile picture updated",
        user: updatedUser,
      });
    } catch (err) {
      console.error("Profile pic upload error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
