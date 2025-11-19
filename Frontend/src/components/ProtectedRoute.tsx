import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Spin } from "antd";

const ProtectedRoute: React.FC = () => {
  const [checking, setChecking] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      const raw = localStorage.getItem("userInfo");
      if (!raw) {
        if (mounted) {
          setOk(false);
          setChecking(false);
        }
        return;
      }

      let token: string | null = null;
      try {
        token = JSON.parse(raw).token;
      } catch {
        token = null;
      }

      if (!token) {
        if (mounted) {
          setOk(false);
          setChecking(false);
        }
        return;
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_SERVER_URL}/check-token`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!mounted) return;

        if (res.status === 200) {
          setOk(true);
        } else {
          setOk(false);
          if (res.status === 401) localStorage.removeItem("userInfo");
        }
      } catch (err) {
        console.log(err);
        if (!mounted) return;
        setOk(false);
      } finally {
        if (mounted) setChecking(false);
      }
    };

    check();

    return () => {
      mounted = false;
    };
  }, []);

  if (checking)
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spin size="large" />
      </div>
    );

  return ok ? <Outlet /> : <Navigate to="/not-found" replace />;
};

export default ProtectedRoute;
