import { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Button, Row, Col, Typography } from "antd";
import {
  UserAddOutlined,
  PlusOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import useFetch from "../../hooks/useFetch";
import { useAppContext } from "../../context";

interface ClassData {
  _id: string;
  name: string;
  idClass: string;
}

const AddTeacherForm = () => {
  const [form] = Form.useForm();
  const [classList, setClassList] = useState<ClassData[]>([]);

  const { request, loading } = useFetch<ClassData[]>();

  const {
    openAddTeacherForm,
    setOpenAddTeacherForm,
    messageApi,
    setReRenderTableTeacher,
  } = useAppContext();

  useEffect(() => {
    if (openAddTeacherForm) {
      const fetchClasses = async () => {
        const userInfoString = localStorage.getItem("userInfo");
        const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
        const token = userInfo?.token;

        try {
          const data = await request(
            `${import.meta.env.VITE_SERVER_URL}/class`,
            {
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          if (data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const filteredData = data.filter((cls: any) => !cls.teacher);
            setClassList(filteredData);
          }
        } catch (error) {
          console.error(error);
        }
      };

      fetchClasses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAddTeacherForm]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAdd = async (values: any) => {
    console.log(values);
    const userInfoString = localStorage.getItem("userInfo");
    const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
    const token = userInfo?.token;

    console.log(values.teachers);

    const response = await request(
      `${import.meta.env.VITE_SERVER_URL}/teacher`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teacherList: values.teachers }),
      },
    );

    if (response.status !== "success") {
      // messageApi.error(response.message || "Đã có lỗi xảy ra!");
      if (response.message === "Dữ liệu không hợp lệ") {
        if (response.duplicateEmailsInList) {
          messageApi.error({
            content: (
              <Typography.Text
                style={{ maxWidth: 300, color: "inherit" }}
                ellipsis={{
                  tooltip: `Email trùng trong danh sách: ${response.duplicateEmailsInList}`,
                }}
              >
                Email trùng trong danh sách: {response.duplicateEmailsInList}
              </Typography.Text>
            ),
          });
        }
        if (response.duplicateIdsInList) {
          messageApi.error({
            content: (
              <Typography.Text
                style={{ maxWidth: 300, color: "inherit" }}
                ellipsis={{
                  tooltip: `Mã giáo viên trùng trong danh sách: ${response.duplicateIdsInList}`,
                }}
              >
                Mã giáo viên trùng trong danh sách:{" "}
                {response.duplicateIdsInList}
              </Typography.Text>
            ),
          });
        }
        if (response.duplicateIdsClass) {
          messageApi.error({
            content: (
              <Typography.Text
                style={{ maxWidth: 300, color: "inherit" }}
                ellipsis={{
                  tooltip: `Mã lớp trùng trong danh sách: ${response.duplicateIdsClass}`,
                }}
              >
                Mã lớp trùng trong danh sách
              </Typography.Text>
            ),
          });
        }
      } else if (response.message === "Không thể thêm giáo viên") {
        if (response.existingEmails) {
          messageApi.error({
            content: (
              <Typography.Text
                style={{ maxWidth: 300, color: "inherit" }}
                ellipsis={{
                  tooltip: `Email đã tồn tại trong CSDL: ${response.existingEmails}`,
                }}
              >
                Email đã tồn tại trong CSDL: {response.existingEmails}
              </Typography.Text>
            ),
          });
        }

        if (response.existingIds) {
          messageApi.error({
            content: (
              <Typography.Text
                style={{ maxWidth: 300, color: "inherit" }}
                ellipsis={{
                  tooltip: `Mã giáo viên đã tồn tại trong CSDL: ${response.existingIds}`,
                }}
              >
                Mã giáo viên đã tồn tại trong CSDL: {response.existingIds}
              </Typography.Text>
            ),
          });
        }
      }
      return;
    }

    messageApi.success("Đã thêm giáo viên thành công!");
    form.resetFields();
    setOpenAddTeacherForm(false);
    setReRenderTableTeacher((prev) => !prev);
  };

  const handleCancel = () => {
    form.resetFields();
    setOpenAddTeacherForm(false);
  };

  return (
    <Modal
      title={
        <div
          className="flex items-center gap-2"
          style={{ color: "var(--primary-color)" }}
        >
          <UserAddOutlined /> <span>Thêm giáo viên mới</span>
        </div>
      }
      open={openAddTeacherForm}
      onCancel={handleCancel}
      footer={null}
      centered
      width={800}
      className="add-teacher-modal"
      forceRender
    >
      <Form
        form={form}
        name="add_teacher_form"
        onFinish={handleAdd}
        layout="vertical"
        className="mt-4"
        initialValues={{ teachers: [{}] }}
      >
        <Form.List name="teachers">
          {(fields, { add, remove }) => (
            <div className="custom-scrollbar max-h-[60vh] overflow-y-auto pr-2">
              {fields.map(({ key, name, ...restField }, index) => (
                <div
                  key={key}
                  className={`relative mb-6 mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-blue-200 hover:shadow-sm ${index > 0 ? "mt-4" : ""}`}
                >
                  <div className="absolute -top-3 left-3 bg-white px-2 text-xs font-bold text-gray-500">
                    Giáo viên #{index + 1}
                  </div>

                  {fields.length > 1 && (
                    <div className="absolute -right-2 -top-2 z-10">
                      <MinusCircleOutlined
                        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-white text-red-500 shadow-sm hover:bg-red-50 hover:text-red-600"
                        onClick={() => remove(name)}
                      />
                    </div>
                  )}

                  <Row gutter={16} align="middle">
                    <Col span={24}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            {...restField}
                            label="Mã giáo viên"
                            name={[name, "idTeacher"]}
                            rules={[{ required: true, message: "Nhập mã GV!" }]}
                          >
                            <Input placeholder="VD: TCH-001" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            {...restField}
                            label="Email"
                            name={[name, "email"]}
                            rules={[
                              { required: true, message: "Nhập email!" },
                              {
                                type: "email",
                                message: "Email sai định dạng!",
                              },
                            ]}
                          >
                            <Input placeholder="VD: example@school.com" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            {...restField}
                            label="Họ (và tên đệm)"
                            name={[name, "lastName"]}
                            rules={[{ required: true, message: "Nhập họ!" }]}
                          >
                            <Input placeholder="VD: Nguyễn Văn" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            {...restField}
                            label="Tên"
                            name={[name, "firstName"]}
                            rules={[{ required: true, message: "Nhập tên!" }]}
                          >
                            <Input placeholder="VD: An" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        {...restField}
                        label="Lớp chủ nhiệm (Nếu có)"
                        name={[name, "idClass"]}
                        className="mb-0"
                      >
                        <Select
                          placeholder={
                            loading ? "Đang tải..." : "Chọn lớp chủ nhiệm"
                          }
                          loading={loading}
                          allowClear
                          showSearch
                          optionFilterProp="children"
                        >
                          {classList.map((cls) => (
                            <Select.Option key={cls._id} value={cls._id}>
                              {cls.idClass} - {cls.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              ))}

              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
                size="large"
                className="mt-2 border-dashed border-blue-300 text-blue-500 hover:border-blue-500 hover:text-blue-600"
              >
                Thêm dòng giáo viên
              </Button>
            </div>
          )}
        </Form.List>

        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button onClick={handleCancel} size="large">
            Hủy bỏ
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            icon={<PlusOutlined />}
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
            Lưu danh sách
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddTeacherForm;
