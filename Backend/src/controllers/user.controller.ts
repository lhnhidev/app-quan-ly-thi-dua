import { Request, Response } from 'express';
import User from '../models/User';
import generateToken from '../utils/generateToken';

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
