import { Factory, Truck, BriefcaseMedical, User } from "lucide-react";
import { ConnectButton } from "@mysten/dapp-kit";

interface DashboardProps {
  onSelectRole: (role: string) => void;
}

export default function Dashboard({ onSelectRole }: DashboardProps) {
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
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white rounded-lg">
            <span className="text-2xl font-bold text-blue-600">Logo</span>
          </div>
        </div>
        <div className="flex items-center">
          <ConnectButton />
        </div>
      </header>

      {/* Main Headline */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
          Hệ thống truy xuất nguồn gốc<br />
          <span className="text-blue-200">dược phẩm</span> trên Sui Blockchain
        </h1>
      </div>

      {/* Role Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {roles.map((role) => {
          const IconComponent = role.icon;
          return (
            <button
              key={role.id}
              onClick={() => onSelectRole(role.id)}
              className="bg-white rounded-2xl p-8 text-center hover:scale-105 transition-transform duration-200 shadow-lg hover:shadow-xl group"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className={`p-4 rounded-full bg-gray-50 group-hover:bg-gray-100 transition-colors duration-200`}>
                  <IconComponent size={48} className={role.color} />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
                  {role.label}
                </h3>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-center mt-16 text-blue-100">
        <p className="text-sm">Select your role to continue</p>
      </div>
    </div>
  );
}
