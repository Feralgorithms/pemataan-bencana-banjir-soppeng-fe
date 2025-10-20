const API_BASE = 'https://api-pemetaan-bencana-banjir-soppeng-prod.vercel.app';

export async function getKecamatan() {
  const res = await fetch(`${API_BASE}/kecamatan`);
  if (!res.ok) throw new Error(`Gagal fetch kecamatan: ${res.status}`);
  const json = await res.json();
  return json.data || [];
}

export async function getKecamatanById(id) {
  const res = await fetch(`${API_BASE}/kecamatan/${id}`);
  if (!res.ok) throw new Error(`Gagal fetch kecamatan: ${res.status}`);
  const json = await res.json();
  return json.data || [];
}

export async function getDesaByKecamatan(idKecamatan) {
  if (!idKecamatan) return null;
  const res = await fetch(`${API_BASE}/desa/kecamatan/${idKecamatan}`);
  if (!res.ok) throw new Error(`Gagal fetch desa: ${res.status}`);
  const json = await res.json();
  return json.data || {};
}

export async function getSungaiByKecamatan(id) {
  if (!id) return null;
  const res = await fetch(`${API_BASE}/sungai/kecamatan/${id}`);
  if (!res.ok) throw new Error(`Gagal fetch sungai: ${res.status}`);
  const json = await res.json();
  console.log(json.data)
  return json.data || {};
}

export async function getLaporanBanjir() {
  const res = await fetch(`${API_BASE}/laporan`);
  if (!res.ok) throw new Error(`Gagal fetch laporan: ${res.status}`);
  const json = await res.json();


  if (!json.success || !Array.isArray(json.data)) {
    console.error("Format data laporan tidak sesuai:", json);
    return null;
  }

  // Konversi data laporan ke GeoJSON
  return {
    type: "FeatureCollection",
    features: json.data.map(item => ({
      type: "Feature",
      properties: {
        id: item.id,
        tinggi_air: item.tinggi_air,
        deskripsi: item.deskripsi,
        foto_url: item.foto_url,
        tanggal: item.created_at
      },
      geometry: {
        type: "Point",
        coordinates: [item.longitude, item.latitude]
      }
    }))
  };
}



