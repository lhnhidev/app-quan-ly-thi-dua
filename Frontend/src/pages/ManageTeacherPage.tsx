import Header from "../components/Header";
import TableTeacher from "../components/Table/TableTeacher";
import { LiaUserTieSolid } from "react-icons/lia";

const ManageUserPage = () => {
  return (
    <div>
      <Header
        title="Quản lý giáo viên"
        subtitle="Chào mừng bạn đến với trang quản lý giáo viên"
        logo={LiaUserTieSolid}
      ></Header>
      <div className="p-5">
        <TableTeacher></TableTeacher>
      </div>
    </div>
  );
};
export default ManageUserPage;
