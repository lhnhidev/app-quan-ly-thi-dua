import { FaHome } from "react-icons/fa";
import Header from "../components/Header";
import TableClass from "../components/Table/TableClass";
import TableUser from "../components/Table/TableUser";
import ClassCompetitionChart from "../components/ClassCompetitionChart";

const DashboardPage = () => {
  return (
    <div>
      <Header
        title="Trang chủ"
        subtitle="Chào mừng bạn đến với trang quản trị"
        logo={FaHome}
      ></Header>

      <div className="space-y-10 p-5">
        <TableClass></TableClass>
        <TableUser></TableUser>
        <ClassCompetitionChart></ClassCompetitionChart>
      </div>
    </div>
  );
};
export default DashboardPage;
