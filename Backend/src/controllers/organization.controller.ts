/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import Organization from '../models/Organization';

const roleMap: Record<string, string> = {
  user: 'redflag',
  teacher: 'teacher',
  student: 'student',
  admin: 'admin',
};

const randomInviteCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const buildUniqueInviteCode = async () => {
  let code = '';
  let exists = true;

  while (exists) {
    code = randomInviteCode();
    const found = await Organization.findOne({ inviteCode: code }).select('_id').lean();
    exists = Boolean(found);
  }

  return code;
};

const getMyRoleInOrganization = (org: any, userId: string) => {
  const member = (org.members || []).find((item: any) => String(item.user) === String(userId));
  return member ? member.role : null;
};

export const getMyOrganizations = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const currentUserId = String(currentUser?._id || '');

    const organizations = await Organization.find({ 'members.user': currentUserId })
      .select('name shortName description address allowJoinByInviteWithoutApproval inviteCode owner members createdAt')
      .lean();

    const mapped = organizations
      .map((org: any) => {
        const member = (org.members || []).find((item: any) => String(item.user) === currentUserId);
        if (!member) return null;

        return {
          _id: String(org._id),
          name: org.name,
          shortName: org.shortName,
          description: org.description,
          address: org.address,
          inviteCode: org.inviteCode,
          allowJoinByInviteWithoutApproval: Boolean(org.allowJoinByInviteWithoutApproval),
          role: member.role,
          status: member.status,
          joinedAt: member.joinedAt,
          createdAt: org.createdAt,
          isOwner: String(org.owner) === currentUserId,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => {
        const joinedA = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
        const joinedB = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
        if (joinedA !== joinedB) return joinedB - joinedA;
        return String(a.name || '').localeCompare(String(b.name || ''));
      });

    return res.status(200).json(mapped);
  } catch (error) {
    console.error('getMyOrganizations error:', error);
    return res.status(500).json({ message: 'Loi server khi tai danh sach to chuc' });
  }
};

export const createOrganization = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const currentUserId = String(currentUser?._id || '');

    const name = String(req.body?.name || '').trim();
    const shortName = String(req.body?.shortName || '').trim();
    const description = String(req.body?.description || '').trim();
    const address = String(req.body?.address || '').trim();
    const website = String(req.body?.website || '').trim();
    const contactEmail = String(req.body?.contactEmail || '').trim();
    const contactPhone = String(req.body?.contactPhone || '').trim();
    const allowJoinByInviteWithoutApproval = Boolean(req.body?.allowJoinByInviteWithoutApproval);

    if (!name) {
      return res.status(400).json({ message: 'Ten to chuc la bat buoc' });
    }

    const inviteCode = await buildUniqueInviteCode();

    const organization = await Organization.create({
      name,
      shortName,
      description,
      address,
      website,
      contactEmail,
      contactPhone,
      allowJoinByInviteWithoutApproval,
      inviteCode,
      owner: currentUserId,
      members: [
        {
          user: currentUserId,
          role: 'admin',
          status: 'approved',
          joinedAt: new Date(),
        },
      ],
    });

    return res.status(201).json({
      _id: organization._id,
      name: organization.name,
      shortName: organization.shortName,
      description: organization.description,
      address: organization.address,
      website: organization.website,
      contactEmail: organization.contactEmail,
      contactPhone: organization.contactPhone,
      allowJoinByInviteWithoutApproval: organization.allowJoinByInviteWithoutApproval,
      inviteCode: organization.inviteCode,
      role: 'admin',
      status: 'approved',
      joinedAt: new Date(),
      isOwner: true,
    });
  } catch (error) {
    console.error('createOrganization error:', error);
    return res.status(500).json({ message: 'Loi server khi tao to chuc' });
  }
};

export const joinOrganizationByInviteCode = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const currentUserId = String(currentUser?._id || '');
    const inviteCode = String(req.params?.inviteCode || '').trim().toUpperCase();

    if (!inviteCode) {
      return res.status(400).json({ message: 'Ma moi la bat buoc' });
    }

    const organization = await Organization.findOne({ inviteCode });
    if (!organization) {
      return res.status(404).json({ message: 'Khong tim thay to chuc voi ma moi nay' });
    }

    const existingMember = organization.members.find((item: any) => String(item.user) === currentUserId);
    if (existingMember) {
      return res.status(200).json({
        message:
          existingMember.status === 'approved'
            ? 'Ban da la thanh vien cua to chuc nay'
            : 'Yeu cau tham gia cua ban dang cho duyet',
        status: existingMember.status,
      });
    }

    const roleFromUser = roleMap[String(currentUser.role || '').toLowerCase()] || 'student';
    const autoApprove = Boolean(organization.allowJoinByInviteWithoutApproval);

    organization.members.push({
      user: currentUserId as any,
      role: roleFromUser as any,
      status: autoApprove ? 'approved' : 'pending',
      ...(autoApprove ? { joinedAt: new Date() } : {}),
    });

    await organization.save();

    return res.status(200).json({
      message: autoApprove ? 'Tham gia to chuc thanh cong' : 'Da gui yeu cau tham gia, vui long cho duyet',
      status: autoApprove ? 'approved' : 'pending',
      role: roleFromUser,
    });
  } catch (error) {
    console.error('joinOrganizationByInviteCode error:', error);
    return res.status(500).json({ message: 'Loi server khi tham gia to chuc' });
  }
};

export const approveOrganizationMember = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const orgId = String(req.params?.orgId || '').trim();
    const memberUserId = String(req.params?.memberUserId || '').trim();

    if (!orgId || !memberUserId) {
      return res.status(400).json({ message: 'Thieu thong tin orgId hoac memberUserId' });
    }

    const organization = await Organization.findById(orgId);
    if (!organization) {
      return res.status(404).json({ message: 'Khong tim thay to chuc' });
    }

    const myRole = getMyRoleInOrganization(organization, String(currentUser._id));
    if (myRole !== 'admin') {
      return res.status(403).json({ message: 'Ban khong co quyen duyet thanh vien' });
    }

    const member = organization.members.find((item: any) => String(item.user) === memberUserId);
    if (!member) {
      return res.status(404).json({ message: 'Khong tim thay thanh vien can duyet' });
    }

    member.status = 'approved';
    member.joinedAt = new Date();
    await organization.save();

    return res.status(200).json({ message: 'Duyet thanh vien thanh cong' });
  } catch (error) {
    console.error('approveOrganizationMember error:', error);
    return res.status(500).json({ message: 'Loi server khi duyet thanh vien' });
  }
};
