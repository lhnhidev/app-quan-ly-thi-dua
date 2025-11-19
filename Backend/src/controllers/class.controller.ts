import { Request, Response } from 'express';
import Class from '../models/Class';
import '../models/Teacher';
import '../models/Student';

export const getClasses = async (req: Request, res: Response) => {
  try {
    const classes = await Class.find({}).populate('teacher').populate('students').exec();
    res.status(200).json(classes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
