import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, PieChart, Users, FileText, Calendar, Filter, 
  TrendingUp, AlertTriangle, ShieldCheck, Truck, DollarSign, RefreshCw 
} from 'lucide-react';

// --- DATA SOURCE & INITIAL STATE (Sama seperti sebelumnya) ---
const MONTHS_ORDER = [
  "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", 
  "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
];

const formatRupiah = (angka) => {
  if (!angka && angka !== 0) return "Rp 0";
  return "Rp " + Number(angka).toLocaleString("id-ID");
};

// Helper hitung umur piutang (Aging Days) dari tanggal invoice
const calculateAgingDays = (tanggalStr) => {
  if (!tanggalStr || tanggalStr === "-") return 0;
  const parts = tanggalStr.split(/[-/]/);
  if (parts.length < 3) return 0;
  
  let date;
  if (parts[0].length === 4) {
    date = new Date(parts[0], parts[1] - 1, parts[2]);
  } else {
    date = new Date(parts[2], parts[1] - 1, parts[0]);
  }
  
  const today = new Date();
  const diffTime = today - date;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

export default function DashboardDeltaPerkasa() {
  // State Utama
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedMonth, setSelectedMonth] = useState("SEMUA");
  const [selectedCustomer, setSelectedCustomer] = useState("SEMUA");
  const [selectedSales, setSelectedSales] = useState("SEMUA");
  const [selectedStatus, setSelectedStatus] = useState("SEMUA");
  
  // Data State mentah dari Google Sheets / Mock Data
  const [invoices, setInvoices] = useState([
    {
      id: 1,
      noInvoice: "INV/2026/001",
      tahun: "2026",
      bulan: "JANUARI",
      tanggal: "15/01/2026",
      customer: "PT Wijaya Karya",
      via: "ANDI",
      nilaiInvoice: 150000000,
      danaMasuk: 150000000,
      sisaTagihan: 0,
      status: "Lunas"
    },
    {
      id: 2,
      noInvoice: "INV/2026/002",
      tahun: "2026",
      bulan: "FEBRUARI",
      tanggal: "10/02/2026",
      customer: "PT PP (Persero)",
      via: "BUDI",
      nilaiInvoice: 220000000,
      danaMasuk: 100000000,
      sisaTagihan: 120000000,
      status: "Belum Lunas"
    },
    {
      id: 3,
      noInvoice: "INV/2026/003",
      tahun: "2026",
      bulan: "MARET",
      tanggal: "05/11/2025", // Contoh invoice lama untuk aging > 120 hari
      customer: "CV Sinar Sulawesi",
      via: "ANDI",
      nilaiInvoice: 85000000,
      danaMasuk: 10000000,
      sisaTagihan: 75000000,
      status: "Belum Lunas"
    },
    {
      id: 4,
      noInvoice: "INV/2025/099",
      tahun: "2025",
      bulan: "OKTOBER",
      tanggal: "12/10/2025", // Contoh invoice aging > 60 hari
      customer: "PT Bumi Mineral",
      via: "IRFAN",
      nilaiInvoice: 95000000,
      danaMasuk: 50000000,
      sisaTagihan: 45000000,
      status: "Belum Lunas"
    }
  ]);

  // Filter Data berdasarkan pilihan dropdown
  const filteredData = useMemo(() => {
    return invoices.filter((item) => {
      const matchYear = selectedYear === "SEMUA" || item.tahun === selectedYear;
      const matchMonth = selectedMonth === "SEMUA" || item.bulan === selectedMonth;
      const matchCust = selectedCustomer === "SEMUA" || item.customer === selectedCustomer;
      const matchSales = selectedSales === "SEMUA" || item.via === selectedSales;
      const matchStatus = selectedStatus === "SEMUA" || item.status === selectedStatus;
      return matchYear && matchMonth && matchCust && matchSales && matchStatus;
    });
  }, [invoices, selectedYear, selectedMonth, selectedCustomer, selectedSales, selectedStatus]);

  // Kalkulasi Ringkasan Utama
  const totalRevenue = filteredData.reduce((acc, curr) => acc + curr.nilaiInvoice, 0);
  const totalCashIn = filteredData.reduce((acc, curr) => acc + curr.danaMasuk, 0);
  const totalSisaTagihan = filteredData.reduce((acc, curr) => acc + curr.sisaTagihan, 0);
  const collectionRate = totalRevenue > 0 ? ((totalCashIn / totalRevenue) * 100).toFixed(1) : 0;

  // Data Unik untuk Dropdown Filter
  const customerList = useMemo(() => [...new Set(invoices.map(i => i.customer))], [invoices]);
  const salesList = useMemo(() => [...new Set(invoices.map(i => i.via))], [invoices]);

  // --- FITUR TAMBAHAN 1: AGING PIUTANG (>60 & >120 Hari) ---
  const agingSummary = useMemo(() => {
    let total60Days = 0;
    let total120Days = 0;
    let count60 = 0;
    let count120 = 0;

    filteredData.forEach((row) => {
      if (row.sisaTagihan > 0) {
        const age = calculateAgingDays(row.tanggal);
        if (age > 120) {
          total120Days += row.sisaTagihan;
          count120 += 1;
        } else if (age > 60) {
          total60Days += row.sisaTagihan;
          count60 += 1;
        }
      }
    });

    return { total60Days, total120Days, count60, count120 };
  }, [filteredData]);

  // --- FITUR TAMBAHAN 2: TOP CUSTOMER (PENYEWA TERBESAR) ---
  const topCustomerData = useMemo(() => {
    const map = {};
    filteredData.forEach((row) => {
      const cust = row.customer || "Unspecified";
      if (!map[cust]) map[cust] = 0;
      map[cust] += row.nilaiInvoice;
    });
    return Object.keys(map)
      .map((customer) => ({ customer, revenue: map[customer] }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredData]);

  // --- FITUR TAMBAHAN 3: KONTRIBUSI SALES (Untuk panel kanan) ---
  const contributionTableData = useMemo(() => {
    const map = {};
    let totalRev2026 = 0;
    filteredData.forEach((row) => {
      const s = row.via || "TANPA SALES";
      if (!map[s]) map[s] = 0;
      map[s] += row.nilaiInvoice;
      totalRev2026 += row.nilaiInvoice;
    });
    return Object.keys(map).map((sales) => ({
      sales,
      revenue: map[sales],
      kontribusi: totalRev2026 > 0 ? (map[sales] / totalRev2026) * 100 : 0
    })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredData]);

  const totalRevenue2026Sum = contributionTableData.reduce((acc, curr) => acc + curr.revenue, 0);

  // Data Sales Perform untuk Tab Dashboard utama
  const salesSummary = useMemo(() => {
    const map = {};
    filteredData.forEach((row) => {
      const s = row.via || "TANPA SALES";
      if (!map[s]) {
        map[s] = { totalRevenue: 0, totalCashIn: 0, totalSisaTagihan: 0, lunasCount: 0, outstandingCount: 0 };
      }
      map[s].totalRevenue += row.nilaiInvoice;
      map[s].totalCashIn += row.danaMasuk;
      map[s].totalSisaTagihan += row.sisaTagihan;
      if (row.status.toLowerCase() === "lunas") {
        map[s].lunasCount += 1;
      } else {
        map[s].outstandingCount += 1;
      }
    });
    return Object.keys(map).map(sales => ({ sales, ...map[sales] }));
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-6">
      {/* HEADER UTAMA */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900/80 backdrop-blur-md border border-slate-800 p-5 rounded-2xl mb-6 shadow-xl gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-red-600/20 text-red-500 border border-red-500/30 rounded-lg text-xs font-black uppercase tracking-wider">
              Delta Perkasa
            </span>
            <span className="text-xs text-slate-400 font-medium">| Heavy Equipment Rental Dashboard</span>
          </div>
          <h1 className="text-xl font-black text-white mt-1 tracking-tight">
            Monitoring Keuangan & Operasional Alat Berat
          </h1>
        </div>

        {/* TAB NAVIGASI */}
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 gap-1 overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "dashboard" ? "bg-red-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            }`}
          >
            Dashboard Utama
          </button>
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "overview" ? "bg-red-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("master")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "master" ? "bg-red-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            }`}
          >
            Master Data ({filteredData.length})
          </button>
        </div>
      </header>

      {/* FILTER PANEL */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-4 rounded-2xl mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 shadow-lg">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tahun</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500"
          >
            <option value="SEMUA">Semua Tahun</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Bulan</label>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500"
          >
            <option value="SEMUA">Semua Bulan</option>
            {MONTHS_ORDER.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Customer</label>
          <select 
            value={selectedCustomer} 
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500"
          >
            <option value="SEMUA">Semua Customer</option>
            {customerList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Sales / VIA</label>
          <select 
            value={selectedSales} 
            onChange={(e) => setSelectedSales(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500"
          >
            <option value="SEMUA">Semua Sales</option>
            {salesList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Status Invoice</label>
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500"
          >
            <option value="SEMUA">Semua Status</option>
            <option value="Lunas">Lunas</option>
            <option value="Belum Lunas">Belum Lunas</option>
          </select>
        </div>

        <div className="flex items-end">
          <button 
            onClick={() => { setSelectedYear("2026"); setSelectedMonth("SEMUA"); setSelectedCustomer("SEMUA"); setSelectedSales("SEMUA"); setSelectedStatus("SEMUA"); }}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-3 rounded-xl text-xs transition-all border border-slate-700 flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset Filter
          </button>
        </div>
      </div>

      {/* KARTU RINGKASAN UTAMA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">Total Revenue</div>
          <div className="text-xl font-black text-white">{formatRupiah(totalRevenue)}</div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">Total Cash In (Masuk)</div>
          <div className="text-xl font-black text-emerald-400">{formatRupiah(totalCashIn)}</div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">Sisa Tagihan (Piutang)</div>
          <div className="text-xl font-black text-red-400">{formatRupiah(totalSisaTagihan)}</div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">Collection Rate</div>
          <div className="text-xl font-black text-blue-400">{collectionRate}%</div>
        </div>
      </div>

      {/* --- FITUR TAMBAHAN: WIDGET AGING PIUTANG KRITIS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Piutang Kritis &gt; 60 Hari
            </div>
            <div className="text-lg font-black text-white">{formatRupiah(agingSummary.total60Days)}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Dari {agingSummary.count60} invoice belum lunas</div>
          </div>
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold rounded-xl">Warning</span>
        </div>

        <div className="bg-red-950/30 border border-red-600/40 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-red-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-500" /> Piutang Macet &gt; 120 Hari (Kritis)
            </div>
            <div className="text-lg font-black text-white">{formatRupiah(agingSummary.total120Days)}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Dari {agingSummary.count120} invoice prioritas tagih</div>
          </div>
          <span className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-xl">Danger</span>
        </div>
      </div>

      {/* --- FITUR TAMBAHAN: STATUS KETERSEDIAAN & UTILISASI ARMADA --- */}
      <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="w-4 h-4 text-red-500" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Status Ketersediaan &amp; Utilisasi Armada Terkini
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Excavator 20 Ton</div>
            <div className="text-sm font-black text-white">3 Unit <span className="text-[10px] font-semibold text-emerald-400">(On-Site)</span></div>
            <div className="text-[10px] text-slate-500 mt-1">1 Unit Standby di Pool</div>
          </div>
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Mini Excavator</div>
            <div className="text-sm font-black text-white">2 Unit <span className="text-[10px] font-semibold text-emerald-400">(On-Site)</span></div>
            <div className="text-[10px] text-slate-500 mt-1">2 Unit Standby di Pool</div>
          </div>
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Vibro Roller</div>
            <div className="text-sm font-black text-white">1 Unit <span className="text-[10px] font-semibold text-emerald-400">(On-Site)</span></div>
            <div className="text-[10px] text-slate-500 mt-1">1 Unit Standby di Pool</div>
          </div>
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Bulldozer / Grader</div>
            <div className="text-sm font-black text-white">2 Unit <span className="text-[10px] font-semibold text-emerald-400">(On-Site)</span></div>
            <div className="text-[10px] text-slate-500 mt-1">0 Unit Standby di Pool</div>
          </div>
        </div>
      </div>

      {/* KONTEN UTAMA BERDASARKAN TAB */}
      {activeTab === "dashboard" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Sisi Kiri: Performa Sales & Cash In */}
          <div className="xl:col-span-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {salesSummary.map((item, idx) => {
                const targetCashIn = item.totalRevenue * 0.8;
                const cashInPct = targetCashIn > 0 ? Math.min(Math.round((item.totalCashIn / targetCashIn) * 100), 100) : 0;
                
                return (
                  <div key={idx} className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-white bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
                        Sales VIA: {item.sales}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">Total Inv: {item.totalRevenue ? formatRupiah(item.totalRevenue) : "Rp 0"}</span>
                    </div>

                    <div className="bg-emerald-950/30 rounded-xl p-3 border border-emerald-900/40 mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase">CASH IN</span>
                        <span className="text-xs font-extrabold text-emerald-300">{cashInPct}%</span>
                      </div>
                      <div className="text-sm font-black text-white">{formatRupiah(item.totalCashIn)}</div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(cashInPct, 100)}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block font-medium">Sisa Tagihan</span>
                        <span className="font-bold text-red-400">{formatRupiah(item.totalSisaTagihan)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-medium">Status Invoices</span>
                        <span className="font-bold text-emerald-400">{item.lunasCount} Lunas</span> / <span className="text-slate-300">{item.outstandingCount} Belum</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* --- FITUR TAMBAHAN: TOP CUSTOMER (PENYEWA TERBESAR) --- */}
            <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                🏆 Top 5 Pelanggan / Penyewa Terbesar
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {topCustomerData.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-5 h-5 rounded-md bg-red-600/20 text-red-400 text-[10px] font-bold flex items-center justify-center border border-red-500/30 shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-200 truncate">{item.customer}</span>
                    </div>
                    <span className="text-xs font-black text-emerald-400 shrink-0">{formatRupiah(item.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Kontribusi Revenue 2026 */}
          <div className="xl:col-span-4 space-y-4">
            <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
                <PieChart className="w-4 h-4 text-red-500" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Kontribusi Revenue 2026
                </h3>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {contributionTableData.map((row, idx) => (
                  <div key={idx} className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-extrabold border border-slate-700">
                          {idx + 1}
                        </span>
                        {row.sales}
                      </span>
                      <span className="text-xs font-black text-red-400">
                        {row.kontribusi.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-400 mb-2">
                      <span>Revenue:</span>
                      <span className="font-bold text-slate-200">{formatRupiah(row.revenue)}</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-red-600 to-red-500 h-full rounded-full" style={{ width: `${Math.min(row.kontribusi, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase">Total Revenue:</span>
                <span className="font-black text-white">{formatRupiah(totalRevenue2026Sum)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            Overview Ringkasan Perusahaan
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            Dashboard Monitoring CV Chandra Delta Perkasa menyajikan data real-time untuk tahun 2025 dan 2026. Gunakan filter di bagian atas untuk menyaring data berdasarkan tahun, bulan, customer, sales, atau status pembayaran.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">Total Invoices Terfilter</div>
              <div className="text-2xl font-black text-white">{filteredData.length}</div>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">Collection Rate</div>
              <div className="text-2xl font-black text-emerald-400">{collectionRate}%</div>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">Total Sisa Tagihan</div>
              <div className="text-2xl font-black text-red-400">{formatRupiah(totalSisaTagihan)}</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MASTER INVOICE */}
      {activeTab === "master" && (
        <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Master Data Invoice ({filteredData.length} Data)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">No. Invoice</th>
                  <th className="p-3">Tahun / Bulan</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Sales / VIA</th>
                  <th className="p-3 text-right">Nilai Invoice</th>
                  <th className="p-3 text-right">Dana Masuk</th>
                  <th className="p-3 text-right">Sisa Tagihan</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-slate-500">
                      Tidak ada data invoice yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3 font-bold text-white">{row.noInvoice}</td>
                      <td className="p-3 text-slate-400">{row.tahun} - {row.bulan}</td>
                      <td className="p-3 font-medium text-slate-200">{row.customer}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md font-bold text-[10px]">
                          {row.via}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-white">{formatRupiah(row.nilaiInvoice)}</td>
                      <td className="p-3 text-right font-bold text-emerald-400">{formatRupiah(row.danaMasuk)}</td>
                      <td className="p-3 text-right font-bold text-red-400">{formatRupiah(row.sisaTagihan)}</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
