// src/components/GoogleClassroomLayout.tsx

import { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Button,
  Typography,
  Dropdown,
  Segmented,
  Tooltip,
  message,
  Avatar,
  Badge,
  Divider,
} from "antd";
import {
  DesktopOutlined,
  MenuOutlined,
  MoonOutlined,
  SunOutlined,
  UserOutlined,
  LogoutOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import SidebarContent from "../components/SidebarContent";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context";
import type { ThemeMode } from "../types/theme";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

type RoleType = "admin" | "user" | "student" | "teacher";

interface AccountInfo {
  _id?: string;
  idUser?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: RoleType;
  avatar?: string;
  avatarUrl?: string;
  token?: string;
}

const roleMeta: Record<RoleType, string> = {
  admin: "Quản trị viên",
  user: "Cờ đỏ",
  teacher: "Giáo viên",
  student: "Học sinh",
};

const DefaultLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const { themeMode, setThemeMode } = useAppContext();
  const [account, setAccount] = useState<AccountInfo>(() => {
    const raw = localStorage.getItem("userInfo");
    if (!raw) return {};

    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Call on initial mount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const syncProfile = async () => {
      if (!account?.token) return;

      try {
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/user/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${account.token}`,
          },
        });

        if (!res.ok) return;

        const data = await res.json();
        const merged = {
          ...account,
          ...data,
          token: account.token,
        };

        setAccount(merged);
        localStorage.setItem("userInfo", JSON.stringify(merged));
      } catch (error) {
        console.log("Sync profile failed", error);
      }
    };

    syncProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleUserInfoUpdated = () => {
      const raw = localStorage.getItem("userInfo");
      if (!raw) return;

      try {
        setAccount(JSON.parse(raw));
      } catch {
        setAccount({});
      }
    };

    window.addEventListener("user-info-updated", handleUserInfoUpdated);

    return () => {
      window.removeEventListener("user-info-updated", handleUserInfoUpdated);
    };
  }, []);

  const fullName = useMemo(() => {
    const firstName = account?.firstName || "";
    const lastName = account?.lastName || "";
    return `${lastName} ${firstName}`.trim() || "Người dùng";
  }, [account?.firstName, account?.lastName]);

  const roleText = useMemo(() => {
    if (!account?.role) return "Đang cập nhật";
    return roleMeta[account.role] || account.role;
  }, [account?.role]);

  const avatarUrl = useMemo(() => {
    if (account?.avatarUrl) {
      return account.avatarUrl;
    }

    if (account?.avatar) {
      return account.avatar;
    }

    const text = encodeURIComponent(fullName);
    return `https://ui-avatars.com/api/?name=${text}&background=1f5ca9&color=fff&size=128`;
  }, [account?.avatar, account?.avatarUrl, fullName]);

  const handleLogout = () => {
    localStorage.clear();
    messageApi.success("Đăng xuất thành công!");
    setTimeout(() => {
      navigate("/");
    }, 500);
  };

  const accountMenuItems = [
    {
      key: "1",
      icon: <IdcardOutlined />,
      label: "Thông tin tài khoản",
      onClick: () => navigate("/profile"),
    },
    {
      key: "2",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className="min-h-screen">
      {contextHolder}
      <Sider
        width={280}
        collapsedWidth={isMobile ? 0 : 70}
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        trigger={null}
        className="!fixed z-20 h-screen border-r shadow-md"
        style={{
          left: isMobile && collapsed ? -280 : 0,
          backgroundColor: "var(--surface-1)",
          borderColor: "var(--border-color)",
        }}
      >
        <div
          className="flex h-[64px] items-center border-b p-4"
          style={{ borderColor: "var(--border-color)" }}
        >
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="mr-2"
              style={{ color: "var(--text-muted)" }}
            />
          )}
          {!collapsed && (
            <Title level={4} className="!mb-0" style={{ color: "var(--text-color)" }}>
              QUẢN LÝ THI ĐUA
            </Title>
          )}
        </div>

        <SidebarContent />
      </Sider>
      {isMobile && !collapsed && (
        <div
          className="fixed inset-0 z-10 bg-black opacity-50"
          onClick={() => setCollapsed(true)}
        />
      )}

      <Layout
        style={{
          marginLeft: isMobile ? 0 : collapsed ? 70 : 280,
          transition: "margin-left 0.2s",
        }}
      >
        <Header
          className="sticky top-0 z-10 flex h-[64px] items-center justify-between border-b p-0 shadow-sm"
          style={{
            backgroundColor: "var(--surface-1)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="flex items-center">
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="ml-4"
              style={{ color: "var(--text-muted)" }}
            />
            {collapsed && !isMobile && (
              <Title level={4} className="!mb-0 ml-4" style={{ color: "var(--text-color)" }}>
                QUẢN LÝ THI ĐUA
              </Title>
            )}
          </div>

          <div className="mr-4 flex items-center space-x-2">
            <Tooltip title="Che do giao dien">
              <Segmented
                size="small"
                value={themeMode}
                onChange={(value) => setThemeMode(value as ThemeMode)}
                options={[
                  { value: "light", icon: <SunOutlined /> },
                  { value: "dark", icon: <MoonOutlined /> },
                  { value: "system", icon: <DesktopOutlined /> },
                ]}
              />
            </Tooltip>
            <Dropdown
              menu={{ items: accountMenuItems }}
              dropdownRender={(menu) => (
                <div
                  className="min-w-[300px] rounded-2xl border p-3 shadow-lg"
                  style={{
                    backgroundColor: "var(--surface-1)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <div className="flex items-start gap-3 rounded-xl px-1 py-1">
                    <Avatar size={48} src={avatarUrl} icon={<UserOutlined />} />
                    <div className="min-w-0 flex-1">
                      <Text strong style={{ color: "var(--text-color)" }}>
                        {fullName}
                      </Text>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                        <Text type="secondary">Online</Text>
                      </div>
                      <div className="mt-0.5 truncate">
                        <Text type="secondary" className="!text-sm">
                          {account.email || "Chưa có email"}
                        </Text>
                      </div>
                      <div className="mt-1">
                        <Text style={{ color: "var(--primary-color)", fontWeight: 600 }}>
                          {roleText}
                        </Text>
                      </div>
                    </div>
                  </div>

                  <Divider className="!my-3" />
                  <div
                    className="rounded-xl p-1"
                    style={{ backgroundColor: "var(--surface-2)" }}
                  >
                    {menu}
                  </div>
                </div>
              )}
              placement="bottomRight"
              trigger={["click"]}
            >
              <div className="cursor-pointer">
                <Badge dot status="success" offset={[-1, 30]}>
                  <Avatar
                    size={34}
                    src={avatarUrl}
                    icon={<UserOutlined />}
                    style={{ border: "1px solid var(--border-color)" }}
                  />
                </Badge>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="p-4" style={{ backgroundColor: "var(--bg-color)" }}>
          <div
            className="h-full w-full rounded"
            style={{
              backgroundColor: "var(--surface-1)",
              border: "1px solid var(--border-color)",
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default DefaultLayout;
