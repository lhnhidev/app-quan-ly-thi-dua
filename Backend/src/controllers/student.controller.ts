import { Request, Response } from 'express';
import '../models/Class';
import '../models/RecordForm';
import Student from '../models/Student';

export const getStudents = async (req: Request, res: Response) => {
  try {
    const students = await Student.find({})
      .populate({
        path: 'class',
        populate: {
          path: 'teacher',
        },
      })
      .populate('recordForms')
      .exec();
    res.status(200).json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
