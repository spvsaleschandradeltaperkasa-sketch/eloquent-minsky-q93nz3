import React, { useState } from "react";

// MENU SIDEBAR BARU
const NAV = [
  ["dashboard", "⌂", "Overview"],
  ["kpi", "🎯", "Sales Performance"],
  ["invoice", "🧾", "Master Invoice"],
  ["outstanding2026", "⚠️", "MONITORING OUTSTANDING INVOICE 2026"],
  ["kontribusi2026", "📊", "KONTRIBUSI REVENUE 2026"],
  ["perbandingan", "📈", "PERBANDINGAN REVENUE BULANAN"],
  ["jobid", "🚜", "JOB ID"],
  ["cashinall", "💳", "CASH IN ALL INVOICE 23,24,25,26"]
];

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// Helper Format Rupiah
const fmtIDR = (val) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val || 0);

export default function App() {
  const [page, setPage] = useState("kpi");
  const [filters, setFilters] = useState({ tahun: "2026", bulan: "Semua", sales: "Semua" });

  // Dummy / Initial State Data
  const totalRev = 3444930234;
  const totalCash = 2276493108;
  const sisaTagihan = totalRev - totalCash;

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigasi */}
      <aside className="w-80 bg-[#0d1425] border-r border-slate-800 p-4 flex flex-col justify-between">
        <div>
          <div className="p-3 mb-6 border-b border-slate-800/80">
            <h1 className="text-red-500 font-bold text-xs tracking-wider uppercase">DASHBOARD MONITORING</h1>
            <p className="text-slate-400 text-[11px] mt-0.5">CV CHANDRA DELTA PERKASA</p>
          </div>

          <nav className="space-y-1">
            {NAV.map(([id, icon, label]) => (
              <button
                key={id}
                onClick={() => setPage(id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  page === id
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <span className="text-sm">{icon}</span>
                <span className="truncate">{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex justify-between items-center">
          <span>● Live System</span>
          <span className="text-xs text-emerald-400">Online</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <header className="mb-6 flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wide">
              {NAV.find((n) => n[0] === page)?.[2]}
            </h2>
            <p className="text-xs text-slate-400">Monitoring & Analisis Operasional Alat Berat</p>
          </div>
        </header>

        {/* Tampilan Dashboard / Sales Performance */}
        {(page === "dashboard" || page === "kpi") && (
          <div>
            {/* Filter Bar */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#0d1425] p-4 rounded-xl border border-slate-800">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Tahun</label>
                <select
                  value={filters.tahun}
                  onChange={(e) => setFilters({ ...filters, tahun: e.target.value })}
                  className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Bulan</label>
                <select
                  value={filters.bulan}
                  onChange={(e) => setFilters({ ...filters, bulan: e.target.value })}
                  className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  <option value="Semua">Semua Bulan</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Sales / VIA</label>
                <select
                  value={filters.sales}
                  onChange={(e) => setFilters({ ...filters, sales: e.target.value })}
                  className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  <option value="Semua">Semua Sales</option>
                  <option value="BKP">BKP</option>
                  <option value="CDP">CDP</option>
                  <option value="ANS">ANS</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ tahun: "2026", bulan: "Semua", sales: "Semua" })}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg border border-slate-700 text-slate-300"
                >
                  ↺ Reset Filter
                </button>
              </div>
            </div>

            {/* Resume Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#0d1425] p-4 rounded-xl border border-blue-500/30">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Revenue</span>
                <p className="text-lg font-bold text-white mt-1">{fmtIDR(totalRev)}</p>
              </div>
              <div className="bg-[#0d1425] p-4 rounded-xl border border-emerald-500/30">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Cash In</span>
                <p className="text-lg font-bold text-emerald-400 mt-1">{fmtIDR(totalCash)}</p>
              </div>
              <div className="bg-[#0d1425] p-4 rounded-xl border border-amber-500/30">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Sisa Tagihan</span>
                <p className="text-lg font-bold text-amber-400 mt-1">{fmtIDR(sisaTagihan)}</p>
              </div>
              <div className="bg-[#0d1425] p-4 rounded-xl border border-purple-500/30">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Jumlah Invoice</span>
                <p className="text-lg font-bold text-white mt-1">26</p>
              </div>
            </div>
          </div>
        )}

        {/* Master Invoice Page */}
        {page === "invoice" && (
          <div className="bg-[#0d1425] border border-slate-800 rounded-xl p-4">
            <h3 className="font-bold text-sm mb-4">Master Data Invoice</h3>
            <p className="text-xs text-slate-400">Data Invoice Siap Ditampilkan.</p>
          </div>
        )}

        {/* Placeholder untuk Menu-Menu Baru */}
        {["outstanding2026", "kontribusi2026", "perbandingan", "jobid", "cashinall"].includes(page) && (
          <div className="bg-[#0d1425] border border-slate-800 rounded-xl p-8 text-center text-slate-400">
            <p className="text-sm">
              Halaman <b>{NAV.find((n) => n[0] === page)?.[2]}</b> telah aktif.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Navigasi berhasil diperbarui dan siap dikembangkan lebih lanjut.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
