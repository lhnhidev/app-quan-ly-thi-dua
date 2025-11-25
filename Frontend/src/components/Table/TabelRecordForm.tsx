import React, { useState, useEffect } from "react";
import { Table, Input, Button, Tag, Space, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiSearch, FiEdit, FiTrash2, FiPlus } from "react-icons/fi";
import useFetch from "../../hooks/useFetch";
import { Loading } from "../../router";
import { useAppContext } from "../../context";
import AddRecordForm from "../Form/AddRecordForm"; // Import form thêm mới

interface User {
  _id: string;
  idUser: string;
  firstName: string;
  lastName: string;
}

interface Student {
  _id: string;
  idStudent: string;
  firstName: string;
  lastName: string;
}

interface ClassInfo {
  _id: string;
  name: string;
  idClass: string;
}

interface Rule {
  _id: string;
  idRule: string;
  content: string;
  point: number;
  type: boolean;
}

interface RecordForm {
  _id: string;
  idRecordForm: string;
  time: string;
  user: User;
  student: Student;
  class: ClassInfo;
  rule: Rule;
}

const TableRecordForm: React.FC = () => {
  const { loading, error, request } = useFetch<RecordForm[]>();
  const [originalData, setOriginalData] = useState<RecordForm[]>([]);
  const [filteredData, setFilteredData] = useState<RecordForm[]>([]);
  const [searchText, setSearchText] = useState("");

  // Lấy modal, messageApi và các hàm state từ Context
  const {
    setOpenAddRecordForm,
    reRenderTableRecord,
    setReRenderTableRecord,
    modal,
    messageApi,
    setOpenModifyRecordForm,
    setCurrentRecordForm,
  } = useAppContext();

  // --- 1. Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      const userInfoString = localStorage.getItem("userInfo");
      const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
      const token = userInfo?.token;

      const result = await request(
        `${import.meta.env.VITE_SERVER_URL}/record-form`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (result) {
        setOriginalData(result);
        setFilteredData(result);
      }
    };

    fetchData();
  }, [request, reRenderTableRecord]);

  // --- 2. Search ---
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);

    const filtered = originalData.filter((item) =>
      item.idRecordForm.toLowerCase().includes(value),
    );
    setFilteredData(filtered);
  };

  // --- 3. Delete Logic ---
  const handleDelete = (record: RecordForm) => {
    modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa phiếu ${record.idRecordForm}?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        const userInfoString = localStorage.getItem("userInfo");
        const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
        const token = userInfo?.token;

        // Gọi API DELETE
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = await request(
          `${import.meta.env.VITE_SERVER_URL}/record-form/${record._id}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response) {
          messageApi.success("Xóa phiếu thi đua thành công!");
          // Reload bảng
          if (setReRenderTableRecord)
            setReRenderTableRecord((prev: boolean) => !prev);
        } else {
          messageApi.error("Xóa thất bại!");
        }
      },
    });
  };

  const columns: ColumnsType<RecordForm> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center",
      render: (_text, _record, index) => (
        <span className="font-medium text-gray-500">{index + 1}</span>
      ),
    },
    {
      title: "Mã phiếu",
      dataIndex: "idRecordForm",
      key: "idRecordForm",
      width: 120,
      sorter: (a, b) => a.idRecordForm.localeCompare(b.idRecordForm),
      render: (text) => (
        <Tag color="blue" className="font-medium">
          {text}
        </Tag>
      ),
    },
    {
      title: "Ngày lập",
      dataIndex: "time",
      key: "time",
      width: 180,
      sorter: (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
      render: (dateString: string) => {
        const date = new Date(dateString);
        const time = date.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const day = date.toLocaleDateString("vi-VN");
        return (
          <div className="flex flex-col">
            <span className="font-bold text-gray-700">{time}</span>
            <span className="text-xs text-gray-400">{day}</span>
          </div>
        );
      },
    },
    {
      title: "Người lập",
      key: "creator",
      width: 120,
      render: (_, record) => (
        <span className="font-medium text-gray-600">
          {record.user?.idUser || "N/A"}
        </span>
      ),
    },
    {
      title: "Học sinh",
      key: "student",
      width: 150,
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-700">
            {record.student?.lastName} {record.student?.firstName}
          </span>
          <span className="text-xs text-gray-400">
            {record.student?.idStudent || "N/A"}
          </span>
        </div>
      ),
    },
    {
      title: "Lớp",
      key: "className",
      width: 80,
      sorter: (a, b) =>
        (a.class?.name || "").localeCompare(b.class?.name || ""),
      render: (_, record) => (
        <Tag color="cyan" className="rounded font-semibold">
          {record.class?.name || "N/A"}
        </Tag>
      ),
    },
    {
      title: "Nội dung",
      key: "content",
      width: 250,
      render: (_, record) => {
        const content = record.rule?.content || "Nội dung đã bị xóa";
        return (
          <Tooltip title={content} placement="topLeft">
            <div className="max-w-[230px] cursor-help truncate text-gray-600">
              {content}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Chi tiết",
      key: "points",
      width: 100,
      align: "right",
      render: (_, record) => {
        const points = record.rule?.point || 0;
        const isPositive = points > 0;
        const color = isPositive ? "green" : "red";
        const sign = isPositive ? "+" : "";
        return (
          <Tag color={color} className="px-2 py-0.5 text-[13px] font-bold">
            {sign}
            {Math.abs(points)}đ
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              size="small"
              icon={<FiEdit />}
              className="text-blue-600 hover:bg-blue-50"
              onClick={() => {
                setCurrentRecordForm(record);
                setOpenModifyRecordForm(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              type="text"
              size="small"
              danger
              icon={<FiTrash2 />}
              onClick={() => handleDelete(record)} // Gọi hàm xóa
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (loading) return <Loading />;
  if (error)
    return <div className="mt-10 text-center text-red-500">{error}</div>;

  return (
    <div>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="m-0 text-2xl font-bold text-gray-800">
            Danh sách phiếu thi đua
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Ghi nhận và theo dõi tình hình thi đua của học sinh
          </p>
        </div>

        <div className="flex w-full items-center gap-3 md:w-auto">
          <Input
            placeholder="Tìm theo Mã phiếu..."
            prefix={<FiSearch className="text-gray-400" />}
            value={searchText}
            onChange={handleSearch}
            allowClear
            className="w-full rounded-lg md:w-64"
            size="large"
          />

          <Button
            type="primary"
            icon={<FiPlus />}
            size="large"
            style={{ backgroundColor: "var(--primary-color)" }}
            onClick={() => setOpenAddRecordForm(true)}
          >
            Tạo phiếu mới
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="_id"
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => (
              <span className="text-sm text-gray-500">
                Hiển thị {range[0]}-{range[1]} trên tổng số {total} phiếu
              </span>
            ),
            className: "p-4",
          }}
          scroll={{ x: 1000 }}
          rowClassName="hover:bg-gray-50 transition-colors"
          components={{
            header: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              cell: (props: any) => (
                <th
                  {...props}
                  className="border-b border-gray-200 bg-gray-50 py-3 font-semibold text-gray-600"
                />
              ),
            },
          }}
        />
      </div>

      {/* Đặt Component Form ở cuối */}
      <AddRecordForm />
    </div>
  );
};

export default TableRecordForm;
