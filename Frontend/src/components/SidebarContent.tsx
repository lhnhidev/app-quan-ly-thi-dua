import { Menu } from "antd";
import {
  HomeOutlined,
  TeamOutlined,
  ScheduleOutlined,
  BankOutlined,
  UsergroupAddOutlined,
  SolutionOutlined,
  FileTextOutlined,
  AuditOutlined,
  TrophyOutlined,
  MessageOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom"; // 1. Import useLocation

const SidebarContent = () => {
  const navigate = useNavigate();
  const location = useLocation(); // 2. Lấy thông tin URL hiện tại

  // 3. Hàm xác định key nào sẽ active dựa trên đường dẫn
  const getSelectedKey = () => {
    const path = location.pathname;

    // Kiểm tra xem đường dẫn bắt đầu bằng gì để active mục tương ứng
    if (path.startsWith("/user")) return "2";
    if (path.startsWith("/assign-classes")) return "3";
    if (path.startsWith("/class")) return "4";
    if (path.startsWith("/student")) return "5";
    if (path.startsWith("/teacher")) return "6";
    if (path.startsWith("/record-form")) return "7";
    if (path.startsWith("/role")) return "8";
    if (path.startsWith("/ranking")) return "9";
    if (path.startsWith("/response")) return "10";
    if (path.startsWith("/settings")) return "11";
    // Mặc định là dashboard (key "1") cho trang chủ hoặc /dashboard
    return "1";
  };

  return (
    <Menu
      theme="light"
      mode="inline"
      // 4. Dùng selectedKeys thay vì defaultSelectedKeys
      selectedKeys={[getSelectedKey()]}
      className="border-r-0"
      items={[
        {
          key: "1",
          icon: <HomeOutlined />,
          label: "Màn hình chính",
          className: "rounded-r-full my-1.5 h-12 flex items-center",
          onClick: () => navigate("/dashboard"),
        },
        {
          key: "2",
          icon: <TeamOutlined />,
          label: "Quản lý người dùng",
          className: "rounded-r-full my-1.5 h-12 flex items-center",
          onClick: () => navigate("/user"),
        },
        {
          key: "3",
          icon: <ScheduleOutlined />,
          label: "Phân công trực",
          className: "rounded-r-full my-1.5 h-12 flex items-center",
          onClick: () => navigate("/assign-classes"),
        },
        {
          key: "4",
          icon: <BankOutlined />,
          label: "Quản lý lớp học",
          className: "rounded-r-full my-1.5 h-12 flex items-center",
          onClick: () => navigate("/class"),
        },
        {
          key: "5",
          icon: <UsergroupAddOutlined />,
          label: "Quản lý học sinh",
          className: "rounded-r-full my-1.5 h-12 flex items-center",
          onClick: () => navigate("/student"),
        },
        {
          key: "6",
          icon: <SolutionOutlined />,
          label: "Quản lý giáo viên",
          className: "rounded-r-full my-1.5 h-12 flex items-center",
          onClick: () => navigate("/teacher"),
        },
        {
          key: "7",
          icon: <FileTextOutlined />,
          label: "Quản lý phiếu thi đua",
          className: "rounded-r-full my-1.5 h-12 flex items-center",
          onClick: () => navigate("/record-form"),
        },
        {
          key: "8",
          icon: <AuditOutlined />,
          label: "Quản lý thang điểm",
          className: "rounded-r-full my-1.5 h-12 flex items-center",
          onClick: () => navigate("/role"),
        },
        {
          key: "9",
          icon: <TrophyOutlined />,
          label: "Bảng xếp hạng",
          className: "rounded-r-full my-1.5 h-12 flex items-center",
          onClick: () => navigate("/ranking"),
        },
        {
          key: "10",
          icon: <MessageOutlined />,
          label: "Quản lý phản hồi",
          className: "rounded-r-full my-1.5 h-12 flex items-center",
          onClick: () => navigate("/response"),
        },
        {
          key: "11",
          icon: <SettingOutlined />,
          label: "Cài đặt",
          className: "rounded-r-full my-1.5 h-12 flex items-center",
          onClick: () => navigate("/settings"),
        },
      ]}
    />
  );
};

export default SidebarContent;
