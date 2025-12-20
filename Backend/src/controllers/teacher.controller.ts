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

export const modifyTeacher = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // ID (realId) của giáo viên đang sửa
    const {
      idTeacher, // Mã giáo viên (VD: GV001)
      email,
      firstName,
      lastName,
      idClass, // ID lớp chủ nhiệm mới (hoặc null)
    } = req.body;

    // --- BƯỚC 1: KIỂM TRA TRÙNG MÃ GIÁO VIÊN ---
    // Tìm giáo viên có idTeacher trùng, nhưng ID không phải là giáo viên đang sửa
    const duplicateCode = await Teacher.findOne({
      idTeacher: idTeacher,
      _id: { $ne: id },
    });

    if (duplicateCode) {
      return res.status(200).json({
        status: 400,
        message: 'Mã giáo viên đã tồn tại trong hệ thống!',
      });
    }

    // --- BƯỚC 2: KIỂM TRA TRÙNG EMAIL ---
    const duplicateEmail = await Teacher.findOne({
      email: email,
      _id: { $ne: id },
    });

    if (duplicateEmail) {
      return res.status(200).json({
        status: 400,
        message: 'Email này đã được sử dụng bởi giáo viên khác!',
      });
    }

    // --- BƯỚC 3: XỬ LÝ LOGIC LỚP CHỦ NHIỆM ---

    // Lấy thông tin hiện tại của giáo viên (để biết lớp cũ là lớp nào)
    const currentTeacherData = await Teacher.findById(id);
    if (!currentTeacherData) {
      return res.status(404).json({ message: 'Không tìm thấy giáo viên' });
    }

    const oldClassId = currentTeacherData.idClass; // Lớp cũ

    // Nếu có sự thay đổi về lớp (Chuyển lớp hoặc Hủy lớp)
    if (idClass !== oldClassId?.toString()) {
      // 3.1. Dọn dẹp lớp CŨ (Nếu trước đó giáo viên có chủ nhiệm lớp)
      if (oldClassId) {
        await Class.findByIdAndUpdate(oldClassId, { teacher: null });
      }

      // 3.2. Xử lý lớp MỚI
      if (idClass) {
        // Tìm lớp mới xem có ai đang chủ nhiệm không
        const targetClass = await Class.findById(idClass);

        if (targetClass && targetClass.teacher) {
          // LOGIC YÊU CẦU: Nếu lớp đó đã có giáo viên khác chủ nhiệm -> Set giáo viên đó thành không chủ nhiệm
          // targetClass.teacher chính là ID của giáo viên đang bị chiếm chỗ
          await Teacher.findByIdAndUpdate(targetClass.teacher, { idClass: null });
        }

        // Cập nhật lớp mới: Set chủ nhiệm là giáo viên hiện tại
        await Class.findByIdAndUpdate(idClass, { teacher: id });
      }
    }

    // --- BƯỚC 4: CẬP NHẬT THÔNG TIN GIÁO VIÊN ---
    const updatedTeacher = await Teacher.findByIdAndUpdate(
      id,
      {
        idTeacher,
        firstName,
        lastName,
        email,
        idClass: idClass || null, // Nếu idClass gửi lên là "" hoặc undefined thì lưu là null
      },
      { new: true } // Trả về data mới nhất
    ).populate('idClass'); // Populate để trả về data đẹp nếu cần hiển thị ngay

    return res.status(200).json({
      message: 'Cập nhật thông tin giáo viên thành công!',
      data: updatedTeacher,
    });
  } catch (error) {
    console.error('Modify Teacher Error:', error);
    return res.status(500).json({ message: 'Lỗi server khi cập nhật giáo viên' });
  }
};
