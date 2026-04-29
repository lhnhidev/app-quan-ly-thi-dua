/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';
import Organization from '../models/Organization';
import User from '../models/User';
import Class from '../models/Class';
import Student from '../models/Student';
import Teacher from '../models/Teacher';
import Role from '../models/Role';
import RecordForm from '../models/RecordForm';
import ResponseModel from '../models/Response';
import SocialMessage from '../models/SocialMessage';

const LEGACY_ORG_NAME = 'THPT Dân Tộc Nội Trú Bạc Liêu';

const normalizeRole = (role: string) => {
  const value = String(role || '').toLowerCase();
  if (value === 'admin') return 'admin';
  if (value === 'teacher') return 'teacher';
  if (value === 'student') return 'student';
  return 'redflag';
};

const dropIndexIfExists = async (model: any, indexName: string) => {
  try {
    const indexes = await model.collection.indexes();
    const found = indexes.some((idx: any) => idx.name === indexName);
    if (found) {
      await model.collection.dropIndex(indexName);
    }
  } catch (error) {
    console.warn(`Drop index ${indexName} failed:`, error);
  }
};

const findLegacyAdmin = async () => {
  const ngocHon = await User.findOne({
    $and: [
      { firstName: { $regex: /(hơn|hon)/i } },
      { lastName: { $regex: /(ngọc|ngoc)/i } },
    ],
  })
    .select('_id role')
    .lean();

  if (ngocHon) return ngocHon as any;

  const anyAdmin = await User.findOne({ role: 'admin' }).select('_id role').lean();
  if (anyAdmin) return anyAdmin as any;

  return User.findOne({}).select('_id role').lean();
};

export const bootstrapLegacyOrganization = async () => {
  await Promise.all([
    dropIndexIfExists(Class, 'idClass_1'),
    dropIndexIfExists(Student, 'idStudent_1'),
    dropIndexIfExists(Teacher, 'idTeacher_1'),
    dropIndexIfExists(Teacher, 'email_1'),
    dropIndexIfExists(Role, 'idRule_1'),
    dropIndexIfExists(RecordForm, 'idRecordForm_1'),
  ]);

  await Promise.all([
    Class.syncIndexes(),
    Student.syncIndexes(),
    Teacher.syncIndexes(),
    Role.syncIndexes(),
    RecordForm.syncIndexes(),
    ResponseModel.syncIndexes(),
    SocialMessage.syncIndexes(),
  ]);

  const admin = await findLegacyAdmin();
  if (!admin?._id) return;

  let organization = await Organization.findOne({ name: LEGACY_ORG_NAME });
  if (!organization) {
    organization = await Organization.create({
      name: LEGACY_ORG_NAME,
      shortName: 'DTNT Bac Lieu',
      description: 'Du lieu he thong cu duoc migrate vao day',
      allowJoinByInviteWithoutApproval: true,
      inviteCode: `DTNT${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      owner: admin._id,
      members: [
        {
          user: admin._id,
          role: 'admin',
          status: 'approved',
          joinedAt: new Date(),
        },
      ],
    });
  }

  const orgId = organization._id as mongoose.Types.ObjectId;

  await Promise.all([
    Class.updateMany({ organization: { $exists: false } }, { $set: { organization: orgId } }),
    Class.updateMany({ organization: null }, { $set: { organization: orgId } }),
    Student.updateMany({ organization: { $exists: false } }, { $set: { organization: orgId } }),
    Student.updateMany({ organization: null }, { $set: { organization: orgId } }),
    Teacher.updateMany({ organization: { $exists: false } }, { $set: { organization: orgId } }),
    Teacher.updateMany({ organization: null }, { $set: { organization: orgId } }),
    Role.updateMany({ organization: { $exists: false } }, { $set: { organization: orgId } }),
    Role.updateMany({ organization: null }, { $set: { organization: orgId } }),
    RecordForm.updateMany({ organization: { $exists: false } }, { $set: { organization: orgId } }),
    RecordForm.updateMany({ organization: null }, { $set: { organization: orgId } }),
    ResponseModel.updateMany({ organization: { $exists: false } }, { $set: { organization: orgId } }),
    ResponseModel.updateMany({ organization: null }, { $set: { organization: orgId } }),
    SocialMessage.updateMany({ organization: { $exists: false } }, { $set: { organization: orgId } }),
    SocialMessage.updateMany({ organization: null }, { $set: { organization: orgId } }),
  ]);

  const users = await User.find({}).select('_id role').lean();
  const existingMembers = new Set((organization.members || []).map((item: any) => String(item.user)));

  users.forEach((user: any) => {
    if (existingMembers.has(String(user._id))) return;

    organization.members.push({
      user: user._id,
      role: normalizeRole(user.role) as any,
      status: 'approved',
      joinedAt: new Date(),
    });
  });

  const ownerAsMember = organization.members.find((item: any) => String(item.user) === String(admin._id));
  if (ownerAsMember) {
    ownerAsMember.role = 'admin';
    ownerAsMember.status = 'approved';
    ownerAsMember.joinedAt = ownerAsMember.joinedAt || new Date();
  }

  if (String(organization.owner) !== String(admin._id)) {
    organization.owner = admin._id;
  }

  await organization.save();
};
