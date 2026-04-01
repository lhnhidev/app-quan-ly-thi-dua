// src/components/GoogleClassroomLayout.tsx

import { useEffect, useState } from "react";
import { Layout, Menu, Button, Typography, Dropdown, Segmented, Tooltip, message } from "antd";
import { DesktopOutlined, MenuOutlined, MoonOutlined, SunOutlined, UserOutlined } from "@ant-design/icons";
import SidebarContent from "../components/SidebarContent";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context";
import type { ThemeMode } from "../types/theme";

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const DefaultLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const { themeMode, setThemeMode } = useAppContext();

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

  const accountMenu = (
    <Menu
      items={[
        { key: "1", label: "Thông tin tài khoản" },
        {
          key: "2",
          label: "Đăng xuất",
          onClick: () => {
            localStorage.clear();
            messageApi.success("Đăng xuất thành công!");
            setTimeout(() => {
              navigate("/");
            }, 500);
          },
        },
      ]}
    />
  );

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
              overlay={accountMenu}
              placement="bottomRight"
              trigger={["click"]}
            >
              <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-white" style={{ backgroundColor: "var(--primary-color)" }}>
                <UserOutlined />
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
