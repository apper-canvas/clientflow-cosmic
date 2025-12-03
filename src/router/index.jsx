import { createBrowserRouter } from "react-router-dom";
import React, { Suspense, lazy } from "react";

// Lazy load pages
const Layout = lazy(() => import("@/components/organisms/Layout"));
const Dashboard = lazy(() => import("@/components/pages/Dashboard"));
const Tasks = lazy(() => import("@/components/pages/Tasks"));
const OverdueTasks = lazy(() => import("@/components/pages/OverdueTasks"));
const TodayTasks = lazy(() => import("@/components/pages/TodayTasks"));
const WeekTasks = lazy(() => import("@/components/pages/WeekTasks"));
const CompletedTasks = lazy(() => import("@/components/pages/CompletedTasks"));
const Projects = lazy(() => import("@/components/pages/Projects"));
const ProjectDetail = lazy(() => import("@/components/pages/ProjectDetail"));
const Clients = lazy(() => import("@/components/pages/Clients"));
const ClientDetail = lazy(() => import("@/components/pages/ClientDetail"));
const TimeTracking = lazy(() => import("@/components/pages/TimeTracking"));
const Expenses = lazy(() => import("@/components/pages/Expenses"));
const ComingSoon = lazy(() => import("@/components/pages/ComingSoon"));
const Schools = lazy(() => import("@/components/pages/Schools"));
const NotFound = lazy(() => import("@/components/pages/NotFound"));
// Suspense fallback component
const suspenseFallback = (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="text-center space-y-4">
      <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  </div>
);

const mainRoutes = [
  {
    path: "",
    index: true,
    element: (
      <Suspense fallback={suspenseFallback}>
        <Dashboard />
      </Suspense>
    )
  },
  {
    path: "tasks",
    element: (
      <Suspense fallback={suspenseFallback}>
        <Tasks />
      </Suspense>
    ),
  },
  {
    path: "tasks/overdue",
    element: (
      <Suspense fallback={suspenseFallback}>
        <OverdueTasks />
      </Suspense>
    )
  },
  {
    path: "tasks/today",
    element: (
      <Suspense fallback={suspenseFallback}>
        <TodayTasks />
      </Suspense>
    )
  },
  {
    path: "tasks/week",
    element: (
      <Suspense fallback={suspenseFallback}>
        <WeekTasks />
      </Suspense>
    )
  },
  {
    path: "tasks/completed",
    element: (
      <Suspense fallback={suspenseFallback}>
        <CompletedTasks />
      </Suspense>
    )
  },
  {
    path: "projects",
    element: (
      <Suspense fallback={suspenseFallback}>
        <Projects />
      </Suspense>
    ),
  },
  {
    path: "projects/:id",
    element: (
      <Suspense fallback={suspenseFallback}>
        <ProjectDetail />
      </Suspense>
    ),
  },
  {
    path: "clients",
    element: (
      <Suspense fallback={suspenseFallback}>
        <Clients />
      </Suspense>
    ),
  },
  {
    path: "clients/:id",
    element: (
      <Suspense fallback={suspenseFallback}>
        <ClientDetail />
      </Suspense>
    ),
  },
  {
    path: "time-tracking",
    element: (
      <Suspense fallback={suspenseFallback}>
        <TimeTracking />
      </Suspense>
    ),
  },
  {
    path: "invoices",
    element: (
      <Suspense fallback={suspenseFallback}>
        <ComingSoon feature="Invoices & Billing" />
      </Suspense>
    ),
  },
  {
    path: "expenses",
    element: (
      <Suspense fallback={suspenseFallback}>
        <Expenses />
      </Suspense>
    ),
  },
  {
    path: "schools",
    element: (
      <Suspense fallback={suspenseFallback}>
        <Schools />
      </Suspense>
    ),
  },
  {
    path: "reports",
    element: (
      <Suspense fallback={suspenseFallback}>
        <ComingSoon feature="Reports" />
      </Suspense>
    ),
  },
  {
    path: "*",
    element: (
      <Suspense fallback={suspenseFallback}>
        <NotFound />
      </Suspense>
    ),
  },
];

const routes = [
  {
    path: "/",
    element: (
      <Suspense fallback={suspenseFallback}>
        <Layout />
      </Suspense>
    ),
    children: [...mainRoutes],
  },
];


export const router = createBrowserRouter(routes);