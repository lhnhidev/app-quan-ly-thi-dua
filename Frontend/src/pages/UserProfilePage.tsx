import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  List,
  message,
  Skeleton,
  Space,
  Tag,
  Tabs,
  Typography,
} from "antd";
import {
  ApartmentOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  IdcardOutlined,
  LockOutlined,
  MailOutlined,
  SafetyOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from "@ant-design/icons";
import useFetch from "../hooks/useFetch";

const { Title, Text } = Typography;

type RoleType = "admin" | "user" | "student" | "teacher";

interface FollowingClass {
  _id: string;
  idClass: string;
  name: string;
  point: number;
}

interface UserProfile {
  _id: string;
  idUser: string;
  firstName: string;
  lastName: string;
  email: string;
  role: RoleType;
  followingClasses: FollowingClass[];
  createdAt: string;
  updatedAt: string;
}

interface ActivityItem {
  id: string;
  type: "record-form" | "response";
  action: string;
  description: string;
  metadata: {
    recordForm?: string;
    state?: string;
    content?: string;
    className?: string;
    classId?: string;
    studentName?: string;
    point?: number;
  };
  createdAt: string;
}

interface ActivityResponse {
  total: number;
  activities: ActivityItem[];
}

const roleMeta: Record<RoleType, { label: string; color: string }> = {
  admin: { label: "Quản trị viên", color: "volcano" },
  user: { label: "Cờ đỏ", color: "green" },
  teacher: { label: "Giáo viên", color: "purple" },
  student: { label: "Học sinh", color: "cyan" },
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const UserProfilePage = () => {
  const { request, loading, error } = useFetch<UserProfile>();
  const { request: updateProfileRequest, loading: updatingProfile } = useFetch<{
    message: string;
    data: UserProfile;
  }>();
  const { request: changePasswordRequest, loading: changingPassword } = useFetch<{
    message: string;
  }>();
  const { request: getActivitiesRequest, loading: loadingActivities } =
    useFetch<ActivityResponse>();
  const [messageApi, contextHolder] = message.useMessage();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const userInfoString = localStorage.getItem("userInfo");
    const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
    const token = userInfo?.token;

    if (!token) {
      setProfile(null);
      return;
    }

    const fetchMyProfile = async () => {
      const result = await request(`${import.meta.env.VITE_SERVER_URL}/user/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (result) {
        setProfile(result);
        profileForm.setFieldsValue({
          firstName: result.firstName,
          lastName: result.lastName,
          email: result.email,
        });
      }
    };

    fetchMyProfile();
  }, [profileForm, request]);

  useEffect(() => {
    const userInfoString = localStorage.getItem("userInfo");
    const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
    const token = userInfo?.token;

    if (!token) {
      setActivities([]);
      return;
    }

    const fetchActivities = async () => {
      const result = await getActivitiesRequest(
        `${import.meta.env.VITE_SERVER_URL}/user/me/activities`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (result?.activities) {
        setActivities(result.activities);
      }
    };

    fetchActivities();
  }, [getActivitiesRequest]);

  const fullName = useMemo(() => {
    if (!profile) return "";
    return `${profile.lastName} ${profile.firstName}`.trim();
  }, [profile]);

  const avatarText = useMemo(() => {
    if (!profile) return "U";
    const f = profile.firstName?.charAt(0)?.toUpperCase() || "";
    const l = profile.lastName?.charAt(0)?.toUpperCase() || "";
    return `${l}${f}` || "U";
  }, [profile]);

  const avatarUrl = useMemo(() => {
    const text = encodeURIComponent(fullName || "User");
    return `https://ui-avatars.com/api/?name=${text}&background=1f5ca9&color=fff&size=128`;
  }, [fullName]);

  const roleLabel = useMemo(() => {
    if (!profile) return "-";
    return roleMeta[profile.role]?.label || profile.role;
  }, [profile]);

  const updateLocalUserInfo = (data: UserProfile) => {
    const userInfoString = localStorage.getItem("userInfo");
    const userInfo = userInfoString ? JSON.parse(userInfoString) : {};

    const merged = {
      ...userInfo,
      ...data,
      token: userInfo?.token,
    };

    localStorage.setItem("userInfo", JSON.stringify(merged));
  };

  const handleUpdateProfile = async (values: {
    firstName: string;
    lastName: string;
    email: string;
  }) => {
    const userInfoString = localStorage.getItem("userInfo");
    const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
    const token = userInfo?.token;

    const result = await updateProfileRequest(
      `${import.meta.env.VITE_SERVER_URL}/user/me`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      },
    );

    if (result?.data) {
      setProfile(result.data);
      updateLocalUserInfo(result.data);
      messageApi.success(result.message || "Cập nhật thông tin thành công");
    }
  };

  const handleChangePassword = async (values: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => {
    const userInfoString = localStorage.getItem("userInfo");
    const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
    const token = userInfo?.token;

    const result = await changePasswordRequest(
      `${import.meta.env.VITE_SERVER_URL}/user/me/password`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      },
    );

    if (result?.message) {
      passwordForm.resetFields();
      messageApi.success(result.message);
    }
  };

  const getActivityTag = (item: ActivityItem) => {
    if (item.type === "record-form") {
      return <Tag color="processing">Phiếu thi đua</Tag>;
    }

    return <Tag color="purple">Phản hồi</Tag>;
  };

  return (
    <div className="p-4 md:p-6">
      {contextHolder}
      <Space direction="vertical" size={16} className="w-full">
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-2)] p-4 md:p-5">
          <Title level={4} className="!mb-1 !text-[var(--text-color)]">
            Thông tin tài khoản
          </Title>
          <Text className="text-[var(--text-muted)]">
            Hồ sơ người dùng hiện tại trong hệ thống quản trị
          </Text>
        </div>

        {error && (
          <Alert
            type="error"
            showIcon
            message="Không tải được thông tin tài khoản"
            description={error}
          />
        )}

        <Card className="rounded-xl border border-[var(--border-color)] shadow-sm">
          {loading ? (
            <Skeleton active avatar paragraph={{ rows: 5 }} />
          ) : profile ? (
            <Space direction="vertical" size={20} className="w-full">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <Avatar
                    size={72}
                    src={avatarUrl}
                    style={{
                      backgroundColor: "var(--primary-color)",
                      color: "#fff",
                      fontWeight: 700,
                    }}
                  >
                    {avatarText}
                  </Avatar>

                  <div>
                    <Title level={4} className="!mb-1 !text-[var(--text-color)]">
                      {fullName || "Không có tên hiển thị"}
                    </Title>
                    <Space wrap size={[8, 8]}>
                      <Tag color={roleMeta[profile.role]?.color || "default"}>
                        {roleMeta[profile.role]?.label || profile.role}
                      </Tag>
                      <Tag icon={<IdcardOutlined />} color="blue">
                        {profile.idUser}
                      </Tag>
                    </Space>
                  </div>
                </div>

                <Tag icon={<UserOutlined />} color="geekblue" className="!m-0">
                  ID hệ thống: {profile._id}
                </Tag>
              </div>

              <Descriptions
                title="Chi tiết tài khoản"
                bordered
                column={{ xs: 1, sm: 1, md: 2 }}
                labelStyle={{ width: 210 }}
              >
                <Descriptions.Item label={<Space><UserOutlined />Họ và tên</Space>}>
                  {fullName || "-"}
                </Descriptions.Item>
                <Descriptions.Item label={<Space><MailOutlined />Email</Space>}>
                  {profile.email || "-"}
                </Descriptions.Item>
                <Descriptions.Item label={<Space><TeamOutlined />Vai trò</Space>}>
                  {roleLabel}
                </Descriptions.Item>
                <Descriptions.Item label={<Space><CalendarOutlined />Ngày tạo</Space>}>
                  {formatDateTime(profile.createdAt)}
                </Descriptions.Item>
                <Descriptions.Item label={<Space><ClockCircleOutlined />Cập nhật gần nhất</Space>}>
                  {formatDateTime(profile.updatedAt)}
                </Descriptions.Item>
                <Descriptions.Item label={<Space><ApartmentOutlined />Số lớp theo dõi</Space>}>
                  {profile.followingClasses?.length || 0}
                </Descriptions.Item>
              </Descriptions>

              <Tabs
                defaultActiveKey="overview"
                items={[
                  {
                    key: "overview",
                    label: "Tổng quan",
                    children: (
                      <Card
                        size="small"
                        title="Danh sách lớp đang theo dõi"
                        className="rounded-lg border border-[var(--border-color)]"
                      >
                        <List
                          dataSource={profile.followingClasses || []}
                          locale={{ emptyText: "Người dùng này chưa theo dõi lớp nào." }}
                          renderItem={(item) => (
                            <List.Item>
                              <div className="flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <Space size={10}>
                                  <Tag color="processing">{item.idClass}</Tag>
                                  <Text strong>{item.name}</Text>
                                </Space>
                                <Text type="secondary">Tổng điểm lớp: {item.point ?? 0}</Text>
                              </div>
                            </List.Item>
                          )}
                        />
                      </Card>
                    ),
                  },
                  {
                    key: "edit-profile",
                    label: (
                      <Space size={6}>
                        <UserOutlined />
                        Chỉnh sửa thông tin
                      </Space>
                    ),
                    children: (
                      <Card
                        size="small"
                        title="Cập nhật hồ sơ"
                        className="rounded-lg border border-[var(--border-color)]"
                      >
                        <Form
                          layout="vertical"
                          form={profileForm}
                          onFinish={handleUpdateProfile}
                        >
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Form.Item
                              name="lastName"
                              label="Họ"
                              rules={[{ required: true, message: "Vui lòng nhập họ" }]}
                            >
                              <Input placeholder="Nhập họ" />
                            </Form.Item>
                            <Form.Item
                              name="firstName"
                              label="Tên"
                              rules={[{ required: true, message: "Vui lòng nhập tên" }]}
                            >
                              <Input placeholder="Nhập tên" />
                            </Form.Item>
                          </div>

                          <Form.Item
                            name="email"
                            label="Email"
                            rules={[
                              { required: true, message: "Vui lòng nhập email" },
                              { type: "email", message: "Email không hợp lệ" },
                            ]}
                          >
                            <Input prefix={<MailOutlined />} placeholder="name@example.com" />
                          </Form.Item>

                          <Button
                            type="primary"
                            htmlType="submit"
                            loading={updatingProfile}
                            icon={<SafetyOutlined />}
                            style={{ backgroundColor: "var(--primary-color)" }}
                          >
                            Lưu thay đổi
                          </Button>
                        </Form>
                      </Card>
                    ),
                  },
                  {
                    key: "change-password",
                    label: (
                      <Space size={6}>
                        <LockOutlined />
                        Đổi mật khẩu
                      </Space>
                    ),
                    children: (
                      <Card
                        size="small"
                        title="Cập nhật mật khẩu"
                        className="rounded-lg border border-[var(--border-color)]"
                      >
                        <Form
                          layout="vertical"
                          form={passwordForm}
                          onFinish={handleChangePassword}
                        >
                          <Form.Item
                            name="currentPassword"
                            label="Mật khẩu hiện tại"
                            rules={[
                              {
                                required: true,
                                message: "Vui lòng nhập mật khẩu hiện tại",
                              },
                            ]}
                          >
                            <Input.Password placeholder="Nhập mật khẩu hiện tại" />
                          </Form.Item>

                          <Form.Item
                            name="newPassword"
                            label="Mật khẩu mới"
                            rules={[
                              { required: true, message: "Vui lòng nhập mật khẩu mới" },
                              {
                                min: 6,
                                message: "Mật khẩu mới phải có ít nhất 6 ký tự",
                              },
                            ]}
                          >
                            <Input.Password placeholder="Nhập mật khẩu mới" />
                          </Form.Item>

                          <Form.Item
                            name="confirmNewPassword"
                            label="Xác nhận mật khẩu mới"
                            dependencies={["newPassword"]}
                            rules={[
                              {
                                required: true,
                                message: "Vui lòng xác nhận mật khẩu mới",
                              },
                              ({ getFieldValue }) => ({
                                validator(_, value) {
                                  if (!value || getFieldValue("newPassword") === value) {
                                    return Promise.resolve();
                                  }
                                  return Promise.reject(
                                    new Error("Xác nhận mật khẩu không khớp"),
                                  );
                                },
                              }),
                            ]}
                          >
                            <Input.Password placeholder="Nhập lại mật khẩu mới" />
                          </Form.Item>

                          <Button
                            type="primary"
                            htmlType="submit"
                            loading={changingPassword}
                            icon={<LockOutlined />}
                            style={{ backgroundColor: "var(--primary-color)" }}
                          >
                            Đổi mật khẩu
                          </Button>
                        </Form>
                      </Card>
                    ),
                  },
                  {
                    key: "activities",
                    label: (
                      <Space size={6}>
                        <ThunderboltOutlined />
                        Lịch sử hoạt động
                      </Space>
                    ),
                    children: (
                      <Card
                        size="small"
                        title="Hoạt động gần đây"
                        className="rounded-lg border border-[var(--border-color)]"
                      >
                        {loadingActivities ? (
                          <Skeleton active paragraph={{ rows: 6 }} />
                        ) : (
                          <List
                            dataSource={activities}
                            locale={{
                              emptyText: "Chưa có hoạt động nào được ghi nhận.",
                            }}
                            renderItem={(item) => (
                              <List.Item>
                                <div className="w-full">
                                  <div className="mb-1 flex items-center justify-between gap-2">
                                    <Space size={8}>
                                      {getActivityTag(item)}
                                      <Text strong>{item.action}</Text>
                                    </Space>
                                    <Text type="secondary">
                                      {formatDateTime(item.createdAt)}
                                    </Text>
                                  </div>
                                  <Text>{item.description}</Text>
                                  {item.metadata?.state && (
                                    <div className="mt-2">
                                      <Tag
                                        color={
                                          item.metadata.state.toLowerCase().includes("từ chối")
                                            ? "error"
                                            : item.metadata.state
                                                  .toLowerCase()
                                                  .includes("chấp nhận")
                                              ? "success"
                                              : "warning"
                                        }
                                      >
                                        {item.metadata.state}
                                      </Tag>
                                    </div>
                                  )}
                                </div>
                              </List.Item>
                            )}
                          />
                        )}
                      </Card>
                    ),
                  },
                ]}
              />
            </Space>
          ) : (
            <Alert
              type="warning"
              showIcon
              message="Không có dữ liệu hồ sơ"
              description="Không tìm thấy thông tin người dùng hiện tại. Vui lòng đăng nhập lại."
            />
          )}
        </Card>
      </Space>
    </div>
  );
};

export default UserProfilePage;
