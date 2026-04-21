/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import PendingRegistration from '../models/PendingRegistration';
import generateToken from '../utils/generateToken';
import { sendOtpEmail } from '../utils/mailService';

const OTP_EXPIRES_MINUTES = 5;

const buildOtp = () => `${Math.floor(100000 + Math.random() * 900000)}`;

const normalizeEmail = (email: string) => String(email || '').trim().toLowerCase();

const generateUniqueIdUser = async () => {
  let candidate = '';
  let exists = true;

  while (exists) {
    candidate = `USR${Date.now().toString().slice(-8)}${Math.floor(100 + Math.random() * 900)}`;
    const found = await User.findOne({ idUser: candidate }).select('_id').lean();
    exists = Boolean(found);
  }

  return candidate;
};

export const requestRegisterOtp = async (req: Request, res: Response) => {
  try {
    const firstName = String(req.body?.firstName || '').trim();
    const lastName = String(req.body?.lastName || '').trim();
    const email = normalizeEmail(req.body?.email || '');
    const password = String(req.body?.password || '');

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Vui long nhap day du thong tin dang ky' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Mat khau phai co it nhat 6 ky tu' });
    }

    const existingUser = await User.findOne({ email }).select('_id').lean();
    if (existingUser) {
      return res.status(409).json({ message: 'Email da ton tai trong he thong' });
    }

    const otpCode = buildOtp();
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);
    const passwordHash = await bcrypt.hash(password, 10);

    await PendingRegistration.findOneAndUpdate(
      { email },
      {
        firstName,
        lastName,
        email,
        passwordHash,
        otpCode,
        otpExpiresAt,
        attempts: 0,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendOtpEmail(email, otpCode);

    return res.status(200).json({
      message: 'Da gui OTP den email cua ban',
      email,
      expiresInSeconds: OTP_EXPIRES_MINUTES * 60,
    });
  } catch (error) {
    console.error('requestRegisterOtp error:', error);
    return res.status(500).json({ message: 'Loi server khi gui OTP dang ky' });
  }
};

export const verifyRegisterOtp = async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body?.email || '');
    const otp = String(req.body?.otp || '').trim();

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email va OTP la bat buoc' });
    }

    const pending = await PendingRegistration.findOne({ email });
    if (!pending) {
      return res.status(404).json({ message: 'Khong tim thay yeu cau dang ky' });
    }

    if (!pending.otpExpiresAt || pending.otpExpiresAt.getTime() < Date.now()) {
      await PendingRegistration.deleteOne({ email });
      return res.status(400).json({ message: 'OTP da het han, vui long dang ky lai' });
    }

    if (pending.otpCode !== otp) {
      pending.attempts = Number(pending.attempts || 0) + 1;
      await pending.save();
      return res.status(400).json({ message: 'OTP khong hop le' });
    }

    const existingUser = await User.findOne({ email }).select('_id').lean();
    if (existingUser) {
      await PendingRegistration.deleteOne({ email });
      return res.status(409).json({ message: 'Email da ton tai trong he thong' });
    }

    const idUser = await generateUniqueIdUser();

    const user = await User.create({
      firstName: pending.firstName,
      lastName: pending.lastName,
      email,
      password: pending.passwordHash,
      role: 'user',
      idUser,
      isEmailVerified: true,
    });

    await PendingRegistration.deleteOne({ email });

    return res.status(201).json({
      _id: user._id,
      idUser: user.idUser,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id.toString()),
    });
  } catch (error) {
    console.error('verifyRegisterOtp error:', error);
    return res.status(500).json({ message: 'Loi server khi xac thuc OTP' });
  }
};

export const resendRegisterOtp = async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body?.email || '');

    if (!email) {
      return res.status(400).json({ message: 'Email la bat buoc' });
    }

    const pending = await PendingRegistration.findOne({ email });
    if (!pending) {
      return res.status(404).json({ message: 'Khong tim thay yeu cau dang ky' });
    }

    const otpCode = buildOtp();
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

    pending.otpCode = otpCode;
    pending.otpExpiresAt = otpExpiresAt;
    pending.attempts = 0;
    await pending.save();

    await sendOtpEmail(email, otpCode);

    return res.status(200).json({
      message: 'Da gui lai OTP',
      email,
      expiresInSeconds: OTP_EXPIRES_MINUTES * 60,
    });
  } catch (error) {
    console.error('resendRegisterOtp error:', error);
    return res.status(500).json({ message: 'Loi server khi gui lai OTP' });
  }
};
