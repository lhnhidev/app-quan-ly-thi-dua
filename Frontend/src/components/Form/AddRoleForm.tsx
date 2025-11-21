import { Modal, Form, Input, Button, message, InputNumber, Radio } from "antd";
import { PlusOutlined, FileAddOutlined } from "@ant-design/icons";
import { useAppContext } from "../../context";
import useFetch from "../../hooks/useFetch";

const AddRoleForm = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const { openAddRoleForm, setOpenAddRoleForm, setReRenderRuleTable } =
    useAppContext();

  const [form] = Form.useForm();
  const { request, loading } = useFetch();

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
      `${import.meta.env.VITE_SERVER_URL}/role`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      },
    );

    if (response) {
      messageApi.success("Thêm quy định mới thành công!");
      form.resetFields();
      setOpenAddRoleForm(false);
      if (setReRenderRuleTable) setReRenderRuleTable((prev: boolean) => !prev);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setOpenAddRoleForm(false);
  };

  return (
    <Modal
      title={
        <div
          className="flex items-center gap-2"
          style={{ color: "var(--primary-color)" }}
        >
          <FileAddOutlined /> <span>Thêm quy định thi đua</span>
        </div>
      }
      open={openAddRoleForm}
      onCancel={handleCancel}
      footer={null}
      centered
      width={600}
    >
      {contextHolder}

      <Form
        form={form}
        name="add_role_form"
        onFinish={onFinish}
        layout="vertical"
        className="mt-4"
        initialValues={{
          type: "bonus",
          point: 10,
        }}
      >
        <Form.Item
          label="Nội dung quy định"
          name="content"
          rules={[{ required: true, message: "Vui lòng nhập nội dung!" }]}
        >
          <Input.TextArea
            placeholder="VD: Đi học muộn, Nhặt được của rơi..."
            rows={3}
            size="large"
          />
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
                className="flex-1 text-center hover:!text-[var(--primary-color)]"
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
            <InputNumber
              className="w-full"
              size="large"
              placeholder="VD: 10"
              min={1}
            />
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
            icon={<PlusOutlined />}
            size="large"
            className="border-none text-white shadow-md"
            style={{
              backgroundColor: "var(--primary-color)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--secondary-color)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--primary-color)")
            }
          >
            Thêm mới
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddRoleForm;
