import { Schema, model, Document, Types } from "mongoose";

export interface ICommunity extends Document {
  name: string;
  description?: string;
  banner?: string;
  followers: Types.ObjectId[];
  createdBy: Types.ObjectId; 
}

const CommunitySchema = new Schema<ICommunity>({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  banner: { type: String },
  followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export const Community = model<ICommunity>("Community", CommunitySchema);
