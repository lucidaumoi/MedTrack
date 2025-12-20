import { ConnectButton } from "@mysten/dapp-kit";
import CreateOrder from "./components/CreateOrder";
import Tracking from "./components/Tracking";
import Transporter from "./components/Transporter";
import Pharmacy from "./components/Pharmacy"; // <--- Import mới

function App() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">MedMarket 💊 - Sui Blockchain</h1>
          <ConnectButton />
        </div>
      </header>

      <main className="py-10 space-y-16">
        
        {/* Bước 1: Nhà Sản Xuất */}
        <section>
            <div className="max-w-7xl mx-auto px-4 mb-4"><span className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm font-bold">Bước 1</span></div>
            <CreateOrder />
        </section>

        {/* Bước 2: Vận Chuyển */}
        <section>
            <div className="max-w-7xl mx-auto px-4 mb-4"><span className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm font-bold">Bước 2</span></div>
            <Transporter />
        </section>

        {/* Bước 3: Nhà Thuốc (Mới) */}
        <section>
            <div className="max-w-7xl mx-auto px-4 mb-4"><span className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm font-bold">Bước 3</span></div>
            <Pharmacy />
        </section>

        <div className="border-t-4 border-dashed border-gray-300 mx-20"></div>

        {/* Tracking: Xem kết quả */}
        <section>
            <div className="text-center mb-6"><h3 className="text-xl font-bold text-gray-500 uppercase tracking-widest">Dữ liệu công khai trên Blockchain</h3></div>
            <Tracking />
        </section>
        
      </main>
    </div>
  );
}

export default App;