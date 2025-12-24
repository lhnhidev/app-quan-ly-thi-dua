/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import Class from '../models/Class';
import '../models/Teacher';
import '../models/Student';
import Teacher from '../models/Teacher';
import Student from '../models/Student';
import mongoose from 'mongoose';
import RecordForm from '../models/RecordForm';

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

export const getClassById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const singleClass = await Class.findById(id)
      .populate('teacher')
      .populate({
        path: 'students',
        populate: {
          path: 'recordForms',
        },
      })
      .exec();

    if (!singleClass) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    }

    res.status(200).json(singleClass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const renderClassInRedFlag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // ID của lớp (DB _id)

    // ---------------------------------------------------------
    // 1. XỬ LÝ THỜI GIAN (Lấy tuần hiện tại: Thứ 2 -> Chủ Nhật)
    // ---------------------------------------------------------
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0: CN, 1: T2, ..., 6: T7

    // Tính khoảng cách đến thứ 2 gần nhất
    // Nếu hôm nay là CN (0), thì thứ 2 là 6 ngày trước. Nếu không thì trừ đi (day - 1)
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0); // 00:00:00 Thứ 2

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999); // 23:59:59 Chủ Nhật

    // ---------------------------------------------------------
    // 2. TRUY VẤN DỮ LIỆU (Dùng Promise.all để tối ưu tốc độ)
    // ---------------------------------------------------------

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID lớp học không hợp lệ' });
    }

    const [classInfo, students, records] = await Promise.all([
      // a. Lấy thông tin lớp và giáo viên
      Class.findById(id)
        .populate<{
          teacher: { idTeacher: string; firstName: string; lastName: string; email: string };
        }>({
          path: 'teacher',
          select: 'idTeacher firstName lastName email', // Chỉ lấy các trường cần thiết
        })
        .lean(),

      // b. Lấy danh sách học sinh của lớp
      Student.find({ class: id }).select('idStudent firstName lastName').lean(),

      // c. Lấy các phiếu thi đua của lớp TRONG TUẦN NÀY
      RecordForm.find({
        class: id,
        time: { $gte: startOfWeek, $lte: endOfWeek },
      })
        .populate<{
          rule: { content: string; point: number; type: boolean };
          user: { idUser: string; firstName: string; lastName: string };
        }>([
          {
            path: 'rule', // Lấy thông tin thang điểm
            select: 'content point type',
          },
          {
            path: 'user', // Lấy thông tin người chấm (Cờ đỏ/GV)
            select: 'idUser firstName lastName',
          },
        ])
        .lean(),
    ]);

    if (!classInfo) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    }

    // ---------------------------------------------------------
    // 3. TÍNH TOÁN ĐIỂM SỐ CỦA LỚP
    // ---------------------------------------------------------
    let totalPoint = 300; // Điểm sàn bắt đầu

    records.forEach((record) => {
      if (record.rule) {
        // Kiểm tra loại điểm (type: true = cộng, type: false = trừ)
        // Lưu ý: Nếu trong DB point luôn dương, ta cần xử lý dấu dựa trên type
        const pointValue = (record.rule as any).point;

        if ((record.rule as any).type === true) {
          totalPoint += pointValue;
        } else {
          // Nếu là vi phạm (type false), trừ điểm
          totalPoint -= pointValue;
        }
      }
    });

    // ---------------------------------------------------------
    // 4. MAPPING RECORD VÀO TỪNG HỌC SINH
    // ---------------------------------------------------------
    const studentsWithRecords = students.map((student) => {
      // Lọc ra các record của học sinh này từ danh sách records đã fetch ở trên
      const studentRecords = records.filter((r) => r.student.toString() === student._id.toString());

      // Format lại dữ liệu record theo yêu cầu
      const formattedRecords = studentRecords.map((r) => {
        // Xác định điểm hiển thị (có dấu - hoặc +)
        const isBonus = r.rule?.type === true;
        const pointVal = r.rule?.point || 0;
        const displayPoint = isBonus ? pointVal : -pointVal;

        return {
          _id: r._id, // ID DB để truy cập
          idRecordForm: r.idRecordForm, // Custom ID
          content: r.rule?.content || 'Không xác định',
          point: displayPoint,
          createdAt: r.time, // Thời gian ghi nhận
          creator: r.user
            ? {
                // Người lập phiếu
                idUser: r.user.idUser,
                firstName: r.user.firstName,
                lastName: r.user.lastName,
              }
            : null,
        };
      });

      return {
        _id: student._id, // Để FE dùng làm key
        idStudent: student.idStudent,
        firstName: student.firstName,
        lastName: student.lastName,
        recordForms: formattedRecords, // Danh sách lỗi/thưởng tuần này
      };
    });

    // ---------------------------------------------------------
    // 5. TRẢ VỀ KẾT QUẢ
    // ---------------------------------------------------------
    const responseData = {
      idClass: classInfo.idClass,
      className: classInfo.name,
      point: totalPoint, // Tổng điểm tuần này (300 +/- ...)
      teacher: classInfo.teacher
        ? {
            idTeacher: classInfo.teacher.idTeacher,
            firstName: classInfo.teacher.firstName,
            lastName: classInfo.teacher.lastName,
            email: classInfo.teacher.email,
          }
        : null,
      students: studentsWithRecords,
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Lỗi renderClassInRedFlag:', error);
    return res.status(500).json({ message: 'Lỗi server xử lý dữ liệu lớp học' });
  }
};
