import { Form, Input, Select, Button, Modal } from "antd";
import { FileAddOutlined, PlusOutlined } from "@ant-design/icons";
import { useAppContext } from "../../context";

const { Option } = Select;

// Định nghĩa kiểu dữ liệu cho form
interface ClassFormData {
  grade: number;
  classCode: string;
  homeroomTeacher: string;
}

const AddClassForm = () => {
  const [form] = Form.useForm();
  const { openAddClassForm, setOpenAddClassForm } = useAppContext();

  // Hàm xử lý khi ấn "Thêm"
  const handleAdd = (values: ClassFormData) => {
    console.log("Dữ liệu form:", values);
    // Sau khi log xong có thể reset form hoặc đóng modal tùy logic của bạn
    // form.resetFields();
  };

  return (
    <Modal
      title={
        <div
          className="flex items-center gap-2"
          style={{ color: "var(--primary-color)" }}
        >
          <FileAddOutlined /> <span>Tạo phiếu thi đua mới</span>
        </div>
      }
      open={openAddClassForm}
      onCancel={() => setOpenAddClassForm(false)}
      footer={null}
      centered
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleAdd}
        requiredMark={true} // Hiện dấu sao đỏ (*)
        size="large"
      >
        {/* Trường 1: Khối (6, 7, 8, 9) */}
        <Form.Item
          label={<span className="font-medium text-gray-700">Khối</span>}
          name="grade"
          rules={[{ required: true, message: "Vui lòng chọn khối!" }]}
        >
          <Select placeholder="Chọn khối học">
            {[6, 7, 8, 9].map((grade) => (
              <Option key={grade} value={grade}>
                Khối {grade}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Trường 2: Mã lớp (Text) */}
        <Form.Item
          label={<span className="font-medium text-gray-700">Mã lớp</span>}
          name="classCode"
          rules={[{ required: true, message: "Vui lòng nhập mã lớp!" }]}
        >
          <Input placeholder="Nhập mã lớp (VD: 9A1)" />
        </Form.Item>

        {/* Trường 3: Giáo viên chủ nhiệm (Dropdown A, B) */}
        <Form.Item
          label={
            <span className="font-medium text-gray-700">
              Giáo viên chủ nhiệm
            </span>
          }
          name="homeroomTeacher"
          rules={[{ required: true, message: "Vui lòng chọn giáo viên!" }]}
        >
          <Select placeholder="Chọn giáo viên chủ nhiệm">
            <Option value="GV_A">Giáo viên A</Option>
            <Option value="GV_B">Giáo viên B</Option>
          </Select>
        </Form.Item>

        {/* Footer: Các nút thao tác */}
        {/* Tạo khoảng cách lớn ở trên để tách biệt giống hình */}
        <div className="mt-8 flex justify-end gap-3 border-t border-transparent pt-4">
          <Button
            size="large"
            className="border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-800"
          >
            Hủy bỏ
          </Button>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            icon={<PlusOutlined />}
            className="bg-[var(--primary-color)] hover:opacity-90"
            // Ant Design Button type="primary" mặc định dùng màu xanh của Ant,
            // dòng style này để ghi đè bằng biến màu của bạn
            style={{
              backgroundColor: "var(--primary-color)",
              borderColor: "var(--primary-color)",
            }}
          >
            Thêm lớp
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddClassForm;
