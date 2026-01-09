import { Request, Response } from 'express';
// 1. Import đúng thư viện này
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

// 2. Khởi tạo SDK
// Ép kiểu 'as string' để TypeScript không báo lỗi nếu biến môi trường bị undefined
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export const index = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    // Validate input
    if (!message) {
      return res.status(400).json({ message: 'Vui lòng nhập nội dung tin nhắn.' });
    }

    // 3. Chọn model
    // Dùng getGenerativeModel thay vì ai.models...
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    // 4. Gọi AI
    // Thư viện này cho phép truyền trực tiếp chuỗi message vào generateContent
    const result = await model.generateContent(message);
    const response = await result.response;

    // Hàm lấy text là .text() (có dấu ngoặc)
    const text = response.text();

    return res.status(200).json({ reply: text });
  } catch (error) {
    console.error('Gemini Chat Error:', error);

    return res.status(500).json({
      message: 'Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau.',
    });
  }
};
