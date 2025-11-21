import { Request, Response } from 'express';
import RecordForm from '../models/RecordForm';
import '../models/Student';
import '../models/Class';
import '../models/Role';
import '../models/User';

export const getRecordForms = async (req: Request, res: Response) => {
  const recordForms = await RecordForm.find({})
    .populate('student')
    .populate('class')
    .populate('rule')
    .populate('user')
    .exec();

  res.status(200).json(recordForms);
};
