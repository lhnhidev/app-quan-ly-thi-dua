import { useEffect, useMemo } from "react";
import { Button, Form, Typography, message } from "antd";
import SettingsGroupCard from "../components/settings/SettingsGroupCard";
import { settingsSchema } from "../data/settingsSchema";
import { useAppContext } from "../context";
import type { ThemeMode } from "../types/theme";

const { Title, Text } = Typography;

const buildInitialValues = () => {
  return settingsSchema.reduce<Record<string, Record<string, boolean | string | number>>>(
    (acc, group) => {
      acc[group.key] = group.fields.reduce<Record<string, boolean | string | number>>(
        (fieldAcc, field) => {
          fieldAcc[field.key] = field.defaultValue;
          return fieldAcc;
        },
        {}
      );
      return acc;
    },
    {}
  );
};

const ManageSettingsPage = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const { themeMode, setThemeMode } = useAppContext();
  const initialValues = useMemo(() => buildInitialValues(), []);

  useEffect(() => {
    form.setFieldValue(["system", "themeMode"], themeMode);
  }, [form, themeMode]);

  const onValuesChange = (changedValues: { system?: { themeMode?: ThemeMode } }) => {
    const nextThemeMode = changedValues.system?.themeMode;
    if (nextThemeMode) {
      setThemeMode(nextThemeMode);
    }
  };

  const onReset = () => {
    form.resetFields();
    setThemeMode("system");
  };

  const onSubmit = () => {
    messageApi.success("Đã áp dụng cài đặt giao diện. Các tùy chọn khác sẽ được triển khai sau.");
  };

  return (
    <div className="min-h-full p-6" style={{ backgroundColor: "var(--bg-color)" }}>
      {contextHolder}

      <div
        className="mb-6 rounded-2xl p-6 shadow-sm"
        style={{
          backgroundColor: "var(--surface-1)",
          border: "1px solid var(--border-color)",
        }}
      >
        <Title level={3} className="!mb-1">
          Cài đặt hệ thống
        </Title>
        <Text type="secondary" style={{ color: "var(--text-muted)" }}>
          Khu vực tổng hợp các tùy chọn quản trị. Hiện tại chỉ mô phỏng giao diện,
          chưa lưu vào server.
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          ...initialValues,
          system: {
            ...initialValues.system,
            themeMode,
          },
        }}
        onValuesChange={onValuesChange}
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {settingsSchema.map((group) => (
            <SettingsGroupCard key={group.key} group={group} />
          ))}
        </div>

        <div
          className="mt-6 flex items-center justify-end gap-3 rounded-2xl p-4 shadow-sm"
          style={{
            backgroundColor: "var(--surface-1)",
            border: "1px solid var(--border-color)",
          }}
        >
          <Button onClick={onReset}>Khôi phục mặc định</Button>
          <Button type="primary" onClick={onSubmit}>
            Lưu cài đặt
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ManageSettingsPage;
