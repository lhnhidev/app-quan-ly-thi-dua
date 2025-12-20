import mongoose, { Schema } from 'mongoose';

export type StudentType = {
  firstName: string;
  lastName: string;
  idStudent: string;
  class: mongoose.Schema.Types.ObjectId;
  recordForms: mongoose.Schema.Types.ObjectId[];
};

const studentSchema: Schema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    idStudent: {
      type: String,
      required: true,
      unique: true,
    },
    class: {
      type: Schema.Types.ObjectId || null || undefined,
      ref: 'Class',
      required: false,
    },
    recordForms: [
      {
        type: Schema.Types.ObjectId,
        ref: 'RecordForm',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Student = mongoose.model<StudentType>('Student', studentSchema, 'Student');

export default Student;
