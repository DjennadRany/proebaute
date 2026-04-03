import { createBrowserRouter, Navigate } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { ProLayout } from "./layouts/ProLayout";
import { HomePage } from "./pages/HomePage";
import { Dashboard } from "./pages/Dashboard";
import { ServicesHub } from "./pages/ServicesHub";
import { ServiceDetail } from "./pages/ServiceDetail";
import { ProfessionalsHub } from "./pages/ProfessionalsHub";
import { ProfessionalProfile } from "./pages/ProfessionalProfile";
import { BookingPage } from "./pages/BookingPage";
import { ReservationsPage } from "./pages/ReservationsPage";
import { ReservationDetailPage } from "./pages/ReservationDetailPage";
import { MessagesPage } from "./pages/MessagesPage";
import { MessagesArchivesPage } from "./pages/MessagesArchivesPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { NotFound } from "./pages/NotFound";
import { LoginPage } from "./pages/LoginPage";
import { ProDashboardPage } from "./pages/pro/ProDashboardPage";
import { ProServicesPage } from "./pages/pro/ProServicesPage";
import { ProAvailabilityPage } from "./pages/pro/ProAvailabilityPage";
import { ProBookingsPage } from "./pages/pro/ProBookingsPage";
import { ProBookingDetailPage } from "./pages/pro/ProBookingDetailPage";
import { ProMessagesPage } from "./pages/pro/ProMessagesPage";
import { ProMessagesArchivesPage } from "./pages/pro/ProMessagesArchivesPage";
import { ProReviewsPage } from "./pages/pro/ProReviewsPage";
import { ProProfilePage } from "./pages/pro/ProProfilePage";
import { ProSettingsPage } from "./pages/pro/ProSettingsPage";
import { ProWalletPage } from "./pages/pro/ProWalletPage";
import { MapBeautePage } from './pages/MapBeautePage';
import { GlamFeedPage } from './pages/GlamFeedPage';

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "dashboard", Component: Dashboard },
      { path: "login", Component: LoginPage },
      { path: "services", Component: ServicesHub },
      { path: "services/:id", Component: ServiceDetail },
      { path: "professionals", Component: ProfessionalsHub },
      { path: "professionals/:id", Component: ProfessionalProfile },
      { path: "booking", Component: BookingPage },
      { path: "booking/:serviceId", Component: BookingPage },
      { path: "reservations", Component: ReservationsPage },
      { path: "reservations/:id", Component: ReservationDetailPage },
      { path: "messages", Component: MessagesPage },
      { path: "messages/archives", Component: MessagesArchivesPage },
      { path: "notifications", Component: NotificationsPage },
      { path: "favorites", Component: FavoritesPage },
      { path: "reviews", Component: ReviewsPage },
      { path: "profile", Component: ProfilePage },
      { path: "settings", Component: SettingsPage },
      { path: "map", Component: MapBeautePage },
      { path: "glamfeed", Component: GlamFeedPage },
      { path: "*", Component: NotFound },
    ],
  },
  {
    path: "/pro",
    Component: ProLayout,
    children: [
      { index: true, element: <Navigate to="/pro/dashboard" replace /> },
      { path: "dashboard", Component: ProDashboardPage },
      { path: "services", Component: ProServicesPage },
      { path: "availability", Component: ProAvailabilityPage },
      { path: "bookings", Component: ProBookingsPage },
      { path: "bookings/:id", Component: ProBookingDetailPage },
      { path: "messages/archives", Component: ProMessagesArchivesPage },
      { path: "messages", Component: ProMessagesPage },
      { path: "reviews", Component: ProReviewsPage },
      { path: "profile", Component: ProProfilePage },
      { path: "settings", Component: ProSettingsPage },
      { path: "wallet", Component: ProWalletPage },
      { path: "*", element: <Navigate to="/pro/dashboard" replace /> },
    ],
  },
]);
