import React, { useState, useMemo } from 'react';

export default function App({ data = [] }) {
  // State untuk autentikasi (Login)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // State untuk Master Invoice
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Fungsi penanganan proses login
  const handleLogin = (e) => {
    e.preventDefault();
    // Atur username dan password default di sini (bisa Anda ubah sesuai keinginan)
    if (username === 'admin' && password === 'delta123') {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Username atau Password salah!');
    }
  };

  // Fungsi helper untuk format mata uang Rupiah
  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number || 0);
  };

  // Filter data berdasarkan pencarian dan status
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const matchSearch = 
        row.noInvoice?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.customer?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = filterStatus === 'ALL' || row.status === filterStatus;
      
      return matchSearch && matchStatus;
    });
  }, [data, searchTerm, filterStatus]);

  // JIKA BELUM LOGIN, TAMPILKAN HALAMAN LOGIN
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-wide">Delta Perkasa</h1>
            <p className="text-sm text-slate-400">Silakan login untuk mengakses Master Invoice.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center">
                {loginError}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Username</label>
              <input
                type="text"
                placeholder="Masukkan username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-slate-700"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
              <input
                type="password"
                placeholder="Masukkan password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-slate-700"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-slate-100 hover:bg-white text-slate-950 font-bold py-2.5 rounded-lg text-sm transition-colors shadow-lg mt-2"
            >
              Masuk
            </button>
          </form>
        </div>
      </div>
    );
  }

  // JIKA SUDAH LOGIN, TAMPILKAN DASHBOARD MASTER INVOICE
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <main className="max-w-7xl mx-auto space-y-6">
        {/* Header & Filter Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div>
            <h1 className="text-xl font-bold text-white">Master Invoice</h1>
            <p className="text-sm text-slate-400">Kelola dan pantau status tagihan serta pembayaran.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Cari no invoice / customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-700 flex-1 md:w-64"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-700"
            >
              <option value="ALL">Semua Status</option>
              <option value="Lunas">Lunas</option>
              <option value="Belum Lunas">Belum Lunas</option>
            </select>
            <button
              onClick={() => setIsLoggedIn(false)}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                  <th className="p-3.5">Tahun</th>
                  <th className="p-3.5">No Invoice</th>
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5">Bulan</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Via</th>
                  <th className="p-3.5 text-right">Nilai Invoice</th>
                  <th className="p-3.5 text-right">Dana Masuk</th>
                  <th className="p-3.5 text-right">Sisa Tagihan</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-8 text-slate-500">
                      Tidak ada data yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row) => {
                    const isLunas = row.status?.toLowerCase() === 'lunas';
                    const badgeStyle = isLunas
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20';

                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-slate-900/40 transition-colors"
                      >
                        <td className="p-3.5 text-slate-300 font-semibold">{row.tahun}</td>
                        <td className="p-3.5 text-white font-bold">{row.noInvoice}</td>
                        <td className="p-3.5 text-slate-300">{row.tanggal}</td>
                        <td className="p-3.5 text-slate-300">{row.bulan}</td>
                        <td className="p-3.5 text-white font-medium">{row.customer}</td>
                        <td className="p-3.5">
                          <span className="bg-slate-800 text-slate-300 font-bold px-2 py-1 rounded-md text-[10px] border border-slate-700">
                            {row.via}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-semibold text-white">
                          {formatRupiah(row.nilaiInvoice)}
                        </td>
                        <td className="p-3.5 text-right font-semibold text-emerald-400">
                          {formatRupiah(row.danaMasuk)}
                        </td>
                        <td className="p-3.5 text-right font-semibold text-red-400">
                          {formatRupiah(row.sisaTagihan)}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeStyle}`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
