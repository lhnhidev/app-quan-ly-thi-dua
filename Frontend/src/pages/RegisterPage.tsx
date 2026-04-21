import React, { useMemo, useState } from "react";
import { Button, Form, Input, Typography, message } from "antd";
import {
  IdcardOutlined,
  LockOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const RegisterPage: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [registerData, setRegisterData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  } | null>(null);

  const otpTarget = useMemo(() => registerData?.email || "", [registerData?.email]);

  const requestOtp = async (values: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    if (values.password !== values.confirmPassword) {
      messageApi.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/register/request-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          password: values.password,
        }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(payload.message || "Không thể gửi OTP");
      }

      setRegisterData({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
      });
      setOtpRequested(true);
      messageApi.success("Đã gửi OTP đến email của bạn");
    } catch (error: any) {
      console.error(error);
      messageApi.error(error.message || "Không thể gửi OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (values: { otp: string }) => {
    if (!otpTarget) {
      messageApi.error("Không tìm thấy email xác thực");
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/register/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: otpTarget,
          otp: values.otp,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.message || "Xác thực OTP thất bại");
      }

      localStorage.setItem("userInfo", JSON.stringify(payload));
      messageApi.success("Đăng ký thành công");
      navigate("/home");
    } catch (error: any) {
      console.error(error);
      messageApi.error(error.message || "Xác thực OTP thất bại");
    } finally {
      setVerifying(false);
    }
  };

  const resendOtp = async () => {
    if (!otpTarget) return;

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/register/resend-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: otpTarget }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.message || "Không thể gửi lại OTP");
      }

      messageApi.success("Đã gửi lại OTP");
    } catch (error: any) {
      console.error(error);
      messageApi.error(error.message || "Không thể gửi lại OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, var(--surface-2) 0%, var(--bg-color) 45%, var(--surface-3) 100%)",
      }}
    >
      {contextHolder}

      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-color)]">
              <span className="text-2xl font-bold text-white">🎓</span>
            </div>
          </div>
          <Title level={2} className="!mb-2 !text-[var(--text-color)]">
            Tạo tài khoản
          </Title>
          <Text className="!text-[var(--text-muted)]">Đăng ký và xác thực OTP qua email</Text>
        </div>

        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-1)] p-8 shadow-lg backdrop-blur-sm">
          {!otpRequested ? (
            <>
              <div className="mb-8">
                <Title level={4} className="!mb-1 !text-[var(--text-color)]">
                  Bắt đầu đăng ký
                </Title>
                <Text className="block !text-[var(--text-muted)]">
                  Nhập thông tin để nhận mã OTP xác thực
                </Text>
              </div>

              <Form layout="vertical" onFinish={requestOtp} size="large" autoComplete="off">
                <Form.Item
                  name="lastName"
                  rules={[{ required: true, message: "Vui lòng nhập họ" }]}
                  className="!mb-4"
                >
                  <Input
                    prefix={<UserOutlined className="mr-2 text-[var(--primary-color)]" />}
                    placeholder="Họ"
                    className="rounded-lg border-[var(--border-color)] bg-[var(--surface-2)] px-4 py-2"
                  />
                </Form.Item>

                <Form.Item
                  name="firstName"
                  rules={[{ required: true, message: "Vui lòng nhập tên" }]}
                  className="!mb-4"
                >
                  <Input
                    prefix={<IdcardOutlined className="mr-2 text-[var(--primary-color)]" />}
                    placeholder="Tên"
                    className="rounded-lg border-[var(--border-color)] bg-[var(--surface-2)] px-4 py-2"
                  />
                </Form.Item>

                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: "Vui lòng nhập email" },
                    { type: "email", message: "Email không hợp lệ" },
                  ]}
                  className="!mb-4"
                >
                  <Input
                    prefix={<MailOutlined className="mr-2 text-[var(--primary-color)]" />}
                    placeholder="you@example.com"
                    className="rounded-lg border-[var(--border-color)] bg-[var(--surface-2)] px-4 py-2"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }, { min: 6, message: "Tối thiểu 6 ký tự" }]}
                  className="!mb-4"
                >
                  <Input.Password
                    prefix={<LockOutlined className="mr-2 text-[var(--primary-color)]" />}
                    placeholder="Mật khẩu"
                    className="rounded-lg border-[var(--border-color)] bg-[var(--surface-2)] px-4 py-2"
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  dependencies={["password"]}
                  rules={[{ required: true, message: "Vui lòng nhập lại mật khẩu" }]}
                  className="!mb-6"
                >
                  <Input.Password
                    prefix={<LockOutlined className="mr-2 text-[var(--primary-color)]" />}
                    placeholder="Nhập lại mật khẩu"
                    className="rounded-lg border-[var(--border-color)] bg-[var(--surface-2)] px-4 py-2"
                  />
                </Form.Item>

                <Button
                  htmlType="submit"
                  type="primary"
                  loading={loading}
                  block
                  size="large"
                  className="!h-12 !rounded-lg !bg-gradient-to-r !from-[var(--primary-color)] !to-[var(--secondary-color)] !text-base !font-semibold !text-white"
                >
                  Gửi OTP
                </Button>
              </Form>
            </>
          ) : (
            <>
              <div className="mb-8">
                <Title level={4} className="!mb-1 !text-[var(--text-color)]">
                  Xác thực OTP
                </Title>
                <Text className="block !text-[var(--text-muted)]">
                  Nhập mã 6 chữ số đã gửi tới {otpTarget}
                </Text>
              </div>

              <Form layout="vertical" onFinish={verifyOtp} size="large" autoComplete="off">
                <Form.Item
                  name="otp"
                  rules={[
                    { required: true, message: "Vui lòng nhập OTP" },
                    { len: 6, message: "OTP gồm 6 chữ số" },
                  ]}
                  className="!mb-6"
                >
                  <Input
                    maxLength={6}
                    prefix={<SafetyCertificateOutlined className="mr-2 text-[var(--primary-color)]" />}
                    placeholder="Nhập OTP 6 số"
                    className="rounded-lg border-[var(--border-color)] bg-[var(--surface-2)] px-4 py-2"
                  />
                </Form.Item>

                <Button
                  htmlType="submit"
                  type="primary"
                  loading={verifying}
                  block
                  size="large"
                  className="!h-12 !rounded-lg !bg-gradient-to-r !from-[var(--primary-color)] !to-[var(--secondary-color)] !text-base !font-semibold !text-white"
                >
                  Xác thực và hoàn tất
                </Button>

                <div className="mt-4 flex justify-between">
                  <Button type="link" onClick={() => setOtpRequested(false)}>
                    Quay lại
                  </Button>
                  <Button type="link" onClick={resendOtp} loading={loading}>
                    Gửi lại OTP
                  </Button>
                </div>
              </Form>
            </>
          )}

          <div className="mt-6 border-t border-[var(--border-color)] pt-4 text-center">
            <Text className="text-sm !text-[var(--text-muted)]">
              Đã có tài khoản? <a className="text-[var(--primary-color)]" href="/">Đăng nhập</a>
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
