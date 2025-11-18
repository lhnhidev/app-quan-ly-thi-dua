import { Schema, model } from 'mongoose';

export type RuleType = {
  idRule: string;
  content: string;
  point: number;
  type: boolean;
};

const RuleSchema: Schema = new Schema(
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

export default model<RuleType>('Rule', RuleSchema, 'Rule');
