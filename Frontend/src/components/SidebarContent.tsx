import { Menu } from "antd";
import {
  HomeOutlined,
  CalendarOutlined,
  FolderOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const SidebarContent = () => {
  const navigate = useNavigate();

  return (
    <Menu
      theme="light"
      mode="inline"
      defaultSelectedKeys={["1"]}
      className="border-r-0"
      items={[
        {
          key: "1",
          icon: <HomeOutlined />,
          label: "Màn hình chính",
          className: "rounded-r-full my-1.5 h-12 flex items-center",
          onClick: () => {
            navigate("/dashboard");
          },
        },
        {
          key: "2",
          icon: <CalendarOutlined />,
          label: "Quản lý người dùng",
          className: "rounded-r-full my-1.5 h-12 flex items-center",
          onClick: () => {
            navigate("/user");
          },
        },
        {
          key: "3",
          icon: <FolderOutlined />,
          label: "Quản lý lớp học",
          className: "rounded-r-full my-1.5 h-12 flex items-center",
          onClick: () => {
            navigate("/class");
          },
        },
        {
          key: "4",
          icon: <FolderOutlined />,
          label: "Quản lý học sinh",
          className: "rounded-r-full my-1.5 h-12 flex items-center",
          onClick: () => {
            navigate("/student");
          },
        },
        {
          key: "5",
          icon: <FolderOutlined />,
          label: "Quản lý phiếu thi đua",
          className: "rounded-r-full my-1.5 h-12 flex items-center",
          onClick: () => {
            navigate("/record-form");
          },
        },
        {
          key: "6",
          icon: <FolderOutlined />,
          label: "Quản lý thang điểm",
          className: "rounded-r-full my-1.5 h-12 flex items-center",
          onClick: () => {
            navigate("/role");
          },
        },
        {
          key: "7",
          icon: <SettingOutlined />,
          label: "Cài đặt",
          className: "rounded-r-full my-1.5 h-12 flex items-center",
        },
      ]}
    />
  );
};

export default SidebarContent;
