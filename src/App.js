import React, { useEffect, useMemo, useState } from "react";
import { SHEETS, USE_DEMO_IF_OFFLINE } from "./config";
import { fetchAllSheets } from "./services/googleSheet";
import { demo } from "./demoData";
import {
  MONTHS, fmtCompact, fmtIDR, num, normalizeRevenue, normalizeCash,
  normalizeInvoice, normalizeJobs, normalizeKpi, unique
} from "./utils";

// --- SUSUNAN MENU SIDEBAR LENGKAP ---
const NAV = [
  ["dashboard", "⌂", "Dashboard"],
  ["kpi", "🎯", "KPI SPV Sales"],
  ["revenue", "💰", "Revenue"],
  ["cash", "💵", "Cash In"],
  ["invoice", "🧾", "Invoice & Piutang"],
  ["jobs", "🚜", "Job & Unit Berjalan"],
  // --- MENU BARU TAMBAHAN ---
  ["outstanding2026", "⚠️", "MONITORING OUTSTANDING INVOICE 2026"],
  ["kontribusi2026", "📊", "KONTRIBUSI REVENUE 2026"],
  ["perbandingan", "📈", "PERBANDINGAN REVENUE BULANAN"],
  ["jobid", "📋", "JOB ID"],
  ["cashinall", "💳", "CASH IN ALL INVOICE 23,24,25,26"]
];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState(demo);
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ tahun: "2026", bulan: "Semua", sales: "Semua" });
  const [mobileOpen, setMobileOpen] = useState(false);

  async function sync() {
    setLoading(true); 
    setError("");
    try {
      const raw = await fetchAllSheets(SHEETS);
      setData({
        revenue: normalizeRevenue(raw.revenue),
        cashIn: normalizeCash(raw.cashIn),
        invoice: normalizeInvoice(raw.invoice),
        jobs: normalizeJobs(raw.jobs),
        kpi: normalizeKpi(raw.kpi)
      });
      setLive(true);
    } catch(e) {
      setError(e.message);
      if (!USE_DEMO_IF_OFFLINE) setData({ revenue: [], cashIn: [], invoice: [], jobs: [], kpi: [] });
      setLive(false);
    } finally { 
      setLoading(false); 
    }
  }

  useEffect(() => { sync(); }, []);

  const years = useMemo(() => unique([
    ...data.revenue.map(x => x.tahun), ...data.cashIn.map(x => x.tahun),
    ...data.invoice.map(x => x.tahun), ...data.jobs.map(x => x.tahun), ...data.kpi.map(x => x.tahun)
  ]).sort().reverse(), [data]);

  const sales = useMemo(() => unique([
    ...data.revenue.map(x => x.sales), ...data.cashIn.map(x => x.sales),
    ...data.invoice.map(x => x.sales), ...data.jobs.map(x => x.sales), ...data.kpi.map(x => x.sales)
  ]), [data]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigasi */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col`}>
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-lg font-bold text-red-500 tracking-wider uppercase">DASHBOARD MONITORING</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">CV CHANDRA DELTA PERKASA</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {NAV.map(([id, icon, label]) => (
            <button
              key={id}
              onClick={() => { setPage(id); setMobileOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                page === id
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <span className="text-base">{icon}</span>
              <span className="truncate">{label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 flex justify-between items-center">
          <span>Status Data:</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${live ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
            {live ? "● Live Sheet" : "● Offline Demo"}
          </span>
        </div>
      </aside>

      {/* Area Konten Utama */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              {NAV.find(n => n[0] === page)?.[2]}
            </h2>
            <p className="text-xs text-slate-400">Monitoring & Analisis Operasional Alat Berat</p>
          </div>
          <button
            onClick={sync}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            {loading ? "Syncing..." : "🔄 Refresh Data"}
          </button>
        </header>

        {/* Filter Bar */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400">Tahun</label>
            <select
              value={filters.tahun}
              onChange={e => setFilters({ ...filters, tahun: e.target.value })}
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400">Bulan</label>
            <select
              value={filters.bulan}
              onChange={e => setFilters({ ...filters, bulan: e.target.value })}
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="Semua">Semua Bulan</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400">Sales / VIA</label>
            <select
              value={filters.sales}
              onChange={e => setFilters({ ...filters, sales: e.target.value })}
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="Semua">Semua Sales</option>
              {sales.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Tampilan per Halaman */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 min-h-[400px]">
          {page === "dashboard" && <p className="text-slate-300 text-sm">Tampilan Ringkasan Utama Dashboard.</p>}
          {page === "kpi" && <p className="text-slate-300 text-sm">Pencapaian KPI SPV Sales.</p>}
          {page === "revenue" && <p className="text-slate-300 text-sm">Laporan Total Revenue Sewa Alat Berat.</p>}
          {page === "cash" && <p className="text-slate-300 text-sm">Detail Arus Pelunasan Kas Masuk (Cash In).</p>}
          {page === "invoice" && <p className="text-slate-300 text-sm">Monitoring Umur Piutang & Invoice Unpaid.</p>}
          {page === "jobs" && <p className="text-slate-300 text-sm">Daftar Status Unit & Job Berjalan.</p>}
          
          {/* Tampilan Modul Baru */}
          {page === "outstanding2026" && <p className="text-slate-300 text-sm">Halaman Monitoring Outstanding Invoice 2026.</p>}
          {page === "kontribusi2026" && <p className="text-slate-300 text-sm">Halaman Kontribusi Revenue 2026 Per Customer/Unit.</p>}
          {page === "perbandingan" && <p className="text-slate-300 text-sm">Grafik Perbandingan Revenue Bulanan (YoY / MoM).</p>}
          {page === "jobid" && <p className="text-slate-300 text-sm">Master Rekapitulasi Data Job ID.</p>}
          {page === "cashinall" && <p className="text-slate-300 text-sm">Rekapitulasi Cash In All Invoice (2023, 2024, 2025, 2026).</p>}
        </div>
      </main>
    </div>
  );
}
