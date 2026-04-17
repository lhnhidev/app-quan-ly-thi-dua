/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import User from '../models/User';
import Student from '../models/Student';
import Teacher from '../models/Teacher';
import SocialMessage from '../models/SocialMessage';
import { getCloudinary } from '../config/cloudinary';
import { emitToUser } from '../config/socket';

const normalize = (value: string) => value.toLowerCase().trim();

const ensureAvatar = (user: any) => {
  if (user?.avatarUrl) return user.avatarUrl;
  if (user?.avatar) return user.avatar;
  const fullName = `${user?.lastName || ''} ${user?.firstName || ''}`.trim() || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=1f5ca9&color=fff&size=128`;
};

export const getSocialUsers = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const q = normalize(String(req.query.q || ''));

    const [users, students, teachers] = await Promise.all([
      User.find({ _id: { $ne: currentUser._id } })
        .select('firstName lastName email role idUser avatar avatarUrl isOnline lastSeenAt')
        .lean(),
      Student.find({}).populate('class', 'name').lean(),
      Teacher.find({}).populate('idClass', 'name').lean(),
    ]);

    const studentById = new Map<string, any>();
    for (const item of students) {
      studentById.set(String(item.idStudent || '').toUpperCase(), item);
    }

    const teacherById = new Map<string, any>();
    for (const item of teachers) {
      teacherById.set(String(item.idTeacher || '').toUpperCase(), item);
    }

    const mapped = users.map((user: any) => {
      const idUser = String(user.idUser || '').toUpperCase();
      const matchedStudent = studentById.get(idUser);
      const matchedTeacher = teacherById.get(idUser);

      const className =
        matchedStudent?.class?.name || matchedTeacher?.idClass?.name || (user.role === 'admin' ? 'Ban quản trị' : '---');

      const studentCode = matchedStudent?.idStudent || '';
      const teacherCode = matchedTeacher?.idTeacher || '';

      return {
        _id: String(user._id),
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.lastName || ''} ${user.firstName || ''}`.trim(),
        email: user.email,
        role: user.role,
        idUser: user.idUser,
        idStudent: studentCode,
        idTeacher: teacherCode,
        className,
        isOnline: Boolean(user.isOnline),
        lastSeenAt: user.lastSeenAt || user.updatedAt || null,
        avatarUrl: ensureAvatar(user),
      };
    });

    const filtered = q
      ? mapped.filter((item) => {
          const haystack = [
            item.fullName,
            item.email,
            item.className,
            item.idUser,
            item.idStudent,
            item.idTeacher,
          ]
            .join(' ')
            .toLowerCase();

          return haystack.includes(q);
        })
      : mapped;

    filtered.sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      return a.fullName.localeCompare(b.fullName);
    });

    return res.status(200).json(filtered);
  } catch (error) {
    console.error('Get social users error:', error);
    return res.status(500).json({ message: 'Lỗi Server khi tải danh bạ người dùng' });
  }
};

export const getMessagesByPeer = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const peerId = String(req.params.peerId || '');

    if (!peerId) {
      return res.status(400).json({ message: 'Thiếu peerId' });
    }

    const messages = await SocialMessage.find({
      $or: [
        { sender: currentUser._id, receiver: peerId },
        { sender: peerId, receiver: currentUser._id },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'firstName lastName email avatar avatarUrl role idUser')
      .populate('receiver', 'firstName lastName email avatar avatarUrl role idUser')
      .lean();

    await SocialMessage.updateMany(
      {
        sender: peerId,
        receiver: currentUser._id,
        seen: false,
      },
      { seen: true }
    );

    return res.status(200).json(messages);
  } catch (error) {
    console.error('Get messages by peer error:', error);
    return res.status(500).json({ message: 'Lỗi Server khi tải tin nhắn' });
  }
};

const uploadFilesToCloudinary = async (files: Express.Multer.File[]) => {
  if (!files || files.length === 0) return [];

  const cloudinary = getCloudinary();

  const uploaded = await Promise.all(
    files.map(
      (file) =>
        new Promise<any>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: process.env.CLOUDINARY_CHAT_FOLDER || 'app-thi-dua/chat',
              resource_type: 'auto',
              public_id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
            },
            (error, result) => {
              if (error || !result) {
                reject(error || new Error('Upload tệp thất bại'));
                return;
              }

              resolve(result);
            }
          );

          stream.end(file.buffer);
        })
    )
  );

  return uploaded.map((item, index) => {
    const file = files[index];

    return {
      url: item.secure_url,
      publicId: item.public_id,
      fileName: file.originalname,
      mimeType: file.mimetype,
      resourceType: item.resource_type || 'raw',
      size: file.size,
    };
  });
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const toUserId = String(req.body.toUserId || '').trim();
    const text = String(req.body.text || '').trim();

    if (!toUserId) {
      return res.status(400).json({ message: 'Thiếu người nhận tin nhắn' });
    }

    if (toUserId === String(currentUser._id)) {
      return res.status(400).json({ message: 'Không thể tự gửi tin nhắn cho chính mình' });
    }

    const receiver = await User.findById(toUserId).select('_id');
    if (!receiver) {
      return res.status(404).json({ message: 'Người nhận không tồn tại' });
    }

    const files = ((req.files as Express.Multer.File[]) || []) as Express.Multer.File[];
    const attachments = await uploadFilesToCloudinary(files);

    if (!text && attachments.length === 0) {
      return res.status(400).json({ message: 'Tin nhắn cần có nội dung text hoặc tệp đính kèm' });
    }

    const message = await SocialMessage.create({
      sender: currentUser._id,
      receiver: toUserId,
      text,
      attachments,
      seen: false,
    });

    const populated = await SocialMessage.findById(message._id)
      .populate('sender', 'firstName lastName email avatar avatarUrl role idUser')
      .populate('receiver', 'firstName lastName email avatar avatarUrl role idUser')
      .lean();

    emitToUser(String(toUserId), 'social:message', populated);
    emitToUser(String(currentUser._id), 'social:message', populated);

    return res.status(201).json(populated);
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ message: 'Lỗi Server khi gửi tin nhắn' });
  }
};
