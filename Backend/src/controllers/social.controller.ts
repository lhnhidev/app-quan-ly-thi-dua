/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Student from '../models/Student';
import Teacher from '../models/Teacher';
import SocialMessage from '../models/SocialMessage';
import { getCloudinary } from '../config/cloudinary';
import { emitToUser } from '../config/socket';

const RECALL_UNDO_WINDOW_MS = 5000;
const recallFinalizeTimers = new Map<string, NodeJS.Timeout>();

const clearRecallFinalizeTimer = (messageId: string) => {
  const timer = recallFinalizeTimers.get(messageId);
  if (timer) {
    clearTimeout(timer);
    recallFinalizeTimers.delete(messageId);
  }
};

const finalizeRecalledMessage = async (messageId: string) => {
  clearRecallFinalizeTimer(messageId);

  const message = await SocialMessage.findById(messageId);
  if (!message || !message.recalled || !message.recallUndoAvailable) {
    return;
  }

  const backupAttachments = Array.isArray((message as any).recalledBackupAttachments)
    ? (message as any).recalledBackupAttachments
    : [];

  if (backupAttachments.length > 0) {
    const cloudinary = getCloudinary();
    await Promise.all(
      backupAttachments.map(async (attachment: any) => {
        try {
          await cloudinary.uploader.destroy(attachment.publicId, {
            resource_type: attachment.resourceType || 'auto',
          });
        } catch (error) {
          console.error('Finalize recalled attachment destroy error:', error);
        }
      })
    );
  }

  (message as any).recallUndoAvailable = false;
  (message as any).recalledBackupText = '';
  (message as any).recalledBackupAttachments = [];
  await message.save();
};

const scheduleRecallFinalize = (messageId: string) => {
  clearRecallFinalizeTimer(messageId);
  const timer = setTimeout(() => {
    void finalizeRecalledMessage(messageId);
  }, RECALL_UNDO_WINDOW_MS);
  recallFinalizeTimers.set(messageId, timer);
};

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
    const currentUserObjectId = new mongoose.Types.ObjectId(String(currentUser._id));

    const [users, students, teachers, conversationSnapshots] = await Promise.all([
      User.find({ _id: { $ne: currentUser._id } })
        .select('firstName lastName email role idUser avatar avatarUrl isOnline lastSeenAt')
        .lean(),
      Student.find({}).populate('class', 'name').lean(),
      Teacher.find({}).populate('idClass', 'name').lean(),
      SocialMessage.aggregate([
        {
          $match: {
            $or: [{ sender: currentUserObjectId }, { receiver: currentUserObjectId }],
          },
        },
        {
          $project: {
            createdAt: 1,
            peerId: {
              $cond: [
                { $eq: ['$sender', currentUserObjectId] },
                '$receiver',
                '$sender',
              ],
            },
          },
        },
        {
          $group: {
            _id: '$peerId',
            lastInteractedAt: { $max: '$createdAt' },
          },
        },
      ]),
    ]);

    const lastInteractedByPeer = new Map<string, Date>();
    for (const snapshot of conversationSnapshots) {
      lastInteractedByPeer.set(String(snapshot._id), snapshot.lastInteractedAt);
    }

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
        lastInteractedAt: lastInteractedByPeer.get(String(user._id)) || null,
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
      const timeA = a.lastInteractedAt ? new Date(a.lastInteractedAt).getTime() : 0;
      const timeB = b.lastInteractedAt ? new Date(b.lastInteractedAt).getTime() : 0;

      if (timeA !== timeB) return timeB - timeA;
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

    const unreadIncoming = await SocialMessage.find({
      sender: peerId,
      receiver: currentUser._id,
      seen: false,
    })
      .select('_id')
      .lean();

    if (unreadIncoming.length > 0) {
      const now = new Date();
      const unreadIds = unreadIncoming.map((item: any) => item._id);

      await SocialMessage.updateMany(
        { _id: { $in: unreadIds } },
        {
          seen: true,
          seenAt: now,
          delivered: true,
          deliveredAt: now,
        }
      );

      emitToUser(String(peerId), 'social:message-status', {
        fromUserId: String(currentUser._id),
        status: 'read',
        messageIds: unreadIds.map((id: any) => String(id)),
        updatedAt: now,
      });
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

    const receiver = await User.findById(toUserId).select('_id isOnline');
    if (!receiver) {
      return res.status(404).json({ message: 'Người nhận không tồn tại' });
    }

    const files = ((req.files as Express.Multer.File[]) || []) as Express.Multer.File[];
    const attachments = await uploadFilesToCloudinary(files);

    if (!text && attachments.length === 0) {
      return res.status(400).json({ message: 'Tin nhắn cần có nội dung text hoặc tệp đính kèm' });
    }

    const deliveredNow = Boolean((receiver as any).isOnline);
    const now = new Date();

    const message = await SocialMessage.create({
      sender: currentUser._id,
      receiver: toUserId,
      text,
      attachments,
      delivered: deliveredNow,
      deliveredAt: deliveredNow ? now : null,
      seen: false,
      seenAt: null,
      recalled: false,
      recalledAt: null,
      recallUndoAvailable: false,
      recalledBackupText: '',
      recalledBackupAttachments: [],
    });

    const populated = await SocialMessage.findById(message._id)
      .populate('sender', 'firstName lastName email avatar avatarUrl role idUser')
      .populate('receiver', 'firstName lastName email avatar avatarUrl role idUser')
      .lean();

    emitToUser(String(toUserId), 'social:message', populated);
    emitToUser(String(currentUser._id), 'social:message', populated);

    if (deliveredNow) {
      emitToUser(String(currentUser._id), 'social:message-status', {
        fromUserId: String(toUserId),
        status: 'delivered',
        messageIds: [String(message._id)],
        updatedAt: now,
      });
    }

    return res.status(201).json(populated);
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ message: 'Lỗi Server khi gửi tin nhắn' });
  }
};

export const recallMessage = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const messageId = String(req.params.messageId || '').trim();

    if (!messageId) {
      return res.status(400).json({ message: 'Thiếu messageId' });
    }

    const message = await SocialMessage.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Tin nhắn không tồn tại' });
    }

    if (String(message.sender) !== String(currentUser._id)) {
      return res.status(403).json({ message: 'Bạn chỉ có thể thu hồi tin nhắn của chính mình' });
    }

    if (message.recalled) {
      const populatedExisting = await SocialMessage.findById(message._id)
        .populate('sender', 'firstName lastName email avatar avatarUrl role idUser')
        .populate('receiver', 'firstName lastName email avatar avatarUrl role idUser')
        .lean();
      return res.status(200).json(populatedExisting);
    }

    const backupText = String(message.text || '');
    const backupAttachments = Array.isArray(message.attachments) ? [...message.attachments] : [];

    message.recalled = true;
    message.recalledAt = new Date();
    (message as any).recallUndoAvailable = true;
    (message as any).recalledBackupText = backupText;
    (message as any).recalledBackupAttachments = backupAttachments;
    message.text = '';
    message.attachments = [];
    await message.save();
    scheduleRecallFinalize(String(message._id));

    const populated = await SocialMessage.findById(message._id)
      .populate('sender', 'firstName lastName email avatar avatarUrl role idUser')
      .populate('receiver', 'firstName lastName email avatar avatarUrl role idUser')
      .lean();

    emitToUser(String(message.sender), 'social:message-recalled', populated);
    emitToUser(String(message.receiver), 'social:message-recalled', populated);

    return res.status(200).json(populated);
  } catch (error) {
    console.error('Recall message error:', error);
    return res.status(500).json({ message: 'Lỗi Server khi thu hồi tin nhắn' });
  }
};

export const undoRecallMessage = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const messageId = String(req.params.messageId || '').trim();

    if (!messageId) {
      return res.status(400).json({ message: 'Thiếu messageId' });
    }

    const message = await SocialMessage.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Tin nhắn không tồn tại' });
    }

    if (String(message.sender) !== String(currentUser._id)) {
      return res.status(403).json({ message: 'Bạn chỉ có thể hoàn tác tin nhắn của chính mình' });
    }

    if (!message.recalled || !(message as any).recallUndoAvailable) {
      return res.status(400).json({ message: 'Tin nhắn không ở trạng thái có thể hoàn tác' });
    }

    const recalledAtTime = message.recalledAt ? new Date(message.recalledAt).getTime() : 0;
    if (!recalledAtTime || Date.now() - recalledAtTime > RECALL_UNDO_WINDOW_MS) {
      await finalizeRecalledMessage(String(message._id));
      return res.status(400).json({ message: 'Đã quá thời gian 5 giây để hoàn tác' });
    }

    clearRecallFinalizeTimer(String(message._id));

    message.recalled = false;
    message.recalledAt = null;
    message.text = String((message as any).recalledBackupText || '');
    message.attachments = Array.isArray((message as any).recalledBackupAttachments)
      ? (message as any).recalledBackupAttachments
      : [];
    (message as any).recallUndoAvailable = false;
    (message as any).recalledBackupText = '';
    (message as any).recalledBackupAttachments = [];
    await message.save();

    const populated = await SocialMessage.findById(message._id)
      .populate('sender', 'firstName lastName email avatar avatarUrl role idUser')
      .populate('receiver', 'firstName lastName email avatar avatarUrl role idUser')
      .lean();

    emitToUser(String(message.sender), 'social:message-unrecalled', populated);
    emitToUser(String(message.receiver), 'social:message-unrecalled', populated);

    return res.status(200).json(populated);
  } catch (error) {
    console.error('Undo recall message error:', error);
    return res.status(500).json({ message: 'Lỗi Server khi hoàn tác thu hồi tin nhắn' });
  }
};
