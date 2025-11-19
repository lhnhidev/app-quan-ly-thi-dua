import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const DashboardPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) {
      navigate("/notfound-404");
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div>DashboardPage</div>;
};
export default DashboardPage;
