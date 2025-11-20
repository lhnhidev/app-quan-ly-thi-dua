import { LuFileSpreadsheet } from "react-icons/lu";
import Header from "../components/Header";
import TableRecordForm from "../components/Table/TabelRecordForm";

const MangeRecordFormPage = () => {
  return (
    <div>
      <Header
        title="Quản lý phiếu thi đua"
        subtitle="Chào mừng bạn đến với trang quản lý phiếu thi đua"
        logo={LuFileSpreadsheet}
      ></Header>
      <div className="p-5">
        <TableRecordForm></TableRecordForm>
      </div>
    </div>
  );
};
export default MangeRecordFormPage;
