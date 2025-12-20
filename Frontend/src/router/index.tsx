/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense, lazy } from "react";
import { useRoutes, type RouteObject } from "react-router-dom";
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

const routeConfig: RouteObject[] = [
  {
    path: "/",
    element: <Loadable Component={lazy(() => import("../pages/LoginPage"))} />,
  },
  {
    element: <ProtectedRoute />,
    children: [
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
