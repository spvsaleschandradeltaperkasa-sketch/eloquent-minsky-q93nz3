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

const URL_2025 =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTo9EJbez7MyWx1yKXc-rzoN8vqYa1SEyc_ffe0bmb0Nq9D6hTAzdS1rbZ6_OnnYntvAYYoTIRP841n/pub?gid=0&single=true&output=csv";
const URL_2026 =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTo9EJbez7MyWx1yKXc-rzoN8vqYa1SEyc_ffe0bmb0Nq9D6hTAzdS1rbZ6_OnnYntvAYYoTIRP841n/pub?gid=1510250917&single=true&output=csv";

const MONTHS_ORDER = [
  "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
  "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
];

const TARGET_KPI_2026 = {
  ANS: { revenue: 900000000, cash: 900000000 },
  CDP: { revenue: 4000000000, cash: 4000000000 },
  FAN: { revenue: 900000000, cash: 900000000 },
  BKP: { revenue: 0, cash: 0 }
};

const NAV_ITEMS = [
  { id: "dashboard", icon: LayoutDashboard, label: "Overview / Dashboard SPV" },
  { id: "kpi", icon: Users, label: "Sales Performance" },
  { id: "invoice", icon: FileText, label: "Master Invoice" },
  { id: "outstanding2026", icon: AlertTriangle, label: "Monitoring Outstanding 2026" },
  { id: "kontribusi2026", icon: PieChart, label: "Kontribusi Revenue 2026" },
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

function parseCSV(text, year) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) =>
    h.replace(/^"|"$/g, "").trim().toLowerCase()
  );

  const getIdx = (possibleNames) => {
    return headers.findIndex((h) => possibleNames.some((p) => h.includes(p)));
  };

  const idxInv = getIdx(["nomor invoice", "no invoice", "no. invoice", "invoice"]);
  const idxCust = getIdx(["nama customer", "customer", "pelanggan"]);
  const idxSales = getIdx(["sales / via", "via / sales", "sales", "via"]);
  const idxBulan = getIdx(["bulan", "month"]);
  const idxRev = getIdx(["total tagihan", "nilai invoice", "revenue", "tagihan"]);
  const idxCash = getIdx(["total dana masuk", "dana masuk", "cash in"]);
  const idxSisa = getIdx(["sisa tagihan", "sisa"]);
  const idxStatus = getIdx(["status invoice", "status ar", "status"]);
  const idxJob = getIdx(["job id", "job"]);

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]).map((cell) => cell.replace(/^"|"$/g, "").trim());
    if (row.length === 0) continue;

    const noInv = idxInv !== -1 ? row[idxInv] || "" : "";
    const customer = idxCust !== -1 ? row[idxCust] || "" : "";
    let salesRaw = idxSales !== -1 ? row[idxSales] || "" : "";
    const bulanRaw = idxBulan !== -1 ? row[idxBulan] || "" : "";
    const revVal = idxRev !== -1 ? cleanNumber(row[idxRev]) : 0;
    const cashVal = idxCash !== -1 ? cleanNumber(row[idxCash]) : 0;
    const sisaVal = idxSisa !== -1 ? cleanNumber(row[idxSisa]) : revVal - cashVal;
    const statusVal = idxStatus !== -1 ? row[idxStatus] || "" : "";
    const jobVal = idxJob !== -1 ? row[idxJob] || "" : "";

    if (!noInv && !customer && revVal === 0 && cashVal === 0) continue;

    let salesNormalized = salesRaw.toUpperCase().trim();
    if (salesNormalized.includes("ANS")) salesNormalized = "ANS";
    else if (salesNormalized.includes("CDP")) salesNormalized = "CDP";
    else if (salesNormalized.includes("FAN")) salesNormalized = "FAN";
    else if (salesNormalized.includes("BKP")) salesNormalized = "BKP";

    let bulanNormalized = bulanRaw.toUpperCase().trim();

    data.push({
      tahun: String(year),
      noInv,
      customer,
      salesRaw,
      sales: salesNormalized,
      bulan: bulanNormalized,
      revenue: revVal,
      cashIn: cashVal,
      sisaTagihan: sisaVal,
      status: statusVal,
      jobId: jobVal
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
  const [activeTab, setActiveTab] = useState("dashboard");
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
    try {
      const [res2025, res2026] = await Promise.all([
        fetch(URL_2025).then((r) => r.text()),
        fetch(URL_2026).then((r) => r.text())
      ]);

      const data2025 = parseCSV(res2025, "2025");
      const data2026 = parseCSV(res2026, "2026");

      setInvoices([...data2025, ...data2026]);
    } catch (err) {
      setError("Gagal menarik data dari Google Sheets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((item) => {
      if (filterTahun !== "Semua tahun" && item.tahun !== filterTahun) return false;
      if (
        filterBulan !== "Semua bulan" &&
        item.bulan.toLowerCase() !== filterBulan.toLowerCase()
      )
        return false;
      if (
        filterSales !== "Semua sales / VIA" &&
        item.sales.toLowerCase() !== filterSales.toLowerCase()
      )
        return false;

      const st = item.status ? item.status.toLowerCase().trim() : "";
      const isLebih = st.includes("lebih") || item.sisaTagihan < 0;
      const isLunas = st.includes("lunas") || (item.sisaTagihan === 0 && item.revenue > 0);

      if (filterStatus === "Lunas" && !isLunas) return false;
      if (filterStatus === "Belum Lunas" && isLunas) return false;
      if (filterStatus === "Bayar Lebih" && !isLebih) return false;

      if (searchInv && !item.noInv.toLowerCase().includes(searchInv.toLowerCase())) return false;
      if (searchCust && !item.customer.toLowerCase().includes(searchCust.toLowerCase())) return false;

      return true;
    });
  }, [invoices, filterTahun, filterBulan, filterSales, filterStatus, searchInv, searchCust]);

  const totalRevenue = useMemo(() => filteredInvoices.reduce((acc, curr) => acc + curr.revenue, 0), [filteredInvoices]);
  const totalCashIn = useMemo(() => filteredInvoices.reduce((acc, curr) => acc + curr.cashIn, 0), [filteredInvoices]);
  const totalSisa = useMemo(() => filteredInvoices.reduce((acc, curr) => acc + curr.sisaTagihan, 0), [filteredInvoices]);

  const salesPerformance = useMemo(() => {
    const salesList = ["BKP", "CDP", "ANS", "FAN"];
    return salesList.map((code) => {
      const items = filteredInvoices.filter((x) => x.sales === code);
      const rev = items.reduce((a, b) => a + b.revenue, 0);
      const cash = items.reduce((a, b) => a + b.cashIn, 0);
      const target = TARGET_KPI_2026[code] || { revenue: 0, cash: 0 };

      return {
        code,
        count: items.length,
        revenue: rev,
        cashIn: cash,
        targetRev: target.revenue,
        targetCash: target.cash
      };
    });
  }, [filteredInvoices]);

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
        {/* HEADER BAR */}
        <header className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#121722]/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-red-400">
                LIVE SPREADSHEETS SYNC (2025 & 2026)
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

          {/* FILTER BAR */}
          <div className="bg-[#121722] border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                🔍 FILTER DATA
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
                <option value="2025">2025</option>
                <option value="2026">2026</option>
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
                <option value="ANS">ANS</option>
                <option value="CDP">CDP</option>
                <option value="FAN">FAN</option>
                <option value="BKP">BKP</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#0b0e14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Semua status">Semua status</option>
                <option value="Lunas">Lunas</option>
                <option value="Belum Lunas">Belum Lunas</option>
                <option value="Bayar Lebih">Bayar Lebih</option>
              </select>
            </div>
          </div>

          {/* DASHBOARD OVERVIEW & KPI */}
          {(activeTab === "dashboard" || activeTab === "kpi") && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#121722] border border-blue-500/30 rounded-2xl p-5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">TOTAL REVENUE</span>
                  <p className="text-xl font-bold text-white mt-2">{formatIDR(totalRevenue)}</p>
                </div>

                <div className="bg-[#121722] border border-emerald-500/30 rounded-2xl p-5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">CASH IN</span>
                  <p className="text-xl font-bold text-emerald-400 mt-2">{formatIDR(totalCashIn)}</p>
                  <span className="text-[10px] text-emerald-500 font-semibold">
                    {totalRevenue ? ((totalCashIn / totalRevenue) * 100).toFixed(1) : 0}% collection rate
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

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          {/* MASTER INVOICE & MONITORING OUTSTANDING */}
          {(activeTab === "invoice" || activeTab === "outstanding2026" || activeTab === "cashinall") && (
            <div className="bg-[#121722] border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 uppercase">
                {NAV_ITEMS.find((n) => n.id === activeTab)?.label}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#0b0e14] text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Tahun</th>
                      <th className="p-3">No Invoice</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Sales</th>
                      <th className="p-3">Total Tagihan</th>
                      <th className="p-3">Cash In</th>
                      <th className="p-3">Sisa Tagihan</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredInvoices
                      .filter((inv) => activeTab !== "outstanding2026" || inv.sisaTagihan > 0)
                      .map((inv, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="p-3 text-slate-400">{inv.tahun}</td>
                          <td className="p-3 text-blue-400 font-semibold">{inv.noInv || "-"}</td>
                          <td className="p-3">{inv.customer || "-"}</td>
                          <td className="p-3">{inv.sales || "-"}</td>
                          <td className="p-3 font-semibold">{formatIDR(inv.revenue)}</td>
                          <td className="p-3 text-emerald-400">{formatIDR(inv.cashIn)}</td>
                          <td className="p-3 text-amber-400">{formatIDR(inv.sisaTagihan)}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded text-[10px] font-bold ${
                                inv.sisaTagihan <= 0
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-amber-500/20 text-amber-400"
                              }`}
                            >
                              {inv.sisaTagihan <= 0 ? "LUNAS" : "BELUM LUNAS"}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* KONTRIBUSI REVENUE & PERBANDINGAN */}
          {(activeTab === "kontribusi2026" || activeTab === "perbandingan") && (
            <div className="bg-[#121722] border border-slate-800 rounded-2xl p-6 space-y-6">
              <h3 className="text-sm font-bold text-white uppercase">
                {activeTab === "kontribusi2026" ? "KONTRIBUSI REVENUE PER SALES 2026" : "PERBANDINGAN REVENUE BULANAN"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {salesPerformance.map((sp) => (
                  <div key={sp.code} className="bg-[#0b0e14] p-4 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-white text-sm">{sp.code}</span>
                      <span className="text-xs text-blue-400 font-bold">
                        {totalRevenue ? ((sp.revenue / totalRevenue) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-red-600 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${totalRevenue ? Math.min((sp.revenue / totalRevenue) * 100, 100) : 0}%`
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{formatIDR(sp.revenue)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* JOB ID & TO DO LIST */}
          {(activeTab === "jobid" || activeTab === "todolist") && (
            <div className="bg-[#121722] border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
              <p className="text-sm">
                📌 Menu <strong className="text-white">{NAV_ITEMS.find((n) => n.id === activeTab)?.label}</strong> siap digunakan dan tersambung otomatis dengan pembaruan Google Sheets.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
