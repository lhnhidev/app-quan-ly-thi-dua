import React, { useState, useEffect } from "react";
import { Input, Button, Tag, Tabs, Empty } from "antd";
import {
  FiSearch,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import Header from "../components/Header";
import useFetch from "../hooks/useFetch";
import { Loading } from "../router";
import { MdOutlinePolicy } from "react-icons/md";
import { useAppContext } from "../context";

interface Rule {
  _id: string;
  idRule: string;
  content: string;
  point: number;
  type: boolean;
}

const ManageRulePage: React.FC = () => {
  const { loading, error, request } = useFetch<Rule[]>();
  const [rules, setRules] = useState<Rule[]>([]);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL");

  const {
    setOpenAddRoleForm,
    reRenderRuleTable,
    modal,
    setReRenderRuleTable,
    messageApi,
    setOpenModifyRoleForm,
    setCurrentRole,
  } = useAppContext();

  useEffect(() => {
    const fetchRules = async () => {
      const userInfoString = localStorage.getItem("userInfo");
      const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
      const token = userInfo?.token;

      const result = await request(`${import.meta.env.VITE_SERVER_URL}/role`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (result) {
        setRules(result);
      }
    };

    fetchRules();
  }, [request, reRenderRuleTable]);

  const filteredRules = rules.filter((rule) => {
    const matchTab =
      activeTab === "ALL" ||
      (activeTab === "BONUS" && rule.type === true) ||
      (activeTab === "PENALTY" && rule.type === false);

    const matchSearch = (rule.idRule || "")
      .toLowerCase()
      .includes(searchText.toLowerCase());

    return matchTab && matchSearch;
  });

  const renderRuleCard = (rule: Rule) => {
    const isBonus = rule.type === true;

    const color = isBonus ? "text-green-600" : "text-red-600";
    const bgColor = isBonus ? "bg-green-50" : "bg-red-50";
    const borderColor = isBonus ? "border-green-200" : "border-red-200";
    const Icon = isBonus ? FiCheckCircle : FiAlertCircle;

    return (
      <div
        key={rule._id}
        className={`group relative flex flex-col justify-between rounded-xl border ${borderColor} bg-white p-5`}
      >
        <div className="mb-3 flex items-start justify-between">
          <Tag
            color={isBonus ? "success" : "error"}
            className="rounded px-2 py-0.5 font-mono text-sm font-bold"
          >
            {rule.idRule}
          </Tag>

          <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              type="text"
              size="small"
              icon={<FiEdit />}
              className="text-blue-600 hover:bg-blue-50"
              onClick={() => {
                setCurrentRole(rule);
                setOpenModifyRoleForm(true);
              }}
            />
            <Button
              type="text"
              size="small"
              danger
              icon={<FiTrash2 />}
              onClick={() => {
                modal.confirm({
                  title: "Xóa thang điểm",
                  content: `Bạn có chắc muốn xóa thang điểm ${rule.idRule}?`,
                  okText: "Xóa",
                  okType: "danger",
                  cancelText: "Hủy",
                  onOk() {
                    const deleteRule = async () => {
                      const userInfoString = localStorage.getItem("userInfo");
                      const userInfo = userInfoString
                        ? JSON.parse(userInfoString)
                        : null;
                      const token = userInfo?.token;

                      const result = await request(
                        `${import.meta.env.VITE_SERVER_URL}/role/${rule._id}`,
                        {
                          method: "DELETE",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                        },
                      );

                      if (result) {
                        setReRenderRuleTable(!reRenderRuleTable);
                        messageApi.success("Xóa thang điểm thành công");
                      }
                    };

                    deleteRule();
                  },
                });
              }}
            />
          </div>
        </div>

        <div className="mb-4 flex-1">
          <h4 className="text-base font-medium leading-snug text-gray-700">
            {rule.content}
          </h4>
        </div>

        <div
          className={`mt-auto flex items-center gap-3 rounded-lg p-3 ${bgColor}`}
        >
          <div className={`text-2xl ${color}`}>
            <Icon />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase text-gray-500">
              {isBonus ? "Điểm thưởng" : "Điểm phạt"}
            </span>
            <span className={`text-xl font-bold ${color}`}>
              {isBonus ? "+" : "-"}
              {Math.abs(rule.point)}đ
            </span>
          </div>
        </div>
      </div>
    );
  };

  const tabItems = [
    { key: "ALL", label: "Tất cả" },
    { key: "BONUS", label: "Điểm cộng (+)" },
    { key: "PENALTY", label: "Điểm trừ (-)" },
  ];

  if (loading)
    return (
      <div>
        <Header
          title="Quản lý Thang điểm"
          subtitle="Thiết lập các quy định tính điểm thi đua cho năm học"
          logo={MdOutlinePolicy}
        ></Header>
        <Loading />
      </div>
    );

  if (error)
    return <div className="mt-10 text-center text-red-500">{error}</div>;

  return (
    <div>
      <Header
        title="Quản lý Thang điểm"
        subtitle="Thiết lập các quy định tính điểm thi đua cho năm học"
        logo={MdOutlinePolicy}
      ></Header>
      <div className="min-h-screen p-6">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="m-0 text-2xl font-bold text-gray-800">
              Danh sách quy định
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Hệ thống quy tắc cộng/trừ điểm thi đua
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
            <Input
              placeholder="Tìm kiếm theo Mã (VD: RL-001)..."
              prefix={<FiSearch className="text-gray-400" />}
              size="large"
              allowClear
              className="w-full rounded-lg md:w-72"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button
              type="primary"
              icon={<FiPlus />}
              size="large"
              className="flex items-center justify-center bg-[var(--primary-color)]"
              style={{ backgroundColor: "var(--primary-color)" }}
              onClick={() => setOpenAddRoleForm(true)}
            >
              Thêm quy định mới
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            type="card"
            className="custom-tabs"
          />
        </div>

        {filteredRules.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredRules.map(renderRuleCard)}
          </div>
        ) : (
          <div className="mt-20 flex justify-center">
            <Empty description="Không tìm thấy quy định nào phù hợp" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageRulePage;
