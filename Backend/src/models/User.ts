import mongoose, { Schema } from 'mongoose';

export type UserType = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  idUser: string;
  followingClasses?: string[];
};

const UserSchema: Schema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      required: true,
      enum: ['user', 'admin', 'student', 'teacher'],
      default: 'student',
    },
    idUser: { type: String, required: true, unique: true },
    followingClasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class', // Tên Model của lớp học (đảm bảo bạn đã export model tên 'Class')
        default: [], // Mặc định là mảng rỗng
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<UserType>('User', UserSchema, 'User');
