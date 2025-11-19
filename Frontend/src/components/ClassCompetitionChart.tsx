import React, { useState, useEffect } from "react";
import { Column } from "@ant-design/charts";
import { Spin } from "antd";
import useFetch from "../hooks/useFetch"; // Import hook useFetch của bạn

// Định nghĩa kiểu dữ liệu
interface ClassData {
  _id: string;
  idClass: string;
  name: string;
  point: number;
}

const ClassCompetitionChart: React.FC = () => {
  const { request, loading } = useFetch<ClassData[]>();
  const [chartData, setChartData] = useState<ClassData[]>([]);

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
        const sortedData = data.sort((a, b) => b.point - a.point);
        setChartData(sortedData);
      }
    };

    fetchData();
  }, [request]);

  const config = {
    data: chartData,
    xField: "name",
    yField: "point",
    // columnWidthRatio: 0.2,
    // maxColumnWidth: 40,
    color: "var(--primary-color)",
    label: {
      position: "top",
      offset: 10,
      style: {
        fill: "white",
        fontSize: 13,
        fontWeight: "bold",
      },
    },
    columnStyle: {
      radius: [6, 6, 0, 0],
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
    animation: {
      appear: {
        animation: "scale-in-y",
        duration: 1000,
      },
    },
    meta: {
      name: { alias: "Lớp" },
      point: { alias: "Điểm thi đua" },
    },
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="mb-1 text-2xl font-bold text-[var(--text-color)]">
            Bảng xếp hạng thi đua
          </h3>
          <p className="text-sm text-gray-500">
            So sánh tổng điểm thi đua giữa các lớp học
          </p>
        </div>
        <div className="rounded-lg bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600">
          Năm học 2024-2025
        </div>
      </div>

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
