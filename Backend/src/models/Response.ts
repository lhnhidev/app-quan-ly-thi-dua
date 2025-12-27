import mongoose, { Schema } from 'mongoose';

export type ResponseTpe = {
  idRecordForm: mongoose.Types.ObjectId;
  idUser: string;
  firstName: string;
  lastName: string;
  email: string;
  content: string;
};

const ResponseSchema: Schema = new Schema(
  {
    idRecordForm: {
      type: Schema.Types.ObjectId,
      ref: 'RecordForm',
      required: true,
    },
    idUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recordForm: {
      type: String,
    },
    user: {
      type: String,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    content: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      enum: ['chấp nhận', 'từ chối', 'chờ xử lý'],
      default: 'chờ xử lý',
    },
    responseOfAdmin: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model<ResponseType>('Response', ResponseSchema, 'Response');
