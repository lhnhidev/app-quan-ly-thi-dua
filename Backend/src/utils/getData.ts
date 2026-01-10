/* eslint-disable @typescript-eslint/no-explicit-any */
import Class from '../models/Class';
import RecordForm from '../models/RecordForm';
import Response from '../models/Response';
import Role from '../models/Role';
import Student from '../models/Student';
import Teacher from '../models/Teacher';
import User from '../models/User';

// Định nghĩa kiểu dữ liệu trả về cho hàm getData để dễ quản lý
export interface SystemDataPayload {
  summary: {
    totalClasses: number;
    totalStudents: number;
    totalTeachers: number;
    totalUsers: number;
    totalRecordForms: number;
    totalResponses: number;
    totalRules: number;
    generatedAt: Date;
  };
  classes: Array<{
    className: string;
    classId: string;
    teacherName: string; // Đã gộp tên GV
    teacherEmail: string;
    totalPoints: number;
    studentCount: number;
    studentList: Array<{ name: string; idStudent: string }>; // Chỉ lấy info cần thiết
  }>;
  students: Array<{
    fullName: string;
    idStudent: string;
    className: string;
    violationCount: number; // Tổng số lỗi đã ghi nhận
    recentViolations: string[]; // Tóm tắt vài lỗi gần nhất để AI nắm bắt nhanh
  }>;
  recordForms: Array<{
    idRecordForm: string;
    date: Date;
    creatorName: string; // Tên người tạo (User)
    studentName: string; // Tên học sinh bị ghi
    studentId: string;
    className: string;
    violationContent: string; // Nội dung lỗi (từ Role)
    pointsDeducted: number; // Điểm trừ (từ Role)
  }>;
  responses: Array<{
    idRecordForm: string; // Để AI đối chiếu với bảng RecordForm
    senderName: string;
    senderEmail: string;
    content: string;
    status: string;
    adminResponse: string;
  }>;
  users: Array<{
    fullName: string;
    email: string;
    role: string;
    idUser: string;
  }>;
  rules: Array<{
    // Bổ sung danh sách quy định để AI hiểu ngữ cảnh nội quy
    content: string;
    point: number;
    type: string; // true/false -> Thưởng/Phạt
  }>;
}

export const getData = async (): Promise<SystemDataPayload> => {
  try {
    // 1. Fetch dữ liệu song song (Parallel Fetching) để tối ưu tốc độ
    const [classesRaw, studentsRaw, teachersRaw, usersRaw, recordFormsRaw, responsesRaw, rolesRaw] =
      await Promise.all([
        Class.find()
          .populate('teacher', 'firstName lastName email idTeacher') // Chỉ lấy field cần
          .populate('students', 'firstName lastName idStudent')
          .lean(),
        Student.find().populate('class', 'name').lean(), // Cần biết HS thuộc lớp nào
        Teacher.find().lean(),
        User.find().select('-password').lean(), // Loại bỏ password
        RecordForm.find()
          .populate('user', 'firstName lastName idUser')
          .populate('student', 'firstName lastName idStudent')
          .populate('class', 'name idClass')
          .populate('rule', 'content point type')
          .sort({ createdAt: -1 }) // Lấy mới nhất trước
          .lean(),
        Response.find().lean(),
        Role.find().lean(),
      ]);

    // 2. Xử lý & Format dữ liệu: CLASSES
    const classesFormatted = classesRaw.map((cls: any) => ({
      className: cls.name,
      classId: cls.idClass,
      totalPoints: cls.point,
      // Xử lý null check cho teacher (vì teacher có thể null)
      teacherName: cls.teacher
        ? `${cls.teacher.firstName} ${cls.teacher.lastName}`
        : 'Chưa phân công',
      teacherEmail: cls.teacher?.email || '',
      studentCount: cls.students?.length || 0,
      studentList: Array.isArray(cls.students)
        ? cls.students.map((s: any) => ({
            name: `${s.firstName} ${s.lastName}`,
            idStudent: s.idStudent,
          }))
        : [],
    }));

    // 3. Xử lý dữ liệu: RECORD FORMS (Phiếu ghi nhận)
    // Map này giúp AI hiểu ngay: Ai bị lỗi gì, ngày nào, ai bắt, mà không cần tra cứu chéo.
    const recordFormsFormatted = recordFormsRaw.map((rf: any) => ({
      idRecordForm: rf.idRecordForm,
      date: rf.time,
      creatorName: rf.user ? `${rf.user.firstName} ${rf.user.lastName}` : 'Unknown User',
      studentName: rf.student
        ? `${rf.student.firstName} ${rf.student.lastName}`
        : 'Unknown Student',
      studentId: rf.student?.idStudent || '',
      className: rf.class?.name || 'Unknown Class',
      violationContent: rf.rule?.content || 'Nội dung lỗi đã bị xóa',
      pointsDeducted: rf.rule?.point || 0,
    }));

    // 4. Xử lý dữ liệu: STUDENTS
    // Bổ sung: Tổng hợp lỗi của từng học sinh để AI trả lời câu hỏi "Học sinh này ngoan hay hư?"
    const studentsFormatted = studentsRaw.map((stu: any) => {
      // Tìm các record liên quan đến học sinh này
      const relatedRecords = recordFormsRaw.filter(
        (rf: any) => rf.student?._id?.toString() === stu._id.toString()
      );

      return {
        fullName: `${stu.firstName} ${stu.lastName}`,
        idStudent: stu.idStudent,
        className: stu.class?.name || 'Chưa xếp lớp',
        violationCount: relatedRecords.length,
        // Lấy 3 lỗi gần nhất làm context cho AI
        recentViolations: relatedRecords
          .slice(0, 3)
          .map((rf: any) => rf.rule?.content || 'Lỗi không xác định'),
      };
    });

    // 5. Xử lý dữ liệu: RESPONSES (Phản hồi)
    const responsesFormatted = responsesRaw.map((res: any) => ({
      idRecordForm: res.idRecordForm?.toString() || '', // Chỉ cần ID reference
      senderName: `${res.firstName} ${res.lastName}`,
      senderEmail: res.email,
      content: res.content,
      status: res.state,
      adminResponse: res.responseOfAdmin,
    }));

    // 6. Xử lý dữ liệu: USERS
    const usersFormatted = usersRaw.map((usr: any) => ({
      fullName: `${usr.firstName} ${usr.lastName}`,
      email: usr.email,
      role: usr.role,
      idUser: usr.idUser,
    }));

    // 7. Xử lý dữ liệu: RULES (Bổ sung quan trọng)
    const rulesFormatted = rolesRaw.map((r: any) => ({
      content: r.content,
      point: r.point,
      type: r.type ? 'Điểm Cộng/Thành Tích' : 'Điểm Trừ/Vi phạm',
    }));

    // 8. TỔNG HỢP (Final Data Construction)
    const data: SystemDataPayload = {
      summary: {
        totalClasses: classesRaw.length,
        totalStudents: studentsRaw.length,
        totalTeachers: teachersRaw.length,
        totalUsers: usersRaw.length,
        totalRecordForms: recordFormsRaw.length,
        totalResponses: responsesRaw.length,
        totalRules: rolesRaw.length,
        generatedAt: new Date(),
      },
      classes: classesFormatted,
      students: studentsFormatted,
      recordForms: recordFormsFormatted,
      responses: responsesFormatted,
      users: usersFormatted,
      rules: rulesFormatted,
    };

    return data;
  } catch (error) {
    console.error('Error fetching system data:', error);
    throw new Error('Failed to gather system data');
  }
};
