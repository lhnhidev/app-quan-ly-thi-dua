import React, { useState, useRef, useEffect } from "react";
import { BsRobot } from "react-icons/bs";
import { AiOutlineClose, AiOutlineSend } from "react-icons/ai";
import { Input, Button, Spin, message as antMessage } from "antd";
import ReactMarkdown from "react-markdown";

// Định nghĩa kiểu dữ liệu cho tin nhắn
interface Message {
  role: "user" | "bot";
  content: string;
}

interface ApiResponse {
  reply?: string;
  message?: string;
}

const ChatComponent: React.FC = () => {
  // State
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false); // Loading khi chờ API
  const [isTyping, setIsTyping] = useState<boolean>(false); // Loading khi đang gõ chữ

  // Refs & Env
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const SERVER_URL = (import.meta.env.VITE_SERVER_URL as string) || "";

  // Hàm cuộn xuống cuối khung chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isTyping]); // Thêm isTyping để cuộn mượt hơn khi đang gõ

  // Hàm tạo hiệu ứng gõ chữ
  const typeWriterEffect = async (text: string) => {
    setIsTyping(true);

    // 1. Tạo tin nhắn rỗng của bot trước
    setMessages((prev) => [...prev, { role: "bot", content: "" }]);

    let currentText = "";
    const speed = 20; // Tốc độ gõ (ms)

    // 2. Lặp qua từng ký tự
    for (let i = 0; i < text.length; i++) {
      currentText += text.charAt(i);

      // Cập nhật tin nhắn cuối cùng (là tin nhắn của bot vừa tạo)
      setMessages((prev) => {
        const newMsgs = [...prev];
        const lastMsgIndex = newMsgs.length - 1;
        if (lastMsgIndex >= 0) {
          newMsgs[lastMsgIndex] = {
            ...newMsgs[lastMsgIndex],
            content: currentText,
          };
        }
        return newMsgs;
      });

      // Delay một chút để tạo hiệu ứng gõ
      await new Promise((resolve) => setTimeout(resolve, speed));
    }

    setIsTyping(false);
  };

  // Xử lý gửi tin nhắn
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return; // Chặn gửi nếu đang gõ

    const userMsg: Message = { role: "user", content: inputValue };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setLoading(true);

    try {
      const token = JSON.parse(localStorage.getItem("userInfo") || "{}").token;
      const role = JSON.parse(localStorage.getItem("userInfo") || "{}").role;

      const response = await fetch(`${SERVER_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMsg.content, role }),
      });

      if (!response.ok) throw new Error("API Error");

      const data: ApiResponse = await response.json();
      const botContent =
        data.reply || data.message || "Tôi không hiểu yêu cầu này.";

      setLoading(false); // Tắt loading xoay vòng

      // Bắt đầu hiệu ứng gõ chữ
      await typeWriterEffect(botContent);
    } catch (error) {
      console.error("Chat error:", error);
      antMessage.error("Không thể gửi tin nhắn!");
      setLoading(false);
      await typeWriterEffect("Hệ thống đang bận, vui lòng thử lại.");
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end font-sans">
      {/* KHUNG CHAT */}
      {isOpen && (
        <div className="animate-fade-in-up mb-4 flex h-[500px] w-[300px] flex-col overflow-hidden rounded-xl border border-[var(--border-color)] bg-white shadow-2xl sm:h-[600px] sm:w-[400px]">
          {/* Header */}
          <div className="flex h-14 shrink-0 items-center justify-between rounded-t-xl bg-[var(--primary-color)] px-4 text-white">
            <div className="flex select-none items-center gap-2 font-semibold">
              <BsRobot size={24} /> <span>Trợ lý ảo</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="transition-colors hover:text-[var(--secondary-color)]"
            >
              <AiOutlineClose size={20} />
            </button>
          </div>

          {/* Body (Danh sách tin nhắn) */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-[var(--bg-color)] p-4">
            {messages.length === 0 && (
              <div className="mt-10 select-none text-center text-sm text-gray-400">
                Xin chào! Tôi có thể giúp gì cho bạn?
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`${msg.role === "user" ? "max-w-[85%]" : "w-[85%]"} whitespace-pre-wrap break-words rounded-lg p-3 text-sm shadow-sm ${
                    msg.role === "user"
                      ? "rounded-tr-none bg-[var(--primary-color)] text-white"
                      : "rounded-tl-none border border-[var(--border-color)] bg-white text-[var(--text-color)]"
                  }`}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  {/* Hiệu ứng dấu nháy khi đang gõ ở tin nhắn cuối cùng của bot */}
                  {msg.role === "bot" &&
                    index === messages.length - 1 &&
                    isTyping && (
                      <span className="animate-pulse font-bold">|</span>
                    )}
                </div>
              </div>
            ))}

            {/* Chỉ hiện Spin khi đang chờ API (chưa có text trả về) */}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg rounded-tl-none border border-[var(--border-color)] bg-white p-3 shadow-sm">
                  <Spin size="small" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer (Input) */}
          <div className="flex shrink-0 items-center gap-2 border-t border-[var(--border-color)] bg-white p-3">
            <Input
              placeholder="Nhập nội dung..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPressEnter={handleSendMessage}
              disabled={loading || isTyping} // Disable khi đang load hoặc đang gõ
              className="rounded-md border-[var(--border-color)] hover:border-[var(--secondary-color)] focus:border-[var(--primary-color)]"
            />
            <Button
              type="primary"
              icon={<AiOutlineSend />}
              onClick={handleSendMessage}
              loading={loading} // Chỉ loading quay vòng ở nút khi chờ API
              disabled={isTyping} // Disable nút khi đang gõ text
              className="border-none bg-[var(--primary-color)] shadow-none hover:!bg-[var(--secondary-color)]"
            />
          </div>
        </div>
      )}

      {/* NÚT BẬT TẮT (Robot Icon) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 transform items-center justify-center rounded-full bg-[var(--primary-color)] text-white shadow-lg transition-all hover:scale-110 hover:bg-[var(--secondary-color)] active:scale-95"
          aria-label="Open Chat"
        >
          <BsRobot size={28} />
        </button>
      )}
    </div>
  );
};

export default ChatComponent;
