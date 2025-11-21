import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Class from './models/Class';
import RecordForm from './models/RecordForm';
import Rule from './models/Role';
import Student from './models/Student';
import Teacher from './models/Teacher';
import User from './models/User';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || '');
    console.log('MongoDB Connected');

    await Class.deleteMany();
    await RecordForm.deleteMany();
    await Rule.deleteMany();
    await Student.deleteMany();
    await Teacher.deleteMany();
    await User.deleteMany();

    const teacherId1 = new mongoose.Types.ObjectId();
    const teacherId2 = new mongoose.Types.ObjectId();
    const teacherId3 = new mongoose.Types.ObjectId();
    const teacherId4 = new mongoose.Types.ObjectId();
    const teacherId5 = new mongoose.Types.ObjectId();
    const teacherId6 = new mongoose.Types.ObjectId();
    const teacherId7 = new mongoose.Types.ObjectId();
    const teacherId8 = new mongoose.Types.ObjectId();
    const teacherId9 = new mongoose.Types.ObjectId();
    const teacherId10 = new mongoose.Types.ObjectId();
    const teacherId11 = new mongoose.Types.ObjectId();
    const teacherId12 = new mongoose.Types.ObjectId();

    const studentId1 = new mongoose.Types.ObjectId();
    const studentId2 = new mongoose.Types.ObjectId();
    const studentId3 = new mongoose.Types.ObjectId();
    const studentId4 = new mongoose.Types.ObjectId();
    const studentId5 = new mongoose.Types.ObjectId();
    const studentId6 = new mongoose.Types.ObjectId();
    const studentId7 = new mongoose.Types.ObjectId();
    const studentId8 = new mongoose.Types.ObjectId();
    const studentId9 = new mongoose.Types.ObjectId();
    const studentId10 = new mongoose.Types.ObjectId();
    const studentId11 = new mongoose.Types.ObjectId();
    const studentId12 = new mongoose.Types.ObjectId();

    const classId1 = new mongoose.Types.ObjectId();
    const classId2 = new mongoose.Types.ObjectId();
    const classId3 = new mongoose.Types.ObjectId();
    const classId4 = new mongoose.Types.ObjectId();
    const classId5 = new mongoose.Types.ObjectId();
    const classId6 = new mongoose.Types.ObjectId();
    const classId7 = new mongoose.Types.ObjectId();
    const classId8 = new mongoose.Types.ObjectId();
    const classId9 = new mongoose.Types.ObjectId();
    const classId10 = new mongoose.Types.ObjectId();
    const classId11 = new mongoose.Types.ObjectId();
    const classId12 = new mongoose.Types.ObjectId();

    const userId1 = new mongoose.Types.ObjectId();
    const userId2 = new mongoose.Types.ObjectId();

    const recordFormId1 = new mongoose.Types.ObjectId();
    const recordFormId2 = new mongoose.Types.ObjectId();

    const ruleId1 = new mongoose.Types.ObjectId();
    const ruleId2 = new mongoose.Types.ObjectId();

    const teacherIds = [
      teacherId1,
      teacherId2,
      teacherId3,
      teacherId4,
      teacherId5,
      teacherId6,
      teacherId7,
      teacherId8,
      teacherId9,
      teacherId10,
      teacherId11,
      teacherId12,
    ];

    const studentIds = [
      studentId1,
      studentId2,
      studentId3,
      studentId4,
      studentId5,
      studentId6,
      studentId7,
      studentId8,
      studentId9,
      studentId10,
      studentId11,
      studentId12,
    ];

    const classIds = [
      classId1,
      classId2,
      classId3,
      classId4,
      classId5,
      classId6,
      classId7,
      classId8,
      classId9,
      classId10,
      classId11,
      classId12,
    ];

    // const userIds = [userId1, userId2];
    // const recordFormIds = [recordFormId1, recordFormId2];
    // const ruleIds = [ruleId1, ruleId2];

    const users = [
      {
        _id: userId1,
        firstName: 'Lê',
        lastName: 'Nhi',
        email: 'lhnhi420@gmail.com',
        password: '123',
        role: 'admin',
        idUser: 'USER-001',
      },
      {
        _id: userId2,
        firstName: 'Doãn',
        lastName: 'Khoa',
        email: 'ddk@gmail.com',
        password: '123',
        role: 'user',
        idUser: 'USER-002',
      },
    ];

    const teachers = [
      {
        _id: teacherId1,
        idTeacher: 'TCH-001',
        firstName: 'Nguyễn',
        lastName: 'Văn A',
        email: 'nguyenvana@example.com',
        idClass: classId1,
      },
      {
        _id: teacherId2,
        idTeacher: 'TCH-002',
        firstName: 'Trần',
        lastName: 'Thị B',
        email: 'tranthib@example.com',
        idClass: classId2,
      },
      {
        _id: teacherId3,
        idTeacher: 'TCH-003',
        firstName: 'Lê',
        lastName: 'Văn C',
        email: 'levanc@example.com',
        idClass: classId3,
      },
      {
        _id: teacherId4,
        idTeacher: 'TCH-004',
        firstName: 'Phạm',
        lastName: 'Thị D',
        email: 'phamthid@example.com',
        idClass: classId4,
      },
      {
        _id: teacherId5,
        idTeacher: 'TCH-005',
        firstName: 'Hoàng',
        lastName: 'Văn E',
        email: 'hoangvane@example.com',
        idClass: classId5,
      },
      {
        _id: teacherId6,
        idTeacher: 'TCH-006',
        firstName: 'Vũ',
        lastName: 'Thị F',
        email: 'vuthif@example.com',
        idClass: classId6,
      },
      {
        _id: teacherId7,
        idTeacher: 'TCH-007',
        firstName: 'Đặng',
        lastName: 'Văn G',
        email: 'dangvang@example.com',
        idClass: classId7,
      },
      {
        _id: teacherId8,
        idTeacher: 'TCH-008',
        firstName: 'Bùi',
        lastName: 'Thị H',
        email: 'buithih@example.com',
        idClass: classId8,
      },
      {
        _id: teacherId9,
        idTeacher: 'TCH-009',
        firstName: 'Đỗ',
        lastName: 'Văn I',
        email: 'dovani@example.com',
        idClass: classId9,
      },
      {
        _id: teacherId10,
        idTeacher: 'TCH-010',
        firstName: 'Hồ',
        lastName: 'Thị K',
        email: 'hothik@example.com',
        idClass: classId10,
      },
      {
        _id: teacherId11,
        idTeacher: 'TCH-011',
        firstName: 'Ngô',
        lastName: 'Văn L',
        email: 'ngovanl@example.com',
        idClass: classId11,
      },
      {
        _id: teacherId12,
        idTeacher: 'TCH-012',
        firstName: 'Dương',
        lastName: 'Thị M',
        email: 'duongthim@example.com',
        idClass: classId12,
      },
    ];

    const students = [
      {
        _id: studentId1,
        firstName: 'Phạm',
        lastName: 'Minh Tuấn',
        idStudent: 'STU-001',
        class: classId1,
        recordForms: [],
      },
      {
        _id: studentId2,
        firstName: 'Nguyễn',
        lastName: 'Thị Lan',
        idStudent: 'STU-002',
        class: classId1,
        recordForms: [],
      },
      {
        _id: studentId3,
        firstName: 'Lê',
        lastName: 'Văn Hùng',
        idStudent: 'STU-003',
        class: classId2,
        recordForms: [],
      },
    ];

    const recordForms = [
      {
        _id: recordFormId1,
        idRecordForm: 'RF-001',
        time: new Date(),
        user: userId2,
        student: studentId1,
        class: classId1,
        rule: ruleId1,
      },
      {
        _id: recordFormId2,
        idRecordForm: 'RF-002',
        time: new Date(),
        user: userId2,
        student: studentId2,
        class: classId2,
        rule: ruleId2,
      },
    ];

    const rules = [
      {
        _id: ruleId1,
        idRule: 'RL-001',
        content: 'Tham gia phong trào đạt giải I - Tập thể',
        point: 30,
        type: true,
      },
      {
        _id: ruleId2,
        idRule: 'RL-002',
        content: 'Tham gia phong trào đạt giải II - Tập thể',
        point: 15,
        type: true,
      },
    ];

    const classes = [];
    const grades = [6, 7, 8, 9];
    const classLetters = ['A', 'B', 'C'];
    let index = 0;

    for (const grade of grades) {
      for (const letter of classLetters) {
        classes.push({
          _id: classIds[index],
          name: `Lớp ${grade}${letter}`,
          idClass: `${grade}${letter}`,
          point: 300,
          teacher: teacherIds[index],
          students: [studentIds[index]],
        });
        index++;
      }
    }

    await Class.insertMany(classes);
    await Teacher.insertMany(teachers);
    await User.insertMany(users);
    await Student.insertMany(students);
    await RecordForm.insertMany(recordForms);
    await Rule.insertMany(rules);
    console.log('✅ Đã thêm dữ liệu mẫu thành công!');

    process.exit();
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
};

seedData();
