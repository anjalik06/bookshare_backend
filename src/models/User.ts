import { Schema, model, Document, Types } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  bio?: string;
  points: number;
  booksShared: number;
  booksBorrowed: number;
  profilePic?: string;   // 🔥 Added
  communities: Types.ObjectId[];
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    bio: { type: String, default: "" },

    points: { type: Number, default: 0 },
    booksShared: { type: Number, default: 0 },
    booksBorrowed: { type: Number, default: 0 },

    profilePic: { type: String, default: null }, // 🔥 Added

    communities: [{ type: Schema.Types.ObjectId, ref: "Community" }]
  },
  { timestamps: true }
);

export const User = model<IUser>("User", UserSchema);
