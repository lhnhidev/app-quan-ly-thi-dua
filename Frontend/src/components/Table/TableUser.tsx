import React, { useState, useEffect } from "react";
import { Table, Input, Button, Tag, Space, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiSearch, FiEdit, FiTrash2, FiUserPlus } from "react-icons/fi";
import useFetch from "../../hooks/useFetch";
import { Loading } from "../../router";
import { useAppContext } from "../../context";

interface User {
  _id: string;
  idUser: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "user";
}

const ManageUserPage = () => {
  const { loading, error, request } = useFetch<User[]>();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchText, setSearchText] = useState("");

  const {
    setOpenAddUserForm,
    setOpenModifyUserForm,
    setReRenderTableUser,
    modal,
    messageApi,
    reRenderTableUser,
    setCurrentUser,
    currentUser,
  } = useAppContext();

  useEffect(() => {
    const userInfoString = localStorage.getItem("userInfo");
    const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
    const token = userInfo?.token;

    const fetchUsers = async () => {
      const result = await request(`${import.meta.env.VITE_SERVER_URL}/user`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (result) {
        setUsers(result);
        setFilteredUsers(result);
      }
    };
    fetchUsers();
  }, [request, reRenderTableUser]);

  const handleChangeUser = (user: User) => {
    setOpenModifyUserForm(true);
    setCurrentUser(user);
  };

  const handleDeleteUser = async (id: string, idUser: string) => {
    modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc muốn xóa người dùng ${idUser}?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk() {
        const deleteUser = async () => {
          const userInfoString = localStorage.getItem("userInfo");
          const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
          const token = userInfo?.token;

          const result = await request(
            `${import.meta.env.VITE_SERVER_URL}/user/deleteUser/${id}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (result) {
            setReRenderTableUser(!reRenderTableUser);
            messageApi.success("Xóa người dùng thành công");
          }
        };

        deleteUser();
      },
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);

    const filtered = users.filter((user) =>
      user.idUser.toLowerCase().includes(value),
    );
    setFilteredUsers(filtered);
  };

  const columns: ColumnsType<User> = [
    {
      title: "#",
      key: "index",
      width: 60,
      render: (_text, _record, index) => (
        <span className="font-medium text-gray-400">{index + 1}</span>
      ),
    },
    {
      title: "Mã người dùng",
      dataIndex: "idUser",
      key: "idUser",
      width: 150,
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
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-200 bg-gradient-to-br from-blue-100 to-blue-200 font-bold text-blue-600 shadow-sm">
            {record.lastName.charAt(0)}
          </div>
          <span className="font-medium text-gray-700">
            {record.lastName} {record.firstName}
          </span>
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text) => <span className="text-gray-500">{text}</span>,
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      width: 150,
      sorter: (a, b) => a.role.localeCompare(b.role),
      render: (role: string) => {
        let color = "blue";
        let label = "Người dùng";

        if (role === "admin") {
          color = "volcano";
          label = "Quản trị viên";
        } else {
          color = "green";
          label = "Người dùng";
        }

        return (
          <Tag
            color={color}
            className="rounded-full border-0 px-3 py-0.5 font-medium shadow-sm"
          >
            {label.toUpperCase()}
          </Tag>
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
              onClick={() => handleChangeUser(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              type="text"
              danger
              icon={<FiTrash2 size={18} />}
              className="hover:bg-red-50"
              onClick={() => handleDeleteUser(record._id, record.idUser)}
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
            Danh sách người dùng
          </h1>
          <p className="mt-1 text-gray-500">
            Quản lý tài khoản và phân quyền hệ thống
          </p>
        </div>

        <div
          className={`${
            location.pathname === "/dashboard" ? "hidden" : "flex"
          } w-full items-center gap-3 md:w-auto`}
        >
          {/* Ô tìm kiếm */}
          <Input
            placeholder="Tìm theo Mã người dùng..."
            prefix={<FiSearch className="text-gray-400" />}
            value={searchText}
            onChange={handleSearch}
            allowClear
            className="w-full rounded-lg border-gray-300 hover:border-[var(--primary-color)] focus:border-[var(--primary-color)] md:w-64"
            size="large"
          />

          {/* Nút thêm mới */}
          <Button
            type="primary"
            icon={<FiUserPlus className="mr-1" />}
            size="large"
            className="flex items-center shadow-md shadow-blue-200"
            style={{ backgroundColor: "var(--primary-color)" }}
            onClick={() => setOpenAddUserForm(true)}
          >
            Thêm mới
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-white shadow-sm">
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="_id"
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => (
              <span className="text-sm text-gray-500">
                Hiển thị {range[0]}-{range[1]} trên tổng số {total} người dùng
              </span>
            ),
            className: "p-4",
          }}
          scroll={{ x: 768 }}
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

export default ManageUserPage;
