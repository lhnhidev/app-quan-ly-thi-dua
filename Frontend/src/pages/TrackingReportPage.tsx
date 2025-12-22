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
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  TrophyOutlined,
  CalendarOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/vi"; // Import locale tiếng Việt
import advancedFormat from "dayjs/plugin/advancedFormat";
import weekOfYear from "dayjs/plugin/weekOfYear";

// Cấu hình dayjs
dayjs.extend(advancedFormat);
dayjs.extend(weekOfYear);
dayjs.locale("vi");

// --- INTERFACES (Định nghĩa kiểu dữ liệu) ---

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
  // idUser có thể không có trong response userInfo mẫu nhưng cần cho hiển thị Header
  // Ta sẽ lấy từ localStorage nếu API không trả về
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

  // State lưu thông tin user từ localStorage để hiển thị nếu chưa fetch
  const [localUser, setLocalUser] = useState<any>(null);

  useEffect(() => {
    // Lấy thông tin user từ localStorage khi mount
    const storedUser = localStorage.getItem("userInfo");
    if (storedUser) {
      setLocalUser(JSON.parse(storedUser));
    }
  }, []);

  // Hàm gọi API
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
    const userId = parsedUser._id || parsedUser.id; // Lấy _id từ local
    const token = parsedUser.token;

    // Tính toán startDate (Thứ 2) và endDate (Chủ nhật) của tuần đã chọn
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
      width: 180,
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
      width: 200,
      render: (_: any, record: IRecord) =>
        record.creator ? (
          <div className="justify-left flex gap-2">
            <div>
              {record.creator.lastName} {record.creator.firstName}
            </div>
            <Tag color="blue">{record.creator.idUser}</Tag>
          </div>
        ) : (
          <span className="italic text-gray-400">Hệ thống</span>
        ),
    },
    {
      title: "Điểm",
      dataIndex: "point",
      key: "point",
      width: 100,
      align: "center" as const,
      render: (point: number) => (
        <Tag color={point >= 0 ? "success" : "error"}>
          {point > 0 ? `+${point}` : point}
        </Tag>
      ),
    },
  ];

  // Render bảng con (Records)
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

  // Thông tin hiển thị header (Ưu tiên lấy từ API, nếu chưa có thì lấy từ LocalStorage)
  const displayUser = reportData?.userInfo || localUser;
  const displayName = displayUser
    ? `${displayUser.lastName} ${displayUser.firstName}`
    : "...";
  // Nếu API không trả idUser trong userInfo, ta lấy idUser từ localStorage
  const displayId = displayUser?.idUser || localUser?.idUser || "N/A";

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      {/* 1. HEADER & FILTER */}
      <Card className="mb-6 rounded-xl shadow-md">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          {/* Thông tin user */}
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

          {/* Bộ lọc thời gian */}
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
                `Tuần ${value.week()} (${value.startOf("week").format("DD/MM")} - ${value.endOf("week").format("DD/MM")})`
              }
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleFetchReport}
              loading={loading}
            >
              Tra cứu
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. MAIN CONTENT (TABS) */}
      <Spin spinning={loading} tip="Đang tải dữ liệu...">
        {!reportData ? (
          // State khi chưa có dữ liệu
          <div className="flex h-64 flex-col items-center justify-center rounded-xl bg-white shadow-sm">
            <SearchOutlined className="mb-4 text-6xl text-gray-300" />
            <p className="text-lg text-gray-500">
              Vui lòng chọn tuần và ấn "Tra cứu" để xem kết quả.
            </p>
          </div>
        ) : (
          // State khi đã có dữ liệu
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
                      {/* A. Thông tin Lớp & GVCN */}
                      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Card Điểm Lớp */}
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

                        {/* Card Thông tin GVCN */}
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
                                  <Descriptions.Item label="Mã giáo viên">
                                    {monitoredClass.homeroomTeacher.idTeacher}
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

                      {/* B. Bảng danh sách học sinh */}
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
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            rowExpandable: (_record) => true,
                            expandRowByClick: true, // Cho phép click vào dòng để sổ xuống
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
};

export default TrackingReportPage;
