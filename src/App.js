// KODE LENGKAP DASHBOARD KONTRIBUSI REVENUE 2026

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

// Fungsi helper untuk format ke Rupiah
function formatRupiah(angka) {
  return "Rp " + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Fungsi Render Komponen
function renderKontribusiRevenue() {
  const container = document.getElementById("revenue-container"); // Sesuaikan id elemen HTML Anda
  if (!container) return;

  let htmlContent = `
    <div class="revenue-card">
      <div class="revenue-header">
        <i class="icon-clock"></i> KONTRIBUSI REVENUE 2026 (% DARI TOTAL)
      </div>
      <div class="revenue-list">
  `;

  revenueData.forEach(item => {
    const formattedRp = formatRupiah(item.revenue);
    // Format diubah: Nilai Rupiah di depan, Persentase di dalam kurung di belakang
    const displayString = `${formattedRp} (${item.persen}%)`;
    
    htmlContent += `
      <div class="revenue-row">
        <div class="revenue-label-group">
          <span class="label">${item.label}</span>
          <span class="value">${displayString}</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${item.persen}%;"></div>
        </div>
      </div>
    `;
  });

  htmlContent += `
      </div>
      <div class="revenue-footer">
        <span>Total 2026:</span>
        <span class="total-value">${formatRupiah(totalRevenue)}</span>
      </div>
    </div>
  `;

  container.innerHTML = htmlContent;
}

// Panggil fungsi render saat halaman dimuat
document.addEventListener("DOMContentLoaded", renderKontribusiRevenue);
