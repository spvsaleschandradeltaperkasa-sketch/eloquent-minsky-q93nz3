import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { 
  FileText, Users, DollarSign, TrendingUp, AlertTriangle, LogOut, 
  Search, Filter, Download, CheckCircle, Clock, ShieldCheck, Database, RefreshCw, Calendar, Layers, Wallet
} from 'lucide-react';

// ==========================================
// KONTANTA URL CSV (DIKETIK UTUH TANPA TERPOTONG)
// ==========================================
const BASE_URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTo9EJbez7MyWXlYkXc-rzoN8vqYa1SEyC_ffeObmb0Nq9D6hTAzdS1rbZ6_OnnYntvAYYoTIMQu03C/pub?output=csv";
const URL_INVOICE_2026 = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTo9EJbez7MyWXlYkXc-rzoN8vqYa1SEyC_ffeObmb0Nq9D6hTAzdS1rbZ6_OnnYntvAYYoTIMQu03C/pub?gid=0&single=true&output=csv";
const URL_INVOICE_2025 = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTo9EJbez7MyWXlYkXc-rzoN8vqYa1SEyC_ffeObmb0Nq9D6hTAzdS1rbZ6_OnnYntvAYYoTIMQu03C/pub?gid=1510255956&single=true&output=csv";
const URL_ALOKASI_KAS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTo9EJbez7MyWXlYkXc-rzoN8vqYa1SEyC_ffeObmb0Nq9D6hTAzdS1rbZ6_OnnYntvAYYoTIMQu03C/pub?gid=1728018265&single=true&output=csv";

export default function App() {
  // State Utama & Login (Kode Asli)
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  
  // State Data (Ditambahkan alokasiKasData)
  const [data2026, setData2026] = useState([]);
  const [data2025, setData2025] = useState([]);
  const [alokasiKasData, setAlokasiKasData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState('');

  // Parser CSV Sesuai Kode Asli Bapak
  const parseCSV = (text) => {
    const lines = text.split('\n');
    const result = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const row = lines[i].split(',').map(val => val.replace(/^"|"$/g, '').trim());
      if (row.length > 1) {
        result.push({
          id: i,
          tahun: row[0] || '2026',
          alokasi: row[1] || '-',
          invoiceNumber: row[2] || '-',
          jobId: row[3] || '-',
          noUnit: row[4] || '-',
          namaKonsumen: row[5] || '-',
          alamat: row[6] || '-',
          kodeKasMasuk: row[7] || '-',
          tanggalKasMasuk: row[8] || '-',
          rekening: row[9] || '-',
          jumlahKasMasuk: parseFloat((row[10] || '0').replace(/\./g, '').replace(',', '.')) || 0,
          sisaKasMasuk: parseFloat((row[11] || '0').replace(/\./g, '').replace(',', '.')) || 0,
          month: row[12] || '-',
        });
      }
    }
    return result;
  };

  // Parser Khusus Alokasi Kas Masuk
  const parseAlokasiKasCSV = (text) => {
    const lines = text.split('\n');
    const result = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const row = lines[i].split(',').map(val => val.replace(/^"|"$/g, '').trim());
      if (row.length > 1) {
        result.push({
          id: i,
          tahun: row[12] || row[0] || '2026',
          bulan: row[11] || '01',
          alokasi: row[1] || '-',
          jumlahKasMasuk: parseFloat((row[10] || row[9] || '0').replace(/\./g, '').replace(',', '.')) || 0,
          keterangan: row[6] || row[10] || '-'
        });
      }
    }
    return result;
  };

  // Fetch Data 
  const fetchData = async () => {
    setLoading(true);
    try {
      const res26 = await fetch(URL_INVOICE_2026);
      const text26 = await res26.text();
      setData2026(parseCSV(text26));

      const res25 = await fetch(URL_INVOICE_2025);
      const text25 = await res25.text();
      setData2025(parseCSV(text25));

      const resKas = await fetch(URL_ALOKASI_KAS);
      const textKas = await resKas.text();
      setAlokasiKasData(parseAlokasiKasCSV(textKas));

      setLastSync(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Gagal sinkronisasi data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format Rupiah (Kode Asli)
  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
        <div className="p-8 bg-gray-900 border border-gray-800 rounded-xl w-96 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 text-center text-emerald-400">Delta Perkasa ERP</h2>
          <button 
            onClick={() => setIsLoggedIn(true)}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-semibold transition"
          >
            Masuk Sistem
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col justify-between">
        <div>
          <div className="p-6 border-b border-gray-800">
            <h1 className="text-xl font-bold text-emerald-400 tracking-wider">DELTA PERKASA</h1>
            <p className="text-xs text-gray-400 mt-1">Rental Alat Berat Makassar</p>
          </div>
          <nav className="p-4 space-y-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'dashboard' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <TrendingUp size={18} />
              <span>Dashboard Utama</span>
            </button>
            <button 
              onClick={() => setActiveTab('invoice2026')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'invoice2026' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <FileText size={18} />
              <span>Master Invoice 2026</span>
            </button>
            <button 
              onClick={() => setActiveTab('invoice2025')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'invoice2025' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <FileText size={18} />
              <span>Master Invoice 2025</span>
            </button>
            <button 
              onClick={() => setActiveTab('alokasiKas')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'alokasiKas' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <Wallet size={18} />
              <span>Alokasi Kas Masuk</span>
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut size={18} />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-8">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">Sinkronisasi Terakhir: <strong className="text-white">{lastSync || 'Belum'}</strong></span>
            <button 
              onClick={fetchData} 
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs font-semibold rounded-lg border border-gray-700 transition"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-emerald-400" : ""} />
              <span>{loading ? 'Menyinkronkan...' : 'Sinkronkan Data'}</span>
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-emerald-600/20 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 font-bold">
              DP
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Admin Delta</p>
              <p className="text-xs text-gray-400">Makassar, Sulawesi Selatan</p>
            </div>
          </div>
        </header>

        {/* DYNAMIC TAB VIEW */}
        <main className="flex-1 overflow-y-auto p-8 bg-gray-950">
          
          {/* TAB 1: DASHBOARD UTAMA */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Dashboard Operasional 2026</h2>
                <p className="text-sm text-gray-400">Ringkasan performa penyewaan alat berat dan keuangan perusahaan.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
                  <p className="text-sm text-gray-400">Total Transaksi 2026</p>
                  <p className="text-3xl font-bold text-white mt-2">{data2026.length} Unit</p>
                </div>
                <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
                  <p className="text-sm text-gray-400">Akumulasi Kas Masuk 2026</p>
                  <p className="text-3xl font-bold text-emerald-400 mt-2">
                    {formatRupiah(data2026.reduce((acc, curr) => acc + curr.jumlahKasMasuk, 0))}
                  </p>
                </div>
                <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
                  <p className="text-sm text-gray-400">Sisa Piutang 2026</p>
                  <p className="text-3xl font-bold text-amber-400 mt-2">
                    {formatRupiah(data2026.reduce((acc, curr) => acc + curr.sisaKasMasuk, 0))}
                  </p>
                </div>
                <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
                  <p className="text-sm text-gray-400">Total Data 2025</p>
                  <p className="text-3xl font-bold text-blue-400 mt-2">{data2025.length} Catatan</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MASTER INVOICE 2026 */}
          {activeTab === 'invoice2026' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">Master Invoice 2026</h2>
                  <p className="text-sm text-gray-400">Data rincian tagihan dan pembayaran tahun 2026.</p>
                </div>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Cari konsumen / nomor invoice..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm text-gray-300">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-400 uppercase text-xs tracking-wider bg-gray-950/50">
                        <th className="py-3 px-4">Tahun</th>
                        <th className="py-3 px-4">Alokasi</th>
                        <th className="py-3 px-4">Invoice</th>
                        <th className="py-3 px-4">Job ID</th>
                        <th className="py-3 px-4">Konsumen</th>
                        <th className="py-3 px-4">Jumlah Kas Masuk</th>
                        <th className="py-3 px-4">Sisa Kas Masuk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data2026
                        .filter(item => item.namaKonsumen.toLowerCase().includes(searchTerm.toLowerCase()) || item.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((item) => (
                        <tr key={item.id} className="border-b border-gray-800/60 hover:bg-gray-800/40">
                          <td className="py-3 px-4">{item.tahun}</td>
                          <td className="py-3 px-4">{item.alokasi}</td>
                          <td className="py-3 px-4 font-semibold text-white">{item.invoiceNumber}</td>
                          <td className="py-3 px-4 text-emerald-400">{item.jobId}</td>
                          <td className="py-3 px-4">{item.namaKonsumen}</td>
                          <td className="py-3 px-4 text-emerald-400 font-medium">{formatRupiah(item.jumlahKasMasuk)}</td>
                          <td className="py-3 px-4 text-amber-400 font-medium">{formatRupiah(item.sisaKasMasuk)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MASTER INVOICE 2025 */}
          {activeTab === 'invoice2025' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Master Invoice 2025</h2>
                <p className="text-sm text-gray-400">Arsip riwayat invoice tahun 2025.</p>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm text-gray-300">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-400 uppercase text-xs tracking-wider bg-gray-950/50">
                        <th className="py-3 px-4">Tahun</th>
                        <th className="py-3 px-4">Alokasi</th>
                        <th className="py-3 px-4">Invoice</th>
                        <th className="py-3 px-4">Job ID</th>
                        <th className="py-3 px-4">Konsumen</th>
                        <th className="py-3 px-4">Jumlah Kas Masuk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data2025.map((item) => (
                        <tr key={item.id} className="border-b border-gray-800/60 hover:bg-gray-800/40">
                          <td className="py-3 px-4">{item.tahun}</td>
                          <td className="py-3 px-4">{item.alokasi}</td>
                          <td className="py-3 px-4 font-semibold text-white">{item.invoiceNumber}</td>
                          <td className="py-3 px-4 text-emerald-400">{item.jobId}</td>
                          <td className="py-3 px-4">{item.namaKonsumen}</td>
                          <td className="py-3 px-4 text-emerald-400 font-medium">{formatRupiah(item.jumlahKasMasuk)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ALOKASI KAS MASUK */}
          {activeTab === 'alokasiKas' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">Alokasi Kas Masuk</h2>
                  <p className="text-sm text-gray-400">Data tersambung langsung dari Google Sheets Alokasi Kas Masuk.</p>
                </div>
                <div className="px-4 py-2 bg-emerald-600/10 border border-emerald-500/30 rounded-lg text-xs font-semibold text-emerald-400">
                  Total Data: {alokasiKasData.length} Baris
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm text-gray-300">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-400 uppercase text-xs tracking-wider bg-gray-950/60">
                        <th className="py-3.5 px-6">Tahun</th>
                        <th className="py-3.5 px-6">Bulan</th>
                        <th className="py-3.5 px-6">Alokasi</th>
                        <th className="py-3.5 px-6">Jumlah Kas Masuk</th>
                        <th className="py-3.5 px-6">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alokasiKasData.map((item, index) => (
                        <tr key={index} className="border-b border-gray-800/60 hover:bg-gray-800/40 transition">
                          <td className="py-4 px-6 font-semibold text-white">{item.tahun}</td>
                          <td className="py-4 px-6 text-gray-300">Bulan {item.bulan}</td>
                          <td className="py-4 px-6 text-gray-300">{item.alokasi}</td>
                          <td className="py-4 px-6 text-emerald-400 font-bold">
                            {formatRupiah(item.jumlahKasMasuk)}
                          </td>
                          <td className="py-4 px-6 text-gray-400">{item.keterangan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
