import React, { useState, useMemo, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  Search,
  RefreshCw,
  RotateCcw,
  Users,
  AlertTriangle,
  PieChart,
  BarChart2,
  Truck,
  CreditCard,
  CheckSquare
} from "lucide-react";

// Link Google Sheets CSV Publikasi Resmi (GID Sheet REKAP INVOICE: 586995800)
const ORIGINAL_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTo9EJbez7MyWx1yKXc-rzoN8vqYa1SEyc_ffe0bmb0Nq9D6hTAzdS1rbZ6_OnnYntvAYYoTIMQu03C/pub?gid=586995800&single=true&output=csv";

const MONTHS_ORDER = [
  "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
  "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
];

const SALES_LIST = ["ANS", "CDP", "FAN", "UCI", "BKP", "CDF", "SPL"];

const NAV_ITEMS = [
  { id: "dashboard", icon: LayoutDashboard, label: "Overview / Dashboard SPV" },
  { id: "kpi", icon: Users, label: "Sales Performance" },
  { id: "invoice", icon: FileText, label: "Master Invoice" },
  { id: "outstanding", icon: AlertTriangle, label: "Monitoring Outstanding" },
  { id: "kontribusi", icon: PieChart, label: "Kontribusi Revenue" },
  { id: "perbandingan", icon: BarChart2, label: "Perbandingan Revenue" },
  { id: "jobid", icon: Truck, label: "Job ID Status" },
  { id: "cashinall", icon: CreditCard, label: "Cash In All (2023-2026)" },
  { id: "todolist", icon: CheckSquare, label: "To Do List SPV" }
];

function cleanNumber(val) {
  if (!val) return 0;
  if (typeof val === "number") return val;
  let str = String(val).trim();
  if (!str) return 0;
  let isNegative = false;
  if (str.startsWith("(") && str.endsWith(")")) {
    isNegative = true;
    str = str.slice(1, -1);
  }
  str = str.replace(/Rp/gi, "").replace(/\s/g, "");
  if (str.includes(",") && str.includes(".")) {
    str = str.replace(/\./g, "").replace(",", ".");
  } else if (str.includes(",")) {
    str = str.replace(",", ".");
  } else if ((str.match(/\./g) || []).length > 1) {
    str = str.replace(/\./g, "");
  }
  const parsed = parseFloat(str);
  if (isNaN(parsed)) return 0;
  return isNegative ? -parsed : parsed;
}

function parseCSVLine(line) {
  const result = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

function parseMasterRekap(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) =>
    h.replace(/^"|"$/g, "").trim().toLowerCase()
  );

  const getIdx = (keywords) => {
    return headers.findIndex((h) => keywords.some((k) => h === k || h.includes(k)));
  };

  const idxTahun = getIdx(["tahun"]);
  const idxSales = getIdx(["via", "sales"]);
  const idxInv = getIdx(["no invoice", "nomor invoice", "no. invoice", "invoice"]);
  const idxCust = getIdx(["nama customer", "customer", "penyewa"]);
  const idxRev = getIdx(["nilai invoice", "total invoice", "revenue"]);
  const idxDanaMasuk = getIdx(["dana masuk", "pembayaran"]);
  const idxSisa = getIdx(["sisa tagihan", "sisa"]);
  const idxStatus = getIdx(["status invoice", "status"]);
  const idxMonth = getIdx(["month", "bulan"]);

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]).map((cell) => cell.replace(/^"|"$/g, "").trim());
    if (row.length === 0) continue;

    const noInv = idxInv !== -1 ? row[idxInv] || "" : "";
    const customer = idxCust !== -1 ? row[idxCust] || "" : "";
    const salesRaw = idxSales !== -1 ? row[idxSales] || "" : "";
    const monthRaw = idxMonth !== -1 ? row[idxMonth] || "" : "";
    const tahunRaw = idxTahun !== -1 ? row[idxTahun] || "" : "2026";

    const revVal = idxRev !== -1 ? cleanNumber(row[idxRev]) : 0;
    const danaMasukVal = idxDanaMasuk !== -1 ? cleanNumber(row[idxDanaMasuk]) : 0;
    const sisaVal = idxSisa !== -1 ? cleanNumber(row[idxSisa]) : revVal - danaMasukVal;
    const statusVal = idxStatus !== -1 ? row[idxStatus] || "" : "";

    if (!noInv && !customer && revVal === 0 && danaMasukVal === 0) continue;

    let tahunNorm = String(tahunRaw).replace(".0", "").trim();
    let monthNorm = monthRaw.toUpperCase().trim();
    let salesNorm = salesRaw.toUpperCase().trim();

    data.push({
      tahun: tahunNorm,
      bulan: monthNorm,
      sales: salesNorm,
      noInv,
      customer,
      revenue: revVal,
      danaMasuk: danaMasukVal,
      sisaTagihan: sisaVal,
      status: statusVal
    });
  }
  return data;
}

const formatIDR = (val) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(val || 0);
};

export default function App() {
  const [activeTab, setActiveTab] = useState("kpi");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filterTahun, setFilterTahun] = useState("2026");
  const [filterBulan, setFilterBulan] = useState("Semua bulan");
  const [filterSales, setFilterSales] = useState("Semua sales / VIA");
  const [filterStatus, setFilterStatus] = useState("Semua status");
  const [searchInv, setSearchInv] = useState("");
  const [searchCust, setSearchCust] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    // Daftar Proxy CORS Cadangan untuk Memastikan Data Terambil
    const urlsToTry = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(ORIGINAL_URL)}`,
      `https://corsproxy.io/?${encodeURIComponent(ORIGINAL_URL)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(ORIGINAL_URL)}`,
      ORIGINAL_URL
    ];

    let resText = "";
    let success = false;

    for (const url of urlsToTry) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          resText = await response.text();
          if (resText && resText.length > 50 && !resText.includes("<!DOCTYPE html>")) {
            success = true;
            break;
          }
        }
      } catch (e) {
        console.warn("Gagal di URL proxy:", url);
      }
    }

    if (success && resText) {
      const parsedData = parseMasterRekap(resText);
      if (parsedData.length > 0) {
        setInvoices(parsedData);
      } else {
        setError("Data berhasil ditarik, tetapi format header kolom tidak dikenali.");
      }
    } else {
      setError("Gagal menarik data dari Google Sheets. Periksa koneksi internet atau status publikasi CSV.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((item) => {
      if (filterTahun !== "Semua tahun" && item.tahun !== filterTahun) return false;
      if (
        filterBulan !== "Semua bulan" &&
        !item.bulan.toUpperCase().includes(filterBulan.toUpperCase())
      )
        return false;
      if (
        filterSales !== "Semua sales / VIA" &&
        !item.sales.includes(filterSales.toUpperCase())
      )
        return false;

      const st = item.status.toLowerCase();
      if (filterStatus === "Lunas" && !st.includes("lunas")) return false;
      if (filterStatus === "Kurang Bayar" && !st.includes("kurang")) return false;
      if (filterStatus === "Lebih Bayar" && !st.includes("lebih")) return false;
      if (filterStatus === "Belum Ada Pembayaran" && !st.includes("belum")) return false;

      if (searchInv && !item.noInv.toLowerCase().includes(searchInv.toLowerCase())) return false;
      if (searchCust && !item.customer.toLowerCase().includes(searchCust.toLowerCase())) return false;

      return true;
    });
  }, [invoices, filterTahun, filterBulan, filterSales, filterStatus, searchInv, searchCust]);

  const totalRevenue = useMemo(() => filteredInvoices.reduce((a, b) => a + b.revenue, 0), [filteredInvoices]);
  const totalDanaMasuk = useMemo(() => filteredInvoices.reduce((a, b) => a + b.danaMasuk, 0), [filteredInvoices]);
  const totalSisa = useMemo(() => filteredInvoices.reduce((a, b) => a + b.sisaTagihan, 0), [filteredInvoices]);

  const salesPerformance = useMemo(() => {
    return SALES_LIST.map((code) => {
      const items = filteredInvoices.filter((x) => x.sales.includes(code));
      const rev = items.reduce((a, b) => a + b.revenue, 0);
      const cash = items.reduce((a, b) => a + b.danaMasuk, 0);

      return {
        code,
        count: items.length,
        revenue: rev,
        cashIn: cash
      };
    });
  }, [filteredInvoices]);

  const monthlyComparison = useMemo(() => {
    return MONTHS_ORDER.map((m) => {
      const data2025 = invoices.filter(
        (x) => x.tahun === "2025" && x.bulan.includes(m) && (filterSales === "Semua sales / VIA" || x.sales.includes(filterSales.toUpperCase()))
      );
      const data2026 = invoices.filter(
        (x) => x.tahun === "2026" && x.bulan.includes(m) && (filterSales === "Semua sales / VIA" || x.sales.includes(filterSales.toUpperCase()))
      );

      const rev2025 = data2025.reduce((a, b) => a + b.revenue, 0);
      const rev2026 = data2026.reduce((a, b) => a + b.revenue, 0);
      const diff = rev2026 - rev2025;
      const growth = rev2025 > 0 ? ((diff / rev2025) * 100).toFixed(1) : 0;

      return {
        month: m,
        rev2025,
        rev2026,
        diff,
        growth
      };
    });
  }, [invoices, filterSales]);

  const handleResetFilter = () => {
    setFilterTahun("2026");
    setFilterBulan("Semua bulan");
    setFilterSales("Semua sales / VIA");
    setFilterStatus("Semua status");
    setSearchInv("");
    setSearchCust("");
  };

  return (
    <div className="flex h-screen bg-[#0b0e14] text-slate-100 font-sans overflow-hidden">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-72 bg-[#121722] border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-4 border-b border-slate-800/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white shadow-lg shadow-red-600/40">
              Δ
            </div>
            <div>
              <h1 className="text-xs font-bold tracking-wider text-red-500 uppercase">DASHBOARD MONITORING</h1>
              <p className="text-[10px] text-slate-400">CV CHANDRA DELTA PERKASA</p>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800/80 flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-400 text-[11px]">Live System</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold">Online</span>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#121722]/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-red-400">
                PIVOT: REKAP INVOICE 23242526
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-wide uppercase mt-1">
              {NAV_ITEMS.find((n) => n.id === activeTab)?.label || "DASHBOARD"}
            </h2>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-lg transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Syncing..." : "Sync Google Sheets"}
          </button>
        </header>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* FILTER CONTROLS */}
          <div className="bg-[#121722] border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                🔍 FILTER DATA (REKAP INVOICE)
              </span>
              <button
                onClick={handleResetFilter}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filter
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
              <select
                value={filterTahun}
                onChange={(e) => setFilterTahun(e.target.value)}
                className="bg-[#0b0e14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Semua tahun">Semua tahun</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>

              <select
                value={filterBulan}
                onChange={(e) => setFilterBulan(e.target.value)}
                className="bg-[#0b0e14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Semua bulan">Semua bulan</option>
                {MONTHS_ORDER.map((m) => (
                  <option key={m} value={m}>
                    {m.charAt(0) + m.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari nomor invoice"
                  value={searchInv}
                  onChange={(e) => setSearchInv(e.target.value)}
                  className="w-full bg-[#0b0e14] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white"
                />
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari customer"
                  value={searchCust}
                  onChange={(e) => setSearchCust(e.target.value)}
                  className="w-full bg-[#0b0e14] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white"
                />
              </div>

              <select
                value={filterSales}
                onChange={(e) => setFilterSales(e.target.value)}
                className="bg-[#0b0e14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Semua sales / VIA">Semua sales / VIA</option>
                {SALES_LIST.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#0b0e14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Semua status">Semua status</option>
                <option value="Lunas">Lunas</option>
                <option value="Kurang Bayar">Kurang Bayar</option>
                <option value="Lebih Bayar">Lebih Bayar</option>
                <option value="Belum Ada Pembayaran">Belum Ada Pembayaran</option>
              </select>
            </div>
          </div>

          {/* DASHBOARD SUMMARY & SALES CARDS */}
          {(activeTab === "dashboard" || activeTab === "kpi") && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#121722] border border-blue-500/30 rounded-2xl p-5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">TOTAL REVENUE</span>
                  <p className="text-xl font-bold text-white mt-2">{formatIDR(totalRevenue)}</p>
                </div>

                <div className="bg-[#121722] border border-emerald-500/30 rounded-2xl p-5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">CASH IN / DANA MASUK</span>
                  <p className="text-xl font-bold text-emerald-400 mt-2">{formatIDR(totalDanaMasuk)}</p>
                  <span className="text-[10px] text-emerald-500 font-semibold">
                    {totalRevenue ? ((totalDanaMasuk / totalRevenue) * 100).toFixed(1) : 0}% collection rate
                  </span>
                </div>

                <div className="bg-[#121722] border border-amber-500/30 rounded-2xl p-5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">SISA TAGIHAN</span>
                  <p className="text-xl font-bold text-amber-400 mt-2">{formatIDR(totalSisa)}</p>
                </div>

                <div className="bg-[#121722] border border-purple-500/30 rounded-2xl p-5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">JUMLAH INVOICE</span>
                  <p className="text-2xl font-bold text-white mt-2">{filteredInvoices.length}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  PERFORMA SALES PERSON INDIVIDUAL
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {salesPerformance.map((sp) => (
                    <div key={sp.code} className="bg-[#121722] border border-slate-800 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center">
                          {sp.code}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{sp.code}</h4>
                          <p className="text-[11px] text-slate-400">{sp.count} Invoices</p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase">TOTAL REVENUE</span>
                          <p className="font-bold text-white">{formatIDR(sp.revenue)}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase">TOTAL CASH IN</span>
                          <p className="font-bold text-emerald-400">{formatIDR(sp.cashIn)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* MASTER INVOICE & OUTSTANDING & CASH IN ALL */}
          {(activeTab === "invoice" || activeTab === "outstanding" || activeTab === "cashinall") && (
            <div className="bg-[#121722] border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 uppercase">
                {NAV_ITEMS.find((n) => n.id === activeTab)?.label}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#0b0e14] text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Thn</th>
                      <th className="p-3">Bulan</th>
                      <th className="p-3">No Invoice</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">VIA</th>
                      <th className="p-3">Nilai Invoice</th>
                      <th className="p-3">Dana Masuk</th>
                      <th className="p-3">Sisa Tagihan</th>
                      <th className="p-3">Status Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredInvoices
                      .filter((inv) => activeTab !== "outstanding" || inv.sisaTagihan > 0)
                      .map((inv, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="p-3 text-slate-400">{inv.tahun}</td>
                          <td className="p-3 text-slate-400">{inv.bulan}</td>
                          <td className="p-3 text-blue-400 font-semibold">{inv.noInv || "-"}</td>
                          <td className="p-3">{inv.customer || "-"}</td>
                          <td className="p-3 font-semibold">{inv.sales || "-"}</td>
                          <td className="p-3 font-semibold">{formatIDR(inv.revenue)}</td>
                          <td className="p-3 text-emerald-400">{formatIDR(inv.danaMasuk)}</td>
                          <td className="p-3 text-amber-400">{formatIDR(inv.sisaTagihan)}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded text-[10px] font-bold ${
                                inv.status.toLowerCase().includes("lunas")
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : inv.status.toLowerCase().includes("kurang")
                                  ? "bg-amber-500/20 text-amber-400"
                                  : inv.status.toLowerCase().includes("lebih")
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {inv.status || "Belum Ada"}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* KONTRIBUSI REVENUE */}
          {activeTab === "kontribusi" && (
            <div className="bg-[#121722] border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase">KONTRIBUSI REVENUE PER SALES</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {salesPerformance.map((sp) => {
                  const percentage = totalRevenue ? ((sp.revenue / totalRevenue) * 100).toFixed(1) : 0;
                  return (
                    <div key={sp.code} className="p-4 bg-[#0b0e14] border border-slate-800 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm">{sp.code}</span>
                        <span className="text-xs font-semibold text-blue-400">{percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                      </div>
                      <p className="text-xs text-slate-400">{formatIDR(sp.revenue)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PERBANDINGAN REVENUE */}
          {activeTab === "perbandingan" && (
            <div className="bg-[#121722] border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase">PERBANDINGAN REVENUE 2025 VS 2026 PER BULAN</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#0b0e14] text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Bulan</th>
                      <th className="p-3">Revenue 2025</th>
                      <th className="p-3">Revenue 2026</th>
                      <th className="p-3">Selisih</th>
                      <th className="p-3">Pertumbuhan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {monthlyComparison.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="p-3 font-semibold text-white">{m.month}</td>
                        <td className="p-3 text-slate-400">{formatIDR(m.rev2025)}</td>
                        <td className="p-3 text-emerald-400 font-semibold">{formatIDR(m.rev2026)}</td>
                        <td className={`p-3 font-semibold ${m.diff >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {formatIDR(m.diff)}
                        </td>
                        <td className={`p-3 font-bold ${m.growth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {m.growth}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* JOB ID STATUS */}
          {activeTab === "jobid" && (
            <div className="bg-[#121722] border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white uppercase">JOB ID STATUS</h3>
              <p className="text-xs text-slate-400">Monitoring status pengerjaan unit / Job ID sewa alat berat.</p>
            </div>
          )}

          {/* TO DO LIST SPV */}
          {activeTab === "todolist" && (
            <div className="bg-[#121722] border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white uppercase">TO DO LIST SUPERVISOR</h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="p-3 bg-[#0b0e14] border border-slate-800 rounded-xl flex items-center gap-3">
                  <input type="checkbox" className="rounded bg-slate-800 border-slate-700" />
                  <span>Follow up penagihan status Kurang Bayar &amp; Outstanding invoice.</span>
                </li>
                <li className="p-3 bg-[#0b0e14] border border-slate-800 rounded-xl flex items-center gap-3">
                  <input type="checkbox" className="rounded bg-slate-800 border-slate-700" />
                  <span>Verifikasi rekap pencairan Cash In bulanan dengan tim keuangan.</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
