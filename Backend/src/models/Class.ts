import mongoose, { Schema } from 'mongoose';

export type ClassType = {
  name: string;
  students: mongoose.Types.ObjectId[];
  point: number;
  idClass: string;
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
  },
  {
    timestamps: true,
  }
);

const Class = mongoose.model<ClassType>('Class', classSchema);

export default Class;
