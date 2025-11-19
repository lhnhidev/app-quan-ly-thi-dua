import { Request, Response } from 'express';
import User from '../models/User';
import crypto from 'crypto';
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
  // Mã người dùng sẽ có dạng USER-XXX
  const { firstName, lastName, email, password, role } = req.body;

  let idUser!: string;
  let userExists = true;
  while (userExists) {
    const randomPart = crypto.randomBytes(2).toString('hex').substring(0, 3).toUpperCase();
    idUser = `USER-${randomPart}`;
    const existingUser = await User.findOne({ idUser });
    if (!existingUser) {
      userExists = false;
    }
  }

  try {
    const newUser = new User({ firstName, lastName, email, password, role, idUser });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: 'Error creating user' });
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
