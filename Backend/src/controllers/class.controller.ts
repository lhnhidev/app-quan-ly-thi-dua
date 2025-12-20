import { Request, Response } from 'express';
import Class from '../models/Class';
import '../models/Teacher';
import '../models/Student';
import Teacher from '../models/Teacher';
import Student from '../models/Student';

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
    const { name, idClass, teacher, point } = req.body;

    const existingClass = await Class.findOne({ idClass });
    if (existingClass) {
      return res.status(409).json({ status: 409, message: 'Lớp học đã tồn tại' });
    }

    const newClass = new Class({
      name,
      idClass,
      teacher,
      point: point || 300,
      students: [],
    });

    await newClass.save();

    if (teacher) {
      await Teacher.findByIdAndUpdate(teacher, {
        idClass: newClass._id,
      });
    }

    res.status(201).json(newClass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const deleteClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Tìm lớp học cần xóa để lấy danh sách GV và HS liên quan
    const classToDelete = await Class.findById(id);

    if (!classToDelete) {
      return res.status(404).json({ status: 404, message: 'Không tìm thấy lớp học' });
    }

    // 2. Cập nhật Giáo viên: Set idClass thành null
    if (classToDelete.teacher) {
      await Teacher.findByIdAndUpdate(classToDelete.teacher, {
        idClass: null, // Set giá trị về null
      });
    }

    // 3. Cập nhật Học sinh: Set class thành null
    // Lưu ý: Dựa vào data mẫu bạn đưa ban đầu thì trong bảng Student trường liên kết tên là "class"
    if (classToDelete.students && classToDelete.students.length > 0) {
      await Student.updateMany(
        { _id: { $in: classToDelete.students } },
        { class: null } // Set giá trị về null
      );
    }

    await Class.findByIdAndDelete(id);

    res.status(200).json({ message: 'Xóa lớp học thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const changeClass = async (req: Request, res: Response) => {
  try {
    // id này là realId của lớp học đang được chỉnh sửa
    const { id } = req.params;
    const { grade, idClass, name, idNewTeacher, idOldTeacher } = req.body;

    // --- BƯỚC 1: KIỂM TRA TRÙNG MÃ LỚP ---
    // Tìm xem có lớp nào KHÁC lớp hiện tại (dùng $ne: not equal) mà có cùng idClass không
    const duplicateClass = await Class.findOne({
      idClass: idClass,
      _id: { $ne: id },
    });

    if (duplicateClass) {
      // Trả về theo format bạn yêu cầu
      return res.status(200).json({ status: 409, message: 'Mã lớp đã tồn tại ở lớp khác!' });
    }

    // --- BƯỚC 2: XỬ LÝ GIÁO VIÊN CŨ (idOldTeacher) ---
    // Nếu có giáo viên cũ và giáo viên cũ KHÁC giáo viên mới (đề phòng trường hợp không đổi GV)
    if (idOldTeacher && idOldTeacher !== idNewTeacher) {
      await Teacher.findByIdAndUpdate(idOldTeacher, {
        idClass: null, // Gỡ bỏ chủ nhiệm
      });
    }

    // --- BƯỚC 3: XỬ LÝ GIÁO VIÊN MỚI (idNewTeacher) ---
    if (idNewTeacher) {
      // Tìm thông tin giáo viên mới
      const newTeacherObj = await Teacher.findById(idNewTeacher);

      if (newTeacherObj) {
        // Kiểm tra: Nếu giáo viên mới đang chủ nhiệm một lớp nào đó (và lớp đó KHÔNG phải lớp hiện tại)
        if (newTeacherObj.idClass && newTeacherObj.idClass.toString() !== id) {
          // Tìm đến cái LỚP KIA và gỡ giáo viên này ra (set teacher = null)
          // Để tránh 1 giáo viên chủ nhiệm 2 lớp
          await Class.findByIdAndUpdate(newTeacherObj.idClass, {
            teacher: null,
          });
        }

        // Cập nhật giáo viên mới: Set đang chủ nhiệm lớp hiện tại
        await Teacher.findByIdAndUpdate(idNewTeacher, {
          idClass: id,
        });
      }
    } else {
      // Trường hợp đặc biệt: Nếu người dùng chọn "Không có giáo viên" (idNewTeacher gửi lên null/undefined)
      // Thì không cần làm gì ở bước này, nhưng ở Bước 4 trường teacher của Class sẽ được set null.
    }

    // --- BƯỚC 4: CẬP NHẬT LỚP HỌC ---
    const updatedClass = await Class.findByIdAndUpdate(
      id,
      {
        grade,
        idClass, // Mã lớp
        name, // Tên hiển thị
        teacher: idNewTeacher, // Update ID giáo viên mới vào lớp (hoặc null nếu không chọn)
      },
      { new: true } // Trả về dữ liệu mới sau khi update
    );

    return res.status(200).json({
      message: 'Cập nhật thông tin lớp học thành công',
      data: updatedClass,
    });
  } catch (error) {
    console.error('Change Class Error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};
