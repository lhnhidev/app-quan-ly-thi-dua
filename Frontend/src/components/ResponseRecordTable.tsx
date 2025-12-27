/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Descriptions,
  Typography,
  Space,
  Select,
  Button,
  Modal,
  Radio,
  Input,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined } from "@ant-design/icons";
// Đảm bảo đường dẫn import useFetch đúng với dự án của bạn
import useFetch from "../hooks/useFetch";
import { useAppContext } from "../context";

// ==========================================
// 1. ĐỊNH NGHĨA TYPES
// ==========================================

interface IUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  idUser: string;
}

interface IStudent {
  _id: string;
  firstName: string;
  lastName: string;
  idStudent: string;
  email?: string;
  class: string;
}

interface IRule {
  _id: string;
  idRule: string;
  content: string;
  point: number;
  type: boolean;
}

interface IClass {
  _id: string;
  name: string; // Đây là trường tên lớp (Ví dụ: "Lớp 6A")
  idClass: string;
}

interface IRecordForm {
  _id: string;
  idRecordForm: string;
  time: string;
  user: IUser;
  student: IStudent;
  class: IClass; // Object class nằm trong idRecordForm
  rule: IRule;
}

interface IResponseData {
  _id: string;
  idRecordForm: IRecordForm; // Dữ liệu tham chiếu populated
  idUser: IUser;
  recordForm: string;
  user: string;
  firstName: string;
  lastName: string;
  email: string;
  content: string;
  state: string;
  responseOfAdmin: string;
  createdAt: string;
  updatedAt: string;
}

interface IApiResponse {
  success: boolean;
  data: IResponseData[];
}

interface ITableRecord extends IResponseData {
  key: string;
  index: number;
}

// ==========================================
// 2. COMPONENT CHÍNH
// ==========================================

const ResponseRecordTable: React.FC = () => {
  // State dữ liệu bảng
  const [allData, setAllData] = useState<ITableRecord[]>([]);
  const [filteredData, setFilteredData] = useState<ITableRecord[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { messageApi } = useAppContext();

  // State User
  const [currentUser, setCurrentUser] = useState<any>(null);

  // State Modal (Admin)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<ITableRecord | null>(null);
  const [responseType, setResponseType] = useState<boolean | null>(null);
  const [responseDesc, setResponseDesc] = useState<string>("");

  // Hook useFetch
  const { loading, request } = useFetch<IApiResponse>();
  const apiUrl = import.meta.env.VITE_SERVER_URL as string;

  useEffect(() => {
    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      setCurrentUser(JSON.parse(storedUserInfo));
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, allData]);

  const fetchData = async () => {
    const storedUser = localStorage.getItem("userInfo");
    const userObj = storedUser ? JSON.parse(storedUser) : null;
    const token = userObj?.token || "";
    const currentUserId = userObj?._id;

    const response = await request(`${apiUrl}/response`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response && response.success) {
      let finalData = response.data;

      if (userObj && userObj.role !== "admin") {
        finalData = finalData.filter(
          (item: { idUser: { _id: any } }) =>
            item.idUser && item.idUser._id === currentUserId,
        );
      }

      const formattedData: ITableRecord[] = finalData.map(
        (item: IResponseData, index: number) => ({
          ...item,
          key: item._id,
          index: index + 1,
        }),
      );

      setAllData(formattedData);
    }
  };

  const applyFilter = () => {
    if (filterStatus === "all") {
      setFilteredData(allData);
      return;
    }

    const result = allData.filter((item) => {
      const s = item.state ? item.state.toLowerCase() : "";
      if (filterStatus === "pending") return s === "chờ xử lý";
      if (filterStatus === "approved")
        return s === "đã duyệt" || s === "chấp nhận";
      if (filterStatus === "rejected") return s === "từ chối";
      return true;
    });
    setFilteredData(result);
  };

  // --- LOGIC XỬ LÝ ADMIN (MODAL) ---
  const handleOpenModal = (record: ITableRecord) => {
    setCurrentRecord(record);
    setResponseType(null);
    setResponseDesc("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentRecord(null);
  };

  const handleSubmitResponse = async () => {
    if (responseType === null) {
      messageApi.warning("Vui lòng chọn Chấp nhận hoặc Từ chối!");
      return;
    }
    if (!currentRecord) return;

    const payload = {
      type: responseType,
      desc: responseDesc,
    };

    const token = currentUser?.token || "";
    const response = await request(`${apiUrl}/response/${currentRecord._id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (response) {
      messageApi.success("Đã gửi phản hồi thành công!");
      handleCloseModal();
      fetchData();
    }
  };

  // ==========================================
  // CẤU HÌNH CỘT (Đã chỉnh sửa logic thêm cột Lớp)
  // ==========================================
  const columns: ColumnsType<ITableRecord> = [
    {
      title: "STT",
      dataIndex: "index",
      key: "index",
      width: 60,
      align: "center",
    },
    {
      title: "Thời gian khởi tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 170,
      render: (text: string) => new Date(text).toLocaleString("vi-VN"),
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Mã phiếu",
      key: "idRecordFormCode",
      width: 120,
      render: (_, record) => (
        <Tag color="blue" style={{ fontWeight: "bold" }}>
          {record.idRecordForm?.idRecordForm || "N/A"}
        </Tag>
      ),
    },
    // Vị trí index 3: Cột Lớp sẽ được chèn vào đây nếu là Admin
    {
      title: "Người gửi",
      key: "creator",
      render: (_, record) => {
        const user = record.idUser;
        return (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>
              {user?.firstName} {user?.lastName}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {user?.idUser}
            </Typography.Text>
          </Space>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "state",
      key: "state",
      width: 140,
      render: (state: string) => {
        let color = "default";
        const s = state ? state.toLowerCase() : "";
        if (s === "chờ xử lý") color = "orange";
        else if (["đã duyệt", "chấp nhận"].includes(s)) color = "green";
        else if (s === "từ chối") color = "red";

        return (
          <Tag color={color}>{state ? state.toUpperCase() : "UNKNOWN"}</Tag>
        );
      },
    },
  ];

  // --- LOGIC KIỂM TRA QUYỀN ADMIN ---
  if (currentUser && currentUser.role === "admin") {
    // 1. Chèn cột "Lớp" vào vị trí mong muốn (sau Mã phiếu, trước Người gửi)
    // Hiện tại: [STT, Thời gian, Mã phiếu, Người gửi, Trạng thái]
    // Index:      0       1          2          3           4
    // Ta muốn chèn vào index 3

    columns.splice(3, 0, {
      title: "Lớp",
      key: "className",
      width: 100,
      render: (_, record) => {
        // Lấy tên lớp từ record.idRecordForm.class.name
        const className = record.idRecordForm?.class?.name || "N/A";
        return <Tag color="cyan">{className}</Tag>;
      },
    });

    // 2. Thêm cột "Hành động" vào cuối cùng
    columns.push({
      title: "Phản hồi",
      key: "action",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleOpenModal(record)}
        >
          Xử lý
        </Button>
      ),
    });
  }

  // --- EXPANDED ROW (CHI TIẾT) ---
  const expandedRowRender = (record: ITableRecord) => {
    const recordForm = record.idRecordForm || {};
    const senderStudent = recordForm.student || {};
    const creatorUser = recordForm.user || {};
    const rule = recordForm.rule || {};
    const isBonus = rule.type === true;
    const pointColor = isBonus ? "#389e0d" : "#cf1322";
    const pointPrefix = isBonus ? "+" : "";

    const stateLower = record.state ? record.state.toLowerCase() : "";
    const showAdminResponse = ["đã duyệt", "chấp nhận", "từ chối"].includes(
      stateLower,
    );

    return (
      <div
        style={{
          padding: "16px",
          background: "#f9f9f9",
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
        }}
      >
        <Descriptions
          title="Thông tin chi tiết"
          bordered
          size="small"
          column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
        >
          <Descriptions.Item label="Học sinh (HS)">
            <div>
              <b>
                {senderStudent.firstName} {senderStudent.lastName}
              </b>{" "}
              - <Tag color="cyan">{senderStudent.idStudent}</Tag>
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="Người lập phiếu (GV)">
            <div>
              <b>
                {creatorUser.firstName} {creatorUser.lastName}
              </b>{" "}
              - <Tag color="purple">{creatorUser.idUser}</Tag>
            </div>
          </Descriptions.Item>
          {/* Hiển thị lớp trong chi tiết luôn cho đầy đủ (tuỳ chọn) */}
          <Descriptions.Item label="Lớp">
            <b>{recordForm.class?.name || "N/A"}</b>
          </Descriptions.Item>
          {/* Dùng span rỗng để cân đối layout bảng description */}
          <Descriptions.Item label="">
            <></>
          </Descriptions.Item>

          <Descriptions.Item label="Chi tiết lỗi/thưởng" span={2}>
            <div>
              <b>[{rule.idRule}]</b> {rule.content} (
              <span style={{ color: pointColor, fontWeight: "bold" }}>
                {pointPrefix}
                {rule.point}
              </span>
              )
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="Nội dung phản hồi" span={2}>
            <Typography.Text style={{ fontStyle: "italic" }}>
              "{record.content}"
            </Typography.Text>
          </Descriptions.Item>
          {showAdminResponse && (
            <Descriptions.Item
              label={<span style={{ color: "#d4380d" }}>Phản hồi QTV</span>}
              span={2}
            >
              <Typography.Text type="danger" strong>
                {record.responseOfAdmin || "(Không có nội dung)"}
              </Typography.Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>
    );
  };

  return (
    <div
      style={{
        background: "#fff",
        padding: 20,
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 15,
        }}
      >
        <h3
          className={`${
            currentUser?.role === "admin"
              ? "b-1 text-2xl font-bold text-[var(--text-color)]"
              : "text-md font-semibold"
          }`}
        >
          {currentUser?.role === "admin"
            ? "Quản lý phản hồi"
            : "Lịch sử phản hồi của tôi"}
        </h3>

        {/* BỘ LỌC TRẠNG THÁI */}
        <Space>
          <span>Lọc trạng thái:</span>
          <Select
            defaultValue="all"
            style={{ width: 150 }}
            onChange={(value) => setFilterStatus(value)}
            options={[
              { value: "all", label: "Tất cả" },
              { value: "pending", label: "Chờ xử lý" },
              { value: "approved", label: "Đã duyệt" },
              { value: "rejected", label: "Từ chối" },
            ]}
          />
        </Space>
      </div>

      <Table<ITableRecord>
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        expandable={{
          expandedRowRender,
          rowExpandable: () => true,
        }}
        scroll={{ x: 800 }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        rowKey="_id"
        bordered
      />

      {/* MODAL XỬ LÝ (CHỈ DÀNH CHO ADMIN) */}
      <Modal
        title={`Mã phiếu: ${
          currentRecord?.idRecordForm?.idRecordForm || "..."
        }`}
        open={isModalOpen}
        onCancel={handleCloseModal}
        onOk={handleSubmitResponse}
        okText="Gửi phản hồi"
        cancelText="Hủy"
        confirmLoading={loading}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          <div>
            <Typography.Text strong>Quyết định xử lý:</Typography.Text>
            <div style={{ marginTop: 8 }}>
              <Radio.Group
                onChange={(e) => setResponseType(e.target.value)}
                value={responseType}
              >
                <Radio value={true} style={{ color: "green" }}>
                  Chấp nhận (Cộng/Trừ lại điểm đúng)
                </Radio>
                <Radio value={false} style={{ color: "red" }}>
                  Từ chối (Giữ nguyên)
                </Radio>
              </Radio.Group>
            </div>
          </div>

          <div>
            <Typography.Text strong>Chi tiết phản hồi:</Typography.Text>
            <Input.TextArea
              rows={4}
              placeholder="Nhập lý do chấp nhận hoặc từ chối..."
              value={responseDesc}
              onChange={(e) => setResponseDesc(e.target.value)}
              style={{ marginTop: 8 }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ResponseRecordTable;
