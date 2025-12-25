import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
          <p className="text-slate-600 font-medium">Đang chuyển hướng vào Dashboard...</p>
          <p className="text-sm text-slate-500">Ví đã được kết nối thành công</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Logo */}
      <div className="p-6 border-b border-purple-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 text-purple-600 font-bold text-xl">
          <div className="p-2 bg-purple-100 rounded-lg">
            <span className="text-2xl">💊</span>
          </div>
          <span className="text-slate-700">MedTrack</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white p-12 rounded-3xl shadow-xl max-w-3xl w-full text-center space-y-8 border border-slate-100">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-800 leading-tight">
              Hệ thống truy xuất nguồn gốc dược phẩm trên  Sui Blockchain{" "}
            </h1>
          </div>
          <div className="space-y-4">
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Theo dõi hành trình của thuốc từ nhà sản xuất đến người tiêu dùng.
              Đảm bảo tính minh bạch và truy xuất nguồn gốc trên nền tảng blockchain.
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
                Kết nối ví Sui để bắt đầu sử dụng hệ thống
              </p>
              <div className="flex justify-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  Bảo mật cao
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  Minh bạch
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  Truy xuất tức thì
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-slate-200 bg-white">
        <div className="text-center text-sm text-slate-500">
          <p>© 2025 MedTrack - Hệ thống quản lý chuỗi cung ứng dược phẩm</p>
        </div>
      </div>
    </div>
  );
}
