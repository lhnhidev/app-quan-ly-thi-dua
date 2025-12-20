import { useEffect, useState } from "react"; // Thêm useEffect, useState
import { Modal, Form, Input, Button, message, Select, Divider } from "antd";
import { UserAddOutlined } from "@ant-design/icons";
import {
  RiIdCardLine,
  RiMailLine,
  RiLockPasswordLine,
  RiUserStarLine,
  RiSave3Line,
  RiBuilding4Line, // Icon mới cho lớp học
} from "react-icons/ri";
import { useAppContext } from "../../context";
import useFetch from "../../hooks/useFetch";

const { Option } = Select;

// Interface cho Lớp học (Tùy chỉnh theo response thực tế của bạn)
interface IClass {
  _id: string;
  name: string;
}

const AddUserForm = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const { openAddUserForm, setOpenAddUserForm, setReRenderTableUser } =
    useAppContext();

  const [form] = Form.useForm();
  const { request, loading } = useFetch();

  // 1. State lưu danh sách lớp
  const [classesList, setClassesList] = useState<IClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState<boolean>(false);

  // 2. Theo dõi giá trị của Role để ẩn hiện trường lớp học
  const currentRole = Form.useWatch("role", form);

  // 3. Fetch danh sách lớp khi mở form
  useEffect(() => {
    if (openAddUserForm) {
      const fetchClasses = async () => {
        setLoadingClasses(true);
        try {
          const userInfoString = localStorage.getItem("userInfo");
          const userInfo = userInfoString ? JSON.parse(userInfoString) : null;

          // Gọi API lấy danh sách lớp
          const res = await request(
            `${import.meta.env.VITE_SERVER_URL}/class`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${userInfo?.token}`,
              },
            },
          );

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
  }, [openAddUserForm, request]);

  // Interface Form
  interface IFormValues {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
    idUser: string;
    followingClasses?: string[]; // Thêm trường này
  }

  interface IUserInfo {
    token: string;
  }

  const onFinish = async (values: IFormValues) => {
    const userInfoString = localStorage.getItem("userInfo");
    const userInfo: IUserInfo | null = userInfoString
      ? JSON.parse(userInfoString)
      : null;
    const token = userInfo?.token;

    // 4. Chuẩn bị Payload
    const payload: IFormValues = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      password: values.password,
      role: values.role,
      idUser: values.idUser.trim().toUpperCase(),
      // Nếu là admin thì gửi mảng rỗng, ngược lại gửi mảng các ID lớp đã chọn
      followingClasses:
        values.role === "admin" ? [] : values.followingClasses || [],
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await request(
      `${import.meta.env.VITE_SERVER_URL}/user/createNewUser`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      },
    );

    if (response && response.status === 409) {
      messageApi.error(response.message);
      return;
    }

    if (response) {
      messageApi.success("Thêm người dùng thành công!");
      form.resetFields();
      setOpenAddUserForm(false);
      if (setReRenderTableUser) setReRenderTableUser((prev) => !prev);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setOpenAddUserForm(false);
  };

  return (
    <Modal
      title={
        <div
          className="flex items-center gap-2"
          style={{ color: "var(--primary-color)" }}
        >
          <UserAddOutlined /> <span>Thêm người dùng mới</span>
        </div>
      }
      open={openAddUserForm}
      onCancel={handleCancel}
      footer={null}
      centered
      width={700}
    >
      {contextHolder}

      <Form
        form={form}
        name="add_user_form"
        onFinish={onFinish}
        layout="vertical"
        className="mt-4"
        initialValues={{
          role: "student",
          followingClasses: [],
        }}
        size="large"
      >
        {/* Hàng 1: ID và Role */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Form.Item
            label="Mã định danh (ID)"
            name="idUser"
            rules={[
              { required: true, message: "Vui lòng nhập mã ID!" },
              {
                pattern: /^[A-Za-z0-9-]+$/,
                message: "Không chứa ký tự đặc biệt!",
              },
            ]}
          >
            <Input
              prefix={<RiIdCardLine className="text-gray-400" />}
              placeholder="VD: HS001"
            />
          </Form.Item>

          <Form.Item
            label="Vai trò hệ thống"
            name="role"
            rules={[{ required: true, message: "Vui lòng chọn vai trò!" }]}
          >
            <Select
              suffixIcon={<RiUserStarLine className="text-gray-400" />}
              placeholder="Chọn vai trò"
            >
              <Option value="student">Học sinh</Option>
              <Option value="teacher">Giáo viên</Option>
              <Option value="user">Cờ đỏ / Ban cán sự</Option>
              <Option value="admin">Quản trị viên</Option>
            </Select>
          </Form.Item>
        </div>

        {/* 5. Logic hiển thị trường chọn lớp */}
        {currentRole !== "admin" && (
          <div className="mt-2">
            <Form.Item
              label="Lớp theo dõi / Phụ trách"
              name="followingClasses"
              tooltip="Chọn các lớp mà người dùng này có quyền xem hoặc quản lý"
            >
              <Select
                mode="multiple"
                allowClear
                placeholder={
                  loadingClasses ? "Đang tải lớp..." : "Chọn các lớp..."
                }
                loading={loadingClasses}
                suffixIcon={<RiBuilding4Line className="text-gray-400" />}
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={classesList.map((cls) => ({
                  value: cls._id,
                  label: cls.name,
                }))}
              />
            </Form.Item>
          </div>
        )}

        <Divider dashed className="my-2 border-gray-300" />

        {/* Hàng 2: Họ tên */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Form.Item
            label="Họ & Tên đệm"
            name="lastName"
            rules={[{ required: true, message: "Nhập họ và tên đệm!" }]}
          >
            <Input placeholder="Nguyễn Văn" />
          </Form.Item>

          <Form.Item
            label="Tên"
            name="firstName"
            rules={[{ required: true, message: "Nhập tên!" }]}
          >
            <Input placeholder="An" />
          </Form.Item>
        </div>

        {/* Hàng 3: Email & Pass */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Form.Item
            label="Email đăng nhập"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email!" },
              { type: "email", message: "Email không đúng định dạng!" },
            ]}
          >
            <Input
              prefix={<RiMailLine className="text-gray-400" />}
              placeholder="example@school.edu.vn"
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu khởi tạo"
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu!" },
              { min: 6, message: "Mật khẩu phải từ 6 ký tự!" },
            ]}
          >
            <Input.Password
              prefix={<RiLockPasswordLine className="text-gray-400" />}
              placeholder="Nhập mật khẩu..."
            />
          </Form.Item>
        </div>

        {/* Footer Buttons */}
        <div className="mt-4 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button onClick={handleCancel} size="large">
            Hủy bỏ
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<RiSave3Line />}
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
            Thêm người dùng
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddUserForm;
