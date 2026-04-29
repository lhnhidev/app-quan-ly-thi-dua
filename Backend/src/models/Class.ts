import mongoose, { Schema } from 'mongoose';

export type ClassType = {
  name: string;
  students: mongoose.Types.ObjectId[];
  point: number;
  idClass: string;
  teacher: mongoose.Types.ObjectId;
  organization?: mongoose.Types.ObjectId;
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
      trim: true,
    },
    teacher: {
      type: Schema.Types.ObjectId || null || undefined,
      ref: 'Teacher',
      required: false,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

classSchema.index({ organization: 1, idClass: 1 }, { unique: true });

const Class = mongoose.model<ClassType>('Class', classSchema, 'Class');

export default Class;
