import React, { useState, useEffect } from "react";
import { Column } from "@ant-design/charts";
import { Spin, Button, Input, message, Card, Statistic } from "antd";
import { FiDownload, FiSearch } from "react-icons/fi";
import * as XLSX from "xlsx"; // Import thư viện xlsx
import useFetch from "../hooks/useFetch";

// --- 1. Định nghĩa Interface khớp với dữ liệu API ---
interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  idStudent: string;
}

interface Teacher {
  _id: string;
  idTeacher: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ClassData {
  _id: string;
  idClass: string;
  name: string;
  point: number;
  students: Student[];
  teacher: Teacher;
}

const ClassCompetitionChart: React.FC = () => {
  const { request, loading } = useFetch<ClassData[]>();
  const [chartData, setChartData] = useState<ClassData[]>([]);

  // State cho chức năng tìm kiếm
  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState<ClassData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const userInfoString = localStorage.getItem("userInfo");
      const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
      const token = userInfo?.token;

      if (!token) return;

      const data = await request(`${import.meta.env.VITE_SERVER_URL}/class`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (data) {
        // Sắp xếp dữ liệu để hiển thị biểu đồ đẹp hơn
        const sortedData = data.sort((a, b) => b.point - a.point);
        setChartData(sortedData);
      }
    };

    fetchData();
  }, [request]);

  // --- 2. Chức năng Xuất Excel ---
  const handleExportExcel = () => {
    if (chartData.length === 0) {
      message.warning("Chưa có dữ liệu để xuất!");
      return;
    }

    const workbook = XLSX.utils.book_new();

    // === TAB 1: SO SÁNH (Bảng điểm các lớp) ===
    const compareData = chartData.map((cls) => ({
      "Tên Lớp": cls.name,
      "Mã Lớp": cls.idClass,
      "Điểm Thi Đua": cls.point,
    }));
    const compareSheet = XLSX.utils.json_to_sheet(compareData);

    // Chỉnh độ rộng cột cho đẹp
    compareSheet["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(workbook, compareSheet, "So sánh");

    // === TAB 2...N: TỪNG LỚP ===
    chartData.forEach((cls) => {
      // A. Chuẩn bị dữ liệu Giáo viên (Dòng 1)
      const teacherName = cls.teacher
        ? `${cls.teacher.lastName} ${cls.teacher.firstName}`
        : "Chưa phân công";
      const teacherId = cls.teacher?.idTeacher || "N/A";
      const teacherEmail = cls.teacher?.email || "N/A";

      // B. Chuẩn bị dữ liệu Học sinh (Bảng bên dưới)
      const studentsData = cls.students.map((st, index) => [
        index + 1,
        st.idStudent,
        `${st.lastName} ${st.firstName}`,
      ]);

      // C. Tạo mảng dữ liệu dạng Array of Arrays (AoA) để dễ custom layout
      const sheetData = [
        // Dòng 1: Thông tin GVCN
        [
          `GVCN: ${teacherName}`,
          `Mã GV: ${teacherId}`,
          `Email: ${teacherEmail}`,
        ],
        [], // Dòng trống tạo khoảng cách
        // Dòng 3: Header bảng học sinh
        ["STT", "Mã Học Sinh", "Họ và Tên"],
        // Các dòng tiếp theo: Dữ liệu học sinh
        ...studentsData,
      ];

      // D. Tạo Sheet từ mảng AoA
      const classSheet = XLSX.utils.aoa_to_sheet(sheetData);

      // Chỉnh độ rộng cột: Cột 1 nhỏ (STT), Cột 2 vừa (Mã), Cột 3 rộng (Tên)
      classSheet["!cols"] = [{ wch: 10 }, { wch: 20 }, { wch: 30 }];

      // E. Thêm Sheet vào Workbook (Tên tab là tên lớp hoặc id lớp)
      // Lưu ý: Tên sheet Excel tối đa 31 ký tự và không chứa ký tự đặc biệt
      const sheetName = cls.idClass || cls.name;
      XLSX.utils.book_append_sheet(workbook, classSheet, sheetName);
    });

    // Xuất file
    XLSX.writeFile(workbook, "Bang_Diem_Thi_Dua.xlsx");
    message.success("Xuất file Excel thành công!");
  };

  // --- 3. Chức năng Tra cứu ---
  const handleSearch = () => {
    if (!searchId.trim()) {
      message.warning("Vui lòng nhập Mã lớp!");
      return;
    }

    // Tìm lớp trong dữ liệu đã fetch về (client-side search để tối ưu)
    const foundClass = chartData.find(
      (cls) => cls.idClass.toLowerCase() === searchId.trim().toLowerCase(),
    );

    if (foundClass) {
      setSearchResult(foundClass);
      message.success("Đã tìm thấy lớp!");
    } else {
      setSearchResult(null);
      message.error("Không tìm thấy lớp với mã này!");
    }
  };

  // --- Cấu hình Biểu đồ ---
  const config = {
    data: chartData,
    xField: "name",
    yField: "point",
    color: "var(--primary-color)",
    label: {
      position: "top" as const,
      offset: 10,
      style: {
        fill: "#595959",
        fontSize: 12,
        fontWeight: "bold",
      },
    },
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
    tooltip: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (datum: any) => {
        return { name: "Điểm thi đua", value: datum.point };
      },
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
      },
    },
    meta: {
      name: { alias: "Lớp" },
      point: { alias: "Điểm thi đua" },
    },
  };

  return (
    <div>
      {/* Header Component */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="mb-1 text-2xl font-bold text-[var(--text-color)]">
            Bảng xếp hạng thi đua
          </h3>
          <p className="text-sm text-gray-500">
            So sánh tổng điểm thi đua giữa các lớp học
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600">
            Năm học 2024-2025
          </div>

          {/* Nút Xuất Excel */}
          <Button
            type="primary"
            icon={<FiDownload />}
            onClick={handleExportExcel}
            className="border-green-600 bg-green-600 shadow-sm hover:border-green-500 hover:bg-green-500"
          >
            Xuất Excel
          </Button>
        </div>
      </div>

      {/* Khu vực Tra cứu điểm */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tra cứu điểm lớp học
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Nhập mã lớp (VD: 6A, 6B...)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onPressEnter={handleSearch}
                prefix={<FiSearch className="text-gray-400" />}
              />
              <Button onClick={handleSearch}>Tìm kiếm</Button>
            </div>
          </div>

          {/* Kết quả tra cứu */}
          {searchResult && (
            <Card
              size="small"
              className="flex-1 border-l-4 border-l-blue-500 shadow-sm"
              bodyStyle={{ padding: "12px 16px" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="m-0 text-lg font-bold text-gray-800">
                    {searchResult.name}
                  </h4>
                  <span className="text-xs text-gray-500">
                    GVCN: {searchResult.teacher?.lastName}{" "}
                    {searchResult.teacher?.firstName}
                  </span>
                </div>
                <Statistic
                  value={searchResult.point}
                  valueStyle={{
                    color: "var(--primary-color)",
                    fontWeight: "bold",
                  }}
                  suffix="đ"
                />
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Biểu đồ */}
      <div className="h-[350px] w-full">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spin tip="Đang tải dữ liệu..." />
          </div>
        ) : chartData.length > 0 ? (
          <Column {...config} />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            Chưa có dữ liệu thi đua
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassCompetitionChart;
