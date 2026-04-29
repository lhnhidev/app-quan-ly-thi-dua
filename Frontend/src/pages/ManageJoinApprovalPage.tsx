import React, { useEffect, useMemo, useState } from "react";
import { Button, Empty, Space, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { MdChecklist } from "react-icons/md";
import Header from "../components/Header";

interface PendingRequest {
  userId: string;
  fullName: string;
  email: string;
  role: "admin" | "teacher" | "student" | "redflag";
  requestMessage: string;
  requestedAt?: string | null;
}

const roleLabel: Record<PendingRequest["role"], string> = {
  admin: "Quản trị tổ chức",
  teacher: "Giáo viên",
  student: "Học sinh",
  redflag: "Cờ đỏ",
};

const roleColor: Record<PendingRequest["role"], string> = {
  admin: "gold",
  teacher: "blue",
  student: "cyan",
  redflag: "magenta",
};

const ManageJoinApprovalPage: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PendingRequest[]>([]);

  const token = useMemo(() => {
    const raw = localStorage.getItem("userInfo");
    if (!raw) return "";

    try {
      return JSON.parse(raw)?.token || "";
    } catch {
      return "";
    }
  }, []);

  const activeOrg = useMemo(() => {
    const raw = localStorage.getItem("activeOrganization");
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const fetchRequests = async () => {
    if (!token || !activeOrg?.organizationId) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/organizations/${activeOrg.organizationId}/pending-requests`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const payload = await res.json().catch(() => []);
      if (!res.ok) {
        throw new Error(payload.message || "Không tải được danh sách chờ duyệt");
      }

      setData(Array.isArray(payload) ? payload : []);
    } catch (error: any) {
      console.error(error);
      messageApi.error(error.message || "Không tải được danh sách chờ duyệt");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeOrg?.organizationId]);

  const approveMember = async (memberId: string) => {
    if (!activeOrg?.organizationId) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/organizations/${activeOrg.organizationId}/members/${memberId}/approve`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.message || "Không thể duyệt thành viên");
      }

      messageApi.success("Đã duyệt thành viên");
      fetchRequests();
    } catch (error: any) {
      console.error(error);
      messageApi.error(error.message || "Không thể duyệt thành viên");
    } finally {
      setLoading(false);
    }
  };

  const rejectMember = async (memberId: string) => {
    if (!activeOrg?.organizationId) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/organizations/${activeOrg.organizationId}/members/${memberId}/reject`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.message || "Không thể từ chối thành viên");
      }

      messageApi.success("Đã từ chối yêu cầu tham gia");
      fetchRequests();
    } catch (error: any) {
      console.error(error);
      messageApi.error(error.message || "Không thể từ chối thành viên");
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<PendingRequest> = [
    {
      title: "Tên người dùng",
      dataIndex: "fullName",
      key: "fullName",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Vai trò xin tham gia",
      dataIndex: "role",
      key: "role",
      render: (value: PendingRequest["role"]) => (
        <Tag color={roleColor[value]}>{roleLabel[value]}</Tag>
      ),
    },
    {
      title: "Nội dung",
      dataIndex: "requestMessage",
      key: "requestMessage",
      render: (value: string) => value || "--",
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="primary" onClick={() => approveMember(record.userId)}>
            Đồng ý
          </Button>
          <Button danger onClick={() => rejectMember(record.userId)}>
            Từ chối
          </Button>
        </Space>
      ),
    },
  ];

  const isAdmin = activeOrg?.role === "admin";

  return (
    <div>
      {contextHolder}
      <Header
        title="Phê duyệt tham gia"
        subtitle="Duyệt yêu cầu tham gia tổ chức của người dùng"
        logo={MdChecklist}
      ></Header>

      <div className="min-h-screen p-6">
        {!activeOrg?.organizationId ? (
          <Empty description="Vui lòng chọn tổ chức trước" />
        ) : !isAdmin ? (
          <Empty description="Chỉ quản trị viên mới có quyền phê duyệt" />
        ) : data.length === 0 ? (
          <Empty description="Không có yêu cầu chờ duyệt" />
        ) : (
          <Table
            rowKey="userId"
            columns={columns}
            dataSource={data}
            loading={loading}
            pagination={{ pageSize: 8 }}
          />
        )}
      </div>
    </div>
  );
};

export default ManageJoinApprovalPage;
