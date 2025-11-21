import { Request, Response } from 'express';
import Role from '../models/Role';

export const getRoles = async (req: Request, res: Response) => {
  const roleList = await Role.find({});
  res.status(200).json(roleList);
};

const generateNextIdRule = async () => {
  const roles = await Role.find({}, 'idRule');

  const numbers = roles
    .map((role) => {
      const numPart = role.idRule.replace('RL-', '');
      return parseInt(numPart, 10);
    })
    .sort((a, b) => a - b);

  let nextNum = 1;
  for (const num of numbers) {
    if (num === nextNum) {
      nextNum++;
    } else if (num > nextNum) {
      break;
    }
  }

  const suffix = String(nextNum).padStart(3, '0');
  return `RL-${suffix}`;
};

export const addRole = async (req: Request, res: Response) => {
  try {
    const { content, point, type } = req.body;

    if (!content || point === undefined || type === undefined) {
      return res.status(400).json({ message: 'Vui lòng nhập đủ content, point và type' });
    }

    const newIdRule = await generateNextIdRule();

    const newRole = new Role({
      idRule: newIdRule,
      content,
      point,
      type,
    });

    await newRole.save();

    return res.status(201).json({
      message: 'Tạo Thang điểm mới thành công',
      data: newRole,
    });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, point, type } = req.body;

    const updatedRole = await Role.findByIdAndUpdate(
      id,
      { content, point, type },
      { new: true, runValidators: true }
    );

    if (!updatedRole) {
      return res.status(404).json({ message: 'Không tìm thấy Role để cập nhật' });
    }

    return res.status(200).json({
      message: 'Cập nhật Thang điểm thành công',
      data: updatedRole,
    });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedRole = await Role.findByIdAndDelete(id);

    if (!deletedRole) {
      return res.status(404).json({ message: 'Không tìm thấy Role để xóa' });
    }

    return res.status(200).json({
      message: `Đã xóa Thang điểm ${deletedRole.idRule} thành công`,
    });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};
