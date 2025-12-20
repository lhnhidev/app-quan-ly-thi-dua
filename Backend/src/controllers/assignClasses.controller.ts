import { Request, Response } from 'express';
import User from '../models/User';

export const index = async (req: Request, res: Response) => {
  try {
    // 1. Lấy dữ liệu từ client
    // assignments: [{ classId: "id_lop_A", redFlagId: "id_user_1" }, ...]
    const { assignments } = req.body;

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({ message: 'Dữ liệu phân công không hợp lệ!' });
    }

    // --- BƯỚC 1: DỌN DẸP DỮ LIỆU CŨ (QUAN TRỌNG) ---
    // Lấy danh sách tất cả các Class ID đang được yêu cầu xử lý
    const classIdsInPayload = assignments.map((item) => item.classId);

    // Tìm tất cả user và GỠ (PULL) các classId này ra khỏi followingClasses của họ.
    // Điều này đảm bảo: Nếu Lớp 10A trước đây của User A, nay gán cho User B,
    // thì User A sẽ mất Lớp 10A ngay lập tức.
    await User.updateMany(
      { followingClasses: { $in: classIdsInPayload } }, // Tìm những người đang giữ các lớp này
      { $pull: { followingClasses: { $in: classIdsInPayload } } } // Gỡ bỏ các lớp đó đi
    );

    // --- BƯỚC 2: CHUẨN BỊ DỮ LIỆU GÁN MỚI ---
    // Gom nhóm: Tạo một Map để biết mỗi User sẽ phụ trách những lớp nào
    // Cấu trúc map: { "user_id_1": ["class_id_A", "class_id_B"], "user_id_2": ["class_id_C"] }
    const userClassMap: Record<string, string[]> = {};

    assignments.forEach(({ classId, redFlagId }) => {
      // Chỉ xử lý nếu có redFlagId (tức là lớp đó CÓ người trực, không bị bỏ trống)
      if (redFlagId) {
        if (!userClassMap[redFlagId]) {
          userClassMap[redFlagId] = [];
        }
        userClassMap[redFlagId].push(classId);
      }
    });

    // --- BƯỚC 3: THỰC HIỆN UPDATE HÀNG LOẠT (BULK WRITE) ---
    // Dùng bulkWrite để hiệu năng cao hơn so với vòng lặp await User.updateOne
    const bulkOps = Object.keys(userClassMap).map((userId) => ({
      updateOne: {
        filter: { _id: userId },
        // Dùng $addToSet hoặc $push.
        // Vì ở Bước 1 đã gỡ sạch rồi, nên ở đây push vào là an toàn.
        // Dùng $addToSet để chắc chắn không bị trùng lặp ID nếu frontend gửi sai.
        update: { $addToSet: { followingClasses: { $each: userClassMap[userId] } } },
      },
    }));

    if (bulkOps.length > 0) {
      await User.bulkWrite(bulkOps);
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật phân công thành công!',
    });
  } catch (error) {
    console.error('Assign Classes Error:', error);
    return res.status(500).json({
      message: 'Lỗi Server khi phân công lớp học',
    });
  }
};
