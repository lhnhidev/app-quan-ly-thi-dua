/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import User from '../models/User';
import generateToken from '../utils/generateToken';
import Class from '../models/Class';
import RecordForm from '../models/RecordForm';

export const index = (req: Request, res: Response) => {
  res.send('User Controller is working!');
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    // 1. Lấy thêm trường followingClasses từ body
    const { firstName, lastName, email, password, role, idUser, followingClasses } = req.body;

    // Kiểm tra các trường bắt buộc (followingClasses không bắt buộc nên không check ở đây)
    if (!firstName || !lastName || !email || !password || !role || !idUser) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc!' });
    }

    // Kiểm tra trùng Email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ status: 409, message: 'Email này đã được sử dụng!' });
    }

    // Kiểm tra trùng ID User
    const existingIdUser = await User.findOne({ idUser });
    if (existingIdUser) {
      return res
        .status(409)
        .json({ status: 409, message: `Mã người dùng '${idUser}' đã tồn tại!` });
    }

    // 2. Logic xử lý followingClasses dựa trên Role
    // Nếu là admin thì luôn là mảng rỗng, ngược lại thì lấy dữ liệu gửi lên (hoặc mảng rỗng nếu null/undefined)
    const classesToAssign = role === 'admin' ? [] : followingClasses || [];

    // 3. Tạo user mới
    const newUser = new User({
      firstName,
      lastName,
      email,
      password, // Lưu ý: Nên hash password trước khi lưu (nếu model chưa có middleware pre-save hash)
      role,
      idUser,
      followingClasses: classesToAssign, // Thêm trường này vào
    });

    await newUser.save();

    // Loại bỏ password trước khi trả về client
    const userObject = newUser.toObject();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _removedPassword, ...userResponse } = userObject;

    return res.status(201).json({
      success: true,
      message: 'Tạo người dùng thành công',
      data: userResponse,
    });
  } catch (error: any) {
    console.error('Create User Error:', error);
    return res.status(500).json({
      message: 'Lỗi Server khi tạo người dùng',
      error: error.message,
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');

    // && (await bcrypt.compare(password, user.password))
    if (user && user.password === password) {
      // Đăng nhập thành công, tạo JWT và gửi về client
      res.json({
        _id: user._id,
        idUser: user.idUser,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        followingClasses: user.followingClasses,
        token: generateToken(user._id.toString()),
      });
    } else {
      res.status(401).json({ message: 'Email hoặc mật khẩu không hợp lệ' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi Server' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const userId = req.params.id;

  try {
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }
    res.status(200).json({ message: 'Xóa người dùng thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi Server' });
  }
};

export const modifyUser = async (req: Request, res: Response) => {
  const userId = req.params.id;

  // 1. Lấy thêm followingClasses từ body
  const { firstName, lastName, email, role, idUser, password, followingClasses } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    // --- KIỂM TRA TRÙNG LẶP (Giữ nguyên) ---
    const existingEmailUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingEmailUser) {
      return res.status(409).json({ message: 'Email này đã được sử dụng bởi người dùng khác!' });
    }

    const existingIdUser = await User.findOne({ idUser, _id: { $ne: userId } });
    if (existingIdUser) {
      return res
        .status(409)
        .json({ message: `Mã người dùng '${idUser}' đã tồn tại ở người dùng khác!` });
    }

    // --- CẬP NHẬT THÔNG TIN ---
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.role = role;
    user.idUser = idUser;

    // 2. Logic cập nhật Lớp theo dõi (followingClasses)
    if (role === 'admin') {
      // Nếu là Admin thì không cần theo dõi lớp cụ thể -> Reset về rỗng
      user.followingClasses = [];
    } else {
      // Các vai trò khác: Cập nhật theo dữ liệu gửi lên (hoặc rỗng nếu không có)
      user.followingClasses = followingClasses || [];
    }

    // 3. Xử lý Mật khẩu (Chỉ cập nhật nếu có gửi lên)
    if (password && password.trim() !== '') {
      user.password = password;
      // Lưu ý: User Schema cần có middleware pre('save') để hash password
    }

    // Dùng .save() để kích hoạt middleware validation và hash password (nếu có đổi pass)
    await user.save();

    // --- TRẢ VỀ RESPONSE ---
    const userObject = user.toObject();

    // Loại bỏ password trước khi trả về
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _removedPassword, ...userResponse } = userObject;

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin người dùng thành công',
      data: userResponse,
    });
  } catch (error) {
    console.error('Modify User Error:', error);
    return res.status(500).json({
      message: 'Lỗi Server khi cập nhật thông tin người dùng',
    });
  }
};

export const getCoDo = async (req: Request, res: Response) => {
  try {
    const coDoUsers = await User.find({ role: 'user' }).select('-password');
    res.status(200).json(coDoUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getTrackingReport = async (req: Request, res: Response) => {
  try {
    // 1. Nhận dữ liệu đầu vào
    const { userId, startDate, endDate } = req.body;

    if (!userId || !startDate || !endDate) {
      return res.status(400).json({ message: 'Thiếu thông tin: userId, startDate, hoặc endDate' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // 2. Lấy thông tin User và danh sách lớp đang theo dõi (followingClasses)
    const user = await User.findById(userId)
      .select('-password') // Không lấy password
      .populate('followingClasses') // Populate để lấy thông tin các lớp
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Lấy danh sách ID các lớp mà user này đang theo dõi
    // user.followingClasses lúc này là mảng các object Class do đã populate
    const followingClassesList = user.followingClasses as any[];
    const targetClassIds = followingClassesList.map((c) => c._id);

    if (targetClassIds.length === 0) {
      return res.status(200).json({
        userInfo: {
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        monitoredClasses: [],
      });
    }

    // 3. QUERY SONG SONG (Parallel Execution)
    // Query A: Lấy chi tiết các lớp (kèm Teacher và Students)
    // Query B: Lấy TẤT CẢ phiếu điểm của các lớp này trong khoảng thời gian

    const [classesDetails, recordForms] = await Promise.all([
      Class.find({ _id: { $in: targetClassIds } })
        .populate({
          path: 'teacher',
          select: 'firstName lastName idTeacher email', // Chọn trường cần lấy của Teacher
        })
        .populate({
          path: 'students',
          select: 'firstName lastName idStudent', // Chọn trường cần lấy của Student
        })
        .lean(),

      RecordForm.find({
        class: { $in: targetClassIds }, // Chỉ lấy record thuộc các lớp đang theo dõi
        time: { $gte: start, $lte: end }, // Trong khoảng thời gian (dùng trường 'time' như schema)
      })
        .populate({
          path: 'user', // Người lập phiếu
          select: 'idUser firstName lastName',
        })
        .populate({
          path: 'rule', // Lấy thông tin Rule (Schema là Role nhưng field là rule)
          select: 'point content idRule',
        })
        .sort({ time: -1 }) // Mới nhất lên đầu
        .lean(),
    ]);

    // 4. Xử lý dữ liệu (Mapping & Calculation)

    const processedClasses = classesDetails.map((cls: any) => {
      // A. Lọc ra các RecordForm thuộc về lớp hiện tại
      const classRecords = recordForms.filter(
        (r: any) => r.class.toString() === cls._id.toString()
      );

      // B. Tính tổng điểm của lớp
      // Công thức: 300 + tổng điểm các phiếu
      const totalClassPoint =
        300 +
        classRecords.reduce((sum, r: any) => {
          const point = r.rule ? r.rule.point : 0; // r.rule là bảng Role
          return sum + point;
        }, 0);

      // C. Xử lý danh sách học sinh trong lớp
      const processedStudents = (cls.students || []).map((stu: any) => {
        // Lọc ra các RecordForm thuộc về học sinh này
        const studentRecords = classRecords.filter(
          (r: any) => r.student && r.student.toString() === stu._id.toString()
        );

        // Tính tổng điểm học sinh
        const totalStudentPoint = studentRecords.reduce((sum, r: any) => {
          const point = r.rule ? r.rule.point : 0;
          return sum + point;
        }, 0);

        // Format chi tiết phiếu điểm của học sinh
        const formattedRecords = studentRecords.map((r: any) => ({
          idRecordForm: r.idRecordForm,
          time: r.time, // Thời gian lập
          content: r.rule ? r.rule.content : 'Không có nội dung', // Nội dung từ Rule
          point: r.rule ? r.rule.point : 0,
          creator: r.user
            ? {
                idUser: r.user.idUser,
                firstName: r.user.firstName,
                lastName: r.user.lastName,
              }
            : null,
        }));

        return {
          idStudent: stu.idStudent,
          firstName: stu.firstName,
          lastName: stu.lastName,
          totalPoint: totalStudentPoint,
          records: formattedRecords,
        };
      });

      // D. Format thông tin GVCN
      const homeroomTeacher = cls.teacher
        ? {
            idTeacher: cls.teacher.idTeacher,
            firstName: cls.teacher.firstName,
            lastName: cls.teacher.lastName,
            email: cls.teacher.email,
          }
        : null;

      return {
        idClass: cls.idClass,
        className: cls.name,
        totalClassPoint: totalClassPoint,
        homeroomTeacher: homeroomTeacher,
        students: processedStudents,
      };
    });

    // 5. Trả về kết quả
    return res.status(200).json({
      userInfo: {
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        email: user.email,
        // Lưu ý: User Schema của bạn không có trường liên kết trực tiếp với Class (như học sinh)
        // nên nếu user là Teacher/Student, cần query thêm bảng tương ứng nếu muốn lấy lớp chủ nhiệm/lớp đang học.
        // Ở đây tôi trả về thông tin cơ bản của User.
      },
      monitoredClasses: processedClasses,
    });
  } catch (error: any) {
    console.error('Error in getTrackingReport:', error);
    return res.status(500).json({ message: 'Lỗi Server', error: error.message });
  }
};
