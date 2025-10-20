const API_BASE = 'https://api-pemetaan-bencana-banjir-soppeng-prod.vercel.app';

let marker = null;
    const map = L.map('map').setView([-4.35, 119.9], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Klik di peta
    map.on('click', function (e) {
      const { lat, lng } = e.latlng;
      document.getElementById('latitude').value = lat;
      document.getElementById('longitude').value = lng;

      if (marker) map.removeLayer(marker);
      marker = L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`📍 Lokasi Banjir<br>Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`)
        .openPopup();
    });

    // Ubah ke Base64
    function toBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
      });
    }

    // Kirim laporan
    document.getElementById('laporanForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const hasil = document.getElementById('hasil');
      hasil.innerHTML = '<div class="text-center text-muted">⏳ Mengirim laporan...</div>';

      const file = document.getElementById('gambar').files[0];
      const gambar_base64 = await toBase64(file);

      const body = {
        latitude: parseFloat(document.getElementById('latitude').value),
        longitude: parseFloat(document.getElementById('longitude').value),
        tinggi_air: document.getElementById('tinggi_air').value,
        deskripsi: document.getElementById('deskripsi').value,
        nama_file: file.name,
        gambar_base64
      };

      try {
        const res = await fetch(`${API_BASE}/laporan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();
        if (data.success) {
          hasil.innerHTML = `
            <div class="alert alert-success shadow-sm">
              ✅ <strong>Laporan berhasil dikirim!</strong><br>
              <small>Lokasi: ${body.latitude.toFixed(5)}, ${body.longitude.toFixed(5)}</small>
              <img src="${data.data[0].foto_url}" alt="foto laporan" class="img-fluid">
            </div>`;
        } else {
          hasil.innerHTML = `<div class="alert alert-danger">❌ ${data.message}</div>`;
        }
      } catch (err) {
        hasil.innerHTML = `<div class="alert alert-danger">⚠️ Gagal mengirim laporan: ${err.message}</div>`;
      }
    });