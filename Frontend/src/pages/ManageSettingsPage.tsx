import { Button, Form, Typography, message } from "antd";
import SettingsGroupCard from "../components/settings/SettingsGroupCard";
import { settingsSchema } from "../data/settingsSchema";

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

  const onSubmit = () => {
    messageApi.info("Tinh nang luu cau hinh se duoc trien khai o buoc tiep theo.");
  };

  return (
    <div className="min-h-full bg-gray-50 p-6">
      {contextHolder}

      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
        <Title level={3} className="!mb-1">
          Cai dat he thong
        </Title>
        <Text type="secondary">
          Khu vuc tong hop cac tuy chon quan tri. Hien tai chi mo phong giao dien,
          chua luu vao server.
        </Text>
      </div>

      <Form form={form} layout="vertical" initialValues={buildInitialValues()}>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {settingsSchema.map((group) => (
            <SettingsGroupCard key={group.key} group={group} />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <Button onClick={() => form.resetFields()}>Khoi phuc mac dinh</Button>
          <Button type="primary" onClick={onSubmit}>
            Luu cai dat
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ManageSettingsPage;
