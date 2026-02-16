import { Schema, model, Types } from "mongoose";

const MessageSchema = new Schema(
  {
    chatId: { type: Types.ObjectId, ref: "Chat" },
    sender: { type: Types.ObjectId, ref: "User" },

    text: String,
    fileUrl: String,
    fileName: String,

    // ⭐ Track unread messages
    readBy: [{ type: Types.ObjectId, ref: "User", default: [] }]
  },
  { timestamps: true }
);

export const Message = model("Message", MessageSchema);
