import { Request, Response } from 'express';
import '../models/Class';
import '../models/RecordForm';
import Student from '../models/Student';
import Class from '../models/Class';

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

export const addStudents = async (req: Request, res: Response) => {
  try {
    const { newStudents } = req.body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const studentIds = newStudents.map((student: any) => student.idStudent);

    const uniqueStudentIds = new Set(studentIds);
    if (uniqueStudentIds.size < studentIds.length) {
      const duplicates = studentIds.filter(
        (id: string, index: number) => studentIds.indexOf(id) !== index
      );
      return res.status(400).json({
        message: `Danh sách học sinh mới chứa các mã số bị trùng: ${duplicates.join(', ')}`,
        duplicateIds: duplicates,
      });
    }

    const existingStudents = await Student.find({ idStudent: { $in: studentIds } });

    if (existingStudents.length > 0) {
      const existingIds = existingStudents.map((student) => student.idStudent);
      return res.status(409).json({
        message: `Các sinh viên với mã số sau đã tồn tại: ${existingIds.join(', ')}`,
        existingIds,
      });
    }

    const createdStudents = await Student.insertMany(newStudents);

    const studentsByClass: { [key: string]: string[] } = {};

    createdStudents.forEach((student) => {
      const classId = student.class.toString();

      if (!studentsByClass[classId]) {
        studentsByClass[classId] = [];
      }
      studentsByClass[classId].push(student._id.toString());
    });

    await Promise.all(
      Object.keys(studentsByClass).map((classId) =>
        Class.findByIdAndUpdate(classId, {
          $push: { students: { $each: studentsByClass[classId] } },
        })
      )
    );

    res.status(201).json(createdStudents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const modifyStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const currentStudent = await Student.findById(id);
    if (!currentStudent) {
      return res.status(404).json({ status: 404, message: 'Không tìm thấy học sinh' });
    }

    if (req.body.idStudent && currentStudent.idStudent !== req.body.idStudent) {
      const existingStudent = await Student.findOne({ idStudent: req.body.idStudent });
      if (existingStudent) {
        return res.status(409).json({
          status: 409,
          message: `Mã học sinh ${req.body.idStudent} đã được sử dụng bởi học sinh khác.`,
        });
      }
    }

    const newClassId = req.body.class;
    const oldClassId = currentStudent.class ? currentStudent.class.toString() : null;

    if (newClassId && oldClassId !== newClassId) {
      if (oldClassId) {
        await Class.findByIdAndUpdate(oldClassId, {
          $pull: { students: id },
        });
      }

      await Class.findByIdAndUpdate(newClassId, {
        $addToSet: { students: id },
      });
    }

    const updateData = req.body;
    const updatedStudent = await Student.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json(updatedStudent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedStudent = await Student.findByIdAndDelete(id);

    if (!deletedStudent) {
      return res.status(404).json({ status: 404, message: 'Không tìm thấy học sinh' });
    }

    if (deletedStudent.class) {
      await Class.findByIdAndUpdate(deletedStudent.class, {
        $pull: { students: id },
      });
    }

    res.status(200).json({ message: 'Xóa học sinh và cập nhật danh sách lớp thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
