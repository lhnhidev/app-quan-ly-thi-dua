import { FaChalkboardTeacher } from "react-icons/fa";
import Header from "../components/Header";
import TableClass from "../components/Table/TableClass";

const ManageClassPage = () => {
  return (
    <div>
      <Header
        title="Quản lý lớp học"
        subtitle="Chào mừng bạn đến với trang quản lý lớp học"
        logo={FaChalkboardTeacher}
      ></Header>
      <div className="p-5">
        <TableClass></TableClass>
      </div>
    </div>
  );
};
export default ManageClassPage;
