import { Schema, model } from 'mongoose';

export type RoleType = {
  idRule: string;
  content: string;
  point: number;
  type: boolean;
};

const RoleSchema: Schema = new Schema(
  {
    idRule: {
      type: String,
      required: true,
      unique: true,
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
  },
  {
    timestamps: true,
  }
);

export default model<RoleType>('Role', RoleSchema, 'Role');
