/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Column } from "@ant-design/charts";
import {
  Spin,
  Button,
  Input,
  message,
  Card,
  DatePicker,
  Table,
  Tag,
  Avatar,
} from "antd";
import { FiDownload, FiSearch, FiUser } from "react-icons/fi";
import { RiTrophyLine, RiFileList3Line } from "react-icons/ri";
import * as XLSX from "xlsx";
import useFetch from "../hooks/useFetch";
import dayjs, { Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import "dayjs/locale/vi";
import { useAppContext } from "../context";
import StudentEvaluationTables from "./StudentEvaluationTables";

// Kích hoạt plugin
dayjs.extend(isBetween);
dayjs.locale("vi");

// --- INTERFACES ---

interface IRecordCreator {
  _id: string;
  idUser: string;
  firstName: string;
  lastName: string;
}

// 1. Interface cho Rule (Quy định)
interface IRule {
  _id: string;
  idRule?: string; // Thêm trường này (ví dụ: RL-024)
  content?: string; // JSON trả về là content, không phải name
  point: number;
}

// 2. Interface cho Teacher
interface ITeacher {
  _id: string;
  idTeacher: string;
  firstName: string;
  lastName: string;
  email: string;
}

// 3. Interface cho Class (Dùng chung cho cả Chart và Student)
interface IClass {
  _id: string;
  idClass: string;
  name: string;
  teacher?: ITeacher;
  students?: string[]; // Trong API /class trả về mảng ID
  point?: number;
}

// 4. Interface cho RecordForm (Phiếu chấm)
interface IRecordForm {
  _id: string;
  idRecordForm: string;
  time: string;
  createdAt: string;

  // Quan trọng: user bây giờ là một Object (IRecordCreator) chứ không phải string nữa
  user: IRecordCreator;

  rule: string | IRule;
  content?: string; // Thêm trường content
}

// 5. Interface cho Student (Từ API /student)
interface IStudent {
  _id: string;
  firstName: string;
  lastName: string;
  idStudent: string;
  class: IClass; // Object class đã populate
  recordForms: IRecordForm[]; // Mảng vi phạm của học sinh
}

// 6. Interface dữ liệu tính toán cho Bảng Xếp Hạng Lớp
interface ComputedClassData extends IClass {
  calculatedPoint: number;
  rank?: number;
}

// 7. Interface dữ liệu tính toán cho Bảng Xếp Hạng Học Sinh
interface ComputedStudentData extends IStudent {
  totalPoint: number;
  rank?: number;
  // validRecords chứa thông tin đã được làm phẳng để dễ hiển thị
  validRecords: Array<
    IRecordForm & {
      ruleContent: string; // Nội dung lỗi
      ruleCode: string; // Mã lỗi (RL-xxx)
      rulePoint: number; // Điểm
    }
  >;
}

const ClassCompetitionChart: React.FC = () => {
  const { request, loading } = useFetch();

  const { messageApi } = useAppContext();

  // --- STATE ---
  const [classes, setClasses] = useState<IClass[]>([]);
  const [students, setStudents] = useState<IStudent[]>([]);
  const [rules, setRules] = useState<IRule[]>([]);

  // Dữ liệu hiển thị
  const [chartData, setChartData] = useState<ComputedClassData[]>([]); // Dữ liệu lớp
  const [studentRankingData, setStudentRankingData] = useState<
    ComputedStudentData[]
  >([]); // Dữ liệu học sinh

  // Bộ lọc & UI
  const [searchId, setSearchId] = useState("");
  const [_searchResult, setSearchResult] = useState<ComputedClassData | null>(
    null,
  );
  const [selectedWeek, setSelectedWeek] = useState<Dayjs>(dayjs());

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchInitialData = async () => {
      const userInfoString = localStorage.getItem("userInfo");
      const token = userInfoString ? JSON.parse(userInfoString).token : "";
      if (!token) return;

      try {
        // Gọi 4 API song song: Class, RecordForm (cho lớp), Student, Rule
        const [resClass, resRecordClass, resStudent, resRule] =
          await Promise.all([
            request(`${import.meta.env.VITE_SERVER_URL}/class`, {
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            }),
            request(`${import.meta.env.VITE_SERVER_URL}/record-form`, {
              // Record tổng để tính điểm lớp
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            }),
            request(`${import.meta.env.VITE_SERVER_URL}/student/desc`, {
              // Student chứa record riêng
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            }),
            request(`${import.meta.env.VITE_SERVER_URL}/role`, {
              // Để lấy điểm số
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

        if (resClass) setClasses(resClass);
        if (resStudent) setStudents(resStudent);
        if (resRule) setRules(resRule);

        // Lưu records tổng của lớp vào state tạm nếu cần,
        // ở đây ta sẽ xử lý trực tiếp trong logic tính toán lớp bên dưới
        // (Giả sử logic tính điểm lớp vẫn giữ nguyên như cũ dùng resRecordClass)
        // Để code gọn, mình sẽ combine logic tính điểm lớp ngay tại đây hoặc tách ra useEffect

        // --- LOGIC TÍNH ĐIỂM LỚP (Giữ nguyên từ code cũ) ---
        if (resClass && resRecordClass) {
          processClassRanking(resClass, resRecordClass, selectedWeek);
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        message.error("Có lỗi xảy ra khi tải dữ liệu hệ thống!");
      }
    };

    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]); // Bỏ selectedWeek ra khỏi đây để tránh fetch lại API liên tục

  // Khi selectedWeek thay đổi -> Cần fetch lại RecordForm của lớp (nếu API filter theo tuần)
  // HOẶC nếu đã fetch hết thì chỉ cần chạy lại hàm tính toán.
  // Ở đây giả định fetch hết 1 lần, nên ta dùng useEffect riêng để tính toán lại.

  // --- 2. LOGIC TÍNH TOÁN LẠI KHI THAY ĐỔI TUẦN ---
  useEffect(() => {
    // Gọi lại API nếu cần thiết, hoặc nếu đã lưu vào state thì tính toán lại
    // Để đơn giản, mình giả lập việc trigger tính toán lại ở đây
    const reCalculate = async () => {
      const userInfoString = localStorage.getItem("userInfo");
      const token = userInfoString ? JSON.parse(userInfoString).token : "";

      // Cần lấy lại record-form tổng quát để tính điểm lớp (vì record này nằm độc lập)
      const resRecordClass = await request(
        `${import.meta.env.VITE_SERVER_URL}/record-form`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (classes.length > 0 && resRecordClass) {
        processClassRanking(classes, resRecordClass, selectedWeek);
      }

      // Tính điểm học sinh (Dữ liệu học sinh đã có sẵn recordForms bên trong, không cần fetch lại record)
      if (students.length > 0 && rules.length > 0) {
        processStudentRanking(students, rules, selectedWeek);
      }
    };

    reCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWeek, classes.length, students.length, rules.length]);

  // --- HÀM XỬ LÝ: TÍNH ĐIỂM LỚP ---
  const processClassRanking = (
    classList: IClass[],
    recordList: any[],
    week: Dayjs,
  ) => {
    const startOfWeek = week.startOf("week").add(1, "day");
    const endOfWeek = week.endOf("week").add(1, "day");

    const tempMap = new Map<string, ComputedClassData>();
    classList.forEach((cls) => {
      tempMap.set(cls._id, { ...cls, calculatedPoint: 300 }); // Đổi tên key point -> calculatedPoint để tránh nhầm
    });

    recordList.forEach((record: any) => {
      const recordDate = dayjs(record.createdAt);
      if (recordDate.isBetween(startOfWeek, endOfWeek, "day", "[]")) {
        const classId =
          typeof record.class === "string" ? record.class : record.class?._id;
        const targetClass = tempMap.get(classId);
        if (targetClass && record.rule) {
          // Lưu ý: check xem record.rule là object hay string
          const point =
            typeof record.rule === "number"
              ? record.rule
              : record.rule.point || 0;
          targetClass.calculatedPoint += point;
          tempMap.set(classId, targetClass);
        }
      }
    });

    const sorted = Array.from(tempMap.values()).sort(
      (a, b) => b.calculatedPoint - a.calculatedPoint,
    );
    setChartData(sorted.map((item, idx) => ({ ...item, rank: idx + 1 })));
  };

  // --- HÀM XỬ LÝ: TÍNH ĐIỂM HỌC SINH ---
  // --- HÀM XỬ LÝ: TÍNH ĐIỂM HỌC SINH ---
  const processStudentRanking = (
    studentList: IStudent[],
    _ruleList: IRule[], // Có thể không cần dùng đến ruleList này nữa nếu API đã populate đủ
    week: Dayjs,
  ) => {
    const startOfWeek = week.startOf("week").add(1, "day");
    const endOfWeek = week.endOf("week").add(1, "day");

    const computedStudents: ComputedStudentData[] = studentList.map((st) => {
      let totalPoint = 0;
      const validRecords: any[] = []; // Dùng tạm any để push dễ dàng

      if (st.recordForms && st.recordForms.length > 0) {
        st.recordForms.forEach((record) => {
          const recordDate = dayjs(record.createdAt);

          // Kiểm tra ngày
          if (recordDate.isBetween(startOfWeek, endOfWeek, "day", "[]")) {
            // --- SỬA Ở ĐÂY: Lấy trực tiếp từ record.rule (vì đã populate) ---
            const ruleData = record.rule as unknown as IRule; // Cast kiểu để lấy dữ liệu

            if (ruleData) {
              const points = ruleData.point || 0;
              totalPoint += points;

              validRecords.push({
                ...record,
                // Map dữ liệu ra ngoài để hiển thị trong Table dễ hơn
                ruleContent: ruleData.content || "Lỗi không xác định",
                ruleCode: ruleData.idRule || "---",
                rulePoint: points,
              });
            }
          }
        });
      }

      return {
        ...st,
        totalPoint,
        validRecords,
      };
    });

    const sortedStudents = computedStudents.sort(
      (a, b) => b.totalPoint - a.totalPoint,
    );

    setStudentRankingData(
      sortedStudents.map((st, idx) => ({ ...st, rank: idx + 1 })),
    );
  };

  // --- EXPORT EXCEL ---
  const handleExportExcel = () => {
    if (chartData.length === 0) {
      message.warning("Chưa có dữ liệu!");
      return;
    }
    const startOfWeek = selectedWeek
      .startOf("week")
      .add(1, "day")
      .format("DD/MM/YYYY");
    const endOfWeek = selectedWeek
      .endOf("week")
      .add(1, "day")
      .format("DD/MM/YYYY");
    const workbook = XLSX.utils.book_new();

    // 1. Sheet Lớp
    const classDataExport = chartData.map((cls) => ({
      Hạng: cls.rank,
      Lớp: cls.name,
      GVCN: cls.teacher
        ? `${cls.teacher.lastName} ${cls.teacher.firstName}`
        : "",
      Điểm: cls.calculatedPoint,
    }));
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(classDataExport),
      "Xep_Hang_Lop",
    );

    // 2. Sheet Học Sinh
    const studentDataExport = studentRankingData.map((st) => ({
      Hạng: st.rank,
      "Mã HS": st.idStudent,
      "Họ Tên": `${st.lastName} ${st.firstName}`,
      Lớp: st.class?.name,
      "Điểm Tổng": st.totalPoint,
    }));
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(studentDataExport),
      "Xep_Hang_Hoc_Sinh",
    );

    XLSX.writeFile(workbook, `Thi_Dua_${startOfWeek}_${endOfWeek}.xlsx`);
  };

  // --- CONFIG CHART ---
  const chartConfig = {
    data: chartData,
    xField: "name",
    yField: "calculatedPoint",
    color: (datum: any) => {
      if (datum.rank === 1) return "#FFD700";
      if (datum.rank === 2) return "#C0C0C0";
      if (datum.rank === 3) return "#CD7F32";
      return "var(--primary-color)";
    },
    label: {
      position: "top" as const,
      style: { fill: "#595959", fontWeight: "bold" },
    },
    xAxis: { label: { autoHide: true } },
    tooltip: {
      formatter: (datum: any) => ({
        name: "Điểm",
        value: datum.calculatedPoint,
      }),
    },
  };

  // --- COLUMNS TABLE ---

  // 1. Columns Lớp
  const classColumns = [
    {
      title: "Hạng",
      dataIndex: "rank",
      width: 70,
      align: "center" as const,
      render: (rank: number) =>
        rank <= 3 ? (
          <span
            className="text-xl font-bold"
            style={{
              color:
                rank === 1 ? "#FFD700" : rank === 2 ? "#C0C0C0" : "#CD7F32",
            }}
          >
            <RiTrophyLine />
          </span>
        ) : (
          <Tag>{rank}</Tag>
        ),
    },
    {
      title: "Lớp",
      dataIndex: "name",
      key: "name",
      render: (t: string) => <b className="text-lg">{t}</b>,
    },
    {
      title: "GVCN",
      key: "teacher",
      render: (_: any, r: ComputedClassData) =>
        r.teacher ? (
          <div className="flex flex-col">
            <Tag color="blue" className="mb-1 w-fit">
              {r.teacher.idTeacher}
            </Tag>
            <span className="text-xs">
              {r.teacher.lastName} {r.teacher.firstName}
            </span>
          </div>
        ) : (
          "---"
        ),
    },
    {
      title: "Điểm",
      dataIndex: "calculatedPoint",
      sorter: (a: any, b: any) => a.calculatedPoint - b.calculatedPoint,
      render: (p: number) => (
        <span
          className={
            p >= 300 ? "font-bold text-green-600" : "font-bold text-red-500"
          }
        >
          {p}
        </span>
      ),
    },
  ];

  // 2. Columns Học sinh
  const studentColumns = [
    {
      title: "Hạng",
      dataIndex: "rank",
      width: 70,
      align: "center" as const,
      render: (rank: number) =>
        rank <= 3 ? (
          <span
            className="text-xl font-bold"
            style={{
              color:
                rank === 1 ? "#FFD700" : rank === 2 ? "#C0C0C0" : "#CD7F32",
            }}
          >
            <RiTrophyLine />
          </span>
        ) : (
          <Tag>{rank}</Tag>
        ),
    },
    { title: "Mã HS", dataIndex: "idStudent", key: "idStudent" },
    {
      title: "Họ và Tên",
      key: "fullname",
      render: (_: any, r: ComputedStudentData) => (
        <div className="flex items-center gap-2">
          <Avatar icon={<FiUser />} size="small" />
          <span className="font-medium">
            {r.lastName} {r.firstName}
          </span>
        </div>
      ),
    },
    { title: "Lớp", dataIndex: ["class", "name"], key: "className" },
    {
      title: "GVCN",
      key: "gvcn",
      render: (_: any, r: ComputedStudentData) =>
        r.class?.teacher ? (
          <div className="flex flex-col">
            <Tag color="blue" className="mb-1 w-fit">
              {r.class?.teacher.idTeacher}
            </Tag>
            <span className="text-xs">
              {r.class?.teacher.lastName} {r.class?.teacher.firstName}
            </span>
          </div>
        ) : (
          "---"
        ),
    },
    {
      title: "Điểm số",
      dataIndex: "totalPoint",
      key: "totalPoint",
      sorter: (a: ComputedStudentData, b: ComputedStudentData) =>
        a.totalPoint - b.totalPoint,
      defaultSortOrder: "descend" as const,
      render: (p: number) => (
        <Tag
          color={p > 0 ? "success" : p < 0 ? "error" : "default"}
          className="px-3 py-1 text-base"
        >
          {p > 0 ? `+${p}` : p}
        </Tag>
      ),
    },
  ];

  // 3. Expanded Row (Chi tiết vi phạm học sinh)
  // 3. Expanded Row (Chi tiết vi phạm học sinh)
  const expandedRowRender = (record: ComputedStudentData) => {
    const detailColumns = [
      {
        title: "Ngày lập",
        dataIndex: "createdAt",
        width: 140,
        render: (t: string) => dayjs(t).format("DD/MM/YYYY HH:mm"),
      },
      {
        title: "Nội dung / Lỗi",
        key: "content",
        // r ở đây là item trong validRecords
        render: (_: any, r: any) => (
          <div className="flex flex-col">
            {/* 1. Hiển thị Mã lỗi (idRule) */}
            <span className="font-bold text-gray-800">
              {r.ruleCode} {/* Lấy từ field ta đã map ở bước 2 */}
            </span>

            {/* 2. Hiển thị Nội dung lỗi (content trong rule) */}
            <span className="text-sm italic text-gray-500">
              {r.ruleContent} {/* Lấy từ field ta đã map ở bước 2 */}
            </span>
          </div>
        ),
      },
      {
        title: "Người lập",
        dataIndex: "user",
        key: "user",
        width: 180,
        render: (u: IRecordCreator) => {
          return (
            <div className="flex flex-col items-start">
              <Tag color="geekblue" className="mb-1">
                {u?.idUser || "N/A"}
              </Tag>
              <span className="text-xs text-gray-600">
                {u ? `${u.lastName} ${u.firstName}` : ""}
              </span>
            </div>
          );
        },
      },
      {
        title: "Điểm",
        dataIndex: "rulePoint", // Field này đã map ở bước 2
        width: 80,
        align: "center" as const,
        render: (p: number) => (
          <span
            className={
              p < 0 ? "font-bold text-red-500" : "font-bold text-green-500"
            }
          >
            {p > 0 ? `+${p}` : p}
          </span>
        ),
      },
    ];

    return (
      <Card
        size="small"
        title="Chi tiết các phiếu ghi nhận trong tuần"
        className="border-l-4 border-l-blue-400 bg-gray-50"
      >
        {record.validRecords.length > 0 ? (
          <Table
            columns={detailColumns}
            dataSource={record.validRecords}
            pagination={false}
            rowKey="_id"
            size="small"
          />
        ) : (
          <div className="py-4 text-center italic text-gray-400">
            Không có ghi nhận nào trong tuần này
          </div>
        )}
      </Card>
    );
  };

  return (
    <div>
      {/* --- HEADER --- */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="mb-1 text-2xl font-bold text-[var(--text-color)]">
            Bảng vàng thi đua
          </h3>
          <p className="text-sm text-gray-500">
            Thống kê xếp hạng Lớp học & Học sinh tiêu biểu
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="mb-1 text-xs text-gray-500">Tuần thống kê:</span>
            <DatePicker
              picker="week"
              value={selectedWeek}
              onChange={(d) => d && setSelectedWeek(d)}
              format={"[Tuần] w-YYYY"}
              allowClear={false}
            />
          </div>
          <Button
            type="primary"
            icon={<FiDownload />}
            onClick={handleExportExcel}
            className="mt-5 bg-green-600"
          >
            Xuất Excel
          </Button>
        </div>
      </div>

      {/* --- SEARCH --- */}
      <div className="mb-6 flex gap-4 rounded-xl border bg-gray-50 p-4">
        <div className="flex gap-4 rounded-xl border bg-gray-50 p-4">
          <Input
            prefix={<FiSearch className="text-gray-400" />}
            placeholder="Tìm kiếm lớp học..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="max-w-md"
          />
          <Button
            onClick={() => {
              const found = chartData.find(
                (c) =>
                  c.name.toLowerCase().includes(searchId.toLowerCase()) ||
                  c.idClass.toLowerCase() === searchId.toLowerCase(),
              );
              if (found) {
                setSearchResult(found);
                messageApi.success(`Tìm thấy lớp ${found.name}`);
              } else {
                setSearchResult(null);
                messageApi.warning("Không tìm thấy!");
              }
            }}
          >
            Tra cứu
          </Button>
        </div>
        {_searchResult && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mt-1 text-2xl font-bold text-green-600">
              {_searchResult.calculatedPoint} điểm
            </div>
          </div>
        )}
      </div>

      {/* --- CHART SECTION --- */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          title="Biểu đồ thi đua các lớp"
          className="rounded-xl shadow-md lg:col-span-2"
        >
          <div className="h-[300px]">
            {loading ? (
              <Spin className="mt-20 w-full" />
            ) : (
              <Column {...chartConfig} />
            )}
          </div>
        </Card>

        <Card title="Xếp hạng lớp" className="rounded-xl shadow-md">
          <Table
            dataSource={chartData}
            columns={classColumns.filter((c) => c.key !== "teacher")}
            pagination={{ pageSize: 5 }}
            rowKey="_id"
            size="small"
          />
        </Card>
      </div>

      {/* --- STUDENT RANKING TABLE --- */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <RiFileList3Line className="text-blue-600" /> Bảng xếp hạng học sinh
          </div>
        }
        className="rounded-xl border-t-4 border-t-blue-500 shadow-md"
      >
        <div className="overflow-x-auto">
          <Table
            loading={loading}
            dataSource={studentRankingData}
            columns={studentColumns}
            rowKey="_id"
            pagination={{ pageSize: 20, responsive: true }}
            expandable={{
              expandedRowRender: expandedRowRender,
              rowExpandable: () => true,
              expandIconColumnIndex: 6,
            }}
            scroll={{ x: "max-content" }}
          />
        </div>
      </Card>
      <StudentEvaluationTables selectedWeek={selectedWeek} />
    </div>
  );
};

export default ClassCompetitionChart;
