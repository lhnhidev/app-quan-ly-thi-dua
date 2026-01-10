import { Request, Response } from 'express';
// Import đúng thư viện
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';
import { getData } from '../utils/getData';

// 2. Khởi tạo AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export const index = async (req: Request, res: Response) => {
  try {
    // Lấy tin nhắn của người dùng gửi lên
    const { message } = req.body;

    // Kiểm tra đầu vào
    if (!message) {
      return res.status(400).json({ message: 'Vui lòng nhập nội dung tin nhắn.' });
    }

    // Lấy dữ liệu từ cơ sở dữ liệu
    const data = await getData();
    // Tạo prompt với ngữ cảnh hệ thống
    const prompt = `Bạn là một trợ lý ảo hỗ trợ trả lời các câu hỏi liên quan đến hệ thống quản lý thi đua học sinh của một trường trung học cơ sở. Dưới đây là dữ liệu tổng quan về hệ thống
    - Hãy trả lời ngắn gọn, dễ hiểu, đúng trọng tâm, nhưng phải đúng và sử dụng ngôn ngữ thân thiện với học sinh và giáo viên.
    - Câu hỏi không biết, hay không có trong dữ liệu thì từ chối trả lời hoặc đưa ra câu trả lời chung chung, không được bịa đặt thông tin.`;

    // Chọn model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' }); // Ở đây là Gemini 2.5

    // Gửi kèm ngữ cảnh hệ thống
    const systemContext = `${prompt}, đây là cơ sở dữ liệu: ${JSON.stringify(data)}. Đây là câu hỏi của bạn: ${message}`;

    // Gọi AI cho nó xử lý và lấy về câu trả lời của AI
    const result = await model.generateContent(systemContext);
    const response = await result.response;
    const text = response.text();

    // Trả về câu trả lời cho frontend
    return res.status(200).json({ reply: text });
  } catch (error) {
    console.error('Gemini Chat Error:', error);

    // Trả về lỗi chung nếu có lỗi xảy ra nữa chừng
    return res.status(500).json({
      message: 'Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau.',
    });
  }
};
