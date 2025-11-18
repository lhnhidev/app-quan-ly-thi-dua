import mongoose, { Schema, model } from 'mongoose';

export type RecordFormType = {
  idRecordForm: string;
  time: Date;
  user: mongoose.Schema.Types.ObjectId;
  student: mongoose.Schema.Types.ObjectId;
  class: mongoose.Schema.Types.ObjectId;
  rule: mongoose.Schema.Types.ObjectId;
};

const recordFormSchema = new Schema<RecordFormType>(
  {
    idRecordForm: {
      type: String,
      required: true,
      unique: true,
    },
    time: {
      type: Date,
      default: Date.now,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    class: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    rule: {
      type: Schema.Types.ObjectId,
      ref: 'Rule',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const RecordForm = model<RecordFormType>('RecordForm', recordFormSchema, 'RecordForm');

export default RecordForm;
