// models/Book.ts
import mongoose, { Schema, Document } from "mongoose";

export interface BookDocument extends Document {
  title: string;
  author: string;
  genre: string;
  description?: string;
  cover?: string;
  available: boolean;
  user: mongoose.Types.ObjectId;       // owner
  requests: mongoose.Types.ObjectId[]; // users who requested
  borrower?: mongoose.Types.ObjectId;  // optional
  returnDate?: Date;                   // optional
}

const bookSchema = new Schema<BookDocument>({
  title: { type: String, required: true },
  author: { type: String, required: true },
  genre: { type: String, required: true },
  description: String,
  cover: String,
  available: { type: Boolean, default: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  requests: [{ type: Schema.Types.ObjectId, ref: "User" }],
  borrower: { type: Schema.Types.ObjectId, ref: "User" },
  returnDate: Date,
}, { timestamps: true });

export const Book = mongoose.model<BookDocument>("Book", bookSchema);
