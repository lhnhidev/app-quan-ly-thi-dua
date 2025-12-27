/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import ResponseModel from '../models/Response';
import RecordFormModel from '../models/RecordForm';
import User from '../models/User';

export const addResponse = async (req: Request, res: Response) => {
  try {
    // 1. Nhận dữ liệu từ Client (Lưu ý: Client KHÔNG cần gửi state hay responseOfAdmin)
    const { idRecordForm, idUser, firstName, lastName, email, content } = req.body;

    // Validate dữ liệu đầu vào
    if (!content || !idRecordForm || !idUser || !firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc.',
      });
    }

    // 2. Tìm _id thật của RecordForm dựa trên mã hiển thị (ví dụ "RF-005")
    // Giả sử trường lưu mã "RF-005" trong db tên là 'idRecordForm' (hoặc 'code')
    const recordForm = await RecordFormModel.findOne({ idRecordForm: idRecordForm });

    if (!recordForm) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy phiếu điểm với mã: ${idRecordForm}`,
      });
    }

    const user = await User.findOne({ idUser: idUser });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy người dùng với mã: ${idUser}`,
      });
    }

    // 3. Tạo Response mới
    // KHÔNG cần truyền 'state' và 'responseOfAdmin' ở đây,
    // Schema sẽ tự set default là 'chờ xử lý' và ''
    const newResponse = new ResponseModel({
      idRecordForm: recordForm._id,
      idUser: user._id,
      recordForm: idRecordForm,
      user: idUser,
      firstName,
      lastName,
      email,
      content,
      state: 'chờ xử lý',
      responseOfAdmin: '',
    });

    // 4. Lưu vào Database
    const savedResponse = await newResponse.save();

    return res.status(201).json({
      success: true,
      message: 'Gửi phản hồi thành công!',
      data: savedResponse,
    });
  } catch (error: any) {
    console.error('Lỗi khi thêm phản hồi:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server nội bộ.',
      error: error.message,
    });
  }
};

export const getResponseList = async (req: Request, res: Response) => {
  try {
    const responses = await ResponseModel.find()
      .populate({
        path: 'idRecordForm', // 1. Populate trường idRecordForm trước
        populate: [
          // 2. Tiếp tục populate các trường nằm bên trong idRecordForm
          { path: 'user' },
          { path: 'class' },
          { path: 'rule' },
          { path: 'student' }, // Mình thêm cái này vì thấy trong JSON của bạn cũng có field student
        ],
      })
      .populate('idUser');
    return res.status(200).json({
      success: true,
      data: responses,
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách phản hồi:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server nội bộ.',
      error: error.message,
    });
  }
};

interface ChangeResponseBody {
  type: boolean; // true: Chấp nhận, false: Từ chối
  desc: string; // Nội dung phản hồi của admin
}

export const changeResponse = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    // Ép kiểu body
    const { type, desc } = req.body as ChangeResponseBody;

    // Validate
    if (typeof type !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: "Trường 'type' phải là boolean (true/false).",
      });
    }

    const newStateStr: string = type ? 'Chấp nhận' : 'Từ chối';

    // --- SỬA LỖI TẠI ĐÂY: DÙNG $set ---
    const updatedResponse = await ResponseModel.findByIdAndUpdate(
      id,
      {
        $set: {
          state: newStateStr,
          responseOfAdmin: desc,
        },
      } as any,
      { new: true } // Trả về document mới sau khi update
    );
    // ----------------------------------

    if (!updatedResponse) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu phản hồi với ID này.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật phản hồi thành công!',
      data: updatedResponse,
    });
  } catch (error: any) {
    console.error('Error in changeResponse:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + (error.message || error),
    });
  }
};
