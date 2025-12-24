/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  Button,
  Card,
  Tag,
  Modal,
  Form,
  Select,
  message,
  Popconfirm,
  Tooltip,
  Typography,
  Space,
  Input,
  Tabs,
  Statistic,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TrophyOutlined,
  SearchOutlined,
  TeamOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import useFetch from "../hooks/useFetch";
import dayjs from "dayjs";
// Import plugin này nếu muốn chắc chắn về việc so sánh tuần (tùy chọn, nhưng isSame 'week' thường đủ)
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const { Title } = Typography;

// --- Interfaces (Giữ nguyên như cũ) ---
interface UserCreator {
  idUser: string;
  firstName: string;
  lastName: string;
}

interface RecordForm {
  _id: string;
  idRecordForm: string;
  content: string;
  point: number;
  createdAt: string;
  creator: UserCreator;
}

interface Student {
  _id: string;
  idStudent: string;
  firstName: string;
  lastName: string;
  recordForms: RecordForm[];
}

interface Teacher {
  idTeacher: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ClassData {
  idClass: string;
  className: string;
  point: number;
  teacher: Teacher;
  students: Student[];
  _id: string;
}

interface Role {
  _id: string;
  content: string;
  point: number;
  type: boolean;
}

const ERedFlagPage: React.FC = () => {
  // --- Constants ---
  const BASE_WEEKLY_POINT = 300; // ĐIỂM SÀN LÀ 300

  // --- State & Hooks ---
  const [allClasses, setAllClasses] = useState<ClassData[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [rules, setRules] = useState<Role[]>([]);
  const [searchText, setSearchText] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit">("create");
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [currentRecord, setCurrentRecord] = useState<RecordForm | null>(null);

  const [form] = Form.useForm();
  const { request, loading } = useFetch();
  const SERVER_URL = import.meta.env.VITE_SERVER_URL;

  const userInfoStr = localStorage.getItem("userInfo");
  const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
  const followingClassIds: string[] = userInfo?.followingClasses || [];

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${userInfo?.token}`,
  });

  // --- Fetch Data ---
  const fetchAllClassesData = async () => {
    if (!followingClassIds.length) return;
    try {
      const promises = followingClassIds.map((id) =>
        request(`${SERVER_URL}/class/get/${id}`, {
          method: "GET",
          headers: getHeaders(),
        }),
      );
      const results = await Promise.all(promises);
      const validClasses: ClassData[] = results
        .map((res, index) =>
          res ? { ...res, _id: followingClassIds[index] } : null,
        )
        .filter((item): item is ClassData => item !== null);

      setAllClasses(validClasses);
      if (!activeTab && validClasses.length > 0) {
        setActiveTab(validClasses[0]._id);
      }
    } catch (error) {
      console.error("Lỗi fetch classes:", error);
    }
  };

  const fetchRules = async () => {
    try {
      const res = await request(`${SERVER_URL}/role`, {
        method: "GET",
        headers: getHeaders(),
      });
      if (res) setRules(Array.isArray(res) ? res : res.data || []);
    } catch (error) {
      console.error("Lỗi fetch roles:", error);
    }
  };

  useEffect(() => {
    if (userInfo && followingClassIds.length > 0) {
      fetchAllClassesData();
      fetchRules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Logic Derived State ---
  const currentClassData = useMemo(() => {
    return allClasses.find((c) => c._id === activeTab) || null;
  }, [allClasses, activeTab]);

  // === TÍNH TOÁN TỔNG ĐIỂM (UPDATED: BASE 300 + CURRENT WEEK) ===
  const calculatedClassPoint = useMemo(() => {
    // Nếu chưa có dữ liệu lớp hoặc rule, trả về điểm gốc 300
    if (!currentClassData || rules.length === 0) return BASE_WEEKLY_POINT;

    let total = BASE_WEEKLY_POINT; // Bắt đầu từ 300
    const currentWeek = dayjs(); // Thời điểm hiện tại để so sánh tuần

    currentClassData.students.forEach((student) => {
      if (student.recordForms) {
        student.recordForms.forEach((record) => {
          // 1. Kiểm tra xem phiếu có thuộc tuần hiện tại không?
          // 'week' sẽ so sánh cùng tuần và cùng năm
          const isThisWeek = dayjs(record.createdAt).isSame(
            currentWeek,
            "week",
          );

          if (isThisWeek) {
            // 2. Tìm rule tương ứng
            const matchedRule = rules.find((r) => r.content === record.content);

            if (matchedRule) {
              // matchedRule.type === true  => Thưởng (Cộng)
              // matchedRule.type === false => Phạt (Trừ)
              if (matchedRule.type) {
                total += Math.abs(record.point);
              } else {
                total -= Math.abs(record.point);
              }
            }
          }
        });
      }
    });

    return total;
  }, [currentClassData, rules]);
  // ================================================================

  const filteredStudents = useMemo(() => {
    if (!currentClassData?.students) return [];
    if (!searchText.trim()) return currentClassData.students;
    const lowerText = searchText.toLowerCase();
    return currentClassData.students.filter(
      (st) =>
        st.idStudent.toLowerCase().includes(lowerText) ||
        st.lastName.toLowerCase().includes(lowerText) ||
        st.firstName.toLowerCase().includes(lowerText),
    );
  }, [currentClassData, searchText]);

  const tabItems = allClasses.map((cls) => ({
    key: cls._id,
    label: (
      <span className="flex items-center gap-2 px-2 py-1 font-medium">
        <TeamOutlined /> {cls.className}
      </span>
    ),
  }));

  // --- Handlers (Giữ nguyên) ---
  const handleOpenCreate = (student: Student) => {
    setModalType("create");
    setCurrentStudent(student);
    setCurrentRecord(null);
    form.resetFields();
    form.setFieldsValue({
      studentName: `${student.lastName} ${student.firstName}`,
      studentIdDisplay: student.idStudent,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: RecordForm, student: Student) => {
    setModalType("edit");
    setCurrentStudent(student);
    setCurrentRecord(record);
    const matchedRule = rules.find((r) => r.content === record.content);
    form.setFieldsValue({
      studentName: `${student.lastName} ${student.firstName}`,
      studentIdDisplay: student.idStudent,
      ruleId: matchedRule ? matchedRule._id : undefined,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!userInfo || !currentClassData || !currentStudent) return;

      const payload = {
        user: userInfo._id,
        classId: currentClassData._id,
        student: currentStudent._id,
        rule: values.ruleId,
      };

      const url =
        modalType === "create"
          ? `${SERVER_URL}/record-form`
          : `${SERVER_URL}/record-form/patch/${currentRecord?._id}`;
      const method = modalType === "create" ? "POST" : "PATCH";

      const res = await request(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (res) {
        message.success(
          modalType === "create" ? "Đã tạo phiếu" : "Đã cập nhật",
        );
        setIsModalOpen(false);
        fetchAllClassesData();
      }
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  const handleDelete = async (recordId: string) => {
    try {
      const res = await request(`${SERVER_URL}/record-form/${recordId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (res) {
        message.success("Đã xóa phiếu");
        fetchAllClassesData();
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // --- Table Columns ---
  const studentColumns = [
    {
      title: "Mã HS",
      dataIndex: "idStudent",
      key: "idStudent",
      width: 90,
      render: (text: string) => <Tag color="geekblue">{text}</Tag>,
    },
    {
      title: "Họ và tên",
      key: "fullName",
      render: (_: any, record: Student) => (
        <span className="font-medium">
          {record.lastName} {record.firstName}
        </span>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_: any, record: Student) => (
        <Button
          type="primary"
          ghost
          icon={<PlusOutlined />}
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenCreate(record);
          }}
        >
          Tạo phiếu
        </Button>
      ),
    },
  ];

  const expandedRowRender = (student: Student) => {
    const recordColumns = [
      {
        title: "Ngày",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 100,
        render: (text: string) => (
          <div className="text-xs text-gray-500">
            {dayjs(text).format("DD/MM/YYYY")}
          </div>
        ),
      },
      {
        title: "Nội dung",
        dataIndex: "content",
        key: "content",
      },
      {
        title: "Điểm",
        key: "point",
        width: 100,
        render: (_: any, record: RecordForm) => {
          const matchedRule = rules.find((r) => r.content === record.content);
          const isBonus = matchedRule ? matchedRule.type : false;

          return (
            <Tag
              color={isBonus ? "success" : "error"}
              className="min-w-[60px] text-center font-bold"
            >
              {isBonus ? "+" : "-"}
              {Math.abs(record.point)}
            </Tag>
          );
        },
      },
      {
        title: "Người tạo",
        key: "creator",
        render: (_: any, record: RecordForm) => (
          <span className="text-xs text-gray-500">
            {record.creator?.lastName} {record.creator?.firstName}
          </span>
        ),
      },
      {
        title: "",
        key: "action",
        width: 100,
        render: (_: any, record: RecordForm) => (
          <Space>
            <Tooltip title="Sửa">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                className="text-blue-600"
                onClick={() => handleOpenEdit(record, student)}
              />
            </Tooltip>
            <Popconfirm
              title="Xóa phiếu này?"
              onConfirm={() => handleDelete(record._id)}
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                danger
              />
            </Popconfirm>
          </Space>
        ),
      },
    ];

    return (
      <Table
        columns={recordColumns}
        dataSource={student.recordForms}
        pagination={false}
        rowKey="_id"
        size="small"
        className="mb-4 ml-4 border-l-2 border-blue-300 bg-gray-50"
        locale={{ emptyText: "Không có phiếu ghi nhận nào" }}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <Card className="border-none shadow-sm">
        <div className="mb-6 flex flex-col items-start justify-between md:flex-row md:items-center">
          <Title
            level={3}
            className="m-0 flex items-center gap-2 text-blue-800"
          >
            <TrophyOutlined /> Sổ Cờ Đỏ Điện Tử
          </Title>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            setSearchText("");
          }}
          type="card"
          items={tabItems}
          className="mb-4"
        />

        {currentClassData ? (
          <>
            {/* --- DASHBOARD LỚP --- */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Card 1: Thông tin lớp */}
              <Card className="border-blue-100 bg-blue-50" bordered={false}>
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-blue-200 p-3 text-blue-600">
                    <TeamOutlined style={{ fontSize: "24px" }} />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">
                      Giáo viên chủ nhiệm
                    </div>
                    <div className="text-base font-bold text-gray-800">
                      {currentClassData.teacher
                        ? `${currentClassData.teacher.lastName} ${currentClassData.teacher.firstName}`
                        : "Chưa cập nhật"}
                    </div>
                    <div>
                      Email:{" "}
                      {currentClassData.teacher
                        ? currentClassData.teacher.email
                        : "Chưa cập nhật"}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Card 2: Tổng điểm (ĐÃ SỬA LOGIC: Base 300) */}
              <Card
                className={`border-l-4 ${calculatedClassPoint >= 300 ? "border-l-green-500" : "border-l-red-500"}`}
                bordered={false}
              >
                <Statistic
                  title={
                    <span className="font-bold text-gray-600">
                      Tổng điểm tuần này
                    </span>
                  }
                  value={calculatedClassPoint}
                  valueStyle={{
                    color: calculatedClassPoint >= 300 ? "#3f8600" : "#cf1322",
                    fontWeight: "bold",
                  }}
                  prefix={
                    calculatedClassPoint >= 300 ? (
                      <ArrowUpOutlined />
                    ) : (
                      <ArrowDownOutlined />
                    )
                  }
                  suffix="/ 300"
                />
                <div className="mt-1 text-xs text-gray-400">
                  *Bắt đầu tuần: 300 điểm
                </div>
              </Card>

              {/* Card 3: Tìm kiếm */}
              <Card bordered={false} className="flex flex-col justify-center">
                <Input
                  placeholder="Tìm học sinh..."
                  prefix={<SearchOutlined />}
                  size="large"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </Card>
            </div>

            {/* --- BẢNG DANH SÁCH --- */}
            <Table
              columns={studentColumns}
              dataSource={filteredStudents}
              rowKey="_id"
              expandable={{
                expandedRowRender: expandedRowRender,
                rowExpandable: () => true,
              }}
              loading={loading}
              pagination={{ pageSize: 10 }}
              className="overflow-hidden rounded-lg bg-white shadow-sm"
            />
          </>
        ) : (
          <div className="rounded-lg bg-white py-10 text-center text-gray-500">
            {loading ? "Đang tải dữ liệu..." : "Không có dữ liệu lớp học"}
          </div>
        )}
      </Card>

      {/* --- MODAL --- */}
      <Modal
        title={modalType === "create" ? "Tạo phiếu mới" : "Chỉnh sửa phiếu"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="back" onClick={() => setIsModalOpen(false)}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleSubmit}
            loading={loading}
          >
            {modalType === "create" ? "Xác nhận tạo" : "Lưu thay đổi"}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" className="pt-4">
          <Form.Item label="Học sinh" name="studentName">
            <Input
              disabled
              className="bg-gray-100 font-semibold text-gray-700"
            />
          </Form.Item>

          <Form.Item
            label="Nội dung vi phạm / Thưởng"
            name="ruleId"
            rules={[{ required: true, message: "Vui lòng chọn nội dung" }]}
          >
            <Select
              placeholder="Chọn nội dung..."
              showSearch
              optionFilterProp="label"
              size="large"
            >
              {rules.map((rule) => (
                <Select.Option
                  key={rule._id}
                  value={rule._id}
                  label={rule.content}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="max-w-[250px] truncate">
                      {rule.content}
                    </span>
                    <Tag color={rule.type ? "green" : "red"}>
                      {rule.type ? "+" : "-"}
                      {Math.abs(rule.point)}
                    </Tag>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ERedFlagPage;
