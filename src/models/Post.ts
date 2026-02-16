import { Schema, model, Document } from "mongoose";
import { IUser } from "./User";

export interface IPost extends Document {
  community: Schema.Types.ObjectId;
  user: IUser;
  content: string;
  image?: string;
  likes: Schema.Types.ObjectId[];
  comments: {
    user: Schema.Types.ObjectId;
    comment: string;
  }[];
}

const PostSchema = new Schema<IPost>({
  community: { type: Schema.Types.ObjectId, ref: "Community", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  image: { type: String },
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      user: { type: Schema.Types.ObjectId, ref: "User" },
      comment: { type: String },
    },
  ],
}, { timestamps: true });

export const Post = model<IPost>("Post", PostSchema);
