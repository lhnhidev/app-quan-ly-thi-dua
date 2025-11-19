import { FaRegUserCircle } from "react-icons/fa";
import Header from "../components/Header";
import TableUser from "../components/Table/TableUser";

const ManageUserPage = () => {
  return (
    <div>
      <Header
        title="Quản lý người dùng"
        subtitle="Chào mừng bạn đến với trang quản lý người dùng"
        logo={FaRegUserCircle}
      ></Header>
      <div className="p-5">
        <TableUser></TableUser>
      </div>
    </div>
  );
};
export default ManageUserPage;
