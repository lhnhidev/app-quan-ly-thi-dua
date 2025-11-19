import { Request, Response } from 'express';

export const getDashboardData = async (req: Request, res: Response) => {
  res.status(200).json({ message: 'Chào mừng đến Dashboard' });
};
