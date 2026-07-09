import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { Route as LoginRoute } from "./routes/login";
import { Route as SignupRoute } from "./routes/signup";
import { Route as IndexRoute } from "./routes/Index";

const rootRoute = createRootRoute({ component: () => <Outlet /> });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: IndexRoute.options.component,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginRoute.options.component,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: SignupRoute.options.component,
});

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, signupRoute]);

export const router = createRouter({ routeTree });
