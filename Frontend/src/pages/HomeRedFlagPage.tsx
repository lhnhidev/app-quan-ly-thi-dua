/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
  DatePicker,
  Button,
  Tabs,
  Table,
  Card,
  Tag,
  Descriptions,
  Empty,
  Typography,
} from "antd";
import type { DatePickerProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import locale from "antd/es/date-picker/locale/vi_VN";

// Import hook useFetch của bạn
import useFetch from "../hooks/useFetch";
import { IoSearchOutline } from "react-icons/io5";
import { useAppContext } from "../context";

// --- 1. INTERFACES (Định nghĩa kiểu dữ liệu) ---

interface ICreator {
  idUser: string;
  firstName: string;
  lastName: string;
}

interface IViolationContent {
  idRule: string;
  content: string;
  point: number;
  creator: ICreator;
}

interface IRecord {
  idRecordForm: string;
  time?: string;
  createdAt?: string;
  content?: string;
  point?: number;
  creator: ICreator;
  violator?: {
    firstName: string;
    lastName: string;
    idStudent: string;
  };
  violationContent?: IViolationContent;
}

interface IStudent {
  idStudent: string;
  firstName: string;
  lastName: string;
  totalPoint: number;
  records: IRecord[];
}

interface IClassData {
  idClass: string;
  className: string;
  totalClassPoint: number;
  homeroomTeacher: {
    idTeacher: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  students: IStudent[];
  classRecords: IRecord[];
}

interface IApiResponse {
  userInfo: any;
  assignedClasses: IClassData[];
}

// --- 2. COMPONENT CHÍNH ---

const HomeRedFlagPage: React.FC = () => {
  // Sử dụng useFetch
  const { data, loading, request } = useFetch<IApiResponse>();
  const { messageApi } = useAppContext();

  const [selectedRange, setSelectedRange] = useState<{
    start: string;
    end: string;
  } | null>(null);

  // --- Xử lý chọn tuần ---
  const handleWeekChange: DatePickerProps["onChange"] = (date) => {
    if (date) {
      const start = date.startOf("week").toISOString();
      const end = date.endOf("week").toISOString();
      setSelectedRange({ start, end });
    } else {
      setSelectedRange(null);
    }
  };

  // --- Hàm gọi API ---
  const handleSearch = async () => {
    if (!selectedRange) {
      messageApi.warning("Vui lòng chọn tuần cần tra cứu!");
      return;
    }

    // 1. Lấy user từ localStorage (Key dựa theo useFetch của bạn là "userInfo")
    const userStr = localStorage.getItem("userInfo");
    if (!userStr) {
      messageApi.error("Không tìm thấy thông tin đăng nhập!");
      return;
    }

    const userLocal = JSON.parse(userStr);

    // 2. Chuẩn bị Body
    // Gửi _id (đổi tên thành id cho gọn nếu BE cần), idUser, và khoảng thời gian
    const payload = {
      id: userLocal._id,
      idUser: userLocal.idUser,
      startDate: selectedRange.start,
      endDate: selectedRange.end,
      // Nếu Backend cần thêm các trường khác từ local thì spread vào đây
    };

    // 3. Gọi hàm request từ useFetch
    await request(`${import.meta.env.VITE_SERVER_URL}/user/trackingRedFlag`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userLocal.token}`, // Đính kèm token
      },
      body: JSON.stringify(payload),
    });
  };

  // --- 3. CẤU HÌNH CỘT TABLE ---

  // Cột bảng Học sinh
  const studentColumns: ColumnsType<IStudent> = [
    {
      title: "Mã HS",
      dataIndex: "idStudent",
      key: "idStudent",
      width: 100,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Họ và tên",
      key: "fullName",
      render: (_, record) => (
        <span className="font-medium text-gray-700">
          {record.lastName} {record.firstName}
        </span>
      ),
    },
    {
      title: "Tổng điểm",
      dataIndex: "totalPoint",
      key: "totalPoint",
      width: 120,
      align: "center",
      render: (point) => (
        <span
          className={`font-bold ${point >= 0 ? "text-green-600" : "text-red-600"}`}
        >
          {point > 0 ? `+${point}` : point}
        </span>
      ),
    },
  ];

  // Cột bảng Chi tiết phiếu (Nested Table)
  const expandedRecordColumns: ColumnsType<IRecord> = [
    {
      title: "Mã phiếu",
      dataIndex: "idRecordForm",
      key: "idRecordForm",
      width: 90,
    },
    {
      title: "Thời gian",
      dataIndex: "time",
      key: "time",
      width: 140,
      render: (time) => (
        <span className="text-gray-500">
          {dayjs(time).format("DD/MM/YYYY HH:mm")}
        </span>
      ),
    },
    {
      title: "Nội dung",
      dataIndex: "content",
      key: "content",
    },
    {
      title: "Điểm",
      dataIndex: "point",
      key: "point",
      width: 80,
      align: "center",
      render: (point) => (
        <Tag color={point >= 0 ? "success" : "error"}>
          {point > 0 ? `+${point}` : point}
        </Tag>
      ),
    },
    {
      title: "Người lập",
      key: "creator",
      width: 140,
      render: (_, record) => (
        <div className="text-xs text-gray-500">
          {record.creator.lastName} {record.creator.firstName}
        </div>
      ),
    },
  ];

  // Cột bảng Class Records
  const classRecordColumns: ColumnsType<IRecord> = [
    {
      title: "Mã phiếu",
      dataIndex: "idRecordForm",
      key: "idRecordForm",
      width: 100,
    },
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (t) => dayjs(t).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Người lập",
      key: "creator",
      width: 140,
      render: (_, record) => (
        <div>
          <div className="text-sm font-medium">
            {record.creator.lastName} {record.creator.firstName}
          </div>
          <div className="text-xs text-gray-400">{record.creator.idUser}</div>
        </div>
      ),
    },
    {
      title: "Học sinh vi phạm",
      key: "violator",
      width: 160,
      render: (_, record) =>
        record.violator ? (
          <div>
            <div className="text-sm font-medium">
              {record.violator.lastName} {record.violator.firstName}
            </div>
            <div className="text-xs text-blue-500">
              {record.violator.idStudent}
            </div>
          </div>
        ) : (
          <span className="italic text-gray-400">N/A</span>
        ),
    },
    {
      title: "Mã lỗi",
      key: "idRule",
      width: 90,
      render: (_, record) => <Tag>{record.violationContent?.idRule}</Tag>,
    },
    {
      title: "Chi tiết nội dung",
      key: "content",
      render: (_, record) => record.violationContent?.content,
    },
    {
      title: "Điểm",
      key: "point",
      width: 80,
      align: "center",
      render: (_, record) => {
        const p = record.violationContent?.point || 0;
        return (
          <span
            className={`font-bold ${p >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {p > 0 ? `+${p}` : p}
          </span>
        );
      },
    },
  ];

  // --- 4. RENDER NỘI DUNG TAB ---
  const renderClassTab = (clsData: IClassData) => {
    return (
      <div className="animate-fadeIn space-y-6 py-2">
        {/* Thông tin lớp */}
        <Card size="small" className="border-blue-200 bg-blue-50 shadow-sm">
          <Descriptions
            title={
              <span className="font-bold text-blue-700">
                Thông tin {clsData.className}
              </span>
            }
            column={{ xs: 1, sm: 2, md: 3 }}
          >
            <Descriptions.Item label="GVCN">
              <span className="font-medium">
                {clsData.homeroomTeacher?.lastName}{" "}
                {clsData.homeroomTeacher?.firstName}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {clsData.homeroomTeacher?.email}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng điểm tuần">
              <span
                className={`text-xl font-bold ${clsData.totalClassPoint >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {clsData.totalClassPoint}
              </span>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Bảng Danh sách học sinh */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <Typography.Title
            level={5}
            className="mb-4 border-b pb-2 text-gray-700"
          >
            1. Danh sách học sinh
          </Typography.Title>
          <Table
            columns={studentColumns}
            dataSource={clsData.students}
            rowKey="idStudent"
            pagination={{ pageSize: 20 }}
            scroll={{ x: 800 }}
            expandable={{
              expandedRowRender: (student) => {
                if (!student.records || student.records.length === 0) {
                  return (
                    <Empty
                      description="Không có dữ liệu phiếu điểm"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  );
                }
                return (
                  <div className="ml-4 rounded-md border border-gray-200 bg-gray-50 p-4 md:ml-8">
                    <h4 className="mb-2 text-sm font-bold text-gray-600">
                      Chi tiết phiếu: {student.lastName} {student.firstName}
                    </h4>
                    <Table
                      columns={expandedRecordColumns}
                      dataSource={student.records}
                      rowKey="idRecordForm"
                      pagination={{ pageSize: 5 }}
                      size="small"
                      bordered
                      className="bg-white"
                      scroll={{ x: 800 }}
                    />
                  </div>
                );
              },
              rowExpandable: (_record) => true,
            }}
          />
        </div>

        {/* Bảng Class Records */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <Typography.Title
            level={5}
            className="mb-4 border-b pb-2 text-gray-700"
          >
            2. Nhật ký phiếu điểm của lớp
          </Typography.Title>
          <Table
            columns={classRecordColumns}
            dataSource={clsData.classRecords}
            rowKey="idRecordForm"
            pagination={{ pageSize: 5 }}
            scroll={{ x: 800 }}
          />
        </div>
      </div>
    );
  };

  // --- 5. RENDER GIAO DIỆN CHÍNH ---
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Search Header */}
      <div className="mb-6 flex flex-col items-end justify-between gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm md:flex-row md:items-center">
        <div className="flex w-full flex-col gap-2 md:w-auto">
          <label className="text-sm font-bold text-gray-600">
            Chọn tuần tra cứu:
          </label>
          <DatePicker
            picker="week"
            onChange={handleWeekChange}
            locale={locale}
            className="w-full md:w-72"
            placeholder="Chọn tuần..."
            format={"Tuần ww - Năm YYYY"}
            size="large"
          />
        </div>

        <Button
          type="primary"
          onClick={handleSearch}
          loading={loading}
          size="large"
          className="w-full bg-blue-600 font-semibold shadow-md hover:bg-blue-500 md:w-auto"
          icon={<IoSearchOutline />}
        >
          Tra cứu
        </Button>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
        {/* State: Chưa có dữ liệu */}
        {!data && !loading && (
          <div className="flex h-64 flex-col items-center justify-center text-gray-400">
            <div className="w-full text-center text-sm md:text-lg">
              Vui lòng chọn tuần và bấm "Tra cứu" để xem dữ liệu
            </div>
          </div>
        )}

        {/* State: Đã có dữ liệu */}
        {data && (
          <>
            {data.assignedClasses.length === 0 ? (
              <Empty
                description="Bạn chưa được phân công lớp nào trong tuần này."
                className="mt-12"
              />
            ) : (
              <Tabs
                defaultActiveKey="0"
                type="card"
                size="large"
                className="custom-tabs-redflag bg-gray-50 px-4 pt-4"
                items={data.assignedClasses.map((cls, index) => ({
                  key: String(index),
                  label: cls.className,
                  children: renderClassTab(cls),
                }))}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomeRedFlagPage;
