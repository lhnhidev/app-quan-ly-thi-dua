import { Request, Response } from 'express';
import Teacher from '../models/Teacher';
import Class from '../models/Class';

export const getTeachers = async (req: Request, res: Response) => {
  try {
    const teachers = await Teacher.find({}).sort({ idTeacher: 1 }).populate('idClass').exec();
    res.status(200).json(teachers);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addTeacher = async (req: Request, res: Response) => {
  try {
    const { teacherList } = req.body;

    const emails = new Set<string>();
    const idTeachers = new Set<string>();
    const idClasses = new Set<string>();
    const duplicateEmailsInList: string[] = [];
    const duplicateIdsInList: string[] = [];
    const duplicateIdsClassInList: string[] = [];

    for (const teacher of teacherList) {
      if (emails.has(teacher.email)) {
        duplicateEmailsInList.push(teacher.email);
      }
      emails.add(teacher.email);

      if (idTeachers.has(teacher.idTeacher)) {
        duplicateIdsInList.push(teacher.idTeacher);
      }
      idTeachers.add(teacher.idTeacher);

      if (teacher.idClass) {
        if (idClasses.has(teacher.idClass)) {
          duplicateIdsClassInList.push(teacher.idClass);
        }
        idClasses.add(teacher.idClass);
      }
    }

    if (
      duplicateEmailsInList.length > 0 ||
      duplicateIdsInList.length > 0 ||
      duplicateIdsClassInList.length > 0
    ) {
      const message = 'Dữ liệu không hợp lệ';
      return res.status(409).json({
        status: 'fail',
        message,
        duplicateEmailsInList: [...new Set(duplicateEmailsInList)].join(', '),
        duplicateIdsInList: [...new Set(duplicateIdsInList)].join(', '),
        duplicateIdsClass: [...new Set(duplicateIdsClassInList)].join(', '),
      });
    }

    const existingIdTeachers = await Teacher.find({
      idTeacher: { $in: Array.from(idTeachers) },
    }).lean();
    const existingEmailTeachers = await Teacher.find({ email: { $in: Array.from(emails) } }).lean();

    if (existingEmailTeachers.length > 0 || existingIdTeachers.length > 0) {
      const existingEmails = existingEmailTeachers.map((t) => t.email);
      const existingIds = existingIdTeachers.map((t) => t.idTeacher);
      const message = 'Không thể thêm giáo viên';
      return res.status(409).json({
        status: 'fail',
        message,
        existingEmails: existingEmails.join(', '),
        existingIds: existingIds.join(', '),
      });
    }

    const newTeachers = await Teacher.insertMany(teacherList);

    const classUpdatePromises = newTeachers.map((teacher) => {
      if (teacher.idClass) {
        return Class.findByIdAndUpdate(teacher.idClass, { teacher: teacher._id });
      }
      return Promise.resolve();
    });

    await Promise.all(classUpdatePromises);
    res.status(201).json({ status: 'success', data: newTeachers });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteTeacher = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ message: 'Không tìm thấy giáo viên' });
    }

    await Promise.all([
      Class.updateMany({ teacher: id }, { $set: { teacher: null } }),
      Teacher.findByIdAndDelete(id),
    ]);

    res.status(200).json({ message: 'Xóa giáo viên thành công' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};
