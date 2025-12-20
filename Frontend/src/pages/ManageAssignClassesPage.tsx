/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo } from "react"; // Thêm useMemo để tối ưu hiệu năng
import { Table, Select, Button, Card, message, Tag } from "antd";
import {
  RiUserReceived2Line,
  RiSave3Line,
  RiUserStarLine,
  RiSearchLine, // Thêm icon search cho đẹp
} from "react-icons/ri";
import Header from "../components/Header";
import useFetch from "../hooks/useFetch";

const { Option } = Select;

// --- Interfaces ---
interface IClass {
  _id: string;
  name: string;
}

interface IRedFlagUser {
  _id: string;
  firstName: string;
  lastName: string;
  idUser: string;
  followingClasses: string[] | IClass[];
}

interface IAssignmentMap {
  [classId: string]: string | undefined;
}

const ManageAssignClassesPage = () => {
  const { request, loading } = useFetch();
  const [messageApi, contextHolder] = message.useMessage();

  const [classes, setClasses] = useState<IClass[]>([]);
  const [redFlags, setRedFlags] = useState<IRedFlagUser[]>([]);
  const [assignments, setAssignments] = useState<IAssignmentMap>({});
  const [initializing, setInitializing] = useState(false);

  // 1. Fetch dữ liệu
  useEffect(() => {
    const fetchData = async () => {
      setInitializing(true);
      try {
        const userInfoString = localStorage.getItem("userInfo");
        const token = userInfoString ? JSON.parse(userInfoString).token : "";

        const [resClasses, resRedFlags] = await Promise.all([
          request(`${import.meta.env.VITE_SERVER_URL}/class`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }),
          // Đã cập nhật đúng endpoint bạn yêu cầu
          request(`${import.meta.env.VITE_SERVER_URL}/user/co-do`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (resClasses && resRedFlags) {
          // Sắp xếp lớp theo tên cho dễ nhìn (Optional)
          const sortedClasses = (resClasses as IClass[]).sort((a, b) =>
            a.name.localeCompare(b.name),
          );
          setClasses(sortedClasses);
          setRedFlags(resRedFlags);

          // Map dữ liệu cũ
          const initialMap: IAssignmentMap = {};
          (resRedFlags as IRedFlagUser[]).forEach((user) => {
            if (user.followingClasses && user.followingClasses.length > 0) {
              user.followingClasses.forEach((cls) => {
                const classId = typeof cls === "string" ? cls : cls._id;
                initialMap[classId] = user._id;
              });
            }
          });
          setAssignments(initialMap);
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu phân công:", error);
      } finally {
        setInitializing(false);
      }
    };

    fetchData();
  }, [request]);

  const handleAssignmentChange = (classId: string, userId: string) => {
    setAssignments((prev) => ({
      ...prev,
      [classId]: userId,
    }));
  };

  const handleSave = async () => {
    const userInfoString = localStorage.getItem("userInfo");
    const token = userInfoString ? JSON.parse(userInfoString).token : "";

    const payload = Object.keys(assignments).map((classId) => ({
      classId,
      redFlagId: assignments[classId],
    }));

    const response = await request(
      `${import.meta.env.VITE_SERVER_URL}/assign-classes`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assignments: payload }),
      },
    );

    if (response && response.success) {
      messageApi.success("Cập nhật phân công thành công!");
    } else {
      messageApi.error("Cập nhật phân công thất bại. Vui lòng thử lại.");
    }
  };

  // --- TỐI ƯU ---
  // Sử dụng useMemo để render danh sách Options 1 lần duy nhất
  // Giúp bảng không bị lag khi danh sách lớp hoặc cờ đỏ quá dài
  const redFlagOptions = useMemo(() => {
    return redFlags.map((user) => (
      <Option
        key={user._id}
        value={user._id}
        // LABEL này chính là từ khóa để tìm kiếm (Kết hợp cả Tên và ID)
        label={`${user.idUser} - ${user.lastName} ${user.firstName}`}
      >
        {/* Giao diện hiển thị trong dropdown */}
        <div className="flex items-center justify-between">
          <span className="font-medium">
            {user.lastName} {user.firstName}
          </span>
          <Tag color="geekblue" className="mr-0 font-mono">
            {user.idUser}
          </Tag>
        </div>
      </Option>
    ));
  }, [redFlags]);

  const columns = [
    {
      title: "Lớp học",
      dataIndex: "name",
      key: "name",
      width: "25%",
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <span className="text-lg text-gray-800">{text}</span>
        </div>
      ),
    },
    {
      title: "Cờ đỏ phụ trách",
      key: "assignee",
      width: "75%",
      render: (_: any, record: IClass) => (
        <Select
          showSearch // 1. Cho phép gõ chữ để tìm
          style={{ width: "100%", maxWidth: "450px" }}
          placeholder="Chọn hoặc tìm kiếm (Tên/ID)..."
          optionFilterProp="label" // 2. Tìm kiếm dựa trên prop 'label' của Option
          allowClear
          value={assignments[record._id] || undefined}
          onChange={(value) => handleAssignmentChange(record._id, value)}
          suffixIcon={<RiUserStarLine className="text-gray-400" />}
          // 3. Logic tìm kiếm (Không phân biệt hoa thường)
          filterOption={(input, option) =>
            ((option?.label ?? "") as string)
              .toLowerCase()
              .includes(input.toLowerCase())
          }
          // Hiển thị khi không tìm thấy
          notFoundContent={
            <div className="p-2 text-center text-gray-400">
              Không tìm thấy cờ đỏ này
            </div>
          }
        >
          {/* Render danh sách options đã memo */}
          {redFlagOptions}
        </Select>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}
      <Header
        title="Phân công trực nhật"
        subtitle="Quản lý và phân chia lớp học cho đội ngũ Cờ đỏ / Ban cán sự"
        logo={RiUserReceived2Line}
      />

      <div className="space-y-10 p-5">
        <Card
          title={
            <div className="flex items-center gap-2">
              <RiSearchLine /> <span>Danh sách phân công</span>
            </div>
          }
          className="rounded-xl border-gray-100 shadow-md"
          extra={
            <Button
              type="primary"
              icon={<RiSave3Line />}
              onClick={handleSave}
              loading={loading}
              size="large"
              style={{ backgroundColor: "var(--primary-color)" }}
              className="shadow-lg"
            >
              Lưu thay đổi
            </Button>
          }
        >
          <Table
            rowKey="_id"
            dataSource={classes}
            columns={columns}
            loading={initializing}
            pagination={{
              pageSize: 10,
            }}
            bordered
            rowClassName="hover:bg-gray-50 transition-colors"
          />
        </Card>
      </div>
    </div>
  );
};

export default ManageAssignClassesPage;
