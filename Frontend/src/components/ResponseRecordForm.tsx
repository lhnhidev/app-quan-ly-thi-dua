import { useState } from "react";
import { useAppContext } from "../context";

// TODO: Import Context chứa messageApi của bạn ở đây
// Ví dụ: import { AppContext } from "@/context/AppContext";

const ResponseRecordForm = ({ recordId }: { recordId: string }) => {
  // --- Giả sử lấy messageApi từ Context ---
  // Bạn cần bỏ comment và sửa lại tên Context cho đúng với dự án của bạn
  const { messageApi } = useAppContext();

  // Lấy thông tin user
  const userInfoStr = localStorage.getItem("userInfo");
  const userInfo = userInfoStr ? JSON.parse(userInfoStr) : {};

  const firstName = userInfo.firstName || "";
  const lastName = userInfo.lastName || "";
  const idUser = userInfo.idUser || "";
  const email = userInfo.email || "";

  const [responseContent, setResponseContent] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  // Thêm state loading để disable nút khi đang gửi
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleResponse = async () => {
    // 1. Kiểm tra validation
    if (!responseContent.trim()) {
      setErrorMessage("Vui lòng nhập nội dung phản hồi trước khi gửi!");
      return;
    }

    // Bắt đầu gửi -> Set loading true
    setIsLoading(true);

    // 2. Chuẩn bị dữ liệu (Payload)
    const payload = {
      idRecordForm: recordId,
      idUser,
      firstName,
      lastName,
      email,
      content: responseContent, // Nội dung người dùng nhập
      // Hoặc gửi nguyên cục userInfo nếu backend cần: ...userInfo
    };

    console.log("Dữ liệu gửi đi:", payload);

    try {
      // 3. Gọi API
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("userInfo") || "{}").token || ""}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      // 4. Kiểm tra kết quả trả về
      if (data && data.success === true) {
        // Hiển thị thông báo từ server
        messageApi.success(data.message);

        // Reset form sau khi thành công
        setResponseContent("");
        setErrorMessage("");
      } else {
        // Xử lý trường hợp success = false (nếu cần)
        messageApi.error(data.message || "Gửi phản hồi thất bại.");
      }
    } catch (error) {
      console.error("Lỗi khi gửi phản hồi:", error);
      messageApi.error("Có lỗi xảy ra trong quá trình gửi dữ liệu.");
    } finally {
      // Kết thúc quá trình -> Tắt loading
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResponseContent(e.target.value);
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  return (
    <div className="mx-auto mt-8 max-w-3xl">
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Các trường input disable giữ nguyên */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Họ
          </label>
          <input
            type="text"
            value={lastName}
            disabled
            className="w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-100 p-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Tên
          </label>
          <input
            type="text"
            value={firstName}
            disabled
            className="w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-100 p-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            ID Người Dùng
          </label>
          <input
            type="text"
            value={idUser}
            disabled
            className="w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-100 p-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-100 p-2"
          />
        </div>
      </div>

      {/* Phần nhập nội dung phản hồi */}
      <div className="mb-6">
        <label
          htmlFor="responseContent"
          className={`mb-1 block text-sm font-medium ${
            errorMessage ? "text-red-600" : "text-gray-700"
          }`}
        >
          Nội dung phản hồi <span className="text-red-500">*</span>
        </label>

        <textarea
          id="responseContent"
          rows={5}
          value={responseContent}
          onChange={handleInputChange}
          disabled={isLoading} // Disable khi đang gửi
          className={`w-full rounded-md border p-2 focus:outline-none focus:ring-1 ${
            errorMessage
              ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          } ${isLoading ? "bg-gray-50 text-gray-500" : ""}`}
          placeholder="Nhập nội dung phản hồi của bạn tại đây..."
        ></textarea>

        {errorMessage && (
          <p className="mt-1 text-sm italic text-red-600">{errorMessage}</p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleResponse}
          disabled={isLoading} // Disable button khi đang gửi
          className={`rounded-md px-6 py-2 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isLoading
              ? "cursor-not-allowed bg-blue-400"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isLoading ? "Đang gửi..." : "Gửi Phản Hồi"}
        </button>
      </div>
    </div>
  );
};

export default ResponseRecordForm;
