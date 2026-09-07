<div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border-l-4 border-l-emerald-500 border border-slate-800 p-5 shadow-xl">
            <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
              TOTAL CASH IN
            </div>
            <div className="text-xl font-black text-white">
              {formatRupiah(totalCashIn)}
            </div>
          </div>

          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border-l-4 border-l-amber-500 border border-slate-800 p-5 shadow-xl">
            <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
              SISA TAGIHAN (PIUTANG)
            </div>
            <div className="text-xl font-black text-white">
              {formatRupiah(totalSisaTagihan)}
            </div>
          </div>

          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border-l-4 border-l-purple-500 border border-slate-800 p-5 shadow-xl">
            <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
              COLLECTION RATE
            </div>
            <div className="text-xl font-black text-white">
              {collectionRate}%
            </div>
          </div>
        </div>

        {/* Ringkasan Aging Piutang Tambahan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-xl">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Current (0 - 30 Hari)
            </div>
            <div className="text-base font-extrabold text-blue-400">
              {formatRupiah(agingSummary.current)}
            </div>
          </div>

          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-xl">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Aging 31 - 60 Hari
            </div>
            <div className="text-base font-extrabold text-emerald-400">
              {formatRupiah(agingSummary.aging31_60)}
            </div>
          </div>

          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-xl">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Aging 61 - 120 Hari
            </div>
            <div className="text-base font-extrabold text-amber-400">
              {formatRupiah(agingSummary.aging60_120)}
            </div>
          </div>

          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-xl">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Kritikal (&gt; 120 Hari)
            </div>
            <div className="text-base font-extrabold text-red-500">
              {formatRupiah(agingSummary.agingCritical120)}
            </div>
          </div>
        </div>

        {/* Tabs Content */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Card Ringkasan Eksekutif */}
              <div className="bg-slate-950/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-red-500" /> Ringkasan Eksekutif & Target
                </h3>
                <div className="space-y-4 text-xs text-slate-300">
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">Total Invoice Terfilter</span>
                    <span className="font-bold text-white">{filteredData.length} Dokumen</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">Target Revenue CDP</span>
                    <span className="font-bold text-red-400">{formatRupiah(activeTargets.CDP.revenue)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">Target Cash In CDP</span>
                    <span className="font-bold text-emerald-400">{formatRupiah(activeTargets.CDP.cashIn)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400">Gabungan Target ANS & FAN</span>
                    <span className="font-bold text-blue-400">{formatRupiah(activeTargets.ANS.revenue)}</span>
                  </div>
                </div>
              </div>

              {/* Card Kontribusi Sales */}
              <div className="bg-slate-950/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-red-500" /> Kontribusi Revenue Sales (Tahun 2026)
                </h3>
                <div className="overflow-x-auto max-h-56">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[10px] text-slate-400 uppercase bg-slate-900/80 border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Sales / VIA</th>
                        <th className="p-2.5">Revenue</th>
                        <th className="p-2.5 text-right">Kontribusi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {contributionTableData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="p-2.5 font-bold text-white">{row.sales}</td>
                          <td className="p-2.5 text-slate-300">{formatRupiah(row.revenue)}</td>
                          <td className="p-2.5 text-right font-semibold text-red-400">
                            {row.kontribusi.toFixed(1)}%
                          </td>
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
          <div className="bg-slate-950/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-red-500" /> Performa Sales / VIA (Berdasarkan Filter Aktif)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] text-slate-400 uppercase bg-slate-900/80 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Sales / VIA</th>
                    <th className="p-3">Total Invoice</th>
                    <th className="p-3">Revenue (Nilai Invoice)</th>
                    <th className="p-3">Total Cash In</th>
                    <th className="p-3">Sisa Tagihan</th>
                    <th className="p-3 text-center">Lunas / Out.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {salesPerformanceData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="p-3 font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        {item.sales}
                      </td>
                      <td className="p-3 text-slate-300 font-semibold">{item.totalCount} Dokumen</td>
                      <td className="p-3 text-slate-200 font-bold">{formatRupiah(item.totalRevenue)}</td>
                      <td className="p-3 text-emerald-400 font-bold">{formatRupiah(item.totalCashIn)}</td>
                      <td className="p-3 text-amber-400 font-bold">{formatRupiah(item.totalSisaTagihan)}</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 font-bold rounded-lg border border-emerald-500/20 mr-1.5">
                          {item.lunasCount} Lunas
                        </span>
                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 font-bold rounded-lg border border-amber-500/20">
                          {item.outstandingCount} Out
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "trend" && (
          <div className="bg-slate-950/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-500" /> Grafik Tren Bulanan Revenue & Cash In ({filterTahun === "Semua tahun" ? "2026" : filterTahun})
            </h3>
            <div className="space-y-4">
              {monthlyTrendData.data.map((m, idx) => {
                const revPercent = monthlyTrendData.maxVal > 0 ? (m.revenue / monthlyTrendData.maxVal) * 100 : 0;
                const cashPercent = monthlyTrendData.maxVal > 0 ? (m.cashIn / monthlyTrendData.maxVal) * 100 : 0;
                return (
                  <div key={idx} className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-center text-xs font-bold mb-2">
                      <span className="text-white w-24">{m.bulan}</span>
                      <div className="flex gap-4 text-[11px]">
                        <span className="text-blue-400">Rev: {formatRupiah(m.revenue)}</span>
                        <span className="text-emerald-400">Cash: {formatRupiah(m.cashIn)}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${revPercent}%` }}></div>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${cashPercent}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "aging" && (
          <div className="bg-slate-950/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-500" /> Detail Piutang Berumur (&gt; 60 Hari &amp; &gt; 120 Hari)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] text-slate-400 uppercase bg-slate-900/80 border-b border-slate-800">
                  <tr>
                    <th className="p-3">No. Invoice</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Sales / VIA</th>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">Sisa Tagihan</th>
                    <th className="p-3 text-center">Umur (Hari)</th>
                    <th className="p-3">Kategori Aging</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredData
                    .filter((item) => item.sisaTagihan > 0 && item.agingDays > 60)
                    .map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="p-3 font-bold text-white">{item.noInvoice}</td>
                        <td className="p-3 text-slate-300">{item.customer}</td>
                        <td className="p-3 text-slate-300 font-semibold">{item.via}</td>
                        <td className="p-3 text-slate-400">{item.tanggal}</td>
                        <td className="p-3 text-amber-400 font-bold">{formatRupiah(item.sisaTagihan)}</td>
                        <td className="p-3 text-center font-bold text-white">{item.agingDays} Hari</td>
                        <td className="p-3">
                          {item.agingDays > 120 ? (
                            <span className="px-2.5 py-1 bg-red-500/10 text-red-500 font-bold rounded-lg border border-red-500/20">
                              Kritikal (&gt;120 Hari)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 font-bold rounded-lg border border-amber-500/20">
                              Warning (61-120 Hari)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "master" && (
          <div className="bg-slate-950/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-500" /> Master Data Invoice (Live Google Sheets)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] text-slate-400 uppercase bg-slate-900/80 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Tahun</th>
                    <th className="p-3">Bulan</th>
                    <th className="p-3">No. Invoice</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Sales / VIA</th>
                    <th className="p-3">Nilai Invoice</th>
                    <th className="p-3">Dana Masuk</th>
                    <th className="p-3">Sisa Tagihan</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="p-3 font-bold text-slate-300">{item.tahun}</td>
                      <td className="p-3 text-slate-300">{item.bulan}</td>
                      <td className="p-3 font-bold text-white">{item.noInvoice}</td>
                      <td className="p-3 text-slate-300">{item.customer}</td>
                      <td className="p-3 text-slate-300 font-semibold">{item.via}</td>
                      <td className="p-3 text-slate-200">{formatRupiah(item.nilaiInvoice)}</td>
                      <td className="p-3 text-emerald-400">{formatRupiah(item.danaMasuk)}</td>
                      <td className="p-3 text-amber-400">{formatRupiah(item.sisaTagihan)}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 bg-slate-900 text-slate-300 font-semibold rounded-lg border border-slate-700">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "jobid" && (
          <div className="bg-slate-950/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-red-500" /> Data Job ID &amp; Kontrak Sewa Alat Berat
              </h3>
              <input
                type="text"
                placeholder="Cari Job ID, Penyewa, Unit, Lokasi..."
                value={filterJobSearch}
                onChange={(e) => setFilterJobSearch(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-red-500 placeholder:text-slate-500 w-full md:w-72"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] text-slate-400 uppercase bg-slate-900/80 border-b border-slate-800">
                  <tr>
                    <th className="p-3">No</th>
                    <th className="p-3">Job ID</th>
                    <th className="p-3">VIA / Sales</th>
                    <th className="p-3">Jenis Sewa</th>
                    <th className="p-3">Nama Penyewa</th>
                    <th className="p-3">Kode Unit</th>
                    <th className="p-3">Class Unit</th>
                    <th className="p-3">Lokasi Kerja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredJobIdData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="p-3 text-slate-400">{item.no}</td>
                      <td className="p-3 font-bold text-white">{item.jobId}</td>
                      <td className="p-3 text-slate-300 font-semibold">{item.via}</td>
                      <td className="p-3 text-slate-300">{item.jenisSewa}</td>
                      <td className="p-3 text-slate-200 font-bold">{item.namaPenyewa}</td>
                      <td className="p-3 text-red-400 font-bold">{item.kodeUnit}</td>
                      <td className="p-3 text-slate-300">{item.classUnit}</td>
                      <td className="p-3 text-slate-400">{item.lokasiKerja}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
