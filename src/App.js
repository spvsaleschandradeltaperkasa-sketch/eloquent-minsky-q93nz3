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
  ChevronRight,
  Gauge,
  Wallet,
  Landmark,
  Plus,
} from "lucide-react";

const URL_2025 =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTo9EJbez7MyWXlYkXc-rzoN8vqYa1SEyC_ffeObmb0Nq9D6hTAzdS1rbZ6_OnnYntvAYYoTIMQu03C/pub?gid=181359356&single=true&output=csv";
const URL_2026 =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTo9EJbez7MyWXlYkXc-rzoN8vqYa1SEyC_ffeObmb0Nq9D6hTAzdS1rbZ6_OnnYntvAYYoTIMQu03C/pub?gid=586995800&single=true&output=csv";
const URL_JOB_ID =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTo9EJbez7MyWXlYkXc-rzoN8vqYa1SEyC_ffeObmb0Nq9D6hTAzdS1rbZ6_OnnYntvAYYoTIMQu03C/pub?gid=1910648116&single=true&output=csv";
const URL_ALOKASI_KAS =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTo9EJbez7MyWXlYkXc-rzoN8vqYa1SEyC_ffeObmb0Nq9D6hTAzdS1rbZ6_OnnYntvAYYoTIMQu03C/pub?gid=1728018265&single=true&output=csv";

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

const MONTHS_SHORT = ["JAN","FEB","MAR","APR","MEI","JUN","JUL","AGU","SEP","OKT","NOV","DES"];
const MONTH_ID_NAMES = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

const ALLOWED_USERS = [
  { username: "admin", password: "123", role: "Administrator" },
  { username: "delta", password: "delta2026", role: "Management" },
  { username: "sales", password: "sales123", role: "Sales Team" },
];

// ---- Design tokens (industrial / heavy-equipment ops board) ----
const C = {
  bg: "#12151A",
  bgAlt: "#0D0F13",
  panel: "#1A1F26",
  panelAlt: "#20262E",
  border: "#2A313A",
  borderLight: "#353D48",
  accent: "#FF7A29",
  accentDim: "#C4571A",
  steel: "#5B8FB0",
  green: "#4EAE72",
  amber: "#E4A23A",
  red: "#E1544D",
  text: "#EAE7E1",
  textDim: "#98A1AC",
  textFaint: "#5C6570",
};

function LogoMark({ size = 44 }) {
  return (
    <div
      className="flex items-center justify-center font-bold shrink-0"
      style={{
        width: size,
        height: size,
        background: C.accent,
        color: "#1A0D00",
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: size * 0.4,
        letterSpacing: "-0.02em",
        boxShadow: `0 0 0 1px ${C.border}`,
      }}
    >
      CDP
    </div>
  );
}

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');";

function StatusDot({ color }) {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full"
      style={{ background: color, boxShadow: `0 0 6px ${color}` }}
    />
  );
}

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

  const [alokasiKasData, setAlokasiKasData] = useState([]);
  const [filterKasTahun, setFilterKasTahun] = useState("2026");
  const [filterKasBulan, setFilterKasBulan] = useState("Semua bulan");
  const [filterKasJenis, setFilterKasJenis] = useState("Semua jenis");
  const [filterKasRekening, setFilterKasRekening] = useState("Semua rekening");
  const [filterKasSearch, setFilterKasSearch] = useState("");
  const [kasVisibleCount, setKasVisibleCount] = useState(100);

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
      ANS: { revenue: 900000000, cashIn: 800000000, isCombined: true, combinedWith: ["ANS", "FAN"] },
      FAN: { revenue: 900000000, cashIn: 800000000, isCombined: true, combinedWith: ["ANS", "FAN"] },
    };
  };

  const activeTargets = useMemo(() => getSalesTargets(filterTahun, filterBulan), [filterTahun, filterBulan]);

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

  // Kolom sheet baru (KPI - SPV Sales - Job ID Berjalan):
  // 0 No | 1 Unit Code | 2 Site Code | 3 Model | 4 Brand | 5 Class | 6 Job ID |
  // 7 Job Via | 8 Jenis Sewa/Status Alat | 9 Nama Penyewa | 10 Jenis Penyewa |
  // 11 Attachment | 12 Nama Operator (awal) | 13 Alamat | 14 Kota |
  // 15 Jenis Pekerjaan | 16 Mobilisation Date (RAW) | 17 Job ID Date
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

      const kodeUnitVal = cleanStr(cols[1]) || "-";
      const siteCodeVal = cleanStr(cols[2]) || "-";
      const modelVal = cleanStr(cols[3]) || "-";
      const brandVal = cleanStr(cols[4]) || "-";
      const classVal = cleanStr(cols[5]) || "-";
      const jobIdVal = cleanStr(cols[6]) || "-";
      const viaVal = cleanStr(cols[7]) || "-";
      const jenisSewaVal = cleanStr(cols[8]) || "-";
      const namaPenyewaVal = cleanStr(cols[9]) || "-";
      const jenisPenyewaVal = cleanStr(cols[10]) || "-";
      const attachmentVal = cleanStr(cols[11]) || "-";
      const namaOperatorVal = cleanStr(cols[12]) || "-";
      const alamatVal = cleanStr(cols[13]) || "-";
      const kotaVal = cleanStr(cols[14]) || "-";
      const jenisPekerjaanVal = cleanStr(cols[15]) || "-";
      const mobilisasiVal = cleanStr(cols[16]) || "-";
      const jobIdDateVal = cleanStr(cols[17]) || "-";

      // lewati baris kosong total (tanpa kode unit maupun job id)
      if (kodeUnitVal === "-" && jobIdVal === "-") continue;

      const lokasiKerjaVal =
        alamatVal !== "-" && kotaVal !== "-"
          ? `${alamatVal}, ${kotaVal}`
          : alamatVal !== "-"
          ? alamatVal
          : kotaVal;

      result.push({
        id: `job-${i}`,
        no: cleanStr(cols[0]) || i,
        kodeUnit: kodeUnitVal,
        siteCode: siteCodeVal,
        model: modelVal,
        brand: brandVal,
        classUnit: classVal,
        jobId: jobIdVal,
        via: viaVal,
        jenisSewa: jenisSewaVal,
        namaPenyewa: namaPenyewaVal,
        jenisPenyewa: jenisPenyewaVal,
        attachment: attachmentVal,
        namaOperator: namaOperatorVal,
        alamat: alamatVal,
        kota: kotaVal,
        lokasiKerja: lokasiKerjaVal || "-",
        jenisPekerjaan: jenisPekerjaanVal,
        mobilisasi: mobilisasiVal,
        jobIdDate: jobIdDateVal,
      });
    }
    return result;
  };

  const parseAlokasiKasCSV = (text) => {
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
    const cleanStr = (val) => (val ? val.replace(/^"|"$/g, "").trim() : "");
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

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cols = parseLine(lines[i]);

      let bulan = cleanStr(cols[17]) || cleanStr(cols[0]) || "-";
      if (bulan !== "-" && bulan.length === 1) bulan = "0" + bulan;
      const tahun = cleanStr(cols[18]) || cleanStr(cols[3]) || "-";
      const jenisAlokasi = cleanStr(cols[4]) || "Lainnya";
      const invoiceNumber = cleanStr(cols[5]) || "-";
      const jobId = cleanStr(cols[6]) || "-";
      const noUnit = cleanStr(cols[7]) || "-";
      const namaKonsumen = cleanStr(cols[8]) || "Unspecified";
      const alamat = cleanStr(cols[9]) || "-";
      const kodeKasMasuk = cleanStr(cols[10]) || "-";
      const tanggalKasMasuk = cleanStr(cols[11]) || "-";
      const rekening = cleanStr(cols[12]) || "-";
      const keterangan = cleanStr(cols[13]) || "-";
      const jumlahAlokasi = cleanNum(cols[14]);
      const jumlahKasMasuk = cleanNum(cols[15]);
      const sisaKasMasuk = cleanNum(cols[16]);

      if (kodeKasMasuk === "-" && namaKonsumen === "Unspecified" && jumlahAlokasi === 0) continue;

      result.push({
        id: `kas-${i}`,
        bulan,
        tahun,
        jenisAlokasi,
        invoiceNumber,
        jobId,
        noUnit,
        namaKonsumen,
        alamat,
        kodeKasMasuk,
        tanggalKasMasuk,
        rekening,
        keterangan,
        jumlahAlokasi,
        jumlahKasMasuk,
        sisaKasMasuk,
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
        combinedData = [...combinedData, ...parseCSV(text2025, "2025")];
      }
      if (URL_2026) {
        const res2026 = await fetch(URL_2026);
        const text2026 = await res2026.text();
        combinedData = [...combinedData, ...parseCSV(text2026, "2026")];
      }
      setInvoices(combinedData);

      if (URL_JOB_ID) {
        const resJob = await fetch(URL_JOB_ID);
        const textJob = await resJob.text();
        setJobIdData(parseJobIdCSV(textJob));
      }

      if (URL_ALOKASI_KAS) {
        const resKas = await fetch(URL_ALOKASI_KAS);
        const textKas = await resKas.text();
        setAlokasiKasData(parseAlokasiKasCSV(textKas));
      }
    } catch (err) {
      console.error("Gagal mengambil data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchGoogleSheetsData();
  }, [isLoggedIn]);

  const filteredData = useMemo(() => {
    return invoices.filter((item) => {
      const st = item.status ? item.status.toLowerCase().trim() : "";
      const isLebih = st.includes("lebih") || item.sisaTagihan < 0;
      const isLunas = st.includes("lunas") || (item.sisaTagihan === 0 && item.danaMasuk > 0);

      if (filterTahun !== "Semua tahun" && item.tahun !== filterTahun) return false;
      if (filterBulan !== "Semua bulan" && item.bulan !== filterBulan.toUpperCase()) return false;
      if (filterNoInvoice && !item.noInvoice.toLowerCase().includes(filterNoInvoice.toLowerCase())) return false;
      if (filterCustomer && !item.customer.toLowerCase().includes(filterCustomer.toLowerCase())) return false;
      if (filterSales !== "Semua sales / VIA" && item.via.toUpperCase() !== filterSales.toUpperCase()) return false;

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
  }, [invoices, filterTahun, filterBulan, filterNoInvoice, filterCustomer, filterSales, filterStatus]);

  const filteredJobIdData = useMemo(() => {
    if (!filterJobSearch) return jobIdData;
    const q = filterJobSearch.toLowerCase();
    return jobIdData.filter((j) => {
      const hay = `${j.jobId} ${j.namaPenyewa} ${j.kodeUnit} ${j.lokasiKerja} ${j.via} ${j.model} ${j.brand} ${j.jenisPekerjaan} ${j.classUnit}`.toLowerCase();
      return hay.includes(q);
    });
  }, [jobIdData, filterJobSearch]);

  const getUnitStatusStyle = (jenisSewa) => {
    const st = (jenisSewa || "").toLowerCase();
    if (st.includes("standby")) {
      return { color: C.amber, background: "rgba(228,162,58,0.12)", border: "rgba(228,162,58,0.3)" };
    }
    if (st.includes("breakdown")) {
      return { color: C.red, background: "rgba(225,84,77,0.12)", border: "rgba(225,84,77,0.3)" };
    }
    if (st !== "-" && st !== "") {
      return { color: C.green, background: "rgba(78,174,114,0.12)", border: "rgba(78,174,114,0.3)" };
    }
    return { color: C.textDim, background: C.panelAlt, border: C.border };
  };

  const combinedAnsFanData = useMemo(() => {
    const ansFanInvoices = filteredData.filter((row) => ["ANS", "FAN"].includes(row.via.toUpperCase()));
    const revenue = ansFanInvoices.reduce((acc, curr) => acc + curr.nilaiInvoice, 0);
    const cashIn = ansFanInvoices.reduce((acc, curr) => acc + curr.danaMasuk, 0);
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
          sales, totalRevenue: 0, totalCashIn: 0, totalSisaTagihan: 0,
          lunasCount: 0, outstandingCount: 0, totalCount: 0,
        };
      }
      map[sales].totalRevenue += row.nilaiInvoice;
      map[sales].totalCashIn += row.danaMasuk;
      map[sales].totalSisaTagihan += row.sisaTagihan;
      map[sales].totalCount += 1;
      if (isLunas || isLebih) map[sales].lunasCount += 1;
      else map[sales].outstandingCount += 1;
    });
    return Object.values(map).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredData]);

  const contributionTableData = useMemo(() => {
    const data2026Only = invoices.filter((item) => item.tahun === "2026");
    const map = {};
    let totalRev2026 = 0;
    data2026Only.forEach((row) => {
      const sales = row.via || "Lainnya";
      if (!map[sales]) map[sales] = 0;
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

  const totalRevenue2026Sum = useMemo(
    () => contributionTableData.reduce((acc, curr) => acc + curr.revenue, 0),
    [contributionTableData]
  );

  const agingSummary = useMemo(() => {
    let current = 0, aging31_60 = 0, aging60_120 = 0, agingCritical120 = 0;
    filteredData.forEach((item) => {
      if (item.sisaTagihan > 0) {
        if (item.agingDays <= 30) current += item.sisaTagihan;
        else if (item.agingDays <= 60) aging31_60 += item.sisaTagihan;
        else if (item.agingDays <= 120) aging60_120 += item.sisaTagihan;
        else agingCritical120 += item.sisaTagihan;
      }
    });
    return { current, aging31_60, aging60_120, agingCritical120 };
  }, [filteredData]);

  const monthlyTrendData = useMemo(() => {
    const targetYear = filterTahun === "Semua tahun" ? "2026" : filterTahun;
    const map = {};
    MONTHS_ORDER.forEach((m) => (map[m] = { revenue: 0, cashIn: 0 }));
    invoices.forEach((row) => {
      if (row.tahun === targetYear && map[row.bulan]) {
        map[row.bulan].revenue += row.nilaiInvoice;
        map[row.bulan].cashIn += row.danaMasuk;
      }
    });
    let maxVal = 1000000;
    const result = MONTHS_ORDER.map((m, idx) => {
      const rev = map[m].revenue;
      const cash = map[m].cashIn;
      if (rev > maxVal) maxVal = rev;
      if (cash > maxVal) maxVal = cash;
      return { bulan: m, short: MONTHS_SHORT[idx], revenue: rev, cashIn: cash };
    });
    return { data: result, maxVal };
  }, [invoices, filterTahun]);

  const kasJenisOptions = useMemo(() => {
    const set = new Set(alokasiKasData.map((i) => i.jenisAlokasi).filter(Boolean));
    return Array.from(set).sort();
  }, [alokasiKasData]);

  const kasRekeningOptions = useMemo(() => {
    const set = new Set(alokasiKasData.map((i) => i.rekening).filter(Boolean));
    return Array.from(set).sort();
  }, [alokasiKasData]);

  const filteredKasData = useMemo(() => {
    return alokasiKasData.filter((item) => {
      if (filterKasTahun !== "Semua tahun" && item.tahun !== filterKasTahun) return false;
      if (filterKasBulan !== "Semua bulan") {
        const idx = MONTH_ID_NAMES.indexOf(filterKasBulan);
        const code = idx >= 0 ? String(idx + 1).padStart(2, "0") : null;
        if (code && item.bulan !== code) return false;
      }
      if (filterKasJenis !== "Semua jenis" && item.jenisAlokasi !== filterKasJenis) return false;
      if (filterKasRekening !== "Semua rekening" && item.rekening !== filterKasRekening) return false;
      if (filterKasSearch) {
        const q = filterKasSearch.toLowerCase();
        const hay = `${item.invoiceNumber} ${item.namaKonsumen} ${item.jobId} ${item.noUnit} ${item.kodeKasMasuk}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [alokasiKasData, filterKasTahun, filterKasBulan, filterKasJenis, filterKasRekening, filterKasSearch]);

  const kasSummary = useMemo(() => {
    let totalAlokasi = 0;
    const txMap = new Map();
    filteredKasData.forEach((item) => {
      totalAlokasi += item.jumlahAlokasi;
      if (item.kodeKasMasuk !== "-" && !txMap.has(item.kodeKasMasuk)) {
        txMap.set(item.kodeKasMasuk, { jumlahKasMasuk: item.jumlahKasMasuk, sisaKasMasuk: item.sisaKasMasuk });
      }
    });
    let totalKasMasuk = 0;
    let totalSisa = 0;
    txMap.forEach((v) => {
      totalKasMasuk += v.jumlahKasMasuk;
      totalSisa += v.sisaKasMasuk;
    });
    return { totalAlokasi, totalKasMasuk, totalSisa, totalTransaksi: txMap.size };
  }, [filteredKasData]);

  const kasByJenis = useMemo(() => {
    const map = {};
    filteredKasData.forEach((item) => {
      const key = item.jenisAlokasi || "Lainnya";
      map[key] = (map[key] || 0) + item.jumlahAlokasi;
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    return Object.entries(map)
      .map(([jenis, val]) => ({ jenis, val, pct: total > 0 ? (val / total) * 100 : 0 }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 8);
  }, [filteredKasData]);

  const kasByRekening = useMemo(() => {
    const map = {};
    filteredKasData.forEach((item) => {
      const key = item.rekening || "-";
      map[key] = (map[key] || 0) + item.jumlahAlokasi;
    });
    return Object.entries(map)
      .map(([rekening, val]) => ({ rekening, val }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 8);
  }, [filteredKasData]);

  const kasMonthlyTrend = useMemo(() => {
    const targetYear = filterKasTahun === "Semua tahun" ? "2026" : filterKasTahun;
    const map = {};
    MONTHS_ORDER.forEach((m, idx) => (map[String(idx + 1).padStart(2, "0")] = 0));
    alokasiKasData.forEach((item) => {
      if (item.tahun === targetYear && map[item.bulan] !== undefined) {
        map[item.bulan] += item.jumlahAlokasi;
      }
    });
    let maxVal = 1000000;
    const result = MONTHS_ORDER.map((m, idx) => {
      const code = String(idx + 1).padStart(2, "0");
      const val = map[code];
      if (val > maxVal) maxVal = val;
      return { bulan: m, short: MONTHS_SHORT[idx], val };
    });
    return { data: result, maxVal };
  }, [alokasiKasData, filterKasTahun]);

  useEffect(() => {
    setKasVisibleCount(100);
  }, [filterKasTahun, filterKasBulan, filterKasJenis, filterKasRekening, filterKasSearch]);

  const totalRevenue = useMemo(() => filteredData.reduce((acc, curr) => acc + curr.nilaiInvoice, 0), [filteredData]);
  const totalCashIn = useMemo(() => filteredData.reduce((acc, curr) => acc + curr.danaMasuk, 0), [filteredData]);
  const totalSisaTagihan = useMemo(() => filteredData.reduce((acc, curr) => acc + curr.sisaTagihan, 0), [filteredData]);
  const collectionRate = totalRevenue > 0 ? ((totalCashIn / totalRevenue) * 100).toFixed(1) : "0.0";

  const resetFilters = () => {
    setFilterTahun("2026");
    setFilterBulan("Semua bulan");
    setFilterNoInvoice("");
    setFilterCustomer("");
    setFilterSales("Semua sales / VIA");
    setFilterStatus("Semua status");
    setFilterJobSearch("");
    setFilterKasTahun("2026");
    setFilterKasBulan("Semua bulan");
    setFilterKasJenis("Semua jenis");
    setFilterKasRekening("Semua rekening");
    setFilterKasSearch("");
  };
const getStatusStyle = (status) => {
  const st = (status || "").toLowerCase();
  if (st.includes("lebih")) {
    return { color: C.steel, background: "rgba(91,143,176,0.12)", border: "rgba(91,143,176,0.3)" };
  }
  if (st.includes("lunas")) {
    return { color: C.green, background: "rgba(78,174,114,0.12)", border: "rgba(78,174,114,0.3)" };
  }
  if (st.includes("kurang")) {
    return { color: C.amber, background: "rgba(228,162,58,0.12)", border: "rgba(228,162,58,0.3)" };
  }
  if (st.includes("belum ada")) {
    return { color: C.red, background: "rgba(225,84,77,0.12)", border: "rgba(225,84,77,0.3)" };
  }
  return { color: C.textDim, background: C.panelAlt, border: C.border };
};
  
  const formatRupiah = (val) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  const formatCompact = (val) => {
    const abs = Math.abs(val);
    if (abs >= 1e9) return (val / 1e9).toFixed(2) + " M";
    if (abs >= 1e6) return (val / 1e6).toFixed(1) + " Jt";
    return val.toString();
  };

  const NAV_ITEMS = [
    { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
    { id: "sales", label: "Performa Sales", icon: Users },
    { id: "trend", label: "Tren Bulanan", icon: TrendingUp },
    { id: "aging", label: "Aging Piutang", icon: Clock },
    { id: "master", label: "Master Invoice", icon: FileText },
    { id: "jobid", label: "Job ID", icon: Briefcase },
    { id: "kasmasuk", label: "Alokasi Kas Masuk", icon: Wallet },
  ];

  // ---------------- LOGIN ----------------
  if (!isLoggedIn) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-4 antialiased relative overflow-hidden"
        style={{ background: C.bgAlt, fontFamily: "'Inter', sans-serif", color: C.text }}
      >
        <style>{FONT_IMPORT}</style>

        {/* backdrop technical grid */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(${C.textDim} 1px, transparent 1px), linear-gradient(90deg, ${C.textDim} 1px, transparent 1px)`,
            backgroundSize: "42px 42px",
          }}
        />
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: C.accent }}
        />

        <div
          className="w-full max-w-sm relative z-10 border"
          style={{ background: C.panel, borderColor: C.border }}
        >
          {/* top strip */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b" style={{ borderColor: C.border, background: C.bgAlt }}>
            <span className="text-[10px] tracking-widest font-mono" style={{ color: C.textFaint }}>
              CDP / OPS-BOARD
            </span>
            <div className="flex items-center gap-1.5">
              <StatusDot color={C.accent} />
              <span className="text-[10px] font-mono" style={{ color: C.textFaint }}>SECURE</span>
            </div>
          </div>

          <div className="p-8">
            <div className="flex items-center gap-3.5 mb-8">
              <LogoMark size={56} />
              <div>
                <h1
                  className="text-2xl leading-none font-semibold"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.text }}
                >
                  Chandra Delta Perkasa
                </h1>
                <p className="text-xs mt-1" style={{ color: C.textDim }}>
                  Masuk untuk memantau penagihan dan kinerja sales
                </p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: C.textDim }}>Username</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: C.textFaint }}>
                    <UserCheck className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan username"
                    value={inputUser}
                    onChange={(e) => setInputUser(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm outline-none transition-colors border"
                    style={{ background: C.bgAlt, borderColor: C.border, color: C.text }}
                    onFocus={(e) => (e.target.style.borderColor = C.accent)}
                    onBlur={(e) => (e.target.style.borderColor = C.border)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: C.textDim }}>Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: C.textFaint }}>
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="Masukkan password"
                    value={inputPass}
                    onChange={(e) => setInputPass(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm outline-none transition-colors border"
                    style={{ background: C.bgAlt, borderColor: C.border, color: C.text }}
                    onFocus={(e) => (e.target.style.borderColor = C.accent)}
                    onBlur={(e) => (e.target.style.borderColor = C.border)}
                  />
                </div>
              </div>

              {loginError && (
                <div className="px-3 py-2.5 text-xs font-medium border" style={{ background: "rgba(225,84,77,0.1)", borderColor: "rgba(225,84,77,0.3)", color: C.red }}>
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 text-sm font-semibold transition-opacity hover:opacity-90 active:scale-[0.99]"
                style={{ background: C.accent, color: "#1A0D00" }}
              >
                Masuk Dashboard
              </button>
            </form>

            <div className="mt-7 pt-4 border-t text-[11px] text-center" style={{ borderColor: C.border, color: C.textFaint }}>
              Akses bawaan: <span style={{ color: C.textDim }}>admin / 123</span> &nbsp;·&nbsp; <span style={{ color: C.textDim }}>delta / delta2026</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- MAIN DASHBOARD ----------------
  return (
    <div className="flex min-h-screen antialiased" style={{ background: C.bg, color: C.text, fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}</style>

      {/* Sidebar */}
      <aside className="w-64 flex flex-col justify-between shrink-0 border-r" style={{ background: C.bgAlt, borderColor: C.border }}>
        <div>
          <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: C.border }}>
            <LogoMark size={44} />
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.01em" }}>
                Ops Board
              </div>
              <div className="text-[10px] truncate" style={{ color: C.accent }}>
                Chandra Delta Perkasa
              </div>
            </div>
          </div>

          <nav className="px-3 py-4 space-y-0.5">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium transition-colors relative"
                  style={{
                    color: active ? C.text : C.textDim,
                    background: active ? C.panel : "transparent",
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = C.panel; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  {active && <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: C.accent }} />}
                  <Icon className="w-4 h-4 shrink-0" style={{ color: active ? C.accent : C.textFaint }} />
                  <span className="truncate">{label}</span>
                  {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: C.textFaint }} />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="px-4 py-4 border-t space-y-3" style={{ borderColor: C.border }}>
          <div className="flex items-center justify-between">
            <div className="text-[11px] min-w-0">
              <div style={{ color: C.textFaint }}>Masuk sebagai</div>
              <div className="font-semibold truncate" style={{ color: C.text }}>{currentUser}</div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-[11px] font-medium shrink-0 transition-colors"
              style={{ color: C.textDim }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.red)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.textDim)}
            >
              <LogOut className="w-3.5 h-3.5" /> Keluar
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: C.textFaint }}>
            <StatusDot color={loading ? C.amber : C.green} />
            {loading ? "SYNCING…" : "LIVE · v3.2"}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-8 pt-7 pb-5">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono mb-1.5" style={{ color: C.textFaint }}>
              <StatusDot color={C.accent} />
              SYNC LIVE · GOOGLE SHEETS 2025–2026
            </div>
            <h1 className="text-[26px] leading-tight font-semibold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Kinerja Revenue &amp; Penagihan
            </h1>
          </div>
          <button
            onClick={fetchGoogleSheetsData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-opacity hover:opacity-90 active:scale-[0.98] self-start md:self-auto"
            style={{ background: C.steel, color: "#0B1620" }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Menyinkronkan…" : "Sinkronkan data"}
          </button>
        </div>

        {/* Filter panel */}
        <div className="mx-8 border" style={{ borderColor: C.border, background: C.panel }}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: C.border }}>
            <div className="flex items-center gap-2 text-[11px] font-medium" style={{ color: C.textDim }}>
              <Search className="w-3.5 h-3.5" style={{ color: C.accent }} />
              Filter — target CDP menyesuaikan bulan &amp; tahun otomatis
            </div>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-[11px] font-medium transition-colors"
              style={{ color: C.textDim }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.textDim)}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-y lg:divide-y-0 lg:divide-x" style={{ borderColor: C.border }}>
            {[
              { value: filterTahun, onChange: setFilterTahun, options: ["Semua tahun", "2026", "2025", "2024", "2023"] },
              { value: filterBulan, onChange: setFilterBulan, options: ["Semua bulan","Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"] },
            ].map((f, idx) => (
              <select
                key={idx}
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                className="bg-transparent px-4 py-3 text-xs font-medium outline-none cursor-pointer"
                style={{ color: C.text, borderColor: C.border }}
              >
                {f.options.map((o) => <option key={o} style={{ background: C.panel }}>{o}</option>)}
              </select>
            ))}

            <input
              type="text"
              placeholder="No. invoice"
              value={filterNoInvoice}
              onChange={(e) => setFilterNoInvoice(e.target.value)}
              className="bg-transparent px-4 py-3 text-xs font-medium outline-none placeholder:opacity-60"
              style={{ color: C.text }}
            />
            <input
              type="text"
              placeholder="Customer"
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              className="bg-transparent px-4 py-3 text-xs font-medium outline-none placeholder:opacity-60"
              style={{ color: C.text }}
            />

            <select
              value={filterSales}
              onChange={(e) => setFilterSales(e.target.value)}
              className="bg-transparent px-4 py-3 text-xs font-medium outline-none cursor-pointer"
              style={{ color: C.text }}
            >
              {["Semua sales / VIA", "ANS", "CDF", "CDP", "FAN", "SPL", "TPM", "UCI"].map((o) => (
                <option key={o} style={{ background: C.panel }}>{o}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent px-4 py-3 text-xs font-medium outline-none cursor-pointer"
              style={{ color: C.text }}
            >
              {["Semua status","Lunas","Lebih Bayar","Kurang Bayar","Belum ada Pembayaran","Belum Lunas (Kurang Bayar & Belum Bayar)"].map((o) => (
                <option key={o} style={{ background: C.panel }}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI gauge strip */}
        <div className="mx-8 mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x border" style={{ borderColor: C.border, background: C.panel }}>
          <div className="px-5 py-5">
            <div className="text-[10px] font-medium mb-2" style={{ color: C.textFaint }}>Total Revenue</div>
            <div className="text-xl font-semibold font-mono" style={{ color: C.text }}>{formatRupiah(totalRevenue)}</div>
          </div>
          <div className="px-5 py-5">
            <div className="text-[10px] font-medium mb-2" style={{ color: C.textFaint }}>Cash In</div>
            <div className="text-xl font-semibold font-mono" style={{ color: C.green }}>{formatRupiah(totalCashIn)}</div>
            <div className="text-[11px] font-medium mt-1" style={{ color: C.textDim }}>{collectionRate}% collection rate</div>
          </div>
          <div className="px-5 py-5">
            <div className="text-[10px] font-medium mb-2" style={{ color: C.textFaint }}>Sisa Tagihan</div>
            <div className="text-xl font-semibold font-mono" style={{ color: C.red }}>{formatRupiah(totalSisaTagihan)}</div>
          </div>
          <div className="px-5 py-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium" style={{ color: C.textFaint }}>Aging &gt;60 &amp; &gt;120 hari</span>
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: C.amber }} />
            </div>
            <div className="text-lg font-semibold font-mono" style={{ color: C.amber }}>
              {formatRupiah(agingSummary.aging60_120 + agingSummary.agingCritical120)}
            </div>
            <div className="text-[10px] mt-1" style={{ color: C.textFaint }}>
              Kritis &gt;120h: <span className="font-semibold" style={{ color: C.red }}>{formatRupiah(agingSummary.agingCritical120)}</span>
            </div>
          </div>
        </div>

        <div className="px-8 py-7">
          {/* SALES PERFORMANCE */}
          {activeTab === "sales" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              <div className="xl:col-span-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    Performa sales individual
                  </h2>
                  <span className="text-xs font-mono" style={{ color: C.textFaint }}>{salesPerformanceData.length} sales</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {salesPerformanceData.map((item) => {
                    const salesKey = item.sales.toUpperCase();
                    const targetConfig = activeTargets[salesKey];
                    const hasTarget = Boolean(targetConfig);
                    const isCombined = targetConfig?.isCombined || false;
                    const revActual = isCombined ? combinedAnsFanData.revenue : item.totalRevenue;
                    const cashInActual = isCombined ? combinedAnsFanData.cashIn : item.totalCashIn;
                    const targetRev = targetConfig ? targetConfig.revenue : 0;
                    const targetCashIn = targetConfig ? targetConfig.cashIn : 0;
                    const revPct = targetRev > 0 ? Math.min(100, Math.round((revActual / targetRev) * 100)) : 0;
                    const cashPct = targetCashIn > 0 ? Math.min(100, Math.round((cashInActual / targetCashIn) * 100)) : 0;

                    return (
                      <div key={item.sales} className="border relative" style={{ borderColor: C.border, background: C.panel }}>
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l" style={{ borderColor: C.accent }} />
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r" style={{ borderColor: C.accent }} />
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-9 h-9 flex items-center justify-center font-bold text-xs font-mono"
                                style={{ background: C.panelAlt, color: C.accent, border: `1px solid ${C.border}` }}
                              >
                                {item.sales.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <h3 className="font-semibold text-sm">
                                  {item.sales} {isCombined && <span className="font-normal" style={{ color: C.textFaint }}>(ANS &amp; FAN)</span>}
                                </h3>
                                <p className="text-[10px]" style={{ color: C.textFaint }}>{item.totalCount} invoice tercatat</p>
                              </div>
                            </div>
                            <span
                              className="px-2 py-1 text-[10px] font-semibold flex items-center gap-1"
                              style={{
                                color: item.lunasCount > 0 ? C.green : C.amber,
                                background: item.lunasCount > 0 ? "rgba(78,174,114,0.1)" : "rgba(228,162,58,0.1)",
                                border: `1px solid ${item.lunasCount > 0 ? "rgba(78,174,114,0.25)" : "rgba(228,162,58,0.25)"}`,
                              }}
                            >
                              {item.lunasCount} lunas / {item.outstandingCount} pending
                            </span>
                          </div>

                          <div className="space-y-3 mb-3">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span style={{ color: C.textDim }}>Revenue aktual</span>
                                <span className="font-mono font-semibold">{formatRupiah(revActual)}</span>
                              </div>
                              {hasTarget && (
                                <>
                                  <div className="w-full h-1 mb-1" style={{ background: C.panelAlt }}>
                                    <div className="h-full" style={{ width: `${revPct}%`, background: C.accent }} />
                                  </div>
                                  <div className="flex justify-between text-[10px]" style={{ color: C.textFaint }}>
                                    <span>Target {formatCompact(targetRev)}</span>
                                    <span className="font-mono font-semibold" style={{ color: C.accent }}>{revPct}%</span>
                                  </div>
                                </>
                              )}
                            </div>

                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span style={{ color: C.textDim }}>Cash in aktual</span>
                                <span className="font-mono font-semibold" style={{ color: C.green }}>{formatRupiah(cashInActual)}</span>
                              </div>
                              {hasTarget && (
                                <>
                                  <div className="w-full h-1 mb-1" style={{ background: C.panelAlt }}>
                                    <div className="h-full" style={{ width: `${cashPct}%`, background: C.green }} />
                                  </div>
                                  <div className="flex justify-between text-[10px]" style={{ color: C.textFaint }}>
                                    <span>Target {formatCompact(targetCashIn)}</span>
                                    <span className="font-mono font-semibold" style={{ color: C.green }}>{cashPct}%</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="text-[11px] pt-2.5 border-t flex justify-between" style={{ borderColor: C.border, color: C.textFaint }}>
                            <span>Sisa tagihan</span>
                            <span className="font-mono font-semibold" style={{ color: C.red }}>{formatRupiah(item.totalSisaTagihan)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="xl:col-span-4">
                <div className="border" style={{ borderColor: C.border, background: C.panel }}>
                  <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: C.border }}>
                    <PieChart className="w-4 h-4" style={{ color: C.accent }} />
                    <h2 className="text-xs font-semibold">Kontribusi revenue 2026</h2>
                  </div>

                  <div className="p-4 space-y-3">
                    {contributionTableData.map((row) => {
                      const percentage = row.kontribusi.toFixed(1);
                      return (
                        <div key={row.sales} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold">{row.sales}</span>
                            <span className="font-mono" style={{ color: C.accent }}>{percentage}%</span>
                          </div>
                          <div className="w-full h-1.5" style={{ background: C.panelAlt }}>
                            <div className="h-full" style={{ width: `${Math.min(100, row.kontribusi)}%`, background: C.accent }} />
                          </div>
                          <div className="text-[10px] font-mono" style={{ color: C.textFaint }}>{formatRupiah(row.revenue)}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="px-4 py-3 border-t flex justify-between items-center text-xs" style={{ borderColor: C.border }}>
                    <span style={{ color: C.textDim }}>Total 2026</span>
                    <span className="font-mono font-semibold">{formatRupiah(totalRevenue2026Sum)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="border" style={{ borderColor: C.border, background: C.panel }}>
              <div className="flex items-center gap-2 px-5 py-3.5 border-b" style={{ borderColor: C.border }}>
                <Gauge className="w-4 h-4" style={{ color: C.accent }} />
                <h2 className="text-sm font-semibold">Ringkasan eksekutif</h2>
              </div>
              <div className="p-6">
                <p className="text-[13px] leading-relaxed mb-6" style={{ color: C.textDim, maxWidth: "68ch" }}>
                  Dashboard ini menampilkan data real-time dari Google Sheets untuk tahun 2025 dan 2026, mencakup penagihan (cash in), pendapatan total (revenue), serta piutang yang melewati batas waktu di seluruh wilayah operasional Makassar dan Sulawesi.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x border" style={{ borderColor: C.border }}>
                  <div className="p-4">
                    <div className="text-[10px] font-medium mb-1" style={{ color: C.textFaint }}>Invoice tersaring</div>
                    <div className="text-lg font-semibold font-mono">{filteredData.length}</div>
                  </div>
                  <div className="p-4">
                    <div className="text-[10px] font-medium mb-1" style={{ color: C.textFaint }}>Rasio kolektibilitas</div>
                    <div className="text-lg font-semibold font-mono" style={{ color: C.green }}>{collectionRate}%</div>
                  </div>
                  <div className="p-4">
                    <div className="text-[10px] font-medium mb-1" style={{ color: C.textFaint }}>Piutang kritis</div>
                    <div className="text-lg font-semibold font-mono" style={{ color: C.red }}>{formatRupiah(agingSummary.agingCritical120)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TREND */}
          {activeTab === "trend" && (
            <div className="border" style={{ borderColor: C.border, background: C.panel }}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: C.border }}>
                <h2 className="text-sm font-semibold">
                  Tren bulanan — {filterTahun === "Semua tahun" ? "2026 (default)" : filterTahun}
                </h2>
                <span className="text-xs" style={{ color: C.textFaint }}>Revenue vs cash in</span>
              </div>
              <div className="p-5 space-y-3">
                {monthlyTrendData.data.map((item) => {
                  const revWidth = (item.revenue / monthlyTrendData.maxVal) * 100;
                  const cashWidth = (item.cashIn / monthlyTrendData.maxVal) * 100;
                  return (
                    <div key={item.bulan} className="flex items-center gap-4">
                      <div className="w-9 text-[11px] font-mono font-semibold shrink-0" style={{ color: C.textDim }}>{item.short}</div>
                      <div className="flex-1 space-y-1">
                        <div className="w-full h-2" style={{ background: C.panelAlt }}>
                          <div className="h-full" style={{ width: `${Math.min(100, revWidth)}%`, background: C.steel }} />
                        </div>
                        <div className="w-full h-2" style={{ background: C.panelAlt }}>
                          <div className="h-full" style={{ width: `${Math.min(100, cashWidth)}%`, background: C.green }} />
                        </div>
                      </div>
                      <div className="w-44 shrink-0 text-right text-[10px] font-mono leading-tight">
                        <div style={{ color: C.steel }}>{formatRupiah(item.revenue)}</div>
                        <div style={{ color: C.green }}>{formatRupiah(item.cashIn)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AGING */}
          {activeTab === "aging" && (
            <div className="border" style={{ borderColor: C.border, background: C.panel }}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: C.border }}>
                <h2 className="text-sm font-semibold">Analisis aging piutang</h2>
                <span className="text-xs font-medium" style={{ color: C.amber }}>Fokus pemulihan kas</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x border-b" style={{ borderColor: C.border }}>
                {[
                  { label: "0–30 hari (lancar)", val: agingSummary.current, color: C.green },
                  { label: "31–60 hari", val: agingSummary.aging31_60, color: C.steel },
                  { label: "61–120 hari", val: agingSummary.aging60_120, color: C.amber },
                  { label: "> 120 hari (kritis)", val: agingSummary.agingCritical120, color: C.red },
                ].map((b) => (
                  <div key={b.label} className="p-4">
                    <div className="text-[10px] font-medium mb-1" style={{ color: C.textFaint }}>{b.label}</div>
                    <div className="text-base font-semibold font-mono" style={{ color: b.color }}>{formatRupiah(b.val)}</div>
                  </div>
                ))}
              </div>

              <div className="p-5">
                <h3 className="text-xs font-semibold mb-3" style={{ color: C.textDim }}>Invoice piutang berumur &gt; 60 hari</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b" style={{ borderColor: C.border, color: C.textFaint }}>
                        <th className="px-3 py-2.5 font-medium">No Invoice</th>
                        <th className="px-3 py-2.5 font-medium">Customer</th>
                        <th className="px-3 py-2.5 font-medium">Sales/VIA</th>
                        <th className="px-3 py-2.5 font-medium">Sisa tagihan</th>
                        <th className="px-3 py-2.5 font-medium">Umur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.filter((item) => item.sisaTagihan > 0 && item.agingDays > 60).length === 0 ? (
                        <tr><td colSpan="5" className="px-3 py-6 text-center" style={{ color: C.textFaint }}>Tidak ada piutang di atas 60 hari pada filter ini.</td></tr>
                      ) : (
                        filteredData.filter((item) => item.sisaTagihan > 0 && item.agingDays > 60).map((item) => (
                          <tr key={item.id} className="border-b transition-colors" style={{ borderColor: C.border }}>
                            <td className="px-3 py-2.5 font-mono font-semibold">{item.noInvoice}</td>
                            <td className="px-3 py-2.5" style={{ color: C.textDim }}>{item.customer}</td>
                            <td className="px-3 py-2.5">{item.via}</td>
                            <td className="px-3 py-2.5 font-mono font-semibold" style={{ color: C.red }}>{formatRupiah(item.sisaTagihan)}</td>
                            <td className="px-3 py-2.5">
                              <span className="px-2 py-0.5 font-mono font-semibold text-[11px]" style={{ background: "rgba(225,84,77,0.1)", color: C.red }}>
                                {item.agingDays}h
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MASTER INVOICE */}
          {activeTab === "master" && (
            <div className="border" style={{ borderColor: C.border, background: C.panel }}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: C.border }}>
                <h2 className="text-sm font-semibold">Master data invoice — {filteredData.length}</h2>
                <span className="text-xs" style={{ color: C.textFaint }}>Live synchronized</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b" style={{ borderColor: C.border, color: C.textFaint }}>
                      <th className="px-4 py-2.5 font-medium">Tahun/Bulan</th>
                      <th className="px-4 py-2.5 font-medium">No Invoice</th>
                      <th className="px-4 py-2.5 font-medium">Customer</th>
                      <th className="px-4 py-2.5 font-medium">Sales/VIA</th>
                      <th className="px-4 py-2.5 font-medium">Nilai invoice</th>
                      <th className="px-4 py-2.5 font-medium">Dana masuk</th>
                      <th className="px-4 py-2.5 font-medium">Sisa tagihan</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.length === 0 ? (
                      <tr><td colSpan="8" className="px-4 py-8 text-center" style={{ color: C.textFaint }}>Tidak ada data invoice yang sesuai dengan filter.</td></tr>
                    ) : (
                      filteredData.map((item) => (
                        <tr key={item.id} className="border-b" style={{ borderColor: C.border }}>
                          <td className="px-4 py-2.5 font-mono" style={{ color: C.textFaint }}>{item.tahun} · {item.bulan}</td>
                          <td className="px-4 py-2.5 font-mono font-semibold">{item.noInvoice}</td>
                          <td className="px-4 py-2.5" style={{ color: C.textDim }}>{item.customer}</td>
                          <td className="px-4 py-2.5 font-semibold" style={{ color: C.accent }}>{item.via}</td>
                          <td className="px-4 py-2.5 font-mono">{formatRupiah(item.nilaiInvoice)}</td>
                          <td className="px-4 py-2.5 font-mono" style={{ color: C.green }}>{formatRupiah(item.danaMasuk)}</td>
                          <td className="px-4 py-2.5 font-mono font-semibold" style={{ color: C.red }}>{formatRupiah(item.sisaTagihan)}</td>
                          <td className="px-4 py-2.5">
                           {(() => {
                 const s = getStatusStyle(item.status);
                 return (
                <span
                className="px-2 py-0.5 text-[10px] font-semibold border"
                style={{ color: s.color, background: s.background, borderColor: s.border }}
                >
               {item.status}
               </span>
               );
                })()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* JOB ID */}
          {activeTab === "jobid" && (
            <div className="border" style={{ borderColor: C.border, background: C.panel }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-3.5 border-b" style={{ borderColor: C.border }}>
                <div>
                  <h2 className="text-sm font-semibold">Monitoring Job ID &amp; pekerjaan alat berat</h2>
                  <p className="text-xs mt-0.5" style={{ color: C.textFaint }}>Sinkronisasi database Job ID dari sheet KPI – SPV Sales</p>
                </div>
                <input
                  type="text"
                  placeholder="Cari Job ID / penyewa / unit / lokasi"
                  value={filterJobSearch}
                  onChange={(e) => setFilterJobSearch(e.target.value)}
                  className="w-full sm:w-72 px-3.5 py-2 text-xs outline-none border"
                  style={{ background: C.bgAlt, borderColor: C.border, color: C.text }}
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b" style={{ borderColor: C.border, color: C.textFaint }}>
                      <th className="px-4 py-2.5 font-medium">No</th>
                      <th className="px-4 py-2.5 font-medium">Kode unit</th>
                      <th className="px-4 py-2.5 font-medium">Brand / Model</th>
                      <th className="px-4 py-2.5 font-medium">Class</th>
                      <th className="px-4 py-2.5 font-medium">Job ID</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 font-medium">Nama penyewa</th>
                      <th className="px-4 py-2.5 font-medium">Jenis penyewa</th>
                      <th className="px-4 py-2.5 font-medium">Via/Sales</th>
                      <th className="px-4 py-2.5 font-medium">Jenis pekerjaan</th>
                      <th className="px-4 py-2.5 font-medium">Lokasi kerja</th>
                      <th className="px-4 py-2.5 font-medium">Tgl mobilisasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="12" className="px-4 py-8 text-center" style={{ color: C.textFaint }}>Memuat data Job ID dari Google Sheets…</td></tr>
                    ) : filteredJobIdData.length === 0 ? (
                      <tr><td colSpan="12" className="px-4 py-8 text-center" style={{ color: C.textFaint }}>Tidak ada data Job ID yang ditemukan.</td></tr>
                    ) : (
                      filteredJobIdData.map((job, idx) => {
                        const s = getUnitStatusStyle(job.jenisSewa);
                        return (
                          <tr key={job.id} className="border-b" style={{ borderColor: C.border }}>
                            <td className="px-4 py-2.5 font-mono" style={{ color: C.textFaint }}>{idx + 1}</td>
                            <td className="px-4 py-2.5 font-mono font-semibold" style={{ color: C.accent }}>{job.kodeUnit}</td>
                            <td className="px-4 py-2.5" style={{ color: C.textDim }}>{job.brand} {job.model}</td>
                            <td className="px-4 py-2.5">{job.classUnit}</td>
                            <td className="px-4 py-2.5 font-mono font-semibold">{job.jobId}</td>
                            <td className="px-4 py-2.5">
                              <span
                                className="px-2 py-0.5 text-[10px] font-semibold border"
                                style={{ color: s.color, background: s.background, borderColor: s.border }}
                              >
                                {job.jenisSewa}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">{job.namaPenyewa}</td>
                            <td className="px-4 py-2.5" style={{ color: C.textDim }}>{job.jenisPenyewa}</td>
                            <td className="px-4 py-2.5 font-semibold" style={{ color: C.steel }}>{job.via}</td>
                            <td className="px-4 py-2.5" style={{ color: C.textDim }}>{job.jenisPekerjaan}</td>
                            <td className="px-4 py-2.5" style={{ color: C.textDim }}>{job.lokasiKerja}</td>
                            <td className="px-4 py-2.5 font-mono" style={{ color: C.textFaint }}>{job.mobilisasi}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ALOKASI KAS MASUK */}
          {activeTab === "kasmasuk" && (
            <div className="space-y-6">
              {/* Local filter bar */}
              <div className="border" style={{ borderColor: C.border, background: C.panel }}>
                <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: C.border }}>
                  <div className="flex items-center gap-2 text-[11px] font-medium" style={{ color: C.textDim }}>
                    <Landmark className="w-3.5 h-3.5" style={{ color: C.accent }} />
                    Filter alokasi kas masuk
                  </div>
                  <button
                    onClick={() => {
                      setFilterKasTahun("2026");
                      setFilterKasBulan("Semua bulan");
                      setFilterKasJenis("Semua jenis");
                      setFilterKasRekening("Semua rekening");
                      setFilterKasSearch("");
                    }}
                    className="flex items-center gap-1.5 text-[11px] font-medium transition-colors"
                    style={{ color: C.textDim }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = C.textDim)}
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x" style={{ borderColor: C.border }}>
                  <select
                    value={filterKasTahun}
                    onChange={(e) => setFilterKasTahun(e.target.value)}
                    className="bg-transparent px-4 py-3 text-xs font-medium outline-none cursor-pointer"
                    style={{ color: C.text }}
                  >
                    {["Semua tahun", "2026", "2025", "2024", "2023"].map((o) => (
                      <option key={o} style={{ background: C.panel }}>{o}</option>
                    ))}
                  </select>
                  <select
                    value={filterKasBulan}
                    onChange={(e) => setFilterKasBulan(e.target.value)}
                    className="bg-transparent px-4 py-3 text-xs font-medium outline-none cursor-pointer"
                    style={{ color: C.text }}
                  >
                    {["Semua bulan", ...MONTH_ID_NAMES].map((o) => (
                      <option key={o} style={{ background: C.panel }}>{o}</option>
                    ))}
                  </select>
                  <select
                    value={filterKasJenis}
                    onChange={(e) => setFilterKasJenis(e.target.value)}
                    className="bg-transparent px-4 py-3 text-xs font-medium outline-none cursor-pointer"
                    style={{ color: C.text }}
                  >
                    {["Semua jenis", ...kasJenisOptions].map((o) => (
                      <option key={o} style={{ background: C.panel }}>{o}</option>
                    ))}
                  </select>
                  <select
                    value={filterKasRekening}
                    onChange={(e) => setFilterKasRekening(e.target.value)}
                    className="bg-transparent px-4 py-3 text-xs font-medium outline-none cursor-pointer"
                    style={{ color: C.text }}
                  >
                    {["Semua rekening", ...kasRekeningOptions].map((o) => (
                      <option key={o} style={{ background: C.panel }}>{o}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Cari invoice / konsumen / job ID"
                    value={filterKasSearch}
                    onChange={(e) => setFilterKasSearch(e.target.value)}
                    className="bg-transparent px-4 py-3 text-xs font-medium outline-none placeholder:opacity-60"
                    style={{ color: C.text }}
                  />
                </div>
              </div>

              {/* KPI strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x border" style={{ borderColor: C.border, background: C.panel }}>
                <div className="px-5 py-5">
                  <div className="text-[10px] font-medium mb-2" style={{ color: C.textFaint }}>Total Kas Masuk Dialokasikan</div>
                  <div className="text-xl font-semibold font-mono" style={{ color: C.green }}>{formatRupiah(kasSummary.totalAlokasi)}</div>
                </div>
                <div className="px-5 py-5">
                  <div className="text-[10px] font-medium mb-2" style={{ color: C.textFaint }}>Jumlah Transaksi Kas Masuk</div>
                  <div className="text-xl font-semibold font-mono">{kasSummary.totalTransaksi.toLocaleString("id-ID")}</div>
                </div>
                <div className="px-5 py-5">
                  <div className="text-[10px] font-medium mb-2" style={{ color: C.textFaint }}>Sisa Belum Dialokasikan</div>
                  <div className="text-xl font-semibold font-mono" style={{ color: C.amber }}>{formatRupiah(kasSummary.totalSisa)}</div>
                </div>
                <div className="px-5 py-5">
                  <div className="text-[10px] font-medium mb-2" style={{ color: C.textFaint }}>Baris Alokasi Tersaring</div>
                  <div className="text-xl font-semibold font-mono">{filteredKasData.length.toLocaleString("id-ID")}</div>
                </div>
              </div>

              {/* Breakdown: jenis alokasi + rekening */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border" style={{ borderColor: C.border, background: C.panel }}>
                  <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: C.border }}>
                    <PieChart className="w-4 h-4" style={{ color: C.accent }} />
                    <h2 className="text-xs font-semibold">Alokasi per jenis</h2>
                  </div>
                  <div className="p-4 space-y-3">
                    {kasByJenis.length === 0 ? (
                      <div className="text-xs" style={{ color: C.textFaint }}>Tidak ada data pada filter ini.</div>
                    ) : (
                      kasByJenis.map((row) => (
                        <div key={row.jenis} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold">{row.jenis}</span>
                            <span className="font-mono" style={{ color: C.accent }}>{row.pct.toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-1.5" style={{ background: C.panelAlt }}>
                            <div className="h-full" style={{ width: `${Math.min(100, row.pct)}%`, background: C.accent }} />
                          </div>
                          <div className="text-[10px] font-mono" style={{ color: C.textFaint }}>{formatRupiah(row.val)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="border" style={{ borderColor: C.border, background: C.panel }}>
                  <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: C.border }}>
                    <Landmark className="w-4 h-4" style={{ color: C.steel }} />
                    <h2 className="text-xs font-semibold">Alokasi per rekening</h2>
                  </div>
                  <div className="p-4 space-y-3">
                    {kasByRekening.length === 0 ? (
                      <div className="text-xs" style={{ color: C.textFaint }}>Tidak ada data pada filter ini.</div>
                    ) : (
                      kasByRekening.map((row) => {
                        const maxVal = kasByRekening[0]?.val || 1;
                        const pct = (row.val / maxVal) * 100;
                        return (
                          <div key={row.rekening} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-semibold">{row.rekening}</span>
                              <span className="font-mono" style={{ color: C.steel }}>{formatRupiah(row.val)}</span>
                            </div>
                            <div className="w-full h-1.5" style={{ background: C.panelAlt }}>
                              <div className="h-full" style={{ width: `${Math.min(100, pct)}%`, background: C.steel }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Monthly trend */}
              <div className="border" style={{ borderColor: C.border, background: C.panel }}>
                <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: C.border }}>
                  <h2 className="text-sm font-semibold">
                    Tren kas masuk bulanan — {filterKasTahun === "Semua tahun" ? "2026 (default)" : filterKasTahun}
                  </h2>
                  <span className="text-xs" style={{ color: C.textFaint }}>Jumlah alokasi per bulan</span>
                </div>
                <div className="p-5 space-y-3">
                  {kasMonthlyTrend.data.map((item) => {
                    const width = (item.val / kasMonthlyTrend.maxVal) * 100;
                    return (
                      <div key={item.bulan} className="flex items-center gap-4">
                        <div className="w-9 text-[11px] font-mono font-semibold shrink-0" style={{ color: C.textDim }}>{item.short}</div>
                        <div className="flex-1">
                          <div className="w-full h-2" style={{ background: C.panelAlt }}>
                            <div className="h-full" style={{ width: `${Math.min(100, width)}%`, background: C.green }} />
                          </div>
                        </div>
                        <div className="w-36 shrink-0 text-right text-[10px] font-mono" style={{ color: C.green }}>
                          {formatRupiah(item.val)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Table */}
              <div className="border" style={{ borderColor: C.border, background: C.panel }}>
                <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: C.border }}>
                  <h2 className="text-sm font-semibold">Rincian alokasi kas masuk — {filteredKasData.length.toLocaleString("id-ID")}</h2>
                  <span className="text-xs" style={{ color: C.textFaint }}>Live synchronized</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b" style={{ borderColor: C.border, color: C.textFaint }}>
                        <th className="px-4 py-2.5 font-medium">Tanggal</th>
                        <th className="px-4 py-2.5 font-medium">Invoice</th>
                        <th className="px-4 py-2.5 font-medium">Konsumen</th>
                        <th className="px-4 py-2.5 font-medium">Job ID / Unit</th>
                        <th className="px-4 py-2.5 font-medium">Jenis</th>
                        <th className="px-4 py-2.5 font-medium">Rekening</th>
                        <th className="px-4 py-2.5 font-medium">Jumlah Alokasi</th>
                        <th className="px-4 py-2.5 font-medium">Sisa Kas Masuk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="8" className="px-4 py-8 text-center" style={{ color: C.textFaint }}>Memuat data alokasi kas masuk dari Google Sheets…</td></tr>
                      ) : filteredKasData.length === 0 ? (
                        <tr><td colSpan="8" className="px-4 py-8 text-center" style={{ color: C.textFaint }}>Tidak ada data alokasi kas masuk yang sesuai dengan filter.</td></tr>
                      ) : (
                        filteredKasData.slice(0, kasVisibleCount).map((item) => (
                          <tr key={item.id} className="border-b" style={{ borderColor: C.border }}>
                            <td className="px-4 py-2.5 font-mono" style={{ color: C.textFaint }}>{item.tanggalKasMasuk}</td>
                            <td className="px-4 py-2.5 font-mono font-semibold">{item.invoiceNumber}</td>
                            <td className="px-4 py-2.5" style={{ color: C.textDim }}>{item.namaKonsumen}</td>
                            <td className="px-4 py-2.5 font-mono text-[11px]" style={{ color: C.accent }}>
                              {item.jobId !== "-" ? item.jobId : item.noUnit}
                            </td>
                            <td className="px-4 py-2.5">{item.jenisAlokasi}</td>
                            <td className="px-4 py-2.5" style={{ color: C.steel }}>{item.rekening}</td>
                            <td className="px-4 py-2.5 font-mono font-semibold" style={{ color: C.green }}>{formatRupiah(item.jumlahAlokasi)}</td>
                            <td className="px-4 py-2.5 font-mono" style={{ color: item.sisaKasMasuk > 0 ? C.amber : C.textFaint }}>{formatRupiah(item.sisaKasMasuk)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {filteredKasData.length > kasVisibleCount && (
                  <div className="px-5 py-3.5 border-t flex justify-center" style={{ borderColor: C.border }}>
                    <button
                      onClick={() => setKasVisibleCount((c) => c + 100)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 transition-opacity hover:opacity-90"
                      style={{ background: C.panelAlt, color: C.text, border: `1px solid ${C.border}` }}
                    >
                      <Plus className="w-3.5 h-3.5" style={{ color: C.accent }} />
                      Tampilkan 100 baris berikutnya ({filteredKasData.length - kasVisibleCount} tersisa)
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
