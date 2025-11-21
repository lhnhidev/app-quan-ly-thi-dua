import { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Select, message } from "antd"; // Giữ nguyên import
import {
  MinusCircleOutlined,
  PlusOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { useAppContext } from "../../context";
import useFetch from "../../hooks/useFetch";

// Interface cho lớp học
interface ClassData {
  _id: string;
  name: string;
}

const AddStudentsForm = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const { openAddStudentForm, setOpenAddStudentForm, setReRenderTableStudent } =
    useAppContext();

  const [form] = Form.useForm();
  const { request, loading } = useFetch();
  const { request: requestClass } = useFetch<ClassData[]>();

  const [classes, setClasses] = useState<ClassData[]>([]);

  useEffect(() => {
    const fetchClasses = async () => {
      const userInfoString = localStorage.getItem("userInfo");
      const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
      const token = userInfo?.token;

      if (openAddStudentForm) {
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
  }, [openAddStudentForm, requestClass]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onFinish = async (values: any) => {
    const userInfoString = localStorage.getItem("userInfo");
    const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
    const token = userInfo?.token;

    const payload = {
      newStudents: values.students,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await request(
      `${import.meta.env.VITE_SERVER_URL}/student`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      },
    );

    if (response && response.existingIds) {
      messageApi.error(response.message);
      return;
    }

    if (response) {
      messageApi.success("Thêm danh sách học sinh thành công!");
      form.resetFields();
      // setOpenAddStudentForm(false);
      setReRenderTableStudent((prev) => !prev);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setOpenAddStudentForm(false);
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-blue-600">
          <UserAddOutlined /> <span>Thêm danh sách học sinh</span>
        </div>
      }
      open={openAddStudentForm}
      onCancel={handleCancel}
      footer={null}
      width={900}
      centered
      className="top-5"
    >
      {contextHolder}

      <Form
        form={form}
        name="dynamic_form_nest_item"
        onFinish={onFinish}
        autoComplete="off"
        layout="vertical"
        initialValues={{
          students: [
            { firstName: "", lastName: "", idStudent: "", class: null },
          ],
        }}
      >
        <div className="mb-2 grid grid-cols-12 gap-2 rounded bg-gray-50 p-2 font-semibold text-gray-600">
          <div className="col-span-2">Họ đệm</div>
          <div className="col-span-3">Tên</div>
          <div className="col-span-3">Mã Học Sinh</div>
          <div className="col-span-3">Lớp Học</div>
          <div className="col-span-1 text-center">Xóa</div>
        </div>

        <Form.List name="students">
          {(fields, { add, remove }) => (
            <>
              <div className="max-h-[400px] overflow-y-auto pr-2">
                {fields.map(({ key, name, ...restField }) => (
                  <div
                    key={key}
                    className="mb-2 grid grid-cols-12 items-start gap-2"
                  >
                    <div className="col-span-2">
                      <Form.Item
                        {...restField}
                        name={[name, "firstName"]}
                        rules={[{ required: true, message: "Nhập họ!" }]}
                        className="mb-0"
                      >
                        <Input placeholder="Vd: Nguyễn" />
                      </Form.Item>
                    </div>

                    <div className="col-span-3">
                      <Form.Item
                        {...restField}
                        name={[name, "lastName"]}
                        rules={[{ required: true, message: "Nhập tên!" }]}
                        className="mb-0"
                      >
                        <Input placeholder="Vd: Văn An" />
                      </Form.Item>
                    </div>

                    <div className="col-span-3">
                      <Form.Item
                        {...restField}
                        name={[name, "idStudent"]}
                        rules={[{ required: true, message: "Nhập mã!" }]}
                        className="mb-0"
                      >
                        <Input placeholder="Vd: STU-001" />
                      </Form.Item>
                    </div>

                    {/* Cột Lớp (Select) */}
                    <div className="col-span-3">
                      <Form.Item
                        {...restField}
                        name={[name, "class"]}
                        rules={[{ required: true, message: "Chọn lớp!" }]}
                        className="mb-0"
                      >
                        <Select placeholder="Chọn lớp">
                          {classes.map((cls) => (
                            <Select.Option key={cls._id} value={cls._id}>
                              {cls.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </div>

                    <div className="col-span-1 flex justify-center pt-1">
                      <MinusCircleOutlined
                        className="cursor-pointer text-xl text-red-500 transition-colors hover:text-red-700"
                        onClick={() => remove(name)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Form.Item className="mt-4">
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                  size="large"
                  className="border-blue-300 text-blue-600 hover:border-blue-500 hover:text-blue-700"
                >
                  Thêm dòng học sinh
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button onClick={handleCancel} size="large">
            Hủy bỏ
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            className="bg-blue-600 shadow-md"
          >
            Lưu danh sách
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddStudentsForm;
