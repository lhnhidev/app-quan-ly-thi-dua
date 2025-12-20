import { useEffect, useState } from "react";
import { Modal, Form, Input, Button, message, Select, Divider } from "antd";
import { EditOutlined } from "@ant-design/icons";
import {
  RiIdCardLine,
  RiMailLine,
  RiLockPasswordLine,
  RiUserStarLine,
  RiSave3Line,
  RiBuilding4Line, // Icon cho lớp học
} from "react-icons/ri";
import { useAppContext } from "../../context";
import useFetch from "../../hooks/useFetch";

const { Option } = Select;

// Interface cho Lớp học
interface IClass {
  _id: string;
  name: string;
}

const ModifyUserForm = () => {
  const [messageApi, contextHolder] = message.useMessage();

  // Lấy data và state từ Context
  const {
    openModifyUserForm,
    setOpenModifyUserForm,
    currentUser, // Object user cần sửa
    setReRenderTableUser,
  } = useAppContext();

  const [form] = Form.useForm();
  const { request, loading } = useFetch();

  // 1. State lưu danh sách lớp
  const [classesList, setClassesList] = useState<IClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState<boolean>(false);

  // 2. Theo dõi giá trị Role để ẩn hiện trường lớp học
  const currentRole = Form.useWatch("role", form);

  // 3. Fetch danh sách lớp khi mở modal
  useEffect(() => {
    if (openModifyUserForm) {
      const fetchClasses = async () => {
        setLoadingClasses(true);
        try {
          const userInfoString = localStorage.getItem("userInfo");
          const userInfo = userInfoString ? JSON.parse(userInfoString) : null;

          const res = await request(
            `${import.meta.env.VITE_SERVER_URL}/class`,
            {
              method: "GET",
              headers: { Authorization: `Bearer ${userInfo?.token}` },
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
  }, [openModifyUserForm, request]);

  // 4. useEffect: Đổ dữ liệu user cũ vào form
  useEffect(() => {
    if (openModifyUserForm && currentUser) {
      // Xử lý followingClasses:
      // Backend có thể trả về mảng ID ["id1", "id2"] hoặc mảng Object [{_id: "id1", ...}] (nếu đã populate)
      // Select của Antd cần mảng string ID để hiển thị default value đúng.
      const processedFollowingClasses =
        currentUser.followingClasses?.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (item: any) => (typeof item === "object" ? item._id : item),
        ) || [];

      form.setFieldsValue({
        idUser: currentUser.idUser,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        role: currentUser.role,
        // Password không điền lại
        followingClasses: processedFollowingClasses,
      });
    }
  }, [openModifyUserForm, currentUser, form]);

  // Interface cho Form Values
  interface ModifyUserFormValues {
    idUser: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "student" | "teacher" | "user" | "admin";
    password?: string;
    followingClasses?: string[]; // Thêm trường này
  }

  interface UserInfo {
    token: string;
  }

  interface UpdateUserPayload {
    firstName: string;
    lastName: string;
    email: string;
    role: "student" | "teacher" | "user" | "admin";
    idUser: string;
    password?: string;
    followingClasses?: string[]; // Thêm trường này vào payload
  }

  const onFinish = async (values: ModifyUserFormValues) => {
    const userInfoString = localStorage.getItem("userInfo");
    const userInfo: UserInfo | null = userInfoString
      ? JSON.parse(userInfoString)
      : null;
    const token = userInfo?.token;

    // 5. Chuẩn bị payload
    const payload: UpdateUserPayload = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      role: values.role,
      idUser: values.idUser.trim().toUpperCase(),
      // Nếu là admin thì gửi mảng rỗng (hoặc backend tự xử lý), ngược lại lấy giá trị form
      followingClasses:
        values.role === "admin" ? [] : values.followingClasses || [],
    };

    // Chỉ gửi password nếu người dùng có nhập
    if (values.password) {
      payload.password = values.password;
    }

    // Gọi API PATCH
    const response = await request(
      `${import.meta.env.VITE_SERVER_URL}/user/modifyUser/${currentUser._id}`,
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
      messageApi.success("Cập nhật thông tin thành công!");
      handleCancel();
      if (setReRenderTableUser) setReRenderTableUser((prev) => !prev);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setOpenModifyUserForm(false);
  };

  return (
    <Modal
      title={
        <div
          className="flex items-center gap-2"
          style={{ color: "var(--primary-color)" }}
        >
          <EditOutlined /> <span>Chỉnh sửa thông tin người dùng</span>
        </div>
      }
      open={openModifyUserForm}
      onCancel={handleCancel}
      footer={null}
      centered
      width={700}
    >
      {contextHolder}

      <Form
        form={form}
        name="modify_user_form"
        onFinish={onFinish}
        layout="vertical"
        className="mt-4"
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
              <Option value="user">Cờ đỏ / Cán bộ lớp</Option>
              <Option value="admin">Quản trị viên</Option>
            </Select>
          </Form.Item>
        </div>

        {/* 6. Hiển thị trường chọn lớp (Logic tương tự AddUserForm) */}
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
                optionFilterProp="label"
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
            <Input placeholder="VD: Nguyễn Văn" />
          </Form.Item>

          <Form.Item
            label="Tên"
            name="firstName"
            rules={[{ required: true, message: "Nhập tên!" }]}
          >
            <Input placeholder="VD: An" />
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
              placeholder="VD: example@school.edu.vn"
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu mới (Tùy chọn)"
            name="password"
            tooltip="Chỉ nhập nếu bạn muốn đổi mật khẩu mới cho người dùng này"
            rules={[{ min: 6, message: "Mật khẩu phải từ 6 ký tự!" }]}
          >
            <Input.Password
              prefix={<RiLockPasswordLine className="text-gray-400" />}
              placeholder="Để trống nếu không đổi..."
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
            Cập nhật
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ModifyUserForm;
