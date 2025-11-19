import { Request, Response } from 'express';

export const getRules = async (req: Request, res: Response) => {
  res.status(200).json({ message: 'Token hợp lệ' });
};
