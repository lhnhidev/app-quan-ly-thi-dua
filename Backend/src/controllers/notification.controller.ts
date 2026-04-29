import { Request, Response } from 'express';
import Notification from '../models/Notification';

export const getMyNotifications = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const currentUserId = String(currentUser?._id || '');

    const items = await Notification.find({ user: currentUserId, isRead: false })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(items || []);
  } catch (error) {
    console.error('getMyNotifications error:', error);
    return res.status(500).json({ message: 'Loi server khi tai thong bao' });
  }
};

export const markNotificationsRead = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const currentUserId = String(currentUser?._id || '');

    await Notification.updateMany({ user: currentUserId, isRead: false }, { $set: { isRead: true } });

    return res.status(200).json({ message: 'Da cap nhat thong bao' });
  } catch (error) {
    console.error('markNotificationsRead error:', error);
    return res.status(500).json({ message: 'Loi server khi cap nhat thong bao' });
  }
};
