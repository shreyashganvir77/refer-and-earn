import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import Landing from "./pages/Landing";
import WantReferral from "./pages/WantReferral";
import GiveReferral from "./pages/GiveReferral";
import ProfileCompletion from "./pages/ProfileCompletion";
import { useAuth } from "./context/AuthContext";
import ProviderReferrals from "./pages/ProviderReferrals";
import MyReferrals from "./pages/MyReferrals";
import AdminLogin from "./pages/AdminLogin";
import AdminSupportTickets from "./pages/AdminSupportTickets";
import AboutUs from "./pages/AboutUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ShippingReturnPolicy from "./pages/ShippingReturnPolicy";
import Contact from "./pages/Contact";
import TermsAndConditions from "./pages/TermsAndConditions";

function App() {
  const { isAuthenticated, loading, isProfileComplete } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/profile"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : (
              <ProfileCompletion />
            )
          }
        />
        <Route
          path="/"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : loading ? (
              <div className="min-h-screen flex items-center justify-center">
                Loading…
              </div>
            ) : !isProfileComplete ? (
              <Navigate to="/profile" replace />
            ) : (
              <Landing />
            )
          }
        />
        <Route
          path="/want-referral"
          element={
            isAuthenticated ? (
              <WantReferral />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/give-referral"
          element={
            isAuthenticated ? (
              <GiveReferral />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/provider/referrals"
          element={
            isAuthenticated ? (
              <ProviderReferrals />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/my-referrals"
          element={
            isAuthenticated ? <MyReferrals /> : <Navigate to="/login" replace />
          }
        />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminSupportTickets />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/shipping-return" element={<ShippingReturnPolicy />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
      </Routes>
    </Router>
  );
}

export default App;
