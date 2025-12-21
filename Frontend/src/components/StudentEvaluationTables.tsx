import React, { useEffect, useState } from "react";
import { Card, Table, Tag, Spin, Row, Col, Empty, message } from "antd";
import { SmileOutlined, FrownOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

// Kích hoạt plugin so sánh ngày
dayjs.extend(isBetween);

// --- INTERFACES (Dựa trên JSON bạn cung cấp) ---

interface IRule {
  _id: string;
  idRule: string;
  content: string;
  point: number;
}

interface IRecordForm {
  _id: string;
  createdAt: string;
  rule: IRule; // Rule đã được populate
}

interface IClassInfo {
  _id: string;
  name: string;
}

interface IStudentRaw {
  _id: string;
  firstName: string;
  lastName: string;
  idStudent: string;
  class: IClassInfo | null; // Class có thể null (như trường hợp Quan Vũ)
  recordForms: IRecordForm[];
}

// Interface cho dữ liệu sau khi tính toán để hiển thị lên bảng
interface IEvaluatedStudent {
  key: string;
  idStudent: string;
  fullName: string;
  className: string;
  totalPoint: number;
}

interface Props {
  selectedWeek: Dayjs; // Prop nhận từ component cha
}

const StudentEvaluationTables: React.FC<Props> = ({ selectedWeek }) => {
  const [loading, setLoading] = useState(false);
  const [commendStudents, setCommendStudents] = useState<IEvaluatedStudent[]>(
    [],
  ); // Danh sách tuyên dương (> 30)
  const [concernStudents, setConcernStudents] = useState<IEvaluatedStudent[]>(
    [],
  ); // Danh sách cần quan tâm (< -30)

  // Hàm gọi API
  const fetchData = async () => {
    setLoading(true);
    try {
      const userInfoString = localStorage.getItem("userInfo");
      const token = userInfoString ? JSON.parse(userInfoString).token : "";

      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/student/desc`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch student data");
      }

      const data: IStudentRaw[] = await response.json();
      processStudentData(data);
    } catch (error) {
      console.error(error);
      message.error("Không thể tải dữ liệu đánh giá học sinh.");
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý dữ liệu: Lọc theo tuần & Tính điểm
  const processStudentData = (students: IStudentRaw[]) => {
    // Xác định khoảng thời gian của tuần đã chọn
    const startOfWeek = selectedWeek.startOf("week").add(1, "day"); // Thứ 2
    const endOfWeek = selectedWeek.endOf("week").add(1, "day"); // Chủ nhật

    const tempCommend: IEvaluatedStudent[] = [];
    const tempConcern: IEvaluatedStudent[] = [];

    students.forEach((st) => {
      let currentTotalPoint = 0;

      // Duyệt qua các phiếu ghi nhận
      if (st.recordForms && st.recordForms.length > 0) {
        st.recordForms.forEach((record) => {
          const recordTime = dayjs(record.createdAt);

          // CHỈ TÍNH nếu phiếu nằm trong tuần được chọn
          if (recordTime.isBetween(startOfWeek, endOfWeek, "day", "[]")) {
            // Cộng điểm từ rule (nếu rule tồn tại)
            if (record.rule && typeof record.rule.point === "number") {
              currentTotalPoint += record.rule.point;
            }
          }
        });
      }

      // Tạo object hiển thị
      const studentDisplayData: IEvaluatedStudent = {
        key: st._id,
        idStudent: st.idStudent,
        fullName: `${st.lastName} ${st.firstName}`,
        className: st.class ? st.class.name : "---", // Xử lý nếu chưa có lớp
        totalPoint: currentTotalPoint,
      };

      // Phân loại dựa trên ngưỡng điểm
      if (currentTotalPoint >= 30) {
        tempCommend.push(studentDisplayData);
      } else if (currentTotalPoint <= -30) {
        tempConcern.push(studentDisplayData);
      }
    });

    // Sắp xếp: Tuyên dương (cao -> thấp), Cần quan tâm (thấp -> cao / âm nhiều nhất lên đầu)
    tempCommend.sort((a, b) => b.totalPoint - a.totalPoint);
    tempConcern.sort((a, b) => a.totalPoint - b.totalPoint);

    setCommendStudents(tempCommend);
    setConcernStudents(tempConcern);
  };

  // Fetch dữ liệu mỗi khi selectedWeek thay đổi
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWeek]);

  // --- DEFINITION COLUMNS ---

  const commonColumns = [
    {
      title: "Mã HS",
      dataIndex: "idStudent",
      key: "idStudent",
      width: 100,
    },
    {
      title: "Họ tên",
      dataIndex: "fullName",
      key: "fullName",
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Lớp",
      dataIndex: "className",
      key: "className",
      width: 80,
      sorter: (a: IEvaluatedStudent, b: IEvaluatedStudent) =>
        a.className.localeCompare(b.className),
    },
    {
      title: "Điểm",
      dataIndex: "totalPoint",
      key: "totalPoint",
      align: "center" as const,
      width: 100,
      sorter: (a: IEvaluatedStudent, b: IEvaluatedStudent) =>
        a.totalPoint - b.totalPoint,
      render: (point: number) => (
        <Tag
          color={point > 0 ? "success" : "error"}
          className="px-2 py-0.5 text-sm font-bold"
        >
          {point > 0 ? `+${point}` : point}
        </Tag>
      ),
    },
  ];

  return (
    <div className="mt-8">
      {loading ? (
        <div className="flex justify-center py-10">
          <Spin tip="Đang tính toán..." />
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          {/* BẢNG 1: TUYÊN DƯƠNG */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <span className="font-bold text-green-700">
                  <SmileOutlined className="mr-2" /> Đề xuất Tuyên Dương (Điểm{" "}
                  {">="} 30)
                </span>
              }
              className="h-full border-t-4 border-t-green-500 shadow-md"
              headStyle={{ backgroundColor: "#f6ffed" }}
            >
              {commendStudents.length > 0 ? (
                <Table
                  dataSource={commendStudents}
                  columns={commonColumns}
                  pagination={{ pageSize: 15 }}
                  size="small"
                />
              ) : (
                <Empty description="Chưa có học sinh đạt điều kiện tuyên dương trong tuần này" />
              )}
            </Card>
          </Col>

          {/* BẢNG 2: CẦN QUAN TÂM */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <span className="font-bold text-red-700">
                  <FrownOutlined className="mr-2" /> Cần quan tâm / Nhắc nhở
                  (Điểm {"<="} -30)
                </span>
              }
              className="h-full border-t-4 border-t-red-500 shadow-md"
              headStyle={{ backgroundColor: "#fff1f0" }}
            >
              {concernStudents.length > 0 ? (
                <Table
                  dataSource={concernStudents}
                  columns={commonColumns}
                  pagination={{ pageSize: 15 }}
                  size="small"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <SmileOutlined style={{ fontSize: 40, color: "#52c41a" }} />
                  <span className="mt-2 text-gray-500">
                    Tuyệt vời! Không có học sinh nào bị kỷ luật nặng.
                  </span>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default StudentEvaluationTables;
