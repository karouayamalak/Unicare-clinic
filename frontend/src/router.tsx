import { createRootRoute, createRoute, createRouter, Outlet, redirect } from "@tanstack/react-router";
import { Route as LoginRoute } from "./routes/login";
import { Route as SignupRoute } from "./routes/signup";
import { Route as VerifyEmailRoute } from "./routes/verify-email";
import { Route as IndexRoute } from "./routes/Index";
import { Route as PatientRoute } from "./routes/Patient";
import { Route as DoctorRoute } from "./routes/Doctor";
import { Route as AdminRoute } from "./routes/Admin";
import { authStore } from "./lib/authStore";

const rootRoute = createRootRoute({ component: () => <Outlet /> });

// ─── Public routes ────────────────────────────────────────────────────────────

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

const verifyEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/verify-email",
  component: VerifyEmailRoute.options.component,
});

// ─── Protected dashboard routes ───────────────────────────────────────────────

const requireAuth = () => {
  const user = authStore.user;
  if (!user) throw redirect({ to: "/login" });
  return user;
};

const patientRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/patient",
  beforeLoad: requireAuth,
  component: PatientRoute.options.component,
});

const doctorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/doctor",
  beforeLoad: requireAuth,
  component: DoctorRoute.options.component,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  beforeLoad: requireAuth,
  component: AdminRoute.options.component,
});

// ─── Route tree ───────────────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  verifyEmailRoute,
  patientRoute,
  doctorRoute,
  adminRoute,
]);

export const router = createRouter({ routeTree });
