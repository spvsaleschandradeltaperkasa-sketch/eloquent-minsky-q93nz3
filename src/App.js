import React from 'react';

export default function App() {
  const revenueData = [
    { label: "CDP", revenue: 13226344323, persen: 26.7 },
    { label: "BKP", revenue: 12999730185, persen: 26.3 },
    { label: "TPM", revenue: 8294496956, persen: 16.8 },
    { label: "ANS", revenue: 7345720025, persen: 14.9 },
    { label: "UCI", revenue: 2948305525, persen: 6.0 },
    { label: "CDF", revenue: 2595531038, persen: 5.2 },
    { label: "FAN", revenue: 1844518750, persen: 3.7 },
    { label: "-", revenue: 184000000, persen: 0.4 },
    { label: "SPL", revenue: 7778500, persen: 0.0 }
  ];

  const totalRevenue = 49446425302;

  const formatRupiah = (angka) => {
    return "Rp " + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  return (
    <div className="revenue-card" style={{ padding: '20px', background: '#0b0f19', color: '#fff', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <div className="revenue-header" style={{ marginBottom: '20px', fontWeight: 'bold', fontSize: '16px' }}>
        KONTRIBUSI REVENUE 2026 (% DARI TOTAL)
      </div>
      
      <div className="revenue-list">
        {revenueData.map((item, index) => (
          <div key={index} style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontWeight: 'bold' }}>{item.label}</span>
              <span>{formatRupiah(item.revenue)} ({item.persen}%)</span>
            </div>
            {/* Progress bar background */}
            <div style={{ background: '#1e293b', borderRadius: '4px', height: '6px', width: '100%', overflow: 'hidden' }}>
              {/* Progress bar fill diubah menjadi warna BIRU */}
              <div style={{ background: '#3b82f6', height: '100%', width: `${item.persen}%`, borderRadius: '4px' }}></div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #334155', paddingTop: '12px', fontSize: '16px' }}>
        <span>Total 2026:</span>
        <span>{formatRupiah(totalRevenue)}</span>
      </div>
    </div>
  );
}
