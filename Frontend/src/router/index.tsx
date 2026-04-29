/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense, lazy } from "react";
import { Navigate, useRoutes, type RouteObject } from "react-router-dom";
import { Spin } from "antd";
import ProtectedRoute from "../components/ProtectedRoute";

export const Loading = ({ style }: { style?: React.CSSProperties }) => (
  <div
    className="flex h-screen w-full items-center justify-center"
    style={style}
  >
    <Spin size="large" tip="Đang tải..." />
  </div>
);

const Loadable = (props: {
  Component: React.ComponentType<any>;
  [key: string]: any;
}) => {
  const { Component, ...rest } = props;
  return (
    <Suspense fallback={<Loading />}>
      <Component {...rest} />
    </Suspense>
  );
};

const SocialEntryRedirect = () => {
  const raw = localStorage.getItem("activeOrganization");

  if (!raw) {
    return <Navigate to="/home" replace />;
  }

  try {
    const parsed = JSON.parse(raw);
    const role = parsed?.role;
    return <Navigate to={role === "admin" ? "/social-admin" : "/social-user"} replace />;
  } catch {
    return <Navigate to="/home" replace />;
  }
};

const AdminSocialGuard = () => {
  const raw = localStorage.getItem("activeOrganization");

  if (!raw) {
    return <Navigate to="/home" replace />;
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed?.role !== "admin") {
      return <Navigate to="/social-user" replace />;
    }
    return (
      <Loadable
        Component={lazy(() => import("../layouts/DefaultLayout"))}
        children={<Loadable Component={lazy(() => import("../pages/SocialPage"))} />}
      />
    );
  } catch {
    return <Navigate to="/home" replace />;
  }
};

const routeConfig: RouteObject[] = [
  {
    path: "/",
    element: <Loadable Component={lazy(() => import("../pages/LoginPage"))} />,
  },
  {
    path: "/register",
    element: <Loadable Component={lazy(() => import("../pages/RegisterPage"))} />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/home",
        element: <Loadable Component={lazy(() => import("../pages/OrganizationHomePage"))} />,
      },
      {
        path: "/dashboard",
        element: (
          <Loadable
            Component={lazy(() => import("../layouts/DefaultLayout"))}
            children={
              <Loadable
                Component={lazy(() => import("../pages/DashboardPage"))}
              />
            }
          />
        ),
      },
      {
        path: "/student",
        element: (
          <Loadable
            Component={lazy(() => import("../layouts/DefaultLayout"))}
            children={
              <Loadable
                Component={lazy(() => import("../pages/ManageStudentPage"))}
              />
            }
          />
        ),
      },
      {
        path: "/user",
        element: (
          <Loadable
            Component={lazy(() => import("../layouts/DefaultLayout"))}
            children={
              <Loadable
                Component={lazy(() => import("../pages/ManageUserPage"))}
              />
            }
          />
        ),
      },
      {
        path: "/organization-approvals",
        element: (
          <Loadable
            Component={lazy(() => import("../layouts/DefaultLayout"))}
            children={
              <Loadable
                Component={lazy(() => import("../pages/ManageJoinApprovalPage"))}
              />
            }
          />
        ),
      },
      {
        path: "/class",
        element: (
          <Loadable
            Component={lazy(() => import("../layouts/DefaultLayout"))}
            children={
              <Loadable
                Component={lazy(() => import("../pages/ManageClassPage"))}
              />
            }
          />
        ),
      },
      {
        path: "/record-form",
        element: (
          <Loadable
            Component={lazy(() => import("../layouts/DefaultLayout"))}
            children={
              <Loadable
                Component={lazy(() => import("../pages/ManageRecordFormPage"))}
              />
            }
          />
        ),
      },
      {
        path: "/role",
        element: (
          <Loadable
            Component={lazy(() => import("../layouts/DefaultLayout"))}
            children={
              <Loadable
                Component={lazy(() => import("../pages/ManageRulePage"))}
              />
            }
          />
        ),
      },
      {
        path: "/ranking",
        element: (
          <Loadable
            Component={lazy(() => import("../layouts/DefaultLayout"))}
            children={
              <Loadable
                Component={lazy(() => import("../pages/ManageRankingPage"))}
              />
            }
          />
        ),
      },
      {
        path: "/teacher",
        element: (
          <Loadable
            Component={lazy(() => import("../layouts/DefaultLayout"))}
            children={
              <Loadable
                Component={lazy(() => import("../pages/ManageTeacherPage"))}
              />
            }
          />
        ),
      },
      {
        path: "/assign-classes",
        element: (
          <Loadable
            Component={lazy(() => import("../layouts/DefaultLayout"))}
            children={
              <Loadable
                Component={lazy(
                  () => import("../pages/ManageAssignClassesPage"),
                )}
              />
            }
          />
        ),
      },
      {
        path: "/response",
        element: (
          <Loadable
            Component={lazy(() => import("../layouts/DefaultLayout"))}
            children={
              <Loadable
                Component={lazy(() => import("../pages/ManageResponsePage"))}
              />
            }
          />
        ),
      },
      {
        path: "/settings",
        element: (
          <Loadable
            Component={lazy(() => import("../layouts/DefaultLayout"))}
            children={
              <Loadable
                Component={lazy(() => import("../pages/ManageSettingsPage"))}
              />
            }
          />
        ),
      },
      {
        path: "/profile",
        element: (
          <Loadable
            Component={lazy(() => import("../layouts/DefaultLayout"))}
            children={
              <Loadable
                Component={lazy(() => import("../pages/UserProfilePage"))}
              />
            }
          />
        ),
      },
      {
        path: "/social",
        element: <SocialEntryRedirect />,
      },
      {
        path: "/social-admin",
        element: <AdminSocialGuard />,
      },
      {
        path: "/social-user",
        element: (
          <Loadable Component={lazy(() => import("../pages/SocialUserPage"))} />
        ),
      },
      {
        path: "/home-1",
        element: (
          <Loadable Component={lazy(() => import("../pages/TrackingReportPage"))} />
        ),
      },
      {
        path: "/home-2",
        element: (
          <Loadable Component={lazy(() => import("../pages/RedFlagPage"))} />
        ),
      },
    ],
  },
  {
    path: "*",
    element: (
      <Loadable Component={lazy(() => import("../pages/NotFoundPage"))} />
    ),
  },
];

const AppRoutes = () => {
  return useRoutes(routeConfig);
};

export default AppRoutes;
