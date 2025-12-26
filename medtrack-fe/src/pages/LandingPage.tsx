import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logoPng from '../assets/logo.png';

export default function LandingPage() {
  const currentAccount = useCurrentAccount();
  const navigate = useNavigate();

  // Auto-redirect to dashboard when wallet is connected
  useEffect(() => {
    if (currentAccount) {
      // Small delay for smooth UX
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    }
  }, [currentAccount, navigate]);

  // If user is connected, show loading state while redirecting
  if (currentAccount) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-600 font-medium">Redirecting to Dashboard...</p>
          <p className="text-sm text-slate-500">Wallet connected successfully</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-slate-100">

      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          {/* Logo trong vòng tròn trắng */}
          <div className="rounded-full transition-transform cursor-pointer">
            <img
              src={logoPng}
              alt="MedTrack Logo"
              className="h-15 w-auto" /* Tăng kích thước lên h-20 (80px) */
            />
          </div>

          {/* Chữ MedTrack nằm ngoài */}
          <span className="text-2xl font-bold text-slate-800 tracking-tight hidden sm:block">
            MedTrack
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white p-12 rounded-3xl shadow-xl max-w-3xl w-full text-center space-y-8 border border-slate-100">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-800 leading-tight">
              Pharmaceutical Supply Chain Traceability System on Sui Blockchain{" "}
            </h1>
          </div>
          <div className="space-y-4">
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Track the journey of medicines from manufacturer to consumer.
              Ensure transparency and traceability on the blockchain platform.
            </p>

            <div className="flex justify-center pt-6">
              {/* Custom styled ConnectButton */}
              <div className="transform scale-110 transition-transform duration-200 hover:scale-115">
                <ConnectButton
                  connectText="🔗 Connect SUI Wallet"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-blue-400 hover:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <p className="text-sm text-slate-500">
                Connect your Sui wallet to start using the system
              </p>
              <div className="flex justify-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  High Security
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  Transparent
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  Instant Traceability
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="text-center text-sm text-slate-500">
          <p>© 2025 MedTrack - Pharmaceutical Supply Chain Management System</p>
        </div>
      </div>

    </div>
  );
}
