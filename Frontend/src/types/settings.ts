export type SettingFieldType = "switch" | "select" | "number" | "text";

export type SettingOption = {
  label: string;
  value: string;
};

export type SettingField = {
  key: string;
  label: string;
  description: string;
  type: SettingFieldType;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: SettingOption[];
  defaultValue: boolean | string | number;
};

export type SettingGroup = {
  key: string;
  title: string;
  description: string;
  fields: SettingField[];
};
