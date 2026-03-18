import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
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
      { path: "*", Component: NotFound },
    ],
  },
]);
