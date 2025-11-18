import { Link } from "react-router-dom";
import { Button, Result } from "antd";

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Result
        status="404"
        title="404"
        subTitle="Xin lỗi, trang bạn đang tìm kiếm không tồn tại."
        extra={
          <Link to="/">
            <Button type="primary">Quay về trang chủ</Button>
          </Link>
        }
      />
    </div>
  );
};

export default NotFoundPage;
