// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { ConnectButton } from "@mysten/dapp-kit";
import ProducerPage from "./pages/ProducerPage";
import CarrierPage from "./pages/CarrierPage"; // Bạn tự implement dựa trên Producer
import PharmacyPage from "./pages/PharmacyPage"; // Bạn tự implement dựa trên Producer
import TrackingPage from "./pages/TrackingPage";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
        {/* Navbar */}
        <nav className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-50">
          <div className="text-xl font-bold text-blue-600 flex items-center gap-2">
            💊 MedTrack
          </div>
          <div className="flex gap-6 font-medium">
            <Link to="/" className="hover:text-blue-500">Nhà sản xuất</Link>
            <Link to="/carrier" className="hover:text-blue-500">Vận chuyển</Link>
            <Link to="/pharmacy" className="hover:text-blue-500">Nhà thuốc</Link>
            <Link to="/tracking" className="hover:text-blue-500">Tra cứu</Link>
          </div>
          <ConnectButton />
        </nav>

        {/* Main Content */}
        <div className="container mx-auto p-6 max-w-4xl">
          <Routes>
            <Route path="/" element={<ProducerPage />} />
            <Route path="/carrier" element={<div className="text-center mt-10">Carrier Page (Copy logic từ Producer)</div>} />
            <Route path="/pharmacy" element={<div className="text-center mt-10">Pharmacy Page (Copy logic từ Producer)</div>} />
            <Route path="/tracking" element={<TrackingPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;