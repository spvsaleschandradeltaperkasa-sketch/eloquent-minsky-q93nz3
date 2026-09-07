import React, { useState, useMemo, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  Search,
  RefreshCw,
  RotateCcw,
  Users,
  Lock,
  LogOut,
  UserCheck,
  PieChart,
  Clock,
  AlertTriangle,
  TrendingUp,
  Briefcase,
} from "lucide-react";

const URL_2025 =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTo9EJbez7MyWXlYkXc-rzoN8vqYa1SEyC_ffeObmb0Nq9D6hTAzdS1rbZ6_OnnYntvAYYoTIMQu03C/pub?gid=181359356&single=true&output=csv";
const URL_2026 =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTo9EJbez7MyWXlYkXc-rzoN8vqYa1SEyC_ffeObmb0Nq9D6hTAzdS1rbZ6_OnnYntvAYYoTIMQu03C/pub?gid=586995800&single=true&output=csv";
const URL_JOB_ID =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTo9EJbez7MyWXlYkXc-rzoN8vqYa1SEyC_ffeObmb0Nq9D6hTAzdS1rbZ6_OnnYntvAYYoTIMQu03C/pub?gid=1656309510&single=true&output=csv";

const MONTHS_ORDER = [
  "JANUARI","
  "FEBRUARI",
  "MARET",
  "APRIL",
  "MEI",
  "JUNI",
  "JULI",
  "AGUSTUS",
  "SEPTEMBER",
  "OKTOBER",
  "NOVEMBER",
  "DESEMBER",
];

const ALLOWED_USERS = [
  { username: "admin", password: "123", role: "Administrator" },
  { username: "delta", password: "delta2026", role: "Management" },
  { username: "sales", password: "sales123", role: "Sales Team" },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [inputUser, setInputUser] = useState("");
  const [inputPass, setInputPass] = useState("");
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState("sales");
  const [invoices, setInvoices] = useState([]);
  const [jobIdData, setJobIdData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterTahun, setFilterTahun] = useState("2026");
  const [filterBulan, setFilterBulan] = useState("Semua bulan");
  const [filterNoInvoice, setFilterNoInvoice] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterSales, setFilterSales] = useState("Semua sales / VIA");
  const [filterStatus, setFilterStatus] = useState("Semua status");
  const [filterJobSearch, setFilterJobSearch] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError("");

    const found = ALLOWED_USERS.find(
      (u) => u.username === inputUser.trim() && u.password === inputPass.trim()
    );

    if (found) {
      setIsLoggedIn(true);
      setCurrentUser(found.username);
    } else {
      setLoginError("Username atau Password salah!");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setInputUser("");
    setInputPass("");
    setCurrentUser("");
  };

  const getSalesTargets = (tahun, bulan) => {
    let cdpRev = 2000000000;
    let cdpCash = 2000000000;

    if (tahun === "2026" && bulan !== "Semua bulan") {
      const monthIndex = MONTHS_ORDER.indexOf(bulan.toUpperCase());
      const sepIndex = MONTHS_ORDER.indexOf("SEPTEMBER");

      if (monthIndex >= sepIndex) {
        cdpRev = 4000000000;
        cdpCash = 4000000000;
      }
    }

    return {
      CDP: { revenue: cdpRev, cashIn: cdpCash },
      ANS: {
        revenue: 900000000,
        cashIn: 800000000,
        isCombined: true,
        combinedWith: ["ANS", "FAN"],
      },
      FAN: {
        revenue: 900000000,
        cashIn: 800000000,
        isCombined: true,
        combinedWith: ["ANS", "FAN"],
      },
    };
  };

  const activeTargets = useMemo(() => {
    return getSalesTargets(filterTahun, filterBulan);
  }, [filterTahun, filterBulan]);

  const parseCSV = (text, defaultYear) => {
    const lines = text.split(/\r\n|\n/);
    if (lines.length < 2) return [];

    const result = [];
    const parseLine = (str) => {
      const arr = [];
      let quote = false;
      let col = "";
      for (let c of str) {
        if (c === '"') {
          quote = !quote;
        } else if (c === "," && !quote) {
          arr.push(col.trim());
          col = "";
        } else {
          col += c;
        }
      }
      arr.push(col.trim());
      return arr;
    };

    const cleanNum = (val) => {
      if (!val) return 0;
      let s = val.replace(/"/g, "").trim();
      if (s === "-" || s === "") return 0;
      if (s.includes(".")) {
        s = s.replace(/\./g, "").replace(",", ".");
      } else {
        s = s.replace(",", ".");
      }
      return parseFloat(s) || 0;
    };

    const cleanStr = (val) => (val ? val.replace(/^"|"$/g, "").trim() : "");

    const calculateAgingDays = (tanggalStr, thnStr, blnStr) => {
      let invoiceDate = new Date();
      if (tanggalStr && tanggalStr !== "-") {
        const parsed = new Date(tanggalStr);
        if (!isNaN(parsed.getTime())) {
          invoiceDate = parsed;
        } else {
          const mIdx = MONTHS_ORDER.indexOf(blnStr ? blnStr.toUpperCase() : "");
          if (mIdx !== -1) {
            invoiceDate = new Date(parseInt(thnStr || defaultYear), mIdx, 1);
          }
        }
      } else {
        const mIdx = MONTHS_ORDER.indexOf(blnStr ? blnStr.toUpperCase() : "");
        if (mIdx !== -1) {
          invoiceDate = new Date(parseInt(thnStr || defaultYear), mIdx, 1);
        } else {
          invoiceDate = new Date(parseInt(thnStr || defaultYear), 0, 1);
        }
      }
      const diffTime = Math.abs(new Date() - invoiceDate);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cols = parseLine(lines[i]);

      const colTahun = cleanStr(cols[0]);
      const colVia = cleanStr(cols[1]);
      const colVia2 = cleanStr(cols[23]);
      const noInv = cleanStr(cols[3]);
      const cust = cleanStr(cols[5]);
      const colMonth = cleanStr(cols[21]);
      const colDate = cleanStr(cols[4]);

      if (!noInv && !cust) continue;

      const thn = colTahun ? colTahun.replace(".0", "") : defaultYear;
      const salesName = colVia2 || colVia || "-";
      const sisa = cleanNum(cols[15]);
      const agingDays = sisa > 0 ? calculateAgingDays(colDate, thn, colMonth) : 0;

      result.push({
        id: `${defaultYear}-${i}`,
        tahun: thn,
        bulan: colMonth ? colMonth.toUpperCase() : "-",
        via: salesName,
        noInvoice: noInv || "-",
        tanggal: colDate || "-",
        customer: cust || "Unspecified Customer",
        nilaiInvoice: cleanNum(cols[10]),
        danaMasuk: cleanNum(cols[13]),
        sisaTagihan: sisa,
        status: cleanStr(cols[16]) || "Belum ada Pembayaran",
        agingDays: agingDays,
      });
    }
    return result;
  };

  const parseJobIdCSV = (text) => {
    const lines = text.split(/\r\n|\n/);
    if (lines.length < 2) return [];
    const result = [];
    const parseLine = (str) => {
      const arr = [];
      let quote = false;
      let col = "";
      for (let c of str) {
        if (c === '"') {
          quote = !quote;
        } else if (c === "," && !quote) {
          arr.push(col.trim());
          col = "";
        } else {
          col += c;
        }
      }
      arr.push(col.trim());
      return arr;
    };

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cols = parseLine(lines[i]);
      const cleanStr = (val) => (val ? val.replace(/^"|"$/g, "").trim() : "");
      
      const jobIdVal = cleanStr(cols[6]) || "-";
      const viaVal = cleanStr(cols[8]) || "-";
      const jenisSewaVal = cleanStr(cols[9]) || "-";
      const namaPenyewaVal = cleanStr(cols[10]) || "-";
      const jenisPenyewaVal = cleanStr(cols[11]) || "-";
      const kodeUnitVal = cleanStr(cols[12]) || "-";
      const classVal = cleanStr(cols[15]) || "-";
      const lokasiKerjaVal = cleanStr(cols[18]) || "-";

      if (jobIdVal === "-" && namaPenyewaVal === "-") continue;

      result.push({
        id: `job-${i}`,
        no: i,
        jobId: jobIdVal,
        via: viaVal,
        jenisSewa: jenisSewaVal,
        namaPenyewa: namaPenyewaVal,
        jenisPenyewa: jenisPenyewaVal,
        kodeUnit: kodeUnitVal,
        classUnit: classVal,
        lokasiKerja: lokasiKerjaVal,
      });
    }
    return result;
  };

  const fetchGoogleSheetsData = async () => {
    setLoading(true);
    try {
      let combinedData = [];

      if (URL_2025) {
        const res2025 = await fetch(URL_2025);
        const text2025 = await res2025.text();
        const data2025 = parseCSV(text2025, "2025");
        combinedData = [...combinedData, ...data2025];
      }

      if (URL_2026) {
        const res2026 = await fetch(URL_2026);
        const text2026 = await res2026.text();
        const data2026 = parseCSV(text2026, "2026");
        combinedData = [...combinedData, ...data2026];
      }

      setInvoices(combinedData);

      if (URL_JOB_ID) {
        const resJob = await fetch(URL_JOB_ID);
        const textJob = await resJob.text();
        const parsedJob = parseJobIdCSV(textJob);
        setJobIdData(parsedJob);
      }
    } catch (err) {
      console.error("Gagal mengambil data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchGoogleSheetsData();
    }
  }, [isLoggedIn]);

  const filteredData = useMemo(() => {
    return invoices.filter((item) => {
      const st = item.status ? item.status.toLowerCase().trim() : "";
      const isLebih = st.includes("lebih") || item.sisaTagihan < 0;
      const isLunas = st.includes("lunas") || (item.sisaTagihan === 0 && item.danaMasuk > 0);

      if (filterTahun !== "Semua tahun" && item.tahun !== filterTahun)
        return false;
      if (
        filterBulan !== "Semua bulan" &&
        item.bulan !== filterBulan.toUpperCase()
      )
        return false;
      if (
        filterNoInvoice &&
        !item.noInvoice.toLowerCase().includes(filterNoInvoice.toLowerCase())
      )
        return false;
      if (
        filterCustomer &&
        !item.customer.toLowerCase().includes(filterCustomer.toLowerCase())
      )
        return false;
      if (
        filterSales !== "Semua sales / VIA" &&
        item.via.toUpperCase() !== filterSales.toUpperCase()
      )
        return false;

      if (filterStatus !== "Semua status") {
        if (filterStatus === "Belum Lunas (Kurang Bayar & Belum Bayar)") {
          if (isLunas || isLebih) return false;
        } else if (filterStatus === "Lebih Bayar") {
          if (!isLebih) return false;
        } else if (filterStatus === "Lunas") {
          if (!isLunas) return false;
        } else if (filterStatus === "Kurang Bayar") {
          if (!st.includes("kurang") && !(item.sisaTagihan > 0 && item.danaMasuk > 0)) return false;
        } else if (filterStatus === "Belum ada Pembayaran") {
          if (!st.includes("belum ada") && item.danaMasuk !== 0) return false;
        }
      }
      return true;
    });
  }, [
    invoices,
    filterTahun,
    filterBulan,
    filterNoInvoice,
    filterCustomer,
    filterSales,
    filterStatus,
  ]);

  const filteredJobIdData = useMemo(() => {
    if (!filterJobSearch) return jobIdData;
    return jobIdData.filter(
      (j) =>
        j.jobId.toLowerCase().includes(filterJobSearch.toLowerCase()) ||
        j.namaPenyewa.toLowerCase().includes(filterJobSearch.toLowerCase()) ||
        j.kodeUnit.toLowerCase().includes(filterJobSearch.toLowerCase()) ||
        j.lokasiKerja.toLowerCase().includes(filterJobSearch.toLowerCase()) ||
        j.via.toLowerCase().includes(filterJobSearch.toLowerCase())
    );
  }, [jobIdData, filterJobSearch]);

  const combinedAnsFanData = useMemo(() => {
    const ansFanInvoices = filteredData.filter((row) =>
      ["ANS", "FAN"].includes(row.via.toUpperCase())
    );
    const revenue = ansFanInvoices.reduce(
      (acc, curr) => acc + curr.nilaiInvoice,
      0
    );
    const cashIn = ansFanInvoices.reduce(
      (acc, curr) => acc + curr.danaMasuk,
      0
    );
    return { revenue, cashIn };
  }, [filteredData]);

  const salesPerformanceData = useMemo(() => {
    const map = {};
    filteredData.forEach((row) => {
      const sales = row.via || "Lainnya";
      const st = row.status ? row.status.toLowerCase().trim() : "";
      const isLebih = st.includes("lebih") || row.sisaTagihan < 0;
      const isLunas = st.includes("lunas") || (row.sisaTagihan === 0 && row.danaMasuk > 0);

      if (!map[sales]) {
        map[sales] = {
          sales,
          totalRevenue: 0,
          totalCashIn: 0,
          totalSisaTagihan: 0,
          lunasCount: 0,
          outstandingCount: 0,
          totalCount: 0,
        };
      }
      map[sales].totalRevenue += row.nilaiInvoice;
      map[sales].totalCashIn += row.danaMasuk;
      map[sales].totalSisaTagihan += row.sisaTagihan;
      map[sales].totalCount += 1;

      if (isLunas || isLebih) {
        map[sales].lunasCount += 1;
      } else {
        map[sales].outstandingCount += 1;
      }
    });
    return Object.values(map).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredData]);

  const contributionTableData = useMemo(() => {
    const data2026Only = invoices.filter((item) => item.tahun === "2026");
    const map = {};
    let totalRev2026 = 0;

    data2026Only.forEach((row) => {
      const sales = row.via || "Lainnya";
      if (!map[sales]) {
        map[sales] = 0;
      }
      map[sales] += row.nilaiInvoice;
      totalRev2026 += row.nilaiInvoice;
    });

    const result = Object.keys(map).map((sales) => {
      const rev = map[sales];
      const kontribusi = totalRev2026 > 0 ? (rev / totalRev2026) * 100 : 0;
      return { sales, revenue: rev, kontribusi };
    });

    return result.sort((a, b) => b.revenue - a.revenue);
  }, [invoices]);

  const totalRevenue2026Sum = useMemo(() => {
    return contributionTableData.reduce((acc, curr) => acc + curr.revenue, 0);
  }, [contributionTableData]);

  const agingSummary = useMemo(() => {
    let current = 0;
    let aging31_60 = 0;
    let aging60_120 = 0;
    let agingCritical120 = 0;

    filteredData.forEach((item) => {
      if (item.sisaTagihan > 0) {
        if (item.agingDays <= 30) {
          current += item.sisaTagihan;
        } else if (item.agingDays <= 60) {
          aging31_60 += item.sisaTagihan;
        } else if (item.agingDays <= 120) {
          aging60_120 += item.sisaTagihan;
        } else {
          agingCritical120 += item.sisaTagihan;
        }
      }
    });

    return { current, aging31_60, aging60_120, agingCritical120 };
  }, [filteredData]);

  const monthlyTrendData = useMemo(() => {
    const targetYear = filterTahun === "Semua tahun" ? "2026" : filterTahun;
    const map = {};
    MONTHS_ORDER.forEach((m) => {
      map[m] = { revenue: 0, cashIn: 0 };
    });

    invoices.forEach((row) => {
      if (row.tahun === targetYear && map[row.bulan]) {
        map[row.bulan].revenue += row.nilaiInvoice;
        map[row.bulan].cashIn += row.danaMasuk;
      }
    });

    let maxVal = 1000000;
    const result = MONTHS_ORDER.map((m) => {
      const rev = map[m].revenue;
      const cash = map[m].cashIn;
      if (rev > maxVal) maxVal = rev;
      if (cash > maxVal) maxVal = cash;
      return { bulan: m, revenue: rev, cashIn: cash };
    });

    return { data: result, maxVal };
  }, [invoices, filterTahun]);

  const totalRevenue = useMemo(
    () => filteredData.reduce((acc, curr) => acc + curr.nilaiInvoice, 0),
    [filteredData]
  );
  const totalCashIn = useMemo(
    () => filteredData.reduce((acc, curr) => acc + curr.danaMasuk, 0),
    [filteredData]
  );
  const totalSisaTagihan = useMemo(
    () => filteredData.reduce((acc, curr) => acc + curr.sisaTagihan, 0),
    [filteredData]
  );
  const collectionRate =
    totalRevenue > 0 ? ((totalCashIn / totalRevenue) * 100).toFixed(1) : "0.0";

  const resetFilters = () => {
    setFilterTahun("2026");
    setFilterBulan("Semua bulan");
    setFilterNoInvoice("");
    setFilterCustomer("");
    setFilterSales("Semua sales / VIA");
    setFilterStatus("Semua status");
    setFilterJobSearch("");
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen bg-slate-950 items-center justify-center p-4 font-sans text-slate-100 antialiased selection:bg-red-500 selection:text-white">
        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-red-950/20">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-16 w-16 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-red-600/30 font-black text-3xl border border-red-500/50">
              Δ
            </div>
            <h1 className="text-xl font-black text-white tracking-wider uppercase">
              CV CHANDRA DELTA PERKASA
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Silakan login untuk mengakses Dashboard Monitoring
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <UserCheck className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Masukkan username..."
                  value={inputUser}
                  onChange={(e) => setInputUser(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-200 font-medium focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Masukkan password..."
                  value={inputPass}
                  onChange={(e) => setInputPass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-200 font-medium focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl text-center">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-600/30 border border-red-500/40 active:scale-95 mt-2"
            >
              Masuk Dashboard
            </button>
          </form>

          <div className="mt-8 pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 text-center font-medium">
            Info Login Bawaan:<br />
            <span className="text-slate-400">admin / 123</span> | <span className="text-slate-400">delta / delta2026</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-900 font-sans text-slate-100 antialiased selection:bg-red-500 selection:text-white">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-950/80 backdrop-blur-xl text-slate-300 flex flex-col justify-between p-5 shrink-0 border-r border-slate-800/80 shadow-2xl">
        <div>
          <div className="flex items-center gap-3.5 px-3 py-4 mb-6 border-b border-slate-800/80">
            <div className="h-11 w-11 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-red-600/30 font-black text-xl border border-red-500/50">
              Δ
            </div>
            <div>
              <div className="font-extrabold text-white text-xs tracking-wider uppercase leading-snug">
                DASHBOARD MONITORING
              </div>
              <div className="text-[10px] text-red-400 font-semibold tracking-wider mt-0.5">
                CV CHANDRA DELTA PERKASA
              </div>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === "overview"
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/25 border border-red-500/30"
                  : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("sales")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === "sales"
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/25 border border-red-500/30"
                  : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Sales Performance</span>
            </button>

            <button
              onClick={() => setActiveTab("trend")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === "trend"
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/25 border border-red-500/30"
                  : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Grafik Tren Bulanan</span>
            </button>

            <button
              onClick={() => setActiveTab("aging")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === "aging"
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/25 border border-red-500/30"
                  : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Aging Piutang (&gt;60 / &gt;120 Hari)</span>
            </button>

            <button
              onClick={() => setActiveTab("master")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === "master"
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/25 border border-red-500/30"
                  : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Master Invoice</span>
            </button>

            <button
              onClick={() => setActiveTab("jobid")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === "jobid"
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/25 border border-red-500/30"
                  : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Job ID</span>
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="text-[11px] text-slate-400 font-medium truncate">
              User: <span className="text-white font-bold">{currentUser}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 font-semibold transition-colors"
              title="Keluar Akun"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
          <div className="text-[10px] text-slate-600 text-center font-medium">
            Secure Live Data Engine v3.2
          </div>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="text-[11px] font-bold text-red-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              LIVE SPREADSHEETS SYNC (2025 & 2026)
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              REVENUE & CASH IN PERFORMANCE
            </h1>
          </div>

          <button
            onClick={fetchGoogleSheetsData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 border border-blue-400/30 active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Syncing Data..." : "Sync Google Sheets"}</span>
          </button>
        </div>

        {/* Global Filter */}
        <div className="bg-slate-950/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 tracking-wider uppercase">
              <Search className="w-3.5 h-3.5 text-red-500" />
              <span>
                Filter Data (Target CDP otomatis menyesuaikan bulan & tahun)
              </span>
            </div>
            <button
              onClick={resetFilters}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Filter
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <select
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-red-500 transition-colors"
            >
              <option>Semua tahun</option>
              <option>2026</option>
              <option>2025</option>
              <option>2024</option>
              <option>2023</option>
            </select>

            <select
              value={filterBulan}
              onChange={(e) => setFilterBulan(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-red-500 transition-colors"
            >
              <option>Semua bulan</option>
              <option>Januari</option>
              <option>Februari</option>
              <option>Maret</option>
              <option>April</option>
              <option>Mei</option>
              <option>Juni</option>
              <option>Juli</option>
              <option>Agustus</option>
              <option>September</option>
              <option>Oktober</option>
              <option>November</option>
              <option>Desember</option>
            </select>

            <input
              type="text"
              placeholder="Cari nomor invoice"
              value={filterNoInvoice}
              onChange={(e) => setFilterNoInvoice(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-red-500 placeholder:text-slate-500 transition-colors"
            />
            <input
              type="text"
              placeholder="Cari customer"
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-red-500 placeholder:text-slate-500 transition-colors"
            />

            <select
              value={filterSales}
              onChange={(e) => setFilterSales(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-red-500 transition-colors"
            >
              <option>Semua sales / VIA</option>
              <option>ANS</option>
              <option>CDF</option>
              <option>CDP</option>
              <option>FAN</option>
              <option>SPL</option>
              <option>TPM</option>
              <option>UCI</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-red-500 transition-colors"
            >
              <option>Semua status</option>
              <option>Lunas</option>
              <option>Lebih Bayar</option>
              <option>Kurang Bayar</option>
              <option>Belum ada Pembayaran</option>
              <option>Belum Lunas (Kurang Bayar & Belum Bayar)</option>
            </select>
          </div>
        </div>

        {/* Dynamic KPI Cards + Ringkasan Aging Piutang Tambahan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border-l-4 border-l-blue-500 border border-slate-800 p-5 shadow-xl">
            <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
              TOTAL REVENUE
            </div>
            <div className="text-xl font-black text-white">
              {formatRupiah(totalRevenue)}
            </div>
          </div>

          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border-l-4 border-l-emerald-500 border border-slate-800 p-5 shadow-xl">
            <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
              CASH IN
            </div>
            <div className="text-xl font-black text-white">
              {formatRupiah(totalCashIn)}
            </div>
            <div className="text-[11px] font-semibold text-emerald-400 mt-1">
              {collectionRate}% collection rate
            </div>
          </div>

          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border-l-4 border-l-red-500 border border-slate-800 p-5 shadow-xl">
            <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
              SISA TAGIHAN
            </div>
            <div className="text-xl font-black text-white">
              {formatRupiah(totalSisaTagihan)}
            </div>
          </div>

          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border-l-4 border-l-amber-500 border border-slate-800 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                AGING &gt; 60 &amp; &gt; 120 HARI
              </span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-black text-amber-400">
              {formatRupiah(agingSummary.aging60_120 + agingSummary.agingCritical120)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Kritis (&gt;120h): <span className="text-red-400 font-bold">{formatRupiah(agingSummary.agingCritical120)}</span>
            </div>
          </div>
        </div>

        {/* TAB CONTENT: SALES PERFORMANCE & KONTRIBUSI REVENUE 2026 */}
        {activeTab === "sales" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-8 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Performa Sales Person Individual
                </h2>
                <span className="text-xs text-slate-400 font-semibold">
                  Total Sales: {salesPerformanceData.length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {salesPerformanceData.map((item) => {
                  const salesKey = item.sales.toUpperCase();
                  const targetConfig = activeTargets[salesKey];

                  const hasTarget = Boolean(targetConfig);
                  const isCombined = targetConfig?.isCombined || false;

                  const revActual = isCombined
                    ? combinedAnsFanData.revenue
                    : item.totalRevenue;
                  const cashInActual = isCombined
                    ? combinedAnsFanData.cashIn
                    : item.totalCashIn;

                  const targetRev = targetConfig ? targetConfig.revenue : 0;
                  const targetCashIn = targetConfig ? targetConfig.cashIn : 0;

                  const revPct =
                    targetRev > 0
                      ? Math.min(100, Math.round((revActual / targetRev) * 100))
                      : 0;
                  const cashPct =
                    targetCashIn > 0
                      ? Math.min(100, Math.round((cashInActual / targetCashIn) * 100))
                      : 0;

                  return (
                    <div
                      key={item.sales}
                      className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 font-black text-xs">
                              {item.sales.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-bold text-white text-sm">
                                {item.sales} {isCombined && "(ANS & FAN)"}
                              </h3>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {item.totalCount} Total Invoice Tercatat
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                              item.lunasCount > 0
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {item.lunasCount} Lunas / {item.outstandingCount} Pending
                          </span>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800/80">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-400 font-medium">Revenue Aktual:</span>
                              <span className="text-white font-bold">{formatRupiah(revActual)}</span>
                            </div>
                            {hasTarget && (
                              <div className="flex justify-between text-[10px] text-slate-500">
                                <span>Target: {formatRupiah(targetRev)}</span>
                                <span className="text-red-400 font-bold">{revPct}%</span>
                              </div>
                            )}
                          </div>

                          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800/80">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-400 font-medium">Cash In Aktual:</span>
                              <span className="text-emerald-400 font-bold">{formatRupiah(cashInActual)}</span>
                            </div>
                            {hasTarget && (
                              <div className="flex justify-between text-[10px] text-slate-500">
                                <span>Target: {formatRupiah(targetCashIn)}</span>
                                <span className="text-emerald-400 font-bold">{cashPct}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 font-medium pt-2 border-t border-slate-800/80 flex justify-between">
                        <span>Sisa Tagihan:</span>
                        <span className="text-red-400 font-bold">{formatRupiah(item.totalSisaTagihan)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="xl:col-span-4 space-y-6">
              <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <PieChart className="w-4 h-4 text-red-500" />
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                    Kontribusi Revenue 2026 (% dari Total)
                  </h2>
                </div>

                <div className="space-y-3">
                  {contributionTableData.map((row) => {
                    const percentage = row.kontribusi.toFixed(1);
                    return (
                      <div key={row.sales} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-slate-300">{row.sales}</span>
                          <span className="text-red-400 font-semibold">{percentage}% ({formatRupiah(row.revenue)})</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="bg-gradient-to-r from-red-600 to-red-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, row.kontribusi)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Total 2026:</span>
                  <span className="text-white font-bold">{formatRupiah(totalRevenue2026Sum)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                Ringkasan Eksekutif CV Chandra Delta Perkasa
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Dashboard ini menampilkan data real-time dari Google Sheets untuk tahun 2025 dan 2026. Anda dapat memonitor performa penagihan (Cash In), pendapatan total (Revenue), serta piutang yang melewati batas waktu (Aging &gt; 60 dan &gt; 120 Hari) di seluruh wilayah operasional Makassar dan Sulawesi.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-bold uppercase mb-1">Total Invoice Tersaring</div>
                  <div className="text-lg font-black text-white">{filteredData.length} Dokumen</div>
                </div>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-bold uppercase mb-1">Rasio Kolektibilitas</div>
                  <div className="text-lg font-black text-emerald-400">{collectionRate}%</div>
                </div>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-bold uppercase mb-1">Total Piutang Kritis</div>
                  <div className="text-lg font-black text-red-400">{formatRupiah(agingSummary.agingCritical120)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: GRAFIK TREN BULANAN */}
        {activeTab === "trend" && (
          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Grafik Tren Bulanan ({filterTahun === "Semua tahun" ? "2026 (Default)" : filterTahun})
              </h2>
              <span className="text-xs text-slate-400 font-semibold">Perbandingan Revenue vs Cash In</span>
            </div>

            <div className="space-y-4 pt-4">
              {monthlyTrendData.data.map((item) => {
                const revWidth = (item.revenue / monthlyTrendData.maxVal) * 100;
                const cashWidth = (item.cashIn / monthlyTrendData.maxVal) * 100;
                return (
                  <div key={item.bulan} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-200">
                      <span>{item.bulan}</span>
                      <div className="flex gap-4 text-[11px]">
                        <span className="text-blue-400">Rev: {formatRupiah(item.revenue)}</span>
                        <span className="text-emerald-400">Cash: {formatRupiah(item.cashIn)}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, revWidth)}%` }}></div>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, cashWidth)}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB CONTENT: AGING PIUTANG */}
        {activeTab === "aging" && (
          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Analisis Aging Piutang (&gt;60 &amp; &gt;120 Hari)
              </h2>
              <span className="text-xs text-amber-400 font-semibold">Fokus Pemulihan Kas</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400 font-bold uppercase mb-1">0 - 30 Hari (Lancar)</div>
                <div className="text-lg font-black text-emerald-400">{formatRupiah(agingSummary.current)}</div>
              </div>
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400 font-bold uppercase mb-1">31 - 60 Hari</div>
                <div className="text-lg font-black text-blue-400">{formatRupiah(agingSummary.aging31_60)}</div>
              </div>
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400 font-bold uppercase mb-1">61 - 120 Hari</div>
                <div className="text-lg font-black text-amber-400">{formatRupiah(agingSummary.aging60_120)}</div>
              </div>
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 border-l-4 border-l-red-500">
                <div className="text-[11px] text-red-400 font-bold uppercase mb-1">&gt; 120 Hari (Kritis)</div>
                <div className="text-lg font-black text-red-500">{formatRupiah(agingSummary.agingCritical120)}</div>
              </div>
            </div>

            <div className="pt-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Daftar Invoice Piutang Berumur &gt; 60 Hari</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">No Invoice</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Sales/VIA</th>
                      <th className="px-4 py-3">Sisa Tagihan</th>
                      <th className="px-4 py-3">Umur (Hari)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.filter(item => item.sisaTagihan > 0 && item.agingDays > 60).length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-6 text-center text-slate-500">Tidak ada piutang di atas 60 hari pada filter ini.</td>
                      </tr>
                    ) : (
                      filteredData.filter(item => item.sisaTagihan > 0 && item.agingDays > 60).map(item => (
                        <tr key={item.id} className="border-b border-slate-800/50 hover:bg-slate-900/40">
                          <td className="px-4 py-3 font-semibold text-white">{item.noInvoice}</td>
                          <td className="px-4 py-3">{item.customer}</td>
                          <td className="px-4 py-3">{item.via}</td>
                          <td className="px-4 py-3 font-bold text-red-400">{formatRupiah(item.sisaTagihan)}</td>
                          <td className="px-4 py-3"><span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded-md font-bold">{item.agingDays} Hari</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: MASTER INVOICE */}
        {activeTab === "master" && (
          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Master Data Invoice (Total: {filteredData.length})
              </h2>
              <span className="text-xs text-slate-400 font-semibold">Live Google Sheets Synchronized</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Tahun/Bulan</th>
                    <th className="px-4 py-3">No Invoice</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Sales/VIA</th>
                    <th className="px-4 py-3">Nilai Invoice</th>
                    <th className="px-4 py-3">Dana Masuk</th>
                    <th className="px-4 py-3">Sisa Tagihan</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-slate-500">Tidak ada data invoice yang sesuai dengan filter.</td>
                    </tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr key={item.id} className="border-b border-slate-800/50 hover:bg-slate-900/40">
                        <td className="px-4 py-3 font-semibold text-slate-400">{item.tahun} - {item.bulan}</td>
                        <td className="px-4 py-3 font-bold text-white">{item.noInvoice}</td>
                        <td className="px-4 py-3">{item.customer}</td>
                        <td className="px-4 py-3 font-semibold text-red-400">{item.via}</td>
                        <td className="px-4 py-3">{formatRupiah(item.nilaiInvoice)}</td>
                        <td className="px-4 py-3 text-emerald-400">{formatRupiah(item.danaMasuk)}</td>
                        <td className="px-4 py-3 text-red-400 font-bold">{formatRupiah(item.sisaTagihan)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            item.status.toLowerCase().includes("lunas")
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}>
                            {item.status}
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

        {/* TAB CONTENT: JOB ID */}
        {activeTab === "jobid" && (
          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Monitoring Job ID &amp; Pekerjaan Alat Berat
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sinkronisasi database Job ID dari sheet KPI - SPV Sales.
                </p>
              </div>
              <div className="w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Cari Job ID / Penyewa / Unit / Lokasi..."
                  value={filterJobSearch}
                  onChange={(e) => setFilterJobSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-red-500 placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">Job ID</th>
                    <th className="px-4 py-3">Nama Penyewa</th>
                    <th className="px-4 py-3">Jenis Penyewa</th>
                    <th className="px-4 py-3">Kode Unit</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Jenis Sewa</th>
                    <th className="px-4 py-3">Via / Sales</th>
                    <th className="px-4 py-3">Lokasi Kerja</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center text-slate-500">Memuat data Job ID dari Google Sheets...</td>
                    </tr>
                  ) : filteredJobIdData.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center text-slate-500">Tidak ada data Job ID yang ditemukan.</td>
                    </tr>
                  ) : (
                    filteredJobIdData.map((job, idx) => (
                      <tr key={job.id} className="border-b border-slate-800/50 hover:bg-slate-900/40">
                        <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-3 font-bold text-white">{job.jobId}</td>
                        <td className="px-4 py-3 text-slate-200">{job.namaPenyewa}</td>
                        <td className="px-4 py-3">{job.jenisPenyewa}</td>
                        <td className="px-4 py-3 font-semibold text-red-400">{job.kodeUnit}</td>
                        <td className="px-4 py-3">{job.classUnit}</td>
                        <td className="px-4 py-3">{job.jenisSewa}</td>
                        <td className="px-4 py-3 font-semibold text-blue-400">{job.via}</td>
                        <td className="px-4 py-3 text-slate-300">{job.lokasiKerja}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
