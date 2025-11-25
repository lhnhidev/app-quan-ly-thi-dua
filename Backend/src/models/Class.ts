import mongoose, { Schema } from 'mongoose';

export type ClassType = {
  name: string;
  students: mongoose.Types.ObjectId[];
  point: number;
  idClass: string;
  teacher: mongoose.Types.ObjectId;
};

const classSchema = new Schema<ClassType>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    point: {
      type: Number,
      default: 0,
    },
    idClass: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    teacher: {
      type: Schema.Types.ObjectId || null || undefined,
      ref: 'Teacher',
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Class = mongoose.model<ClassType>('Class', classSchema, 'Class');

export default Class;
