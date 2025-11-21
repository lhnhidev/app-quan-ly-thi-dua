import Header from "../components/Header";
import TableRanking from "../components/ClassCompetitionChart";
import { PiRanking } from "react-icons/pi";

const MangeRankingPage = () => {
  return (
    <div>
      <Header
        title="Bảng xếp hạng thi đua"
        subtitle="Chào mừng bạn đến với trang bảng xếp hạng thi đua"
        logo={PiRanking}
      ></Header>
      <div className="p-5">
        <TableRanking></TableRanking>
      </div>
    </div>
  );
};
export default MangeRankingPage;
