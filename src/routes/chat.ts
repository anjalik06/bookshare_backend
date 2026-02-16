import { Router } from "express";
import { Chat } from "../models/Chat";
import { Message } from "../models/Message";
import { protect, AuthRequest } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = Router();

// ⭐ Start chat
router.post("/start", protect, async (req: AuthRequest, res) => {
  const { partnerId } = req.body;

  let chat = await Chat.findOne({
    members: { $all: [req.user._id, partnerId] },
  }).populate("members", "name profilePic");

  if (!chat) {
    chat = await Chat.create({
      members: [req.user._id, partnerId],
    });

    chat = await chat.populate("members", "name profilePic");
  }

  res.json(chat);
});

// ⭐ Chat list
router.get("/", protect, async (req: AuthRequest, res) => {
  const chats = await Chat.find({ members: req.user._id }).populate(
    "members",
    "name profilePic"
  );

  res.json(chats);
});

// ⭐ Get chat messages
router.get("/:chatId/messages", protect, async (req: AuthRequest, res) => {
  const msgs = await Message.find({ chatId: req.params.chatId }).populate(
    "sender",
    "name profilePic"
  );

  res.json(msgs);
});

// ⭐ Send message
router.post(
  "/:chatId/send",
  protect,
  upload.single("file"),
  async (req: AuthRequest, res) => {
    try {
      const { text } = req.body;
      let fileUrl = "";
      let fileName = "";

      if (req.file) {
        fileUrl = "/uploads/" + req.file.filename;
        fileName = req.file.originalname;
      }

      const message = await Message.create({
        chatId: req.params.chatId,
        sender: req.user._id,
        text,
        fileUrl,
        fileName,
        readBy: [req.user._id], // ⭐ sender already read it
      });

      const populated = await message.populate("sender", "name profilePic");

      res.json(populated);
    } catch (err) {
      console.error("Chat send error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ⭐ Unread count for all chats
router.get("/unread/all", protect, async (req: AuthRequest, res) => {
  const userId = req.user._id;

  const chats = await Chat.find({ members: userId });

  const unreadData: Record<string, number> = {};

  for (let chat of chats) {
    const count = await Message.countDocuments({
      chatId: chat._id,
      sender: { $ne: userId },
      readBy: { $ne: userId },
    });

    unreadData[chat._id.toString()] = count; // ← FIXED
  }

  res.json(unreadData);
});

// ⭐ Mark chat messages as read
router.post("/:chatId/read", protect, async (req: AuthRequest, res) => {
  const userId = req.user._id;

  await Message.updateMany(
    {
      chatId: req.params.chatId,
      readBy: { $ne: userId },
    },
    {
      $push: { readBy: userId },
    }
  );

  res.json({ message: "Messages marked as read" });
});

export default router;
