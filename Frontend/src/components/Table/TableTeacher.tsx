import { useEffect, useState } from "react";
import { Table, Input, Button, Space, Tooltip, Tag } from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import useFetch from "../../hooks/useFetch";
import { Loading } from "../../router";
import { useAppContext } from "../../context";
import { FiEdit, FiTrash2 } from "react-icons/fi";

interface ClassInfo {
  _id: string;
  name: string;
  idClass: string;
  point: number;
}

interface TeacherData {
  _id: string;
  idTeacher: string;
  firstName: string;
  lastName: string;
  email: string;
  idClass: ClassInfo;
  createdAt: string;
  updatedAt: string;
}

const TableTeacher = () => {
  const [dataSource, setDataSource] = useState<TeacherData[]>([]);
  const [searchText, setSearchText] = useState("");

  const { request, loading, error } = useFetch<TeacherData[]>();

  const {
    setOpenAddTeacherForm,
    reRenderTableTeacher,
    modal,
    messageApi,
    setReRenderTableTeacher,
  } = useAppContext();

  const handleDelete = (id: string, idTeacher: string) => {
    modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc muốn xóa giáo viên ${idTeacher}?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk() {
        const deleteTeacher = async () => {
          const userInfoString = localStorage.getItem("userInfo");
          const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
          const token = userInfo?.token;

          const result = await request(
            `${import.meta.env.VITE_SERVER_URL}/teacher/${id}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (result) {
            setReRenderTableTeacher((prev) => !prev);
            messageApi.success(`Xóa giáo viên ${idTeacher} thành công`);
          }
        };

        deleteTeacher();
      },
    });
  };

  useEffect(() => {
    const fetchTeachers = async () => {
      const userInfoString = localStorage.getItem("userInfo");
      const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
      const token = userInfo?.token;

      try {
        const data = await request(
          `${import.meta.env.VITE_SERVER_URL}/teacher`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (data) {
          setDataSource(data);
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reRenderTableTeacher]);

  const filteredData = dataSource.filter((item) =>
    item.idTeacher.toLowerCase().includes(searchText.toLowerCase()),
  );

  const columns: ColumnsType<TeacherData> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center",
      render: (_, __, index) => (
        <span className="font-medium text-gray-400">{index + 1}</span>
      ),
    },
    {
      title: "Mã giáo viên",
      dataIndex: "idTeacher",
      key: "idTeacher",
      sorter: (a, b) => a.idTeacher.localeCompare(b.idTeacher),
      render: (text) => (
        <Tag color="blue" className="font-medium">
          {text}
        </Tag>
      ),
    },
    {
      title: "Họ tên",
      key: "fullName",
      sorter: (a, b) => a.idTeacher.localeCompare(b.idTeacher),
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-indigo-200 bg-gradient-to-br from-indigo-100 to-indigo-200 font-bold text-indigo-600 shadow-sm">
            {record.lastName.charAt(0)}
          </div>
          <span className="font-medium text-gray-700">
            {record.firstName} {record.lastName}
          </span>
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text) => <span className="text-gray-600">{text}</span>,
    },
    {
      title: "Lớp chủ nhiệm",
      key: "classInfo",
      sorter: (a, b) => a.idTeacher.localeCompare(b.idTeacher),

      render: (_, record) => (
        <div className="">
          <Tag color="cyan" className="rounded px-2 font-medium">
            {record.idClass?.name || "Chưa phân lớp"}
          </Tag>
        </div>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              size="small"
              icon={<FiEdit />}
              className="text-blue-600 hover:bg-blue-50"
              onClick={() => {}}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              type="text"
              size="small"
              danger
              icon={<FiTrash2 />}
              onClick={() => handleDelete(record._id, record.idTeacher)} // Gọi hàm xóa
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
          <h1 className="m-0 text-2xl font-bold text-[var(--text-color)]">
            Danh sách giáo viên
          </h1>
          <p className="mt-1 text-gray-500">
            Quản lý thông tin hồ sơ giáo viên toàn trường
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Tìm theo Mã giáo viên..."
            prefix={<SearchOutlined className="text-gray-400" />}
            allowClear
            size="large"
            className="w-full sm:w-[280px]"
            onChange={(e) => setSearchText(e.target.value)}
          />

          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            className="bg-blue-600 shadow-md hover:bg-blue-700"
            style={{ backgroundColor: "var(--primary-color)" }}
            onClick={() => setOpenAddTeacherForm(true)}
          >
            Thêm giáo viên
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-white shadow-sm">
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total, range) =>
              `Hiển thị ${range[0]}-${range[1]} trên tổng số ${total} giáo viên`,
          }}
          className="custom-teacher-table"
          scroll={{ x: 800 }}
          components={{
            header: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              cell: (props: any) => (
                <th
                  {...props}
                  className="border-b border-gray-200 bg-gray-50 py-4 font-semibold text-gray-600"
                />
              ),
            },
          }}
        />
      </div>
    </div>
  );
};

export default TableTeacher;
