import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, CheckCircle, Clock, 
  Search, RefreshCw, DollarSign, Building, 
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [jenisFilter, setJenisFilter] = useState('ALL');

  // TEMPEL LINK CSV "SELURUH DOKUMEN" YANG BARU KAMU SALIN DI SINI:
  const publishedCsvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTo9EJbez7MyWXlYKXc-rzon8VqYa1SEYc_ffeObmb0Nq9D6hTAzdS1rbZ6_OnnYtvAYYoTIMQu03C/pub?output=csv";

  const parseCSVLine = (line) => {
    const result = [];
    let startValue = 0;
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        let val = line.substring(startValue, i).trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        }
        result.push(val.replace(/""/g, '"'));
        startValue = i + 1;
      }
    }
    let lastVal = line.substring(startValue).trim();
    if (lastVal.startsWith('"') && lastVal.endsWith('"')) {
      lastVal = lastVal.substring(1, lastVal.length - 1);
    }
    result.push(lastVal.replace(/""/g, '"'));
    return result;
  };

  const parseMasterRekap = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    // Cari baris header yang mengandung kata 'Appsheet ID' atau 'Nama Penyewa'
    let headerIndex = 0;
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      if (lines[i].includes('Appsheet ID') || lines[i].includes('Nama Penyewa')) {
        headerIndex = i;
        break;
      }
    }

    const headers = parseCSVLine(lines[headerIndex]);
    const parsedData = [];

    for (let i = headerIndex + 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      if (row.length < 2) continue;

      const obj = {};
      headers.forEach((h, index) => {
        obj[h.trim()] = row[index] || '';
      });

      const appsheetId = obj['Appsheet ID'] || `ROW-${i}`;
      const timestamp = obj['Timestamp'] || '';
      const transactionNumber = obj['Transaction Number'] || '';
      const onJobOrNot = obj['On Job or Not'] || obj['On Job'] || '';
      const jenisSewa = obj['Jenis Sewa'] || '';
      const namaPenyewa = obj['Nama Penyewa'] || '';
      const jenisPenyewa = obj['Jenis Penyewa'] || '';
      const kodeUnit = obj['Kode Unit'] || '';

      // Abaikan baris kosong yang tidak punya nama penyewa atau timestamp
      if (!timestamp && !namaPenyewa) continue;

      let nilaiInvoice = 0;
      Object.keys(obj).forEach(key => {
        const val = obj[key];
        if (key !== 'Transaction Number' && key !== 'Appsheet ID' && !isNaN(val) && val.length > 3) {
          const num = parseFloat(val);
          if (num > 1000 && nilaiInvoice === 0) {
            nilaiInvoice = num;
          }
        }
      });

      parsedData.push({
        id: appsheetId,
        timestamp,
        transactionNumber,
        onJobOrNot,
        jenisSewa,
        namaPenyewa: namaPenyewa || 'Tanpa Nama',
        jenisPenyewa,
        kodeUnit,
        nilaiInvoice
      });
    }

    return parsedData;
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(publishedCsvUrl)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) throw new Error("Gagal mengambil data.");
      
      const data = await response.json();
      const csvText = data.contents;

      if (csvText && csvText.length > 50) {
        const parsedData = parseMasterRekap(csvText);
        setInvoices(parsedData);
      } else {
        setError("Data kosong atau tidak dapat dibaca.");
      }
    } catch (e) {
      try {
        const directRes = await fetch(publishedCsvUrl);
        const directText = await directRes.text();
        const parsedData = parseMasterRekap(directText);
        setInvoices(parsedData);
      } catch (err) {
        setError("Gagal menghubungi Google Sheets. Periksa publikasi web.");
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const totalData = invoices.length;
    const totalNilai = invoices.reduce((acc, curr) => acc + (curr.nilaiInvoice || 0), 0);
    const onJobCount = invoices.filter(item => item.onJobOrNot.toUpperCase().includes('ON JOB')).length;
    const standbyCount = invoices.filter(item => item.onJobOrNot.toUpperCase().includes('STANDBY')).length;

    return { totalData, totalNilai, onJobCount, standbyCount };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(item => {
      const matchSearch = 
        item.namaPenyewa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kodeUnit.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || item.onJobOrNot.toUpperCase().includes(statusFilter);
      const matchJenis = jenisFilter === 'ALL' || item.jenisPenyewa.toUpperCase().includes(jenisFilter);

      return matchSearch && matchStatus && matchJenis;
    });
  }, [invoices, searchTerm, statusFilter, jenisFilter]);

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm mb-1">
            <Building className="w-4 h-4" /> DELTA PERKASA RENTAL MANAGEMENT
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Dashboard Rekap Invoice & Unit
          </h1>
        </div>
        <button 
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-lg shadow-blue-900/30 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Menyinkronkan...' : 'Sync Google Sheets'}
        </button>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-800 text-red-200 p-4 rounded-xl mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-sm font-medium">Total Record</span>
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalData}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-sm font-medium">Unit On Job</span>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats.onJobCount}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-sm font-medium">Unit Standby</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{stats.standbyCount}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-sm font-medium">Estimasi Nilai Total</span>
            <DollarSign className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white truncate">{formatRupiah(stats.totalNilai)}</div>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari nama penyewa atau kode unit..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300"
          >
            <option value="ALL">Semua Status</option>
            <option value="ON JOB">ON JOB</option>
            <option value="STANDBY">STANDBY</option>
          </select>
          <select 
            value={jenisFilter}
            onChange={(e) => setJenisFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300"
          >
            <option value="ALL">Semua Jenis Penyewa</option>
            <option value="SWASTA">SWASTA</option>
            <option value="PRIBADI">PRIBADI</option>
            <option value="BUMN">BUMN</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Nama Penyewa</th>
                <th className="p-4">Jenis Sewa</th>
                <th className="p-4">Status</th>
                <th className="p-4">Kode Unit</th>
                <th className="p-4 text-right">Nilai / Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {loading && invoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">Memuat semua data rekap...</td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">Tidak ada data yang sesuai filter.</td>
                </tr>
              ) : (
                filteredInvoices.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 text-slate-400 text-xs">{item.timestamp}</td>
                    <td className="p-4 font-medium text-white">{item.namaPenyewa}</td>
                    <td className="p-4 text-slate-300">{item.jenisSewa || '-'}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        item.onJobOrNot.toUpperCase().includes('ON JOB') 
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50' 
                          : 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
                      }`}>
                        {item.onJobOrNot || 'STANDBY'}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-blue-300">{item.kodeUnit || '-'}</td>
                    <td className="p-4 text-right font-medium text-white">
                      {item.nilaiInvoice > 0 ? formatRupiah(item.nilaiInvoice) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
