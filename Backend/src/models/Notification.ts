import mongoose, { Schema } from 'mongoose';

export type NotificationType = {
  user: mongoose.Types.ObjectId;
  message: string;
  isRead: boolean;
};

const NotificationSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export default mongoose.model<NotificationType>('Notification', NotificationSchema, 'Notification');
