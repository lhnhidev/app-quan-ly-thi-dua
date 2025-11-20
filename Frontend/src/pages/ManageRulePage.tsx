import React, { useState } from "react";
import { Input, Button, Tag, Tabs, Modal, Empty } from "antd";
import {
  FiSearch,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import { PiRanking } from "react-icons/pi";
import Header from "../components/Header";

// --- 1. Định nghĩa kiểu dữ liệu ---
interface Rule {
  _id: string;
  idRule: string; // Mã thang điểm (VD: RL-001)
  content: string; // Nội dung
  point: number; // Điểm (+30, -10)
  type: "bonus" | "penalty"; // Loại (Thưởng/Phạt) - dùng để lọc
}

// --- 2. Mock Data (Dữ liệu giả lập) ---
const mockRules: Rule[] = [
  {
    _id: "1",
    idRule: "RL-001",
    content: "Đi học muộn (sau 7h00)",
    point: -5,
    type: "penalty",
  },
  {
    _id: "2",
    idRule: "RL-002",
    content: "Không đeo khăn quàng đỏ/huy hiệu",
    point: -2,
    type: "penalty",
  },
  {
    _id: "3",
    idRule: "RL-003",
    content: "Nói chuyện riêng trong giờ học",
    point: -2,
    type: "penalty",
  },
  {
    _id: "4",
    idRule: "RL-004",
    content: "Đạt điểm 10 kiểm tra miệng/15 phút",
    point: 10,
    type: "bonus",
  },
  {
    _id: "5",
    idRule: "RL-005",
    content: "Đạt giải Nhất cấp trường",
    point: 30,
    type: "bonus",
  },
  {
    _id: "6",
    idRule: "RL-006",
    content: "Nhặt được của rơi trả lại người mất",
    point: 20,
    type: "bonus",
  },
  {
    _id: "7",
    idRule: "RL-007",
    content: "Vệ sinh lớp học không sạch sẽ",
    point: -10,
    type: "penalty",
  },
  {
    _id: "8",
    idRule: "RL-008",
    content: "Tham gia đầy đủ các phong trào đoàn đội",
    point: 15,
    type: "bonus",
  },
];

const ManageRulePage: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL");

  // --- 3. Logic Lọc & Tìm kiếm ---
  const filteredRules = mockRules.filter((rule) => {
    // Lọc theo Tab (Tất cả / Điểm cộng / Điểm trừ)
    const matchTab =
      activeTab === "ALL" ||
      (activeTab === "BONUS" && rule.point > 0) ||
      (activeTab === "PENALTY" && rule.point < 0);

    // Lọc theo ô tìm kiếm (Mã thang điểm)
    const matchSearch = rule.idRule
      .toLowerCase()
      .includes(searchText.toLowerCase());

    return matchTab && matchSearch;
  });

  // --- 4. Render từng thẻ (Card) ---
  const renderRuleCard = (rule: Rule) => {
    const isBonus = rule.point > 0;
    const color = isBonus ? "text-green-600" : "text-red-600";
    const bgColor = isBonus ? "bg-green-50" : "bg-red-50";
    const borderColor = isBonus ? "border-green-200" : "border-red-200";
    const Icon = isBonus ? FiCheckCircle : FiAlertCircle;

    return (
      <div
        key={rule._id}
        className={`group relative flex flex-col justify-between rounded-xl border ${borderColor} bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md`}
      >
        {/* Header Card: Mã & Actions */}
        <div className="mb-3 flex items-start justify-between">
          <Tag
            color={isBonus ? "success" : "error"}
            className="rounded px-2 py-0.5 font-mono text-sm font-bold"
          >
            {rule.idRule}
          </Tag>

          {/* Action Buttons (Hiện khi hover) */}
          <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              type="text"
              size="small"
              icon={<FiEdit />}
              className="text-blue-600 hover:bg-blue-50"
            />
            <Button
              type="text"
              size="small"
              danger
              icon={<FiTrash2 />}
              onClick={() => {
                Modal.confirm({
                  title: "Xóa quy định",
                  content: `Bạn có chắc chắn muốn xóa: ${rule.idRule}?`,
                  okType: "danger",
                });
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="mb-4 flex-1">
          <h4 className="text-base font-medium leading-snug text-gray-700">
            {rule.content}
          </h4>
        </div>

        {/* Footer: Điểm số */}
        <div
          className={`mt-auto flex items-center gap-3 rounded-lg p-3 ${bgColor}`}
        >
          <div className={`text-2xl ${color}`}>
            <Icon />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase text-gray-500">
              {isBonus ? "Điểm thưởng" : "Điểm phạt"}
            </span>
            <span className={`text-xl font-bold ${color}`}>
              {isBonus ? "+" : ""}
              {rule.point}đ
            </span>
          </div>
        </div>
      </div>
    );
  };

  // --- 5. Cấu hình Tabs ---
  const tabItems = [
    { key: "ALL", label: "Tất cả" },
    { key: "BONUS", label: "Điểm cộng (+)" },
    { key: "PENALTY", label: "Điểm trừ (-)" },
  ];

  return (
    <div>
      <Header
        title="Quản lý Thang điểm"
        subtitle="Chào mừng bạn đến với trang quản lý Thang điểm"
        logo={PiRanking}
      ></Header>
      <div className="min-h-screen p-6">
        {/* Header Trang */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="m-0 text-2xl font-bold text-gray-800">
              Danh sách phiếu thi đua
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Ghi nhận và theo dõi tình hình thi đua của học sinh
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
            <Input
              placeholder="Tìm kiếm theo Mã (VD: RL-001)..."
              prefix={<FiSearch className="text-gray-400" />}
              size="large"
              allowClear
              className="w-full rounded-lg md:w-72"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button
              type="primary"
              icon={<FiPlus />}
              size="large"
              className="flex items-center justify-center bg-blue-600 shadow-lg shadow-blue-200 hover:bg-blue-500"
            >
              Thêm quy định mới
            </Button>
          </div>
        </div>

        {/* Tabs Filter */}
        <div className="mb-6">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            type="card"
            className="custom-tabs"
          />
        </div>

        {/* Grid hiển thị Cards */}
        {filteredRules.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredRules.map(renderRuleCard)}
          </div>
        ) : (
          <div className="mt-20 flex justify-center">
            <Empty description="Không tìm thấy quy định nào phù hợp" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageRulePage;
