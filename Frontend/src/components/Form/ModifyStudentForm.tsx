import { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Select, message } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { useAppContext } from "../../context";
import useFetch from "../../hooks/useFetch";

interface ClassData {
  _id: string;
  name: string;
}

const ModifyStudentForm = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const {
    openModifyStudentForm,
    setOpenModifyStudentForm,
    setReRenderTableStudent,
    currentStudent,
    setCurrentStudent,
  } = useAppContext();

  const [form] = Form.useForm();
  const { request, loading } = useFetch();
  const { request: requestClass } = useFetch<ClassData[]>();

  const [classes, setClasses] = useState<ClassData[]>([]);

  useEffect(() => {
    const fetchClasses = async () => {
      const userInfoString = localStorage.getItem("userInfo");
      const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
      const token = userInfo?.token;

      if (openModifyStudentForm) {
        const data = await requestClass(
          `${import.meta.env.VITE_SERVER_URL}/class`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (data) setClasses(data);
      }
    };
    fetchClasses();
  }, [openModifyStudentForm, requestClass]);

  useEffect(() => {
    if (openModifyStudentForm && currentStudent) {
      form.setFieldsValue({
        firstName: currentStudent?.firstName || "",
        lastName: currentStudent?.lastName || "",
        idStudent: currentStudent?.idStudent || "",
        class:
          typeof currentStudent?.class === "object"
            ? currentStudent?.class?._id
            : (currentStudent?.class as unknown as string) || "",
      });
    }
  }, [openModifyStudentForm, currentStudent, form]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onFinish = async (values: any) => {
    const userInfoString = localStorage.getItem("userInfo");
    const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
    const token = userInfo?.token;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await request(
      `${import.meta.env.VITE_SERVER_URL}/student/${currentStudent?._id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      },
    );

    if (response && response.status === 409) {
      messageApi.error(
        response.message || "Mã học sinh đã được sử dụng bởi học sinh khác.",
      );
      return;
    }

    if (response && response.error) {
      messageApi.error(response.message || "Cập nhật thất bại");
      return;
    }

    if (response) {
      messageApi.success("Cập nhật thông tin học sinh thành công!");
      setOpenModifyStudentForm(false);
      setCurrentStudent(null);
      setReRenderTableStudent((prev: boolean) => !prev);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setOpenModifyStudentForm(false);
    setCurrentStudent(null);
  };

  return (
    <Modal
      title={
        <div
          className="flex items-center gap-2"
          style={{ color: "var(--primary-color)" }}
        >
          <EditOutlined /> <span>Cập nhật thông tin học sinh</span>
        </div>
      }
      open={openModifyStudentForm}
      onCancel={handleCancel}
      footer={null}
      centered
      width={600}
    >
      {contextHolder}

      <Form
        form={form}
        name="modify_student_form"
        onFinish={onFinish}
        layout="vertical"
        className="mt-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label="Họ đệm"
            name="firstName"
            rules={[{ required: true, message: "Vui lòng nhập họ đệm!" }]}
          >
            <Input placeholder="Vd: Nguyễn" size="large" />
          </Form.Item>
          <Form.Item
            label="Tên"
            name="lastName"
            rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
          >
            <Input placeholder="Vd: Văn An" size="large" />
          </Form.Item>
        </div>
        <Form.Item
          label="Mã học sinh"
          name="idStudent"
          rules={[{ required: true, message: "Vui lòng nhập mã học sinh!" }]}
        >
          <Input placeholder="Vd: STU-001" size="large" />
        </Form.Item>
        <Form.Item
          label="Lớp học"
          name="class"
          rules={[{ required: true, message: "Vui lòng chọn lớp!" }]}
        >
          <Select placeholder="Chọn lớp học" size="large">
            {classes.map((cls) => (
              <Select.Option key={cls._id} value={cls._id}>
                {cls.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button onClick={handleCancel} size="large">
            Hủy bỏ
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
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
            Cập nhật
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ModifyStudentForm;
