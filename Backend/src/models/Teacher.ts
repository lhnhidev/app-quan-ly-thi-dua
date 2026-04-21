import mongoose, { Schema, model } from 'mongoose';

export type TeacherType = {
  idTeacher: string;
  firstName: string;
  lastName: string;
  email: string;
  idClass?: mongoose.Types.ObjectId;
  organization?: mongoose.Types.ObjectId;
};

const teacherSchema: Schema = new Schema(
  {
    idTeacher: {
      type: String,
      required: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    idClass: {
      type: Schema.Types.ObjectId || null || undefined,
      ref: 'Class',
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
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

teacherSchema.index({ organization: 1, idTeacher: 1 }, { unique: true });
teacherSchema.index({ organization: 1, email: 1 }, { unique: true });

const Teacher = model<TeacherType>('Teacher', teacherSchema, 'Teacher');

export default Teacher;
