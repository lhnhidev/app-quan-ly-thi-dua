import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";
import SocialPage from "./SocialPage";

const SocialUserPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--surface-2)] p-3 md:p-4">
      <div className="mx-auto mb-3 flex w-full max-w-[1400px] items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--surface-1)] px-3 py-2">
        <div className="text-sm font-semibold text-[var(--text-color)] md:text-base">
          Khu vực mạng xã hội người dùng
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      </div>

      <div className="mx-auto w-full max-w-[1400px]">
        <SocialPage mode="user" />
      </div>
    </div>
  );
};

export default SocialUserPage;
