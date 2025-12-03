import { createBrowserRouter } from "react-router-dom";
import React, { Suspense, lazy } from "react";

// Lazy load page components
const Layout = lazy(() => import("@/components/organisms/Layout"));
const Dashboard = lazy(() => import("@/components/pages/Dashboard"));
const Clients = lazy(() => import("@/components/pages/Clients"));
const ClientDetail = lazy(() => import("@/components/pages/ClientDetail"));
const Projects = lazy(() => import("@/components/pages/Projects"));
const ProjectDetail = lazy(() => import("@/components/pages/ProjectDetail"));
const Tasks = lazy(() => import("@/components/pages/Tasks"));
const TodayTasks = lazy(() => import("@/components/pages/TodayTasks"));
const WeekTasks = lazy(() => import("@/components/pages/WeekTasks"));
const OverdueTasks = lazy(() => import("@/components/pages/OverdueTasks"));
const CompletedTasks = lazy(() => import("@/components/pages/CompletedTasks"));
const Reports = lazy(() => import("@/components/pages/Reports"));
const TimeTracking = lazy(() => import("@/components/pages/TimeTracking"));
const Expenses = lazy(() => import("@/components/pages/Expenses"));
const ExpenseReports = lazy(() => import("@/components/pages/ExpenseReports"));
const ProjectExpenseReport = lazy(() => import("@/components/pages/ProjectExpenseReport"));
const InvoiceList = lazy(() => import("@/components/pages/InvoiceList"));
const InvoiceDetail = lazy(() => import("@/components/pages/InvoiceDetail"));
const Schools = lazy(() => import("@/components/pages/Schools"));
const ComingSoon = lazy(() => import("@/components/pages/ComingSoon"));
const NotFound = lazy(() => import("@/components/pages/NotFound"));
// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="text-center space-y-4">
      <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  </div>
);

const mainRoutes = [
  {
    path: "",
    index: true,
    element: <Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense>
  },
  {
    path: "clients",
    element: <Suspense fallback={<LoadingFallback />}><Clients /></Suspense>
  },
  {
    path: "clients/:id",
    element: <Suspense fallback={<LoadingFallback />}><ClientDetail /></Suspense>
  },
  {
    path: "projects",
    element: <Suspense fallback={<LoadingFallback />}><Projects /></Suspense>
  },
  {
    path: "projects/:id",
    element: <Suspense fallback={<LoadingFallback />}><ProjectDetail /></Suspense>
  },
  {
    path: "tasks",
    element: <Suspense fallback={<LoadingFallback />}><Tasks /></Suspense>
  },
  {
    path: "tasks/today",
    element: <Suspense fallback={<LoadingFallback />}><TodayTasks /></Suspense>
  },
  {
    path: "tasks/week",
    element: <Suspense fallback={<LoadingFallback />}><WeekTasks /></Suspense>
  },
  {
    path: "tasks/overdue",
    element: <Suspense fallback={<LoadingFallback />}><OverdueTasks /></Suspense>
  },
  {
    path: "tasks/completed",
    element: <Suspense fallback={<LoadingFallback />}><CompletedTasks /></Suspense>
  },
  {
    path: "time-tracking",
    element: <Suspense fallback={<LoadingFallback />}><TimeTracking /></Suspense>
  },
  {
    path: "expenses",
    element: <Suspense fallback={<LoadingFallback />}><Expenses /></Suspense>
  },
{
    path: "tax-reports", 
    element: <Suspense fallback={<LoadingFallback />}><ExpenseReports /></Suspense>
  },
  {
    path: "project-expense-report",
    element: <Suspense fallback={<LoadingFallback />}><ProjectExpenseReport /></Suspense>
  },
  {
    path: "invoices",
    element: <Suspense fallback={<LoadingFallback />}><InvoiceList /></Suspense>
  },
  {
    path: "invoices/:id",
    element: <Suspense fallback={<LoadingFallback />}><InvoiceDetail /></Suspense>
  },
  {
    path: "schools",
    element: <Suspense fallback={<LoadingFallback />}><Schools /></Suspense>
  },
  {
    path: "coming-soon",
    element: <Suspense fallback={<LoadingFallback />}><ComingSoon /></Suspense>
  },
{
    path: "reports",
    element: <Suspense fallback={<LoadingFallback />}><Reports /></Suspense>
  },
  {
    path: "*",
    element: <Suspense fallback={<LoadingFallback />}><NotFound /></Suspense>
  }
];

const routes = [
  {
    path: "/",
    element: <Suspense fallback={<LoadingFallback />}><Layout /></Suspense>,
    children: mainRoutes
  }
];

export const router = createBrowserRouter(routes);

export default router;