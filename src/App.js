import React, { useEffect, useMemo, useState } from "react";
import { SHEETS, USE_DEMO_IF_OFFLINE } from "./config";
import { fetchAllSheets } from "./services/googleSheet";
import { demo } from "./demoData";
import {
  MONTHS, fmtCompact, fmtIDR, num, normalizeRevenue, normalizeCash,
  normalizeInvoice, normalizeJobs, normalizeKpi, unique
} from "./utils";

// NAVIGASI DENGAN MENU BARU
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

export default function App() {
  const [page, setPage] = useState("kpi");
  const [data, setData] = useState(demo);
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ tahun: "2026", bulan: "Semua", sales: "Semua" });

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

  const salesList = useMemo(() => unique([
    ...data.revenue.map(x => x.sales), ...data.cashIn.map(x => x.sales),
    ...data.invoice.map(x => x.sales), ...data.jobs.map(x => x.sales), ...data.kpi.map(x => x.sales)
  ]), [data]);

  const totalRev = useMemo(() => data.revenue.reduce((a, b) => a + num(b.total), 0), [data]);
  const totalCash = useMemo(() => data.cashIn.reduce((a, b) => a + num(b.total), 0), [data]);
  const sisaTagihan = totalRev - totalCash;

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
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
          <span>{live ? "● Live Sheet Sync" : "● Offline Demo"}</span>
          <button onClick={sync} className="text-xs text-blue-400 hover:underline">{loading ? "Syncing..." : "Sync"}</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <header className="mb-6 flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wide">
              {NAV.find(n => n[0] === page)?.[2]}
            </h2>
            <p className="text-xs text-slate-400">Monitoring & Analisis Operasional Alat Berat</p>
          </div>
          <button
            onClick={sync}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition"
          >
            {loading ? "Memuat Data..." : "🔄 Sync Google Sheets"}
          </button>
        </header>

        {/* Multi-Tab Tampilan Data */}
        {(page === "dashboard" || page === "kpi") && (
          <div>
            {/* Filter Bar */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#0d1425] p-4 rounded-xl border border-slate-800">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Tahun</label>
                <select value={filters.tahun} onChange={e => setFilters({...filters, tahun: e.target.value})} className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Bulan</label>
                <select value={filters.bulan} onChange={e => setFilters({...filters, bulan: e.target.value})} className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white">
                  <option value="Semua">Semua Bulan</option>
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Sales / VIA</label>
                <select value={filters.sales} onChange={e => setFilters({...filters, sales: e.target.value})} className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white">
                  <option value="Semua">Semua Sales</option>
                  {salesList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={() => setFilters({ tahun: "2026", bulan: "Semua", sales: "Semua" })} className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg border border-slate-700 text-slate-300">
                  ↺ Reset Filter
                </button>
              </div>
            </div>

            {/* Summary Data */}
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
                <p className="text-lg font-bold text-white mt-1">{data.invoice.length}</p>
              </div>
            </div>
          </div>
        )}

        {page === "invoice" && (
          <div className="bg-[#0d1425] border border-slate-800 rounded-xl p-4">
            <h3 className="font-bold text-sm mb-4">Master Data Invoice</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400">
                  <tr>
                    <th className="p-2">No. Invoice</th>
                    <th className="p-2">Customer</th>
                    <th className="p-2">Sales</th>
                    <th className="p-2">Nilai Tagihan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data.invoice.slice(0, 10).map((inv, idx) => (
                    <tr key={idx}>
                      <td className="p-2 text-blue-400">{inv.noInv || inv.invoice || `-`}</td>
                      <td className="p-2">{inv.customer || `-`}</td>
                      <td className="p-2">{inv.sales || `-`}</td>
                      <td className="p-2 font-semibold">{fmtIDR(num(inv.total || inv.nominal))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {["outstanding2026", "kontribusi2026", "perbandingan", "jobid", "cashinall"].includes(page) && (
          <div className="bg-[#0d1425] border border-slate-800 rounded-xl p-8 text-center text-slate-400">
            <p className="text-sm">Halaman <b>{NAV.find(n => n[0] === page)?.[2]}</b> sudah terhubung.</p>
            <p className="text-xs text-slate-500 mt-1">Klik tombol 'Sync Google Sheets' untuk memperbarui data langsung dari sheet.</p>
          </div>
        )}
      </main>
    </div>
  );
}
