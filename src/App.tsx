import { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import AdminLogin from "./components/AdminLogin";
import MainAdminPanel from "./components/MainAdminPanel";
import WardAdminPanel from "./components/WardAdminPanel";
import CitizenPortal from "./components/CitizenPortal";
import CollectorApp from "./components/CollectorApp";
import SuperAdminPanel from "./components/SuperAdminPanel";
import BusinessPortal from "./components/BusinessPortal";
import api, { userStorage } from "./lib/api";

type Page =
  | "landing"
  | "admin-login"
  | "main-admin"
  | "ward-admin"
  | "citizen"
  | "collector"
  | "super-admin"
  | "business";

interface AppState {
  page: Page;
  wardId?: string | number;
  cityCorpId?: string;
}

export default function App() {
  const [state, setState] = useState<AppState>({ page: "landing" });

  useEffect(() => {
    // Check if user is already logged in
    const user = userStorage.get();
    if (user) {
      if (user.role === "SUPER_ADMIN") {
        setState({ page: "super-admin" });
      } else if (user.role === "CITY_ADMIN") {
        setState({ page: "main-admin", cityCorpId: user.cityCorpId || undefined });
      } else if (user.role === "WARD_ADMIN") {
        setState({ page: "ward-admin", wardId: user.wardId || undefined });
      } else if (user.role === "DRIVER") {
        setState({ page: "collector" });
      } else if (user.role === "CITIZEN") {
        setState({ page: "citizen" });
      }
    }
  }, []);

  const navigate = (page: string, wardId?: string | number) => {
    if (page === "admin") setState({ page: "admin-login" });
    else setState({ page: page as Page, wardId });
  };

  const handleLogin = (role: "super" | "city" | "ward", targetId?: string | number) => {
    if (role === "super") {
      setState({ page: "super-admin" });
    } else if (role === "city") {
      setState({ page: "main-admin", cityCorpId: typeof targetId === "string" ? targetId : undefined });
    } else {
      setState({ page: "ward-admin", wardId: targetId });
    }
  };

  const handleLogout = () => {
    api.auth.logout();
    setState({ page: "admin-login" });
  };

  switch (state.page) {
    case "admin-login":
      return <AdminLogin onLogin={handleLogin} onNavigate={navigate} />;
    case "main-admin":
      return (
        <MainAdminPanel
          cityCorpId={state.cityCorpId}
          onLogout={handleLogout}
          onNavigateWard={(wId) => setState({ page: "ward-admin", wardId: wId })}
        />
      );
    case "super-admin":
      return <SuperAdminPanel onLogout={handleLogout} />;
    case "ward-admin":
      return <WardAdminPanel wardId={Number(state.wardId) || 1} onLogout={handleLogout} />;
    case "citizen":
      return <CitizenPortal onNavigate={navigate} />;
    case "collector":
      return <CollectorApp onNavigate={navigate} />;
    case "business":
      return <BusinessPortal onNavigate={navigate} />;
    default:
      return <LandingPage onNavigate={navigate} />;
  }
}
