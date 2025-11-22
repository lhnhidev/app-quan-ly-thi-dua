import { useEffect, useState } from "react";
import { Modal, Form, Button, Select, message, Tag } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { useAppContext } from "../../context";
import useFetch from "../../hooks/useFetch";

// --- Interfaces (Giữ nguyên như form thêm) ---
interface ClassData {
  _id: string;
  name: string;
}

interface StudentData {
  _id: string;
  firstName: string;
  lastName: string;
  idStudent: string;
  class: ClassData | string;
}

interface RuleData {
  _id: string;
  content: string;
  point: number;
  type: boolean;
}

const ModifyRecordForm = () => {
  // 1. Hooks & Context
  const [messageApi, contextHolder] = message.useMessage();
  const {
    openModifyRecordForm,
    setOpenModifyRecordForm,
    setReRenderTableRecord,
    currentRecordForm, // Dữ liệu phiếu cần sửa
  } = useAppContext();

  const [form] = Form.useForm();
  const { request, loading } = useFetch();

  // Hooks get data
  const { request: requestClass } = useFetch<ClassData[]>();
  const { request: requestStudent } = useFetch<StudentData[]>();
  const { request: requestRule } = useFetch<RuleData[]>();

  // 2. Local States
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [allStudents, setAllStudents] = useState<StudentData[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentData[]>([]);
  const [rules, setRules] = useState<RuleData[]>([]);
  const [isStudentDisabled, setIsStudentDisabled] = useState(true);

  // 3. Load dữ liệu danh mục (Lớp, HS, Role)
  useEffect(() => {
    const fetchInitialData = async () => {
      const userInfoString = localStorage.getItem("userInfo");
      const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
      const token = userInfo?.token;

      if (openModifyRecordForm && token) {
        const [classData, studentData, ruleData] = await Promise.all([
          requestClass(`${import.meta.env.VITE_SERVER_URL}/class`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }),
          requestStudent(`${import.meta.env.VITE_SERVER_URL}/student`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }),
          requestRule(`${import.meta.env.VITE_SERVER_URL}/role`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (classData) setClasses(classData);
        if (studentData) setAllStudents(studentData);
        if (ruleData) setRules(ruleData);
      }
    };

    fetchInitialData();
  }, [openModifyRecordForm, requestClass, requestRule, requestStudent]);

  useEffect(() => {
    if (openModifyRecordForm && currentRecordForm && allStudents.length > 0) {
      const classId = currentRecordForm.class._id;

      const studentsInClass = allStudents.filter((s) => {
        const sClassId = typeof s.class === "object" ? s.class?._id : s.class;
        return sClassId === classId;
      });

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilteredStudents(studentsInClass);
      setIsStudentDisabled(false);

      form.setFieldsValue({
        classId: classId,
        student: currentRecordForm.student._id,
        rule: currentRecordForm.rule._id,
      });
    }
  }, [openModifyRecordForm, currentRecordForm, allStudents, form]);

  const handleClassChange = (classId: string) => {
    form.setFieldsValue({ student: undefined });

    if (!classId) {
      setIsStudentDisabled(true);
      setFilteredStudents([]);
      return;
    }

    const studentsInClass = allStudents.filter((s) => {
      const sClassId = typeof s.class === "object" ? s.class?._id : s.class;
      return sClassId === classId;
    });

    setFilteredStudents(studentsInClass);
    setIsStudentDisabled(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onFinish = async (values: any) => {
    const userInfoString = localStorage.getItem("userInfo");
    const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
    const token = userInfo?.token;
    const userId = userInfo?._id;

    const payload = {
      user: userId,
      classId: values.classId,
      student: values.student,
      rule: values.rule,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await request(
      `${import.meta.env.VITE_SERVER_URL}/record-form/${currentRecordForm._id}`,
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
      messageApi.success("Cập nhật phiếu thi đua thành công!");
      setOpenModifyRecordForm(false);
      if (setReRenderTableRecord)
        setReRenderTableRecord((prev: boolean) => !prev);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setOpenModifyRecordForm(false);
  };

  return (
    <Modal
      title={
        <div
          className="flex items-center gap-2"
          style={{ color: "var(--primary-color)" }}
        >
          <EditOutlined /> <span>Chỉnh sửa phiếu thi đua</span>
        </div>
      }
      open={openModifyRecordForm}
      onCancel={handleCancel}
      footer={null}
      centered
      width={600}
    >
      {contextHolder}

      <Form
        form={form}
        name="modify_record_form"
        onFinish={onFinish}
        layout="vertical"
        className="mt-4"
      >
        <Form.Item
          label="Lớp học"
          name="classId"
          rules={[{ required: true, message: "Vui lòng chọn lớp!" }]}
        >
          <Select
            placeholder="Chọn lớp học"
            size="large"
            onChange={handleClassChange}
          >
            {classes.map((cls) => (
              <Select.Option key={cls._id} value={cls._id}>
                {cls.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Học sinh"
          name="student"
          rules={[{ required: true, message: "Vui lòng chọn học sinh!" }]}
        >
          <Select
            placeholder={
              isStudentDisabled ? "Vui lòng chọn lớp trước" : "Chọn học sinh"
            }
            size="large"
            disabled={isStudentDisabled}
            showSearch
            optionFilterProp="label"
          >
            {filteredStudents.map((stu) => (
              <Select.Option
                key={stu._id}
                value={stu._id}
                label={`${stu.lastName} ${stu.firstName} (${stu.idStudent})`}
              >
                <div className="flex justify-between">
                  <span>
                    {stu.lastName} {stu.firstName}
                  </span>
                  <span className="text-xs text-gray-400">{stu.idStudent}</span>
                </div>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Nội dung / Thang điểm"
          name="rule"
          rules={[
            { required: true, message: "Vui lòng chọn nội dung thi đua!" },
          ]}
        >
          <Select
            placeholder="Tìm kiếm nội dung..."
            size="large"
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "")
                .toString()
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            {rules.map((rule) => {
              const isBonus = rule.type;
              const pointLabel = isBonus
                ? `+${rule.point}`
                : `-${Math.abs(rule.point)}`;
              const color = isBonus ? "green" : "red";

              return (
                <Select.Option
                  key={rule._id}
                  value={rule._id}
                  label={rule.content}
                >
                  <div className="flex w-full items-center justify-between">
                    <span
                      className="max-w-[350px] truncate"
                      title={rule.content}
                    >
                      {rule.content}
                    </span>
                    <Tag color={color} className="mr-0 font-bold">
                      {pointLabel}đ
                    </Tag>
                  </div>
                </Select.Option>
              );
            })}
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

export default ModifyRecordForm;
