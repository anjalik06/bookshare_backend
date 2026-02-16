import { Schema, model, Types } from "mongoose";

const ChatSchema = new Schema(
  {
    members: [{ type: Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export const Chat = model("Chat", ChatSchema);
