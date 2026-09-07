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
} from "lucide-react";

const URL_2025 =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTo9EJbez7MyWXlYkXc-rzoN8vqYa1SEyC_ffeObmb0Nq9D6hTAzdS1rbZ6_OnnYntvAYYoTIMQu03C/pub?gid=181359356&single=true&output=csv";
const URL_2026 =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTo9EJbez7MyWXlYkXc-rzoN8vqYa1SEyC_ffeObmb0Nq9D6hTAzdS1rbZ6_OnnYntvAYYoTIMQu03C/pub?gid=586995800&single=true&output=csv";

const MONTHS_ORDER = [
  "JANUARI",
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

  // activeTab bisa bernilai: "overview", "sales", "master", atau "contribution"
  const [activeTab, setActiveTab] = useState("sales");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterTahun, setFilterTahun] = useState("2026");
  const [filterBulan, setFilterBulan] = useState("Semua bulan");
  const [filterNoInvoice, setFilterNoInvoice] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterSales, setFilterSales] = useState("Semua sales / VIA");
  const [filterStatus, setFilterStatus] = useState("Semua status");

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

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cols = parseLine(lines[i]);

      const colTahun = cleanStr(cols[0]);
      const colVia = cleanStr(cols[1]);
      const colVia2 = cleanStr(cols[23]);
      const noInv = cleanStr(cols[3]);
      const cust = cleanStr(cols[5]);
      const colMonth = cleanStr(cols[21]);

      if (!noInv && !cust) continue;

      const thn = colTahun ? colTahun.replace(".0", "") : defaultYear;
      const salesName = colVia2 || colVia || "-";

      result.push({
        id: `${defaultYear}-${i}`,
        tahun: thn,
        bulan: colMonth ? colMonth.toUpperCase() : "-",
        via: salesName,
        noInvoice: noInv || "-",
        tanggal: cleanStr(cols[4]) || "-",
        customer: cust || "Unspecified Customer",
        nilaiInvoice: cleanNum(cols[10]),
        danaMasuk: cleanNum(cols[13]),
        sisaTagihan: cleanNum(cols[15]),
        status: cleanStr(cols[16]) || "Belum ada Pembayaran",
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
              onClick={() => setActiveTab("master")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text
