import { useState, useEffect } from "react";
import { Form, Input, Select, Button, Modal, message, Row, Col } from "antd";
import { EditOutlined, SaveOutlined } from "@ant-design/icons";
import { useAppContext } from "../../context";
import useFetch from "../../hooks/useFetch";

const { Option } = Select;
const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const ModifyTeacherForm = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // 1. Lấy Context
  const {
    openModifyTeacherForm,
    setOpenModifyTeacherForm,
    currentTeacher, // Object giáo viên cần sửa
    setReRenderTableTeacher, // Hàm trigger reload bảng (nếu có)
  } = useAppContext();

  // State cho danh sách lớp học
  const [classesList, setClassesList] = useState<ClassInfo[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const { request, loading } = useFetch();

  // 2. Fetch danh sách lớp học để hiển thị trong Select
  useEffect(() => {
    if (openModifyTeacherForm) {
      const fetchClasses = async () => {
        setLoadingClasses(true);
        try {
          const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
          // Gọi API lấy danh sách lớp
          const res = await request(`${SERVER_URL}/class`, {
            method: "GET",
            headers: { Authorization: `Bearer ${userInfo.token}` },
          });

          if (res) {
            setClassesList(res);
          }
        } catch (error) {
          console.error("Lỗi lấy danh sách lớp:", error);
        } finally {
          setLoadingClasses(false);
        }
      };
      fetchClasses();
    }
  }, [openModifyTeacherForm, request]);

  // 3. Điền dữ liệu giáo viên cũ vào Form
  useEffect(() => {
    if (openModifyTeacherForm && currentTeacher) {
      // Xử lý field idClass: Kiểm tra xem currentTeacher.idClass là object (đã populate) hay string id
      let classValue = undefined;
      if (currentTeacher.idClass) {
        classValue =
          typeof currentTeacher.idClass === "object"
            ? currentTeacher.idClass._id
            : currentTeacher.idClass;
      }

      form.setFieldsValue({
        idTeacher: currentTeacher.idTeacher,
        email: currentTeacher.email,
        lastName: currentTeacher.lastName,
        firstName: currentTeacher.firstName,
        homeroomClass: classValue,
      });
    }
  }, [openModifyTeacherForm, currentTeacher, form]);

  // 4. Xử lý Submit
  const onFinish = async (values: {
    idTeacher: string;
    email: string;
    lastName: string;
    firstName: string;
    homeroomClass: string;
  }) => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");

    // Chuẩn bị payload
    // Lưu ý: Tùy vào backend của bạn xử lý "bỏ lớp chủ nhiệm" như thế nào (gửi null hay chuỗi rỗng)
    const payload = {
      idTeacher: values.idTeacher,
      email: values.email,
      lastName: values.lastName,
      firstName: values.firstName,
      idClass: values.homeroomClass || null, // Nếu không chọn thì set null
    };

    // Gọi API PATCH /teacher/:id
    const res = await request(`${SERVER_URL}/teacher/${currentTeacher?._id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userInfo.token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res && res.status === 400) {
      messageApi.error(res.message || "Cập nhật thông tin giáo viên thất bại!");
      return;
    }

    if (res) {
      messageApi.success("Cập nhật thông tin giáo viên thành công!");
      handleCancel();
      // Reload lại bảng dữ liệu bên ngoài nếu có function này
      if (setReRenderTableTeacher) setReRenderTableTeacher((prev) => !prev);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setOpenModifyTeacherForm(false);
  };

  // Helper function để render text hiển thị trong Option
  interface PopulatedTeacherInfo {
    lastName: string;
    firstName: string;
  }

  interface ClassInfo {
    _id: string;
    name: string;
    teacher?: string | PopulatedTeacherInfo;
  }

  const renderClassOption = (cls: ClassInfo): React.ReactNode => {
    const isCurrentClass =
      currentTeacher?.idClass &&
      (typeof currentTeacher.idClass === "object"
        ? currentTeacher.idClass._id === cls._id
        : currentTeacher.idClass === cls._id);

    // Nếu lớp này do giáo viên khác chủ nhiệm
    if (cls.teacher && !isCurrentClass) {
      // cls.teacher có thể là object populate hoặc id string.
      // Giả sử backend populate teacher trong API /class
      const teacherName =
        typeof cls.teacher === "object"
          ? `${cls.teacher.lastName} ${cls.teacher.firstName}`
          : "Giáo viên khác";

      return `${cls.name} (GV: ${teacherName})`;
    }

    // Nếu lớp chưa có ai hoặc là lớp hiện tại của giáo viên này
    return `${cls.name} ${isCurrentClass ? "(Hiện tại)" : "(Trống)"}`;
  };

  return (
    <Modal
      title={
        <div
          className="flex items-center gap-2"
          style={{ color: "var(--primary-color)" }}
        >
          <EditOutlined /> <span>Chỉnh sửa thông tin giáo viên</span>
        </div>
      }
      open={openModifyTeacherForm}
      onCancel={handleCancel}
      footer={null}
      centered
      width={700} // Form ngang nên để rộng hơn chút
    >
      {contextHolder}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        size="large"
        className="mt-5"
      >
        <Row gutter={16}>
          {/* Cột 1: Mã GV & Họ */}
          <Col span={12}>
            <Form.Item
              label="Mã giáo viên"
              name="idTeacher"
              rules={[
                { required: true, message: "Vui lòng nhập mã giáo viên!" },
              ]}
            >
              <Input placeholder="VD: TCH-001" />
            </Form.Item>

            <Form.Item
              label="Họ (và tên đệm)"
              name="lastName"
              rules={[{ required: true, message: "Vui lòng nhập họ!" }]}
            >
              <Input placeholder="VD: Nguyễn Văn" />
            </Form.Item>
          </Col>

          {/* Cột 2: Email & Tên */}
          <Col span={12}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email!" },
                { type: "email", message: "Email không hợp lệ!" },
              ]}
            >
              <Input placeholder="VD: example@school.com" />
            </Form.Item>

            <Form.Item
              label="Tên"
              name="firstName"
              rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
            >
              <Input placeholder="VD: An" />
            </Form.Item>
          </Col>
        </Row>

        {/* Lớp chủ nhiệm (Chiếm full chiều ngang) */}
        <Form.Item label="Lớp chủ nhiệm (Nếu có)" name="homeroomClass">
          <Select
            placeholder={
              loadingClasses
                ? "Đang tải danh sách lớp..."
                : "Chọn lớp chủ nhiệm"
            }
            allowClear
            loading={loadingClasses}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              ((option?.children ?? "") as string)
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            {classesList.map((cls) => (
              <Option
                key={cls._id}
                value={cls._id}
                // Disabled nếu lớp đã có GVCN và không phải là lớp của chính GV này (optional logic)
                // disabled={cls.teacher && cls.teacher !== currentTeacher._id}
              >
                {renderClassOption(cls)}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button size="large" onClick={handleCancel}>
            Hủy bỏ
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            icon={<SaveOutlined />}
            style={{ backgroundColor: "var(--primary-color)" }}
          >
            Lưu thay đổi
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ModifyTeacherForm;
