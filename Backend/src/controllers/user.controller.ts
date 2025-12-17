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
    const { firstName, lastName, email, password, role, idUser } = req.body;

    if (!firstName || !lastName || !email || !password || !role || !idUser) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc!' });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ status: 409, message: 'Email này đã được sử dụng!' });
    }

    const existingIdUser = await User.findOne({ idUser });
    if (existingIdUser) {
      return res
        .status(409)
        .json({ status: 409, message: `Mã người dùng '${idUser}' đã tồn tại!` });
    }

    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      role,
      idUser,
    });

    await newUser.save();

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
  const { firstName, lastName, email, role, idUser, password } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }
    // Kiểm tra nếu email hoặc idUser đã tồn tại ở người dùng khác
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
    // Cập nhật thông tin người dùng
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.role = role;
    user.idUser = idUser;
    if (password) {
      user.password = password;
    }
    await user.save();
    const userObject = user.toObject();
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
