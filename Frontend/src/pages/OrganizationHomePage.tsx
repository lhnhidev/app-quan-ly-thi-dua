import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Space,
  Spin,
  Switch,
  Tag,
  Typography,
  message,
} from "antd";
import {
  HomeOutlined,
  LinkOutlined,
  LogoutOutlined,
  PlusOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

type OrgRole = "admin" | "teacher" | "student" | "redflag";
type OrgStatus = "approved" | "pending";

interface OrganizationItem {
  _id: string;
  name: string;
  shortName?: string;
  description?: string;
  address?: string;
  inviteCode: string;
  allowJoinByInviteWithoutApproval: boolean;
  role: OrgRole;
  status: OrgStatus;
  joinedAt?: string;
  isOwner: boolean;
}

const roleLabel: Record<OrgRole, string> = {
  admin: "Quản trị tổ chức",
  teacher: "Giáo viên",
  student: "Học sinh",
  redflag: "Cờ đỏ",
};

const roleColor: Record<OrgRole, string> = {
  admin: "gold",
  teacher: "blue",
  student: "cyan",
  redflag: "magenta",
};

const goToRoleInterface = (navigate: ReturnType<typeof useNavigate>, role: OrgRole) => {
  if (role === "admin") {
    navigate("/dashboard");
    return;
  }

  if (role === "teacher" || role === "student") {
    navigate("/home-1");
    return;
  }

  navigate("/home-2");
};

const OrganizationHomePage: React.FC = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();

  const token = useMemo(() => {
    const raw = localStorage.getItem("userInfo");
    if (!raw) return "";

    try {
      return JSON.parse(raw).token || "";
    } catch {
      return "";
    }
  }, []);

  const fetchOrganizations = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/organizations/my`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await res.json().catch(() => []);
      if (!res.ok) {
        throw new Error(payload.message || "Không tải được danh sách tổ chức");
      }

      setOrganizations(Array.isArray(payload) ? payload : []);
    } catch (error: any) {
      console.error(error);
      messageApi.error(error.message || "Không tải được danh sách tổ chức");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onCreateOrganization = async (values: {
    name: string;
    shortName?: string;
    description?: string;
    address?: string;
    website?: string;
    contactEmail?: string;
    contactPhone?: string;
    allowJoinByInviteWithoutApproval: boolean;
  }) => {
    setCreating(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/organizations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.message || "Không thể tạo tổ chức");
      }

      messageApi.success("Tạo tổ chức thành công");
      setIsCreateModalOpen(false);
      createForm.resetFields();
      fetchOrganizations();
    } catch (error: any) {
      console.error(error);
      messageApi.error(error.message || "Không thể tạo tổ chức");
    } finally {
      setCreating(false);
    }
  };

  const onJoinByInviteCode = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      messageApi.warning("Vui lòng nhập mã mời");
      return;
    }

    setJoining(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/organizations/join/${code}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.message || "Không thể tham gia tổ chức");
      }

      messageApi.success(payload.message || "Đã gửi yêu cầu tham gia");
      setJoinCode("");
      fetchOrganizations();
    } catch (error: any) {
      console.error(error);
      messageApi.error(error.message || "Không thể tham gia tổ chức");
    } finally {
      setJoining(false);
    }
  };

  const openOrganization = (organization: OrganizationItem) => {
    if (organization.status !== "approved") {
      messageApi.info("Tổ chức này đang chờ duyệt thành viên");
      return;
    }

    localStorage.setItem(
      "activeOrganization",
      JSON.stringify({
        organizationId: organization._id,
        organizationName: organization.name,
        role: organization.role,
      }),
    );

    goToRoleInterface(navigate, organization.role);
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] p-4 md:p-6">
      {contextHolder}
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-1)] p-4 md:flex-row md:items-center md:justify-between">
          <Space align="center">
            <Avatar size={48} icon={<HomeOutlined />} style={{ backgroundColor: "var(--primary-color)" }} />
            <div>
              <Title level={4} className="!mb-0 !text-[var(--text-color)]">
                Trang chủ tổ chức
              </Title>
              <Text className="!text-[var(--text-muted)]">
                Chọn tổ chức để vào không gian làm việc tương ứng theo quyền của bạn
              </Text>
            </div>
          </Space>

          <Space>
            <Button icon={<PlusOutlined />} type="primary" onClick={() => setIsCreateModalOpen(true)}>
              Thêm tổ chức
            </Button>
            <Button icon={<LogoutOutlined />} onClick={logout}>
              Đăng xuất
            </Button>
          </Space>
        </div>

        <div className="mb-4 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-1)] p-4">
          <Text strong className="!text-[var(--text-color)]">
            Tham gia tổ chức bằng mã mời
          </Text>
          <div className="mt-3 flex flex-col gap-2 md:flex-row">
            <Input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value)}
              placeholder="Nhập mã mời (ví dụ: AB12CD)"
              prefix={<LinkOutlined />}
              maxLength={12}
            />
            <Button loading={joining} type="primary" onClick={onJoinByInviteCode} icon={<TeamOutlined />}>
              Tham gia
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="mt-12 flex justify-center">
            <Spin size="large" />
          </div>
        ) : organizations.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-1)] p-8">
            <Empty description="Bạn chưa tham gia tổ chức nào" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {organizations.map((organization) => (
              <Card
                key={organization._id}
                className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                styles={{ body: { padding: 18 } }}
                title={<span className="text-[var(--text-color)]">{organization.name}</span>}
                extra={<Tag color={roleColor[organization.role]}>{roleLabel[organization.role]}</Tag>}
              >
                <div className="space-y-2">
                  {organization.shortName && (
                    <Text className="block !text-[var(--text-muted)]">Viết tắt: {organization.shortName}</Text>
                  )}
                  {organization.description && (
                    <Text className="block !text-[var(--text-muted)]">{organization.description}</Text>
                  )}
                  <Text className="block !text-[var(--text-muted)]">Mã mời: {organization.inviteCode}</Text>
                  <Tag color={organization.status === "approved" ? "success" : "warning"}>
                    {organization.status === "approved" ? "Đã tham gia" : "Đang chờ duyệt"}
                  </Tag>
                </div>

                <Button
                  type="primary"
                  block
                  className="mt-4"
                  disabled={organization.status !== "approved"}
                  onClick={() => openOrganization(organization)}
                >
                  Vào tổ chức
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={isCreateModalOpen}
        title="Khởi tạo tổ chức trường học"
        onCancel={() => setIsCreateModalOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={creating}
        okText="Tạo tổ chức"
        cancelText="Hủy"
      >
        <Form
          layout="vertical"
          form={createForm}
          initialValues={{ allowJoinByInviteWithoutApproval: true }}
          onFinish={onCreateOrganization}
        >
          <Form.Item
            name="name"
            label="Tên trường / tổ chức"
            rules={[{ required: true, message: "Vui lòng nhập tên tổ chức" }]}
          >
            <Input placeholder="Ví dụ: Trường THCS Nguyễn Du" />
          </Form.Item>

          <Form.Item name="shortName" label="Tên viết tắt">
            <Input placeholder="Ví dụ: THCS Nguyen Du" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả ngắn">
            <Input.TextArea rows={2} placeholder="Mô tả tổ chức" />
          </Form.Item>

          <Form.Item name="address" label="Địa chỉ">
            <Input placeholder="Địa chỉ trường" />
          </Form.Item>

          <Form.Item name="website" label="Website">
            <Input placeholder="https://example.edu.vn" />
          </Form.Item>

          <Form.Item name="contactEmail" label="Email liên hệ">
            <Input placeholder="contact@example.edu.vn" />
          </Form.Item>

          <Form.Item name="contactPhone" label="Số điện thoại liên hệ">
            <Input placeholder="0123 456 789" />
          </Form.Item>

          <Form.Item
            name="allowJoinByInviteWithoutApproval"
            label="Chính sách tham gia bằng link/mã mời"
            valuePropName="checked"
          >
            <Switch checkedChildren="Tự động duyệt" unCheckedChildren="Cần admin duyệt" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrganizationHomePage;
