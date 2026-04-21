import mongoose, { Schema } from 'mongoose';

export type PendingRegistrationType = {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  otpCode: string;
  otpExpiresAt: Date;
  attempts: number;
};

const PendingRegistrationSchema: Schema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    otpCode: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

PendingRegistrationSchema.index({ otpExpiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<PendingRegistrationType>(
  'PendingRegistration',
  PendingRegistrationSchema,
  'PendingRegistration'
);
