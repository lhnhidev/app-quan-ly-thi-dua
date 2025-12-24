import React, { useState } from "react";
import { Tabs } from "antd";
import { FaClipboardCheck, FaHome } from "react-icons/fa"; // Import icon từ react-icons

import HomeRedFlagPage from "./HomeRedFlagPage";
import UpdateRedFlagPage from "./UpdateRedFlagPage";

// --- COMPONENT CHÍNH ---

const RedFlagPage: React.FC = () => {
  // State để lưu tab đang active (nếu cần xử lý logic thêm)
  const [activeTab, setActiveTab] = useState<string>("1");

  // Cấu hình các items cho Tabs của Ant Design
  const items = [
    {
      key: "1",
      label: (
        <span className="flex items-center gap-2 px-2 py-1 text-base">
          <FaHome className="text-lg" />
          <span>Trang chủ</span>
        </span>
      ),
      children: <HomeRedFlagPage />,
    },
    {
      key: "2",
      label: (
        <span className="flex items-center gap-2 px-2 py-1 text-base">
          <FaClipboardCheck className="text-lg" />
          <span>Cập nhật thi đua</span>
        </span>
      ),
      children: <UpdateRedFlagPage />,
    },
  ];

  const onChange = (key: string) => {
    setActiveTab(key);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      {/* Container chính */}
      <div className="overflow-hidden rounded-xl bg-white shadow-lg">
        {/* Header trang (Tùy chọn) */}
        <div className="border-b border-gray-100 bg-white px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Trang quản lý thi đua - Sao đỏ
          </h1>
          <p className="text-sm text-gray-500">
            Theo dõi và cập nhật tình hình nề nếp thi đua
          </p>
        </div>

        {/* Phần Tabs */}
        <div className="p-4 md:p-6">
          <Tabs
            defaultActiveKey="1"
            activeKey={activeTab}
            items={items}
            onChange={onChange}
            type="card" // Kiểu hiển thị tab dạng thẻ (card) nhìn hiện đại hơn
            size="large" // Kích thước tab lớn
            className="custom-tabs-redflag"
          />
        </div>
      </div>
    </div>
  );
};

export default RedFlagPage;
