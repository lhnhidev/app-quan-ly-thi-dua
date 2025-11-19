import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute: React.FC = () => {
  const userInfoString = localStorage.getItem("userInfo");
  const userInfo = userInfoString ? JSON.parse(userInfoString) : null;

  const isAuthenticated = userInfo && userInfo.token;

  return isAuthenticated ? <Outlet /> : <Navigate to="/notfound" replace />;
};

export default ProtectedRoute;
