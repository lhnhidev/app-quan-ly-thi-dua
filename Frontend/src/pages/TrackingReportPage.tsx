/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Card,
  DatePicker,
  Button,
  Tabs,
  Table,
  Tag,
  Descriptions,
  Avatar,
  message,
  Spin,
  Empty,
  Modal,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  TrophyOutlined,
  CalendarOutlined,
  TeamOutlined,
  MessageOutlined,
  HistoryOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/vi";
import advancedFormat from "dayjs/plugin/advancedFormat";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { useAppContext } from "../context";

// --- IMPORT CÁC COMPONENT CON ---
import ResponseRecordForm from "../components/ResponseRecordForm";
// GIẢ ĐỊNH: Import component ResponseRecordTable của bạn
import ResponseRecordTable from "../components/ResponseRecordTable";
// Nếu chưa có file này, hãy tạo file dummy hoặc bỏ comment dòng dưới để chạy thử:
// const ResponseRecordTable = () => <Empty description="Component bảng lịch sử phản hồi sẽ hiển thị ở đây" />;

// Cấu hình dayjs
dayjs.extend(advancedFormat);
dayjs.extend(weekOfYear);
dayjs.locale("vi");

// --- INTERFACES ---

interface ICreator {
  idUser: string;
  firstName: string;
  lastName: string;
}

interface IRecord {
  idRecordForm: string;
  time: string;
  content: string;
  point: number;
  creator: ICreator | null;
}

interface IStudent {
  idStudent: string;
  firstName: string;
  lastName: string;
  totalPoint: number;
  records: IRecord[];
}

interface ITeacher {
  idTeacher: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface IMonitoredClass {
  idClass: string;
  className: string;
  totalClassPoint: number;
  homeroomTeacher: ITeacher | null;
  students: IStudent[];
}

interface IUserInfo {
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  idUser?: string;
}

interface IReportResponse {
  userInfo: IUserInfo;
  monitoredClasses: IMonitoredClass[];
}

// --- COMPONENT CHÍNH ---

const TrackingReportPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<IReportResponse | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<Dayjs | null>(dayjs());
  const [localUser, setLocalUser] = useState<any>(null);

  // --- STATE CHO PHẦN PHẢN HỒI ---
  const [selectedRecordId, setSelectedRecordId] = useState<string>("");

  const { showResponseModal, setShowResponseModal } = useAppContext();

  useEffect(() => {
    const storedUser = localStorage.getItem("userInfo");
    if (storedUser) {
      setLocalUser(JSON.parse(storedUser));
    }
  }, []);

  const handleFetchReport = async () => {
    if (!selectedWeek) {
      message.warning("Vui lòng chọn tuần cần xem!");
      return;
    }

    const storedUserInfo = localStorage.getItem("userInfo");
    if (!storedUserInfo) {
      message.error("Không tìm thấy thông tin đăng nhập!");
      return;
    }

    const parsedUser = JSON.parse(storedUserInfo);
    const userId = parsedUser._id || parsedUser.id;
    const token = parsedUser.token;

    const startDate = selectedWeek.startOf("week").toISOString();
    const endDate = selectedWeek.endOf("week").toISOString();

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/user/getTrackingReport`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId,
            startDate,
            endDate,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Lỗi khi tải dữ liệu báo cáo.");
      }

      const data: IReportResponse = await response.json();
      setReportData(data);
      message.success("Đã cập nhật dữ liệu báo cáo!");
    } catch (error) {
      console.error(error);
      message.error("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý khi ấn nút Phản hồi
  const handleOpenResponse = (recordId: string) => {
    setSelectedRecordId(recordId);
    setShowResponseModal(true);
  };

  // --- CẤU HÌNH CỘT BẢNG HỌC SINH (Level 1) ---
  const studentColumns = [
    {
      title: "Mã HS",
      dataIndex: "idStudent",
      key: "idStudent",
      width: 120,
      sorter: (a: IStudent, b: IStudent) =>
        a.idStudent.localeCompare(b.idStudent),
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Họ và tên",
      key: "fullName",
      render: (_: any, record: IStudent) => (
        <span className="font-medium">
          {record.lastName} {record.firstName}
        </span>
      ),
    },
    {
      title: "Tổng điểm tuần",
      dataIndex: "totalPoint",
      key: "totalPoint",
      width: 150,
      align: "center" as const,
      sorter: (a: IStudent, b: IStudent) => a.totalPoint - b.totalPoint,
      render: (point: number) => (
        <span
          className={`text-lg font-bold ${
            point >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {point > 0 ? `+${point}` : point}
        </span>
      ),
    },
  ];

  // --- CẤU HÌNH CỘT BẢNG RECORDS CHI TIẾT (Level 2 - Expandable) ---
  const recordColumns = [
    {
      title: "Thời gian",
      dataIndex: "time",
      key: "time",
      width: 160,
      render: (time: string) => dayjs(time).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Nội dung",
      dataIndex: "content",
      key: "content",
    },
    {
      title: "Người ghi nhận",
      key: "creator",
      width: 180,
      render: (_: any, record: IRecord) =>
        record.creator ? (
          <div className="justify-left flex gap-2">
            <div>
              {record.creator.lastName} {record.creator.firstName}
            </div>
          </div>
        ) : (
          <span className="italic text-gray-400">Hệ thống</span>
        ),
    },
    {
      title: "Điểm",
      dataIndex: "point",
      key: "point",
      width: 80,
      align: "center" as const,
      render: (point: number) => (
        <Tag color={point >= 0 ? "success" : "error"}>
          {point > 0 ? `+${point}` : point}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 100,
      align: "center" as const,
      render: (_: any, record: IRecord) => (
        <Button
          type="primary"
          ghost
          size="small"
          icon={<MessageOutlined />}
          onClick={() => handleOpenResponse(record.idRecordForm)}
        >
          Phản hồi
        </Button>
      ),
    },
  ];

  const expandedRowRender = (record: IStudent) => {
    return (
      <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
        <h4 className="mb-2 text-sm font-semibold text-gray-600">
          Chi tiết phiếu điểm của: {record.lastName} {record.firstName}
        </h4>
        <Table
          columns={recordColumns}
          dataSource={record.records}
          pagination={false}
          rowKey="idRecordForm"
          size="small"
          locale={{ emptyText: "Không có ghi nhận nào trong tuần này" }}
        />
      </div>
    );
  };

  // --- RENDER GIAO DIỆN ---
  const displayUser = reportData?.userInfo || localUser;
  const displayName = displayUser
    ? `${displayUser.lastName} ${displayUser.firstName}`
    : "...";
  const displayId = displayUser?.idUser || localUser?.idUser || "N/A";

  // --- NỘI DUNG TAB 1: TRA CỨU ĐIỂM ---
  const renderTrackingTab = () => (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card bordered={false} className="rounded-lg bg-white shadow-sm">
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <div className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 md:w-auto">
            <CalendarOutlined className="text-gray-500" />
            <span className="whitespace-nowrap font-medium">Chọn tuần:</span>
            <DatePicker
              picker="week"
              value={selectedWeek}
              onChange={(date) => setSelectedWeek(date)}
              className="w-full md:w-64"
              placeholder="Chọn tuần học"
              format={(value) =>
                `Tuần ${value.week()} (${value
                  .startOf("week")
                  .format("DD/MM")} - ${value.endOf("week").format("DD/MM")})`
              }
            />
          </div>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleFetchReport}
            loading={loading}
            size="large"
          >
            Tra cứu kết quả
          </Button>
        </div>
      </Card>

      {/* Result Display */}
      <Spin spinning={loading} tip="Đang tải dữ liệu...">
        {!reportData ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl bg-white shadow-sm">
            <SearchOutlined className="mb-4 text-6xl text-gray-300" />
            <div className="w-full text-center text-sm text-gray-500 md:text-lg">
              Vui lòng chọn tuần và bấm "Tra cứu" để xem dữ liệu
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-white p-2 shadow-md">
            {reportData.monitoredClasses.length === 0 ? (
              <Empty description="Bạn không có lớp theo dõi nào trong danh sách." />
            ) : (
              <Tabs
                type="card"
                className="custom-tabs"
                items={reportData.monitoredClasses.map((monitoredClass) => ({
                  key: monitoredClass.idClass,
                  label: (
                    <span className="px-2 font-semibold">
                      {monitoredClass.className} ({monitoredClass.idClass})
                    </span>
                  ),
                  children: (
                    <div className="p-4">
                      {/* Class Info */}
                      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Card className="border-blue-200 bg-blue-50">
                          <div className="flex items-center gap-4">
                            <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                              <TrophyOutlined style={{ fontSize: "24px" }} />
                            </div>
                            <div>
                              <p className="mb-1 text-gray-500">
                                Tổng điểm lớp tuần này
                              </p>
                              <h3 className="text-3xl font-bold text-blue-700">
                                {monitoredClass.totalClassPoint}
                              </h3>
                            </div>
                          </div>
                        </Card>
                        <Card className="border-orange-200 bg-orange-50">
                          <div className="flex items-start gap-3">
                            <TeamOutlined className="mt-1 text-xl text-orange-500" />
                            <div className="w-full">
                              <h4 className="mb-2 border-b border-orange-200 pb-1 font-bold text-gray-800">
                                Giáo viên chủ nhiệm
                              </h4>
                              {monitoredClass.homeroomTeacher ? (
                                <Descriptions column={1} size="small">
                                  <Descriptions.Item label="Họ tên">
                                    <span className="font-medium">
                                      {monitoredClass.homeroomTeacher.lastName}{" "}
                                      {monitoredClass.homeroomTeacher.firstName}
                                    </span>
                                  </Descriptions.Item>
                                  <Descriptions.Item label="Email">
                                    {monitoredClass.homeroomTeacher.email}
                                  </Descriptions.Item>
                                </Descriptions>
                              ) : (
                                <span className="italic text-gray-400">
                                  Chưa cập nhật thông tin
                                </span>
                              )}
                            </div>
                          </div>
                        </Card>
                      </div>

                      {/* Student List Table */}
                      <div className="mt-4">
                        <h3 className="mb-4 border-l-4 border-blue-500 pl-2 text-lg font-bold text-gray-800">
                          Chi tiết học sinh
                        </h3>
                        <Table
                          columns={studentColumns}
                          dataSource={monitoredClass.students}
                          rowKey="idStudent"
                          pagination={{ pageSize: 20 }}
                          expandable={{
                            expandedRowRender: expandedRowRender,
                            rowExpandable: (_record) => true,
                            expandRowByClick: true,
                          }}
                          bordered
                          className="shadow-sm"
                          scroll={{ x: 800 }}
                        />
                      </div>
                    </div>
                  ),
                }))}
              />
            )}
          </div>
        )}
      </Spin>
    </div>
  );

  // --- CẤU HÌNH CÁC TAB ---
  const items = [
    {
      key: "1",
      label: (
        <span className="flex items-center gap-2">
          <BarChartOutlined />
          Tra cứu điểm
        </span>
      ),
      children: renderTrackingTab(),
    },
    {
      key: "2",
      label: (
        <span className="flex items-center gap-2">
          <HistoryOutlined />
          Lịch sử phản hồi
        </span>
      ),
      children: (
        <div className="rounded-xl bg-white p-6 shadow-md">
          {/* Render component ResponseRecordTable ở đây */}
          <ResponseRecordTable />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      {/* 1. HEADER: USER INFO (Giữ nguyên trên cùng) */}
      <Card className="mb-6 rounded-xl shadow-md">
        <div className="flex items-center gap-3">
          <Avatar size={64} icon={<UserOutlined />} className="bg-blue-500" />
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Xin chào, {displayName}
            </h2>
            <Tag color="cyan" className="mt-1 px-2 py-0.5 text-sm">
              MSSV/MGV: {displayId}
            </Tag>
          </div>
        </div>
      </Card>

      {/* 2. MAIN TABS AREA */}
      <Tabs
        defaultActiveKey="1"
        items={items}
        size="large"
        className="tracking-page-tabs"
      />

      {/* --- MODAL HIỂN THỊ RESPONSE RECORD FORM --- */}
      <Modal
        title="Gửi phản hồi phiếu điểm"
        open={showResponseModal}
        onCancel={() => setShowResponseModal(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <ResponseRecordForm recordId={selectedRecordId} />
      </Modal>
    </div>
  );
};

export default TrackingReportPage;
