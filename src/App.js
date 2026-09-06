import React, { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Users,
  AlertCircle,
  PieChart,
  BarChart2,
  Briefcase,
  Wallet
} from "lucide-react";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "sales-performance", label: "Sales Performance", icon: Users },
  { id: "master-invoice", label: "Master Invoice", icon: FileText },
  
  // --- MENU BARU TAMBAHAN ---
  { id: "outstanding-2026", label: "MONITORING OUTSTANDING INVOICE 2026", icon: AlertCircle },
  { id: "kontribusi-2026", label: "KONTRIBUSI REVENUE 2026", icon: PieChart },
  { id: "perbandingan-revenue", label: "PERBANDINGAN REVENUE BULANAN", icon: BarChart2 },
  { id: "job-id", label: "JOB ID", icon: Briefcase },
  { id: "cash-in-all", label: "CASH IN ALL INVOICE 23,24,25,26", icon: Wallet }
];

export default function App() {
  const [activeTab, setActiveTab] = useState("sales-performance");

  return (
    <div className="flex h-screen bg-slate-950 text-white font-sans">
      {/* Sidebar Navigasi */}
      <aside className="w-80 bg-slate-900 border-r border-slate-800 p-4 flex flex-col">
        <div className="p-3 mb-6 border-b border-slate-800">
          <h1 className="text-red-500 font-bold text-sm tracking-wider uppercase">DASHBOARD MONITORING</h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">CV CHANDRA DELTA PERKASA</p>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Icon size={18} />
                <span className="truncate text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Area Tampilan */}
      <main className="flex-1 p-8 overflow-y-auto bg-slate-950">
        <div className="border-b border-slate-800 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-white">
            {NAV_ITEMS.find((n) => n.id === activeTab)?.label}
          </h2>
          <p className="text-slate-400 text-xs mt-1">Monitoring & Analisis Operasional Alat Berat</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 min-h-[400px] flex items-center justify-center">
          <p className="text-slate-400 text-sm">
            Halaman <b>{NAV_ITEMS.find((n) => n.id === activeTab)?.label}</b> siap digunakan.
          </p>
        </div>
      </main>
    </div>
  );
}
