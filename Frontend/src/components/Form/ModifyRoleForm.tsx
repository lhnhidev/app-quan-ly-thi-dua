import { useEffect } from "react";
import { Modal, Form, Input, Button, InputNumber, Radio } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { useAppContext } from "../../context";
import useFetch from "../../hooks/useFetch";

const ModifyRoleForm = () => {
  const {
    openModifyRoleForm,
    setOpenModifyRoleForm,
    setReRenderRuleTable,
    currentRole,
    messageApi,
  } = useAppContext();

  const [form] = Form.useForm();
  const { request, loading } = useFetch();

  useEffect(() => {
    if (openModifyRoleForm && currentRole) {
      form.setFieldsValue({
        content: currentRole.content,
        type: currentRole.type ? "bonus" : "penalty",
        point: Math.abs(currentRole.point),
      });
    }
  }, [openModifyRoleForm, currentRole, form]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onFinish = async (values: any) => {
    const userInfoString = localStorage.getItem("userInfo");
    const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
    const token = userInfo?.token;

    const isBonus = values.type === "bonus";
    const finalPoint = isBonus
      ? Math.abs(values.point)
      : -Math.abs(values.point);

    const payload = {
      content: values.content,
      point: finalPoint,
      type: isBonus,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await request(
      `${import.meta.env.VITE_SERVER_URL}/role/${currentRole._id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      },
    );

    if (response) {
      setOpenModifyRoleForm(false);
      messageApi.success("Cập nhật quy định thành công!");
      if (setReRenderRuleTable) setReRenderRuleTable((prev: boolean) => !prev);
    } else {
      messageApi.error("Cập nhật thất bại!");
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setOpenModifyRoleForm(false);
  };

  return (
    <Modal
      title={
        <div
          className="flex items-center gap-2"
          style={{ color: "var(--primary-color)" }}
        >
          <EditOutlined /> <span>Chỉnh sửa quy định</span>
        </div>
      }
      open={openModifyRoleForm}
      onCancel={handleCancel}
      footer={null}
      centered
      width={600}
    >
      <Form
        form={form}
        name="modify_role_form"
        onFinish={onFinish}
        layout="vertical"
        className="mt-4"
      >
        <Form.Item
          label="Nội dung quy định"
          name="content"
          rules={[{ required: true, message: "Vui lòng nhập nội dung!" }]}
        >
          <Input.TextArea rows={3} size="large" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-6">
          <Form.Item
            label="Loại điểm"
            name="type"
            rules={[{ required: true, message: "Vui lòng chọn loại điểm!" }]}
          >
            <Radio.Group buttonStyle="solid" className="flex w-full">
              <Radio.Button
                value="bonus"
                className="flex-1 text-center"
                style={{
                  borderColor:
                    form.getFieldValue("type") === "bonus"
                      ? "var(--primary-color)"
                      : undefined,
                  backgroundColor:
                    form.getFieldValue("type") === "bonus"
                      ? "var(--primary-color)"
                      : undefined,
                }}
              >
                Điểm cộng (+)
              </Radio.Button>
              <Radio.Button
                value="penalty"
                className="flex-1 text-center"
                style={{
                  borderColor:
                    form.getFieldValue("type") === "penalty"
                      ? "#ff4d4f"
                      : undefined,
                  backgroundColor:
                    form.getFieldValue("type") === "penalty"
                      ? "#ff4d4f"
                      : undefined,
                  color:
                    form.getFieldValue("type") === "penalty"
                      ? "white"
                      : undefined,
                }}
              >
                Điểm trừ (-)
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="Điểm số (>= 1)"
            name="point"
            rules={[
              { required: true, message: "Nhập điểm số!" },
              { type: "number", min: 1, message: "Điểm số phải lớn hơn 0!" },
            ]}
          >
            <InputNumber className="w-full" size="large" min={1} />
          </Form.Item>
        </div>

        <div className="mt-4 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button onClick={handleCancel} size="large">
            Hủy bỏ
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            className="border-none text-white shadow-md"
            style={{ backgroundColor: "var(--primary-color)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--secondary-color)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--primary-color)")
            }
          >
            Cập nhật
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ModifyRoleForm;
