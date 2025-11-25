import { Request, Response } from 'express';
import Class from '../models/Class';
import '../models/Teacher';
import '../models/Student';

export const getClasses = async (req: Request, res: Response) => {
  try {
    const classes = await Class.find({})
      .sort({ idClass: 1 })
      .populate('teacher')
      .populate('students')
      .exec();
    res.status(200).json(classes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const addClass = async (req: Request, res: Response) => {
  try {
    const { className, id, idTeacher } = req.body;
    const newClass = new Class({
      name: `Lớp ${className}${id}`,
      students: [],
      point: 300,
      idClass: `${className}${id}`,
      teacher: idTeacher,
    });
    await newClass.save();
    res.status(201).json(newClass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const deleteClass = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const deletedClass = await Class.findByIdAndDelete(classId);
    if (!deletedClass) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    }
    res.status(200).json({ message: 'Xóa lớp học thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
