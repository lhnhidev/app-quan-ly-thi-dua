import React from "react";
import { Form, Input, Button, Card, Typography } from "antd";

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onFinish = (values: any) => {
    console.log("Dữ liệu form:", values);
  };

  return (
    // Toàn bộ màn hình, nền gradient
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-color)] p-5">
      <h2 className="mb-5 text-3xl uppercase text-white">Quản lý Thi đua</h2>

      <Card className="w-full max-w-md rounded-lg shadow-xl">
        <div className="mb-6 text-center">
          <Title level={3} className="!mb-0">
            Chào mừng trở lại
          </Title>
          <Text type="secondary">
            Vui lòng đăng nhập vào tài khoản bên dưới.
          </Text>
        </div>

        <Form
          layout="vertical"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập Email!" },
              { type: "email", message: "Email không hợp lệ!" },
            ]}
            className="mb-6" // Khoảng cách dưới
          >
            <Input placeholder="Nhập email..." />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
            className="mb-4"
          >
            <Input.Password placeholder="Nhập mật khẩu..." />
          </Form.Item>

          <div className="mb-6 text-center">
            <Text type="secondary">Chưa có tài khoản? </Text>
            <a
              href="#"
              className="font-medium text-blue-500 hover:text-blue-600"
            >
              Liên hệ với admin
            </a>
          </div>

          <div className="flex items-center justify-between">
            <a
              href="/forgot-password"
              className="text-blue-500 hover:text-blue-600"
            >
              Khôi phục mật khẩu
            </a>
            <Button
              type="primary"
              htmlType="submit"
              className="h-10 bg-[var(--primary-color)] px-8"
            >
              Đăng nhập
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
