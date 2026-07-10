import mongoose, { Schema, Document } from "mongoose";

export interface IToken extends Document {
  user: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  replacedByToken?: string;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const tokenSchema = new Schema<IToken>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Token must belong to a user"],
    },
    token: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    replacedByToken: {
      type: String,
    },
    isRevoked: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Token = mongoose.model<IToken>("Token", tokenSchema);
