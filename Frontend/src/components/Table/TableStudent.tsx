import React, { useState, useEffect } from "react";
import { Table, Input, Button, Space, Tooltip, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiSearch, FiEdit, FiTrash2, FiUserPlus } from "react-icons/fi";
import useFetch from "../../hooks/useFetch";
import { Loading } from "../../router";
import { useAppContext } from "../../context";

interface Teacher {
  _id: string;
  idTeacher: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ClassInfo {
  _id: string;
  name: string;
  idClass: string;
  point: number;
  students: string[];
  teacher: Teacher;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  idStudent: string;
  class: ClassInfo;
}

const TableStudent = () => {
  const { loading, error, request } = useFetch<Student[]>();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchText, setSearchText] = useState("");
  const [messageApi, contextHolder] = message.useMessage();

  const {
    setOpenAddStudentForm,
    reRenderTableStudent,
    setReRenderTableStudent,
    setOpenModifyStudentForm,
    setCurrentStudent,
    modal,
  } = useAppContext();

  const handleDelete = (id: string, firstName: string, lastName: string) => {
    modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc muốn xóa học sinh ${firstName} ${lastName}?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk() {
        const deleteStudent = async () => {
          const userInfoString = localStorage.getItem("userInfo");
          const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
          const token = userInfo?.token;

          const result = await request(
            `${import.meta.env.VITE_SERVER_URL}/student/${id}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (result) {
            setReRenderTableStudent(!reRenderTableStudent);
            messageApi.success("Xóa học sinh thành công");
          }
        };

        deleteStudent();
      },
    });
  };

  useEffect(() => {
    const fetchStudents = async () => {
      const userInfoString = localStorage.getItem("userInfo");
      const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
      const token = userInfo?.token;

      const result = await request(
        `${import.meta.env.VITE_SERVER_URL}/student`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (result) {
        setStudents(result);
        setFilteredStudents(result);
      }
    };
    fetchStudents();
  }, [request, reRenderTableStudent]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);

    const filtered = students.filter((s) =>
      s.idStudent.toLowerCase().includes(value),
    );
    setFilteredStudents(filtered);
  };

  const columns: ColumnsType<Student> = [
    {
      title: "#",
      key: "index",
      width: 60,
      render: (_text, _record, index) => (
        <span className="font-medium text-gray-400">{index + 1}</span>
      ),
    },
    {
      title: "Mã học sinh",
      dataIndex: "idStudent",
      key: "idStudent",
      width: 120,
      render: (text) => (
        <Tag color="blue" className="font-medium">
          {text}
        </Tag>
      ),
    },
    {
      title: "Họ và tên",
      key: "fullName",
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
      title: "Lớp",
      dataIndex: ["class", "name"],
      key: "class",
      width: 100,
      sorter: (a, b) => a.class.name.localeCompare(b.class.name),
      render: (text) => (
        <Tag color="cyan" className="rounded px-2 font-medium">
          {text}
        </Tag>
      ),
    },
    {
      title: "Chủ nhiệm",
      key: "teacher",
      width: 200,
      render: (_, record) => {
        const teacher = record.class?.teacher;
        if (!teacher)
          return <span className="italic text-gray-400">Chưa phân công</span>;

        return (
          <div className="flex flex-col">
            <span className="font-medium text-gray-700">
              {teacher.lastName} {teacher.firstName}
            </span>
            <span className="text-xs text-gray-500">{teacher.email}</span>
          </div>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      align: "center",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<FiEdit size={18} />}
              className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              onClick={() => {
                setCurrentStudent(record);
                setOpenModifyStudentForm(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              type="text"
              danger
              icon={<FiTrash2 size={18} />}
              className="hover:bg-red-50"
              onClick={() => {
                handleDelete(record?._id, record?.firstName, record?.lastName);
              }}
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
      {contextHolder}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="m-0 text-2xl font-bold text-[var(--text-color)]">
            Danh sách học sinh
          </h1>
          <p className="mt-1 text-gray-500">
            Quản lý thông tin hồ sơ học sinh toàn trường
          </p>
        </div>

        <div className="flex w-full items-center gap-3 md:w-auto">
          <Input
            placeholder="Tìm theo Mã học sinh..."
            prefix={<FiSearch className="text-gray-400" />}
            value={searchText}
            onChange={handleSearch}
            allowClear
            className="w-full rounded-lg border-gray-300 hover:border-[var(--primary-color)] focus:border-[var(--primary-color)] md:w-64"
            size="large"
          />
          <Button
            type="primary"
            icon={<FiUserPlus className="mr-1" />}
            size="large"
            className="flex items-center shadow-md shadow-blue-200"
            style={{ backgroundColor: "var(--primary-color)" }}
            onClick={() => setOpenAddStudentForm(true)}
          >
            Thêm mới
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-white shadow-sm">
        <Table
          columns={columns}
          dataSource={filteredStudents}
          rowKey="_id"
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => (
              <span className="text-sm text-gray-500">
                Hiển thị {range[0]}-{range[1]} trên tổng số {total} học sinh
              </span>
            ),
            className: "p-4",
          }}
          scroll={{ x: 900 }}
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

export default TableStudent;
