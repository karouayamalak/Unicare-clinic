import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { LoginPage } from "./routes/login";
import { SignupPage } from "./routes/signup";

const rootRoute = createRootRoute({ component: () => <Outlet /> });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <div>heelloo</div>,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: SignupPage,
});

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, signupRoute]);

export const router = createRouter({ routeTree });
