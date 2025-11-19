import { PiStudent } from "react-icons/pi";
import Header from "../components/Header";
import TableStudent from "../components/Table/TableStudent";

const ManageStudentPage = () => {
  return (
    <div>
      <Header
        title="Quản lý học sinh"
        subtitle="Chào mừng bạn đến với trang quản lý học sinh"
        logo={PiStudent}
      ></Header>
      <div className="p-5">
        <TableStudent></TableStudent>
      </div>
    </div>
  );
};
export default ManageStudentPage;
