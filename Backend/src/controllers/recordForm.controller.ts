import { Request, Response } from 'express';
import RecordForm from '../models/RecordForm';
import '../models/Student';
import '../models/Class';
import '../models/Role';
import '../models/User';
import Student from '../models/Student';
import Role from '../models/Role';
import Class from '../models/Class';

export const getRecordForms = async (req: Request, res: Response) => {
  const recordForms = await RecordForm.find({})
    .populate('student')
    .populate('class')
    .populate('rule')
    .populate('user')
    .exec();

  res.status(200).json(recordForms);
};

export const addRecordForm = async (req: Request, res: Response) => {
  try {
    const { user, student, classId, rule } = req.body;

    const allRecords = await RecordForm.find({}, 'idRecordForm');
    const existingNumbers = allRecords
      .map((record) => {
        const parts = record.idRecordForm.split('-');
        return parseInt(parts[1]);
      })
      .sort((a, b) => a - b);

    let nextIdNum = 1;
    for (const num of existingNumbers) {
      if (num === nextIdNum) {
        nextIdNum++;
      } else if (num > nextIdNum) {
        break;
      }
    }
    const newIdRecordForm = `RF-${String(nextIdNum).padStart(3, '0')}`;

    const ruleInfo = await Role.findById(rule);
    if (!ruleInfo) {
      return res.status(404).json({ message: 'Không tìm thấy quy định (Rule)' });
    }

    let pointToUpdate = ruleInfo.point;

    if (ruleInfo.type === false && pointToUpdate > 0) {
      pointToUpdate = -pointToUpdate;
    }
    if (ruleInfo.type === true && pointToUpdate < 0) {
      pointToUpdate = -pointToUpdate;
    }

    const newRecordForm = new RecordForm({
      idRecordForm: newIdRecordForm,
      user,
      student,
      class: classId,
      rule,
      time: new Date().toISOString().replace('Z', '+00:00'),
    });

    const savedRecordForm = await newRecordForm.save();

    await Promise.all([
      Student.findByIdAndUpdate(student, {
        $push: { recordForms: savedRecordForm._id },
      }),
      Class.findByIdAndUpdate(classId, {
        $inc: { point: pointToUpdate },
      }),
    ]);

    res.status(201).json(savedRecordForm);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi Server khi tạo phiếu thi đua' });
  }
};

export const deleteRecordForm = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const currentRecord = await RecordForm.findById(id).populate('rule');

    if (!currentRecord) {
      return res.status(404).json({ message: 'Không tìm thấy phiếu thi đua' });
    }

    let pointToRevert = 0;

    if (currentRecord.rule) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ruleInfo = currentRecord.rule as any;

      const point = ruleInfo.point;
      const type = ruleInfo.type;

      if (type === true) {
        pointToRevert = -Math.abs(point);
      } else {
        pointToRevert = Math.abs(point);
      }
    }

    await Promise.all([
      RecordForm.findByIdAndDelete(id),
      Student.findByIdAndUpdate(currentRecord.student, {
        $pull: { recordForms: id },
      }),
      Class.findByIdAndUpdate(currentRecord.class, {
        $inc: { point: pointToRevert },
      }),
    ]);

    res.status(200).json({ message: 'Xóa phiếu thành công và đã cập nhật lại điểm lớp' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi Server khi xóa phiếu' });
  }
};

export const modifyRecordForm = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user, student: newStudentId, classId: newClassId, rule: newRuleId } = req.body;

    const oldRecord = await RecordForm.findById(id).populate('rule');

    if (!oldRecord) {
      return res.status(404).json({ message: 'Không tìm thấy phiếu thi đua' });
    }

    const newRuleInfo = await Role.findById(newRuleId);
    if (!newRuleInfo) {
      return res.status(404).json({ message: 'Quy định mới không hợp lệ' });
    }

    const oldStudentId = oldRecord.student.toString();

    if (oldStudentId !== newStudentId) {
      await Promise.all([
        Student.findByIdAndUpdate(oldStudentId, {
          $pull: { recordForms: id },
        }),
        Student.findByIdAndUpdate(newStudentId, {
          $addToSet: { recordForms: id },
        }),
      ]);
    }

    let oldPointValue = 0;
    if (oldRecord.rule) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = oldRecord.rule as any;
      oldPointValue = r.type ? Math.abs(r.point) : -Math.abs(r.point);
    }

    const newPointValue = newRuleInfo.type
      ? Math.abs(newRuleInfo.point)
      : -Math.abs(newRuleInfo.point);

    const oldClassId = oldRecord.class.toString();

    if (oldClassId !== newClassId) {
      await Promise.all([
        Class.findByIdAndUpdate(oldClassId, {
          $inc: { point: -oldPointValue },
        }),
        Class.findByIdAndUpdate(newClassId, {
          $inc: { point: newPointValue },
        }),
      ]);
    } else {
      const pointDifference = newPointValue - oldPointValue;

      if (pointDifference !== 0) {
        await Class.findByIdAndUpdate(oldClassId, {
          $inc: { point: pointDifference },
        });
      }
    }

    const updatedRecord = await RecordForm.findByIdAndUpdate(
      id,
      {
        user,
        student: newStudentId,
        class: newClassId,
        rule: newRuleId,
      },
      { new: true }
    )
      .populate('user')
      .populate('student')
      .populate('class')
      .populate('rule');

    res.status(200).json(updatedRecord);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi Server khi cập nhật phiếu' });
  }
};
