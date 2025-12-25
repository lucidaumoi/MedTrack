// src/App.tsx
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useEffect } from "react";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import ProducerPage from "./pages/ProducerPage";
import CarrierPage from "./pages/CarrierPage";
import PharmacyPage from "./pages/PharmacyPage";
import TrackingPage from "./pages/TrackingPage";

function AppContent() {
  const currentAccount = useCurrentAccount();
  const navigate = useNavigate();

  const handleSelectRole = (role: string) => {
    switch (role) {
      case 'producer':
        navigate('/producer');
        break;
      case 'carrier':
        navigate('/carrier');
        break;
      case 'pharmacy':
        navigate('/pharmacy');
        break;
      case 'tracking':
        navigate('/tracking');
        break;
      default:
        navigate('/dashboard');
    }
  };

  // Auto redirect to dashboard if connected but on landing page
  useEffect(() => {
    if (currentAccount && window.location.pathname === '/') {
      navigate('/dashboard');
    }
  }, [currentAccount, navigate]);

  return (
    <Routes>
      <Route
        path="/"
        element={<LandingPage />}
      />
      <Route
        path="/dashboard"
        element={currentAccount ? <Dashboard onSelectRole={handleSelectRole} /> : <LandingPage />}
      />
      <Route
        path="/producer"
        element={currentAccount ? <ProducerPage /> : <LandingPage />}
      />
      <Route
        path="/carrier"
        element={currentAccount ? <CarrierPage /> : <LandingPage />}
      />
      <Route
        path="/pharmacy"
        element={currentAccount ? <PharmacyPage /> : <LandingPage />}
      />
      <Route
        path="/tracking"
        element={currentAccount ? <TrackingPage /> : <LandingPage />}
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;