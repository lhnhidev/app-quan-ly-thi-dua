import { Schema, model } from 'mongoose';
import mongoose from 'mongoose';

export type RoleType = {
  idRule: string;
  content: string;
  point: number;
  type: boolean;
  organization?: mongoose.Types.ObjectId;
};

const RoleSchema: Schema = new Schema(
  {
    idRule: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    point: {
      type: Number,
      required: true,
    },
    type: {
      type: Boolean,
      required: true,
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

RoleSchema.index({ organization: 1, idRule: 1 }, { unique: true });

export default model<RoleType>('Role', RoleSchema, 'Role');
