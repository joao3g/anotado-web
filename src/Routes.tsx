import { createBrowserRouter, redirect } from "react-router";
import LoginPage from "./pages/Login";
import IncomesPage from "./pages/Incomes";
import ExpensesPage from "./pages/Expenses";
import CategoriesPage from "./pages/Categories";
import RecurrencesPage from "./pages/Recurrences";
import CardsPage from "./pages/Cards";
import Dashboard from "./pages/Dashboard";
import ComponentsPage from "./pages/Components";
import RegisterPage from "./pages/Register";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPassword";
import OnboardingPage from "./pages/Onboarding";
import SettingsPage from "./pages/settings/Settings";
import ProfileTab from "./pages/settings/ProfileTab";
import FamilyTab from "./pages/settings/FamilyTab";
import SecurityTab from "./pages/settings/SecurityTab";
import AppLayout from "./layouts/AppLayout";
import { authMiddleware } from "./loaders/auth";
import { categoriesLoader } from "./loaders/categories";
import { cardsLoader } from "./loaders/cards";
import { queryClient } from "./queryClient";

// Re-exported: many files import queryClient from here.
export { queryClient };

export const router = createBrowserRouter([
    {
        path: "/",
        element: <LoginPage />,
        loader: () => {
            if (localStorage.getItem("token")) throw redirect("/dashboard")
        },
    },
    {
        path: "/register",
        element: <RegisterPage />,
        loader: () => {
            if (localStorage.getItem("token")) throw redirect("/dashboard")
        },
    },
    {
        path: "/forgot-password",
        element: <ForgotPasswordPage />,
        loader: () => {
            if (localStorage.getItem("token")) throw redirect("/dashboard")
        },
    },
    {
        // Opened from the reset email. No redirect when logged in: the link may be opened on a logged-in phone.
        path: "/reset-password",
        element: <ResetPasswordPage />,
    },
    {
        // Logged in, but without a family yet
        path: "/onboarding",
        element: <OnboardingPage />,
        loader: authMiddleware,
    },
    {
        path: "/error",
        element: <h1>Error page</h1>
    },
    {
        path: "/components",
        element: <ComponentsPage />,
    },
    {
        loader: authMiddleware,
        element: <AppLayout />,
        children: [
            {
                loader: authMiddleware,
                element: <Dashboard />,
                path: "/dashboard"
            },
            {
                loader: authMiddleware,
                path: "/incomes",
                element: <IncomesPage />,
            },
            {
                loader: authMiddleware,
                path: "/expenses",
                element: <ExpensesPage />,
            },
            {
                loader: authMiddleware,
                path: "/recurrences",
                element: <RecurrencesPage />,
            },
            {
                loader: cardsLoader(queryClient),
                path: "/cards",
                element: <CardsPage />,
            },
            {
                loader: categoriesLoader(queryClient),
                path: "/categories",
                element: <CategoriesPage />,
            },
            {
                loader: authMiddleware,
                path: "/settings",
                element: <SettingsPage />,
                children: [
                    { index: true, loader: () => redirect("/settings/profile") },
                    { path: "profile", element: <ProfileTab /> },
                    { path: "family", element: <FamilyTab /> },
                    { path: "security", element: <SecurityTab /> },
                ],
            },
        ],
    },
]);