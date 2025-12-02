import { createBrowserRouter } from "react-router-dom"
import { Suspense, lazy } from "react"

const Layout = lazy(() => import("@/components/organisms/Layout"))
const Dashboard = lazy(() => import("@/components/pages/Dashboard"))
const Clients = lazy(() => import("@/components/pages/Clients"))
const ClientDetail = lazy(() => import("@/components/pages/ClientDetail"))
const Expenses = lazy(() => import("@/components/pages/Expenses"))
const Projects = lazy(() => import("@/components/pages/Projects"))
const ProjectDetail = lazy(() => import("@/components/pages/ProjectDetail"))
const Tasks = lazy(() => import("@/components/pages/Tasks"))
const ComingSoon = lazy(() => import("@/components/pages/ComingSoon"))
const NotFound = lazy(() => import("@/components/pages/NotFound"))

const suspenseFallback = (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
    <div className="text-center space-y-4">
      <svg className="animate-spin h-12 w-12 text-primary-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <p className="text-slate-600 dark:text-slate-400">Loading...</p>
    </div>
  </div>
)

const mainRoutes = [
  {
    path: "",
    index: true,
    element: (
      <Suspense fallback={suspenseFallback}>
        <Dashboard />
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
path: "tasks",
    element: (
      <Suspense fallback={suspenseFallback}>
        <Tasks />
      </Suspense>
    ),
  },
  {
    path: "time-tracking",
    element: (
      <Suspense fallback={suspenseFallback}>
        <ComingSoon feature="Time Tracking" />
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
]

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
]

export const router = createBrowserRouter(routes)