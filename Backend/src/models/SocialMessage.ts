import mongoose, { Schema, model } from 'mongoose';

type MessageAttachment = {
  url: string;
  publicId: string;
  fileName: string;
  mimeType: string;
  resourceType: string;
  size: number;
};

export type SocialMessageType = {
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  text?: string;
  attachments: MessageAttachment[];
  delivered: boolean;
  deliveredAt?: Date | null;
  seen: boolean;
  seenAt?: Date | null;
};

const AttachmentSchema = new Schema<MessageAttachment>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    resourceType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

const SocialMessageSchema = new Schema<SocialMessageType>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000,
    },
    attachments: {
      type: [AttachmentSchema],
      default: [],
    },
    delivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    seen: {
      type: Boolean,
      default: false,
    },
    seenAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

SocialMessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

const SocialMessage = model<SocialMessageType>(
  'SocialMessage',
  SocialMessageSchema,
  'SocialMessage'
);

export default SocialMessage;
