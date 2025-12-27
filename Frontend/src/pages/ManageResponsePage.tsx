import { LuFileSpreadsheet } from "react-icons/lu";
import Header from "../components/Header";
import ResponseRecordTable from "../components/ResponseRecordTable";

const MangeResponsePage = () => {
  return (
    <div>
      <Header
        title="Quản lý phản hồi"
        subtitle="Chào mừng bạn đến với trang quản lý phản hồi phiếu thi đua"
        logo={LuFileSpreadsheet}
      ></Header>
      <div className="p-5">
        <ResponseRecordTable></ResponseRecordTable>
      </div>
    </div>
  );
};
export default MangeResponsePage;
