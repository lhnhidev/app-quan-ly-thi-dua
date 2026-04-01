import { Card, Form, Input, InputNumber, Select, Switch, Typography } from "antd";
import type { SettingField, SettingGroup } from "../../types/settings";

const { Text } = Typography;

type SettingsGroupCardProps = {
  group: SettingGroup;
};

const renderFieldInput = (field: SettingField) => {
  if (field.type === "switch") {
    return <Switch />;
  }

  if (field.type === "select") {
    return (
      <Select
        options={field.options}
        placeholder={field.placeholder || "Chon gia tri"}
      />
    );
  }

  if (field.type === "number") {
    return (
      <InputNumber
        min={field.min}
        max={field.max}
        step={field.step || 1}
        className="w-full"
      />
    );
  }

  return <Input placeholder={field.placeholder || "Nhap gia tri"} />;
};

const SettingsGroupCard = ({ group }: SettingsGroupCardProps) => {
  return (
    <Card
      title={group.title}
      className="h-full rounded-2xl shadow-sm"
      style={{
        backgroundColor: "var(--surface-1)",
        borderColor: "var(--border-color)",
      }}
    >
      <Text type="secondary" className="mb-4 block" style={{ color: "var(--text-muted)" }}>
        {group.description}
      </Text>

      <div className="space-y-4">
        {group.fields.map((field) => (
          <div
            key={field.key}
            className="rounded-xl p-4"
            style={{
              backgroundColor: "var(--surface-2)",
              border: "1px solid var(--border-color)",
            }}
          >
            <Form.Item
              label={field.label}
              name={[group.key, field.key]}
              valuePropName={field.type === "switch" ? "checked" : "value"}
              className="!mb-1"
            >
              {renderFieldInput(field)}
            </Form.Item>
            <Text type="secondary" className="text-xs" style={{ color: "var(--text-muted)" }}>
              {field.description}
            </Text>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default SettingsGroupCard;
