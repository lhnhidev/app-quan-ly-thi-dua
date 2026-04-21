/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { type UserType } from '../models/User';
import Organization from '../models/Organization';

interface DecodedToken {
  id: string;
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;

      (req as any).user = (await User.findById(decoded.id).select('-password')) as UserType;

      if (!(req as any).user) {
        res
          .status(401)
          .json({ message: 'Không được phép truy cập, Token hợp lệ nhưng User không tồn tại' });
        return;
      }

      const activeOrganizationId = String(req.headers['x-organization-id'] || '').trim();
      if (activeOrganizationId) {
        const membership = await Organization.findOne({
          _id: activeOrganizationId,
          members: {
            $elemMatch: {
              user: (req as any).user._id,
              status: 'approved',
            },
          },
        })
          .select('_id')
          .lean();

        if (!membership) {
          res.status(403).json({ message: 'Ban khong co quyen truy cap to chuc nay' });
          return;
        }

        (req as any).organizationId = activeOrganizationId;
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Không được phép truy cập, Token không hợp lệ' });
      return;
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Không được phép truy cập, yêu cầu Token' });
    return;
  }
};
