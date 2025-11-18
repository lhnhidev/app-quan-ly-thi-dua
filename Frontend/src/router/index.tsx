import { Suspense, lazy, type JSX } from "react";
import { useRoutes, type RouteObject } from "react-router-dom";
import { Spin } from "antd";

const LoginPage = lazy(() => import("../pages/LoginPage"));

const Loading = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <Spin size="large" tip="Loading..." />
  </div>
);

const Loadable = ({
  Component,
}: {
  Component: React.ComponentType;
}): JSX.Element => (
  <Suspense fallback={<Loading />}>
    <Component />
  </Suspense>
);

const routeConfig: RouteObject[] = [
  {
    path: "/",
    element: <Loadable Component={LoginPage} />,
  },
];

const AppRoutes = () => {
  return useRoutes(routeConfig);
};

export default AppRoutes;
