import { createBrowserRouter, Navigate } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { ProLayout } from "./layouts/ProLayout";

/**
 * Lazy loading de toutes les pages via React Router 7 route-level lazy().
 * Chaque page est chargée uniquement quand l'utilisateur navigue vers elle.
 * Le bundle initial ne contient que RootLayout + ProLayout + les deux layouts.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      {
        index: true,
        lazy: () => import("./pages/HomePage").then((m) => ({ Component: m.HomePage })),
      },
      {
        path: "dashboard",
        lazy: () => import("./pages/Dashboard").then((m) => ({ Component: m.Dashboard })),
      },
      {
        path: "login",
        lazy: () => import("./pages/LoginPage").then((m) => ({ Component: m.LoginPage })),
      },
      {
        path: "services",
        lazy: () => import("./pages/ServicesHub").then((m) => ({ Component: m.ServicesHub })),
      },
      {
        path: "services/:id",
        lazy: () => import("./pages/ServiceDetail").then((m) => ({ Component: m.ServiceDetail })),
      },
      {
        path: "professionals",
        lazy: () => import("./pages/ProfessionalsHub").then((m) => ({ Component: m.ProfessionalsHub })),
      },
      {
        path: "professionals/:id",
        lazy: () => import("./pages/ProfessionalProfile").then((m) => ({ Component: m.ProfessionalProfile })),
      },
      {
        path: "booking",
        lazy: () => import("./pages/BookingPage").then((m) => ({ Component: m.BookingPage })),
      },
      {
        path: "booking/:serviceId",
        lazy: () => import("./pages/BookingPage").then((m) => ({ Component: m.BookingPage })),
      },
      {
        path: "reservations",
        lazy: () => import("./pages/ReservationsPage").then((m) => ({ Component: m.ReservationsPage })),
      },
      {
        path: "reservations/:id",
        lazy: () => import("./pages/ReservationDetailPage").then((m) => ({ Component: m.ReservationDetailPage })),
      },
      {
        path: "messages",
        lazy: () => import("./pages/MessagesPage").then((m) => ({ Component: m.MessagesPage })),
      },
      {
        path: "messages/archives",
        lazy: () => import("./pages/MessagesArchivesPage").then((m) => ({ Component: m.MessagesArchivesPage })),
      },
      {
        path: "notifications",
        lazy: () => import("./pages/NotificationsPage").then((m) => ({ Component: m.NotificationsPage })),
      },
      {
        path: "favorites",
        lazy: () => import("./pages/FavoritesPage").then((m) => ({ Component: m.FavoritesPage })),
      },
      {
        path: "reviews",
        lazy: () => import("./pages/ReviewsPage").then((m) => ({ Component: m.ReviewsPage })),
      },
      {
        path: "profile",
        lazy: () => import("./pages/ProfilePage").then((m) => ({ Component: m.ProfilePage })),
      },
      {
        path: "settings",
        lazy: () => import("./pages/SettingsPage").then((m) => ({ Component: m.SettingsPage })),
      },
      {
        path: "map",
        lazy: () => import("./pages/MapBeautePage").then((m) => ({ Component: m.MapBeautePage })),
      },
      {
        path: "glamfeed",
        lazy: () => import("./pages/GlamFeedPage").then((m) => ({ Component: m.GlamFeedPage })),
      },
      {
        path: "glamfeed/publish",
        lazy: () => import("./pages/GlamFeedPublishPage").then((m) => ({ Component: m.GlamFeedPublishPage })),
      },
      {
        path: "email-confirmed",
        lazy: () => import("./pages/EmailConfirmedPage").then((m) => ({ Component: m.EmailConfirmedPage })),
      },
      {
        path: "*",
        lazy: () => import("./pages/NotFound").then((m) => ({ Component: m.NotFound })),
      },
    ],
  },
  {
    path: "/pro",
    Component: ProLayout,
    children: [
      { index: true, element: <Navigate to="/pro/dashboard" replace /> },
      {
        path: "dashboard",
        lazy: () => import("./pages/pro/ProDashboardPage").then((m) => ({ Component: m.ProDashboardPage })),
      },
      {
        path: "services",
        lazy: () => import("./pages/pro/ProServicesPage").then((m) => ({ Component: m.ProServicesPage })),
      },
      {
        path: "availability",
        lazy: () => import("./pages/pro/ProAvailabilityPage").then((m) => ({ Component: m.ProAvailabilityPage })),
      },
      {
        path: "bookings",
        lazy: () => import("./pages/pro/ProBookingsPage").then((m) => ({ Component: m.ProBookingsPage })),
      },
      {
        path: "bookings/:id",
        lazy: () => import("./pages/pro/ProBookingDetailPage").then((m) => ({ Component: m.ProBookingDetailPage })),
      },
      {
        path: "messages/archives",
        lazy: () => import("./pages/pro/ProMessagesArchivesPage").then((m) => ({ Component: m.ProMessagesArchivesPage })),
      },
      {
        path: "messages",
        lazy: () => import("./pages/pro/ProMessagesPage").then((m) => ({ Component: m.ProMessagesPage })),
      },
      {
        path: "reviews",
        lazy: () => import("./pages/pro/ProReviewsPage").then((m) => ({ Component: m.ProReviewsPage })),
      },
      {
        path: "profile",
        lazy: () => import("./pages/pro/ProProfilePage").then((m) => ({ Component: m.ProProfilePage })),
      },
      {
        path: "settings",
        lazy: () => import("./pages/pro/ProSettingsPage").then((m) => ({ Component: m.ProSettingsPage })),
      },
      {
        path: "wallet",
        lazy: () => import("./pages/pro/ProWalletPage").then((m) => ({ Component: m.ProWalletPage })),
      },
      { path: "*", element: <Navigate to="/pro/dashboard" replace /> },
    ],
  },
]);
