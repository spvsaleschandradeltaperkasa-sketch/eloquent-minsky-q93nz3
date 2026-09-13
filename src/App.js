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
  TrendingUp,
  Briefcase,
  Clock,
} from "lucide-react";

const URL_2025 =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTo9EJbez7MyWXlYkXc-rzoN8vqYa1SEyC_ffeObmb0Nq9D6hTAzdS1rbZ6_OnnYntvAYYoTIMQu03C/pub?gid=181359356&single=true&output=csv";
const URL_2026 =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTo9EJbez7MyWXlYkXc-rzoN8vqYa1SEyC_ffeObmb0Nq9D6hTAzdS1rbZ6_OnnYntvAYYoTIMQu03C/pub?gid=586995800&single=true&output=csv";
const URL_JOB_ID =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTo9EJbez7MyWXlYkXc-rzoN8vqYa1SEyC_ffeObmb0Nq9D6hTAzdS1rbZ6_OnnYntvAYYoTIMQu03C/pub?gid=1656309510&single=true&output=csv";

// Tambahkan URL untuk Alokasi Kas Masuk di sini (Ganti link pub?gid=... sesuai tab Google Sheets Alokasi Kas Masuk Anda)
const URL_ALOKASI_KAS =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTo9EJbez7MyWXlYkXc-rzoN8vqYa1SEyC_ffeObmb0Nq9D6hTAzdS1rbZ6_OnnYntvAYYoTIMQu03C/pub?gid=0&single=true&output=csv";

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

  const [activeTab, setActiveTab] = useState("sales");
  const [invoices, setInvoices] = useState([]);
  const [jobIdData, setJobIdData] = useState([]);
  const [alokasiKasData, setAlokasiKasData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterTahun, setFilterTahun] = useState("2026");
  const [filterBulan, setFilterBulan] = useState("Semua bulan");
  const [filterNoInvoice, setFilterNoInvoice] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterSales, setFilterSales] = useState("Semua sales / VIA");
  const [filterStatus, setFilterStatus] = useState("Semua status");
  const [filterJobSearch, setFilterJobSearch] = useState("");
  const [filterAlokasiKas, setFilterAlokasiKas] = useState("Semua alokasi kas masuk");

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

  const parseCSV = (text, defaultYear, kasMapping = {}) => {
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

      // Cek alokasi kas dari kolom internal atau mapping URL alokasi kas terpisah
      const colAlokasiKas = cleanStr(cols[24]) || kasMapping[noInv] || "-";

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
        alokasiKasMasuk: colAlokasiKas,
      });
    }
    return result;
  };

  const parseAlokasiKasCSV = (text) => {
    const lines = text.split(/\r\n|\n/);
    if (lines.length < 2) return { list: [], mapping: {} };
    const list = [];
    const mapping = {};
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
      
      const noInv = cleanStr(cols[0]) || cleanStr(cols[1]);
      const alokasi = cleanStr(cols[2]) || cleanStr(cols[3]) || "-";

      if (noInv && noInv !== "-") {
        mapping[noInv] = alokasi;
        list.push(alokasi);
      }
    }
    return { list: Array.from(new Set(list)), mapping };
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
      let kasMapping = {};
      let kasList = [];

      if (URL_ALOKASI_KAS) {
        try {
          const resKas = await fetch(URL_ALOKASI_KAS);
          const textKas = await resKas.text();
          const parsedKas = parseAlokasiKasCSV(textKas);
          kasMapping = parsedKas.mapping;
          kasList = parsedKas.list;
          setAlokasiKasData(kasList);
        } catch (e) {
          console.error("Gagal load URL Alokasi Kas:", e);
        }
      }

      let combinedData = [];

      if (URL_2025) {
        const res2025 = await fetch(URL_2025);
        const text2025 = await res2025.text();
        const data2025 = parseCSV(text2025, "2025", kasMapping);
        combinedData = [...combinedData, ...data2025];
      }

      if (URL_2026) {
        const res2026 = await fetch(URL_2026);
        const text2026 = await res2026.text();
        const data2026 = parseCSV(text2026, "2026", kasMapping);
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
      if (
        filterAlokasiKas !== "Semua alokasi kas masuk" &&
        item.alokasiKasMasuk.toUpperCase() !== filterAlokasiKas.toUpperCase()
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
    filterAlokasiKas,
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
    setFilterAlokasiKas("Semua alokasi kas masuk");
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
              <span>Filter Data & Alokasi Kas Masuk</span>
            </div>
            <button
              onClick={resetFilters}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Filter
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
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

            {/* Filter Alokasi Kas Masuk */}
            <select
              value={filterAlokasiKas}
              onChange={(e) => setFilterAlokasiKas(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-red-500 transition-colors"
            >
              <option>Semua alokasi kas masuk</option>
              {Array.from(
                new Set([
                  ...alokasiKasData,
                  ...invoices.map((i) => i.alokasiKasMasuk).filter(Boolean),
                ])
              )
                .filter((x) => x && x !== "-")
                .sort()
                .map((val, idx) => (
                  <option key={idx} value={val}>
                    {val}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Dynamic KPI Cards */}
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
              TOTAL CASH IN
            </div>
            <div className="text-xl font-black text-emerald-400">
              {formatRupiah(totalCashIn)}
            </div>
          </div>

          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border-l-4 border-l-amber-500 border border-slate-800 p-5 shadow-xl">
            <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
              TOTAL SISA TAGIHAN
            </div>
            <div className="text-xl font-black text-amber-400">
              {formatRupiah(totalSisaTagihan)}
            </div>
          </div>

          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border-l-4 border-l-purple-500 border border-slate-800 p-5 shadow-xl">
            <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
              COLLECTION RATE
            </div>
            <div className="text-xl font-black text-purple-400">
              {collectionRate}%
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl p-6">
          {activeTab === "overview" && (
            <div>
              <h2 className="text-lg font-bold text-white mb-4">Overview Dashboard</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800">
                  <h3 className="text-sm font-bold text-white mb-3">Ringkasan Aging Piutang</h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex justify-between"><span>Current (&le; 30 Hari):</span> <span className="font-bold text-white">{formatRupiah(agingSummary.current)}</span></li>
                    <li className="flex justify-between"><span>31 - 60 Hari:</span> <span className="font-bold text-white">{formatRupiah(agingSummary.aging31_60)}</span></li>
                    <li className="flex justify-between"><span>61 - 120 Hari:</span> <span className="font-bold text-white">{formatRupiah(agingSummary.aging60_120)}</span></li>
                    <li className="flex justify-between text-red-400"><span>&gt; 120 Hari (Critical):</span> <span className="font-bold">{formatRupiah(agingSummary.agingCritical120)}</span></li>
                  </ul>
                </div>
                <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800">
                  <h3 className="text-sm font-bold text-white mb-3">Kontribusi Sales 2026</h3>
                  <div className="overflow-x-auto max-h-40">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="pb-2">Sales</th>
                          <th className="pb-2 text-right">Revenue</th>
                          <th className="pb-2 text-right">Kontribusi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contributionTableData.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-800/50">
                            <td className="py-2 text-slate-200 font-medium">{item.sales}</td>
                            <td className="py-2 text-right text-slate-300">{formatRupiah(item.revenue)}</td>
                            <td className="py-2 text-right text-blue-400 font-bold">{item.kontribusi.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "sales" && (
            <div>
              <h2 className="text-lg font-bold text-white mb-4">Sales Performance</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="p-3">Sales / VIA</th>
                      <th className="p-3 text-right">Total Revenue</th>
                      <th className="p-3 text-right">Total Cash In</th>
                      <th className="p-3 text-right">Sisa Tagihan</th>
                      <th className="p-3 text-center">Lunas</th>
                      <th className="p-3 text-center">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesPerformanceData.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-900/80 hover:bg-slate-900/50">
                        <td className="p-3 font-bold text-white">{row.sales}</td>
                        <td className="p-3 text-right text-slate-200">{formatRupiah(row.totalRevenue)}</td>
                        <td className="p-3 text-right text-emerald-400">{formatRupiah(row.totalCashIn)}</td>
                        <td className="p-3 text-right text-amber-400">{formatRupiah(row.totalSisaTagihan)}</td>
                        <td className="p-3 text-center text-slate-300">{row.lunasCount}</td>
                        <td className="p-3 text-center text-red-400">{row.outstandingCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "trend" && (
            <div>
              <h2 className="text-lg font-bold text-white mb-4">Grafik Tren Bulanan ({filterTahun === "Semua tahun" ? "2026" : filterTahun})</h2>
              <div className="space-y-3">
                {monthlyTrendData.data.map((m, idx) => {
                  const max = monthlyTrendData.maxVal || 1;
                  const revPercent = Math.min(100, (m.revenue / max) * 100);
                  return (
                    <div key={idx} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-white w-24">{m.bulan}</span>
                        <span className="text-blue-400">Rev: {formatRupiah(m.revenue)}</span>
                        <span className="text-emerald-400">Cash: {formatRupiah(m.cashIn)}</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden flex">
                        <div className="bg-blue-500 h-full" style={{ width: `${revPercent}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "aging" && (
            <div>
              <h2 className="text-lg font-bold text-white mb-4">Aging Piutang (&gt;60 / &gt;120 Hari)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Current (&le;30 Hari)</div>
                  <div className="text-lg font-bold text-white mt-1">{formatRupiah(agingSummary.current)}</div>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">31 - 60 Hari</div>
                  <div className="text-lg font-bold text-white mt-1">{formatRupiah(agingSummary.aging31_60)}</div>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">61 - 120 Hari</div>
                  <div className="text-lg font-bold text-amber-400 mt-1">{formatRupiah(agingSummary.aging60_120)}</div>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">&gt; 120 Hari (Critical)</div>
                  <div className="text-lg font-bold text-red-500 mt-1">{formatRupiah(agingSummary.agingCritical120)}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "master" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white">Master Invoice</h2>
                <span className="text-xs text-slate-400">Total Baris: {filteredData.length}</span>
              </div>
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-950 z-10">
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="p-3">Tahun</th>
                      <th className="p-3">Bulan</th>
                      <th className="p-3">No Invoice</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Sales / VIA</th>
                      <th className="p-3">Alokasi Kas Masuk</th>
                      <th className="p-3 text-right">Nilai Invoice</th>
                      <th className="p-3 text-right">Dana Masuk</th>
                      <th className="p-3 text-right">Sisa Tagihan</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row) => (
                      <tr key={row.id} className="border-b border-slate-900/60 hover:bg-slate-900/40">
                        <td className="p-3 text-slate-400">{row.tahun}</td>
                        <td className="p-3 text-slate-300">{row.bulan}</td>
                        <td className="p-3 font-semibold text-white">{row.noInvoice}</td>
                        <td className="p-3 text-slate-300">{row.customer}</td>
                        <td className="p-3 text-slate-300">{row.via}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-red-950/60 text-red-400 border border-red-800/50 font-medium">
                            {row.alokasiKasMasuk}
                          </span>
                        </td>
                        <td className="p-3 text-right text-slate-200">{formatRupiah(row.nilaiInvoice)}</td>
                        <td className="p-3 text-right text-emerald-400">{formatRupiah(row.danaMasuk)}</td>
                        <td className="p-3 text-right text-amber-400">{formatRupiah(row.sisaTagihan)}</td>
                        <td className="p-3 text-slate-300">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "jobid" && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h2 className="text-lg font-bold text-white">Data Job ID</h2>
                <input
                  type="text"
                  placeholder="Cari Job ID / Penyewa / Unit..."
                  value={filterJobSearch}
                  onChange={(e) => setFilterJobSearch(e.target.value)}
                  className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-red-500 w-full sm:w-64"
                />
              </div>
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-950 z-10">
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="p-3">No</th>
                      <th className="p-3">Job ID</th>
                      <th className="p-3">Via</th>
                      <th className="p-3">Jenis Sewa</th>
                      <th className="p-3">Nama Penyewa</th>
                      <th className="p-3">Kode Unit</th>
                      <th className="p-3">Class</th>
                      <th className="p-3">Lokasi Kerja</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobIdData.map((row) => (
                      <tr key={row.id} className="border-b border-slate-900/60 hover:bg-slate-900/40">
                        <td className="p-3 text-slate-400">{row.no}</td>
                        <td className="p-3 font-bold text-white">{row.jobId}</td>
                        <td className="p-3 text-slate-300">{row.via}</td>
                        <td className="p-3 text-slate-300">{row.jenisSewa}</td>
                        <td className="p-3 text-slate-200 font-medium">{row.namaPenyewa}</td>
                        <td className="p-3 text-slate-300">{row.kodeUnit}</td>
                        <td className="p-3 text-slate-300">{row.classUnit}</td>
                        <td className="p-3 text-slate-300">{row.lokasiKerja}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
