import { Factory, Truck, BriefcaseMedical, User } from "lucide-react";
import { ConnectButton } from "@mysten/dapp-kit";
import logoPng from '../assets/logo.png';

interface DashboardProps {
  onSelectRole: (role: string) => void;
}

const Dashboard = ({ onSelectRole }: DashboardProps) => {
  const roles = [
    {
      id: 'producer',
      label: 'Manufacturer',
      icon: Factory,
      color: 'text-blue-600'
    },
    {
      id: 'carrier',
      label: 'Carrier',
      icon: Truck,
      color: 'text-green-600'
    },
    {
      id: 'pharmacy',
      label: 'Pharmacy',
      icon: BriefcaseMedical,
      color: 'text-purple-600'
    },
    {
      id: 'tracking',
      label: 'Consumer',
      icon: User,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-blue-500 text-white p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          
          {/* Logo trong vòng tròn trắng */}
          <div className="rounded-full transition-transform cursor-pointer">
            <img 
              src={logoPng} 
              alt="MedTrack Logo" 
              className="h-15 w-auto" /* Tăng kích thước lên h-20 (80px) */
            />
          </div>

          {/* Chữ MedTrack nằm ngoài */}
          <span className="text-2xl font-bold text-white tracking-tight hidden sm:block drop-shadow-md">
            MedTrack
          </span>
          
        </div>
        
        {/* Wallet Button Wrapper */}
        <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/20 shadow-lg">
          <ConnectButton />
        </div>
      </header>

      {/* Main Headline */}
      <div className="text-center mb-16 mt-6">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4 drop-shadow-sm">
          Pharmaceutical Traceability<br />System on Sui Blockchain
        </h1>
        <p className="text-blue-100 text-lg max-w-2xl mx-auto font-medium">
          Secure, transparent, and efficient supply chain management powered by blockchain technology.
        </p>
      </div>

      {/* Role Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {roles.map((role) => {
          const IconComponent = role.icon;
          return (
            <button
              key={role.id}
              onClick={() => onSelectRole(role.id)}
              className="bg-white rounded-2xl p-8 text-center hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl group border-4 border-transparent hover:border-blue-300"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className={`p-5 rounded-full bg-gray-50 group-hover:bg-blue-50 transition-colors duration-300`}>
                  <IconComponent size={48} className={`${role.color} transition-transform duration-300 group-hover:rotate-6`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-200">
                    {role.label}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wider">Select Role</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-center mt-20 text-blue-100/60 pb-6">
        <p className="text-sm font-medium">Powered by SUI Network</p>
      </div>
    </div>
  );
};

export default Dashboard;