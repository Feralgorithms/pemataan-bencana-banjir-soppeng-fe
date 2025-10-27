const API_BASE = 'https://api-pemetaan-bencana-banjir-soppeng-prod.vercel.app';
function getAuthHeaders() {
  const token = localStorage.getItem('token_secret');
  if (!token) {
    alert("Sesi login habis, silakan login kembali.");
    window.location.href = "login.html";
    return {};
  }
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}


// ================== KECAMATAN ==================
async function fetchKecamatan() {
  try {
    const res = await fetch(`${API_BASE}/kecamatan`);
    const json = await res.json();
    const tbody = document.querySelector('#tableKecamatan tbody');
    tbody.innerHTML = '';
    json.data.forEach(k => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${k.id}</td>
        <td>${k.kode_kec}</td>
        <td>${k.nama_kecamatan}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="editKecamatan(${k.id})">Edit</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
  }
}

function showTambahKecamatanForm() {
  document.getElementById('kecamatan-form').style.display = 'block';
}

async function tambahKecamatan() {
  const kode = document.getElementById('kode_kec').value;
  const nama = document.getElementById('nama_kecamatan').value;
  const luas = document.getElementById('luas').value;
  const geom = document.getElementById('geom').value;

  try {
    const res = await fetch(`${API_BASE}/kecamatan`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        kode_kec: kode,
        nama_kecamatan: nama,
        luas: Number(luas),
        geom: JSON.parse(geom)
      })
    });

    if (!res.ok) throw new Error(res.statusText);

    fetchKecamatan();
    alert('✅ Kecamatan berhasil ditambahkan!');
  } catch (err) {
    console.error(err);
    alert('❌ Gagal tambah kecamatan');
  }
}

async function editKecamatan(id) {
  const getData = await fetch(`${API_BASE}/kecamatan/${id}`);
  const oldJson = await getData.json();
  const oldData = oldJson.data.features[0].properties;
  const oldGeometry = oldJson.data.features[0].geometry;

  const { value: formValues } = await Swal.fire({
    title: "Edit Kecamatan",
    html: `
      <input id="kode-kec" class="swal2-input" placeholder="Kode Kecamatan" value="${oldData.kode_kec}">
      <input id="nama-kec" class="swal2-input" placeholder="Nama Kecamatan" value="${oldData.nama_kecamatan}">
      <input id="luas-kec" class="swal2-input" placeholder="Luas" value="${oldData.luas ?? ''}">
      <textarea id="geom-kec" class="swal2-textarea" placeholder="GeoJSON">
      ${oldGeometry ? JSON.stringify(oldGeometry) : ''}
      </textarea>

    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Simpan",
    cancelButtonText: "Batal",
    customClass: {
      confirmButton: "btn btn-primary",
      cancelButton: "btn btn-secondary"
    },
    buttonsStyling: false ,

    preConfirm: () => {
      return {
        kode_kec: document.getElementById('kode-kec').value.trim(),
        nama_kecamatan: document.getElementById('nama-kec').value.trim(),
        luas: document.getElementById('luas-kec').value.trim(),
        geom: document.getElementById('geom-kec').value.trim()
      };
    }
  });

  if (!formValues) return;

  
  const changed =
    formValues.kode_kec !== oldData.kode_kec ||
    formValues.nama_kecamatan !== oldData.nama_kecamatan ||
    (formValues.luas && Number(formValues.luas) !== oldData.luas) ||
    (formValues.geom &&
    JSON.stringify(JSON.parse(formValues.geom)) !== JSON.stringify(oldGeometry))


  if (!changed) {
    Swal.fire("📌 Tidak ada perubahan", "Silakan ubah minimal 1 field.", "info");
    return;
  }


  const body = {};
  if (formValues.kode_kec !== oldData.kode_kec) body.kode_kec = formValues.kode_kec;
  if (formValues.nama_kecamatan !== oldData.nama_kecamatan) body.nama_kecamatan = formValues.nama_kecamatan;
  if (formValues.luas && Number(formValues.luas) !== oldData.luas) body.luas = Number(formValues.luas);
  if (formValues.geom && formValues.geom.trim() !== "") body.geom = JSON.parse(formValues.geom);

  try {
    const res = await fetch(`${API_BASE}/kecamatan/update/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error();
    Swal.fire("✅ Sukses!", "Data kecamatan berhasil diperbarui.", "success");
    fetchKecamatan();

  } catch (err) {
    console.error(err);
    Swal.fire("❌ Gagal!", "Tidak dapat memperbarui data.", "error");
  }
}


// ================== DESA ==================
async function fetchDesa() {
  try {
    const res = await fetch(`${API_BASE}/desa`);
    const json = await res.json();
    const tbody = document.querySelector('#tableDesa tbody');
    tbody.innerHTML = '';
    json.data.forEach(d => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${d.kode_desa}</td>
        <td>${d.nama_desa}</td>
        <td>${d.id_kecamatan}</td>
        <td>${d.luas}</td>
        <td>${d.jumlah_penduduk}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="editDesa('${d.kode_desa}')">Edit</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
  }
}

function showTambahDesaForm() {
  document.getElementById('desa-form').style.display = 'block';
}

async function tambahDesa() {
  const kode = document.getElementById('kode_desa').value;
  const nama = document.getElementById('nama_desa').value;
  const id_kec = document.getElementById('id_kecamatan_desa').value;
  const luas = parseFloat(document.getElementById('luas_desa').value) || null;
  const jumlah = parseInt(document.getElementById('jumlah_penduduk').value) || null;
  const geom = document.getElementById('geom_desa').value;

  try {
    const res = await fetch(`${API_BASE}/desa`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        kode_desa: kode,
        nama_desa: nama,
        id_kecamatan: id_kec,
        luas,
        jumlah_penduduk: jumlah,
        geom
      })
    });
    if (!res.ok) throw new Error(res.statusText);
    fetchDesa();
    alert('Desa berhasil ditambahkan!');
  } catch (err) {
    console.error(err);
    alert('Gagal tambah desa');
  }
}


async function editDesa(kode_desa) {
  const getData = await fetch(`${API_BASE}/desa/${kode_desa}`);
  const oldJson = await getData.json();
  const feature = oldJson.data?.features?.[0];
  const oldData = feature?.properties || {};
  const oldGeom = feature?.geometry ? JSON.stringify(feature.geometry) : "";

  const { value: formValues } = await Swal.fire({
    title: "Edit Desa",
    html: `
      <input id="nama-desa" class="swal2-input" placeholder="Nama Desa" value="${oldData.nama_desa ?? ''}">
      <input id="id-kec" class="swal2-input" placeholder="ID Kecamatan" value="${oldData.id_kecamatan ?? ''}">
      <input id="luas-desa" class="swal2-input" placeholder="Luas" value="${oldData.luas ?? ''}">
      <input id="jumlah" class="swal2-input" placeholder="Jumlah Penduduk" value="${oldData.jumlah_penduduk ?? ''}">
      <textarea id="geom-desa" class="swal2-textarea" placeholder="GeoJSON"
      style="min-height: 140px;">${oldGeom}</textarea>`,
    showCancelButton: true,
    confirmButtonText: "Simpan",
    cancelButtonText: "Batal",
    customClass: {
      confirmButton: "btn btn-success",
      cancelButton: "btn btn-secondary"
    },
    buttonsStyling: false,
    focusConfirm: false,
    preConfirm: () => {
      return {
        nama_desa: document.getElementById("nama-desa").value.trim(),
        id_kecamatan: document.getElementById("id-kec").value.trim(),
        luas: document.getElementById("luas-desa").value.trim(),
        jumlah_penduduk: document.getElementById("jumlah").value.trim(),
        geom: document.getElementById("geom-desa").value.trim(),
      };
    }
  });

  if (!formValues) return;

  const changed =
    formValues.nama_desa !== oldData.nama_desa ||
    formValues.id_kecamatan !== String(oldData.id_kecamatan) ||
    (formValues.luas && Number(formValues.luas) !== oldData.luas) ||
    (formValues.jumlah_penduduk && Number(formValues.jumlah_penduduk) !== oldData.jumlah_penduduk) ||
    (formValues.geom && JSON.stringify(JSON.parse(formValues.geom)) !== JSON.stringify(feature.geometry));

  if (!changed) {
    Swal.fire("📌 Tidak ada perubahan", "Silakan ubah minimal 1 field.", "info");
    return;
  }

  const body = {};
  if (formValues.nama_desa !== oldData.nama_desa) body.nama_desa = formValues.nama_desa;
  if (formValues.id_kecamatan !== String(oldData.id_kecamatan)) body.id_kecamatan = Number(formValues.id_kecamatan);
  if (formValues.luas && Number(formValues.luas) !== oldData.luas) body.luas = Number(formValues.luas);
  if (formValues.jumlah_penduduk && Number(formValues.jumlah_penduduk) !== oldData.jumlah_penduduk)
    body.jumlah_penduduk = Number(formValues.jumlah_penduduk);
  if (formValues.geom.trim() !== "") body.geom = JSON.parse(formValues.geom);

  try {
    const res = await fetch(`${API_BASE}/desa/update/${kode_desa}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error();

    Swal.fire("✅ Sukses!", "Data desa berhasil diperbarui.", "success");
    fetchDesa(); 

  } catch (err) {
    console.error(err);
    Swal.fire("❌ Gagal!", "Tidak dapat memperbarui data.", "error");
  }
}



// ================== LAPORAN BANJIR ==================
async function fetchLaporan() {
  try {
    const res = await fetch(`${API_BASE}/laporan/all`);
    const json = await res.json();
    const tbody = document.querySelector('#tableLaporan tbody');
    tbody.innerHTML = '';
    json.data.forEach(l => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${l.id}</td>
        <td>${l.latitude}</td>
        <td>${l.longitude}</td>
        <td>${l.tinggi_air}</td>
        <td>${l.deskripsi}</td>
        <td>${l.status}</td>
        <td>${l.verifikasi || '-'}</td>
        <td>
          <button class="btn btn-sm btn-success me-1" onclick="verifikasiLaporan(${l.id})">Terima</button>
          <button class="btn btn-sm btn-warning me-1" onclick="tolakLaporan(${l.id})">Tolak</button>
          <button class="btn btn-sm btn-danger" onclick="hapusLaporan(${l.id})">Hapus</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
  }
}

// Terima laporan
async function verifikasiLaporan(id) {
  if (!confirm("Yakin ingin menerima laporan ini?")) return;

  try {
    const res = await fetch(`${API_BASE}/laporan/update/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ verifikasi: 'diterima', status: 'aktif' })
    });
    if (!res.ok) throw new Error("Gagal verifikasi");

    alert("✅ Laporan berhasil diterima!");
    fetchLaporan();
  } catch (err) {
    alert("❌ Terjadi kesalahan saat menerima laporan!");
  }
}

// Tolak laporan
async function tolakLaporan(id) {
    if (!confirm("Yakin ingin menolak laporan ini?")) return;

  try {
    const res = await fetch(`${API_BASE}/laporan/update/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ verifikasi: 'ditolak', status: 'nonaktif' })
    });

      if (!res.ok) throw new Error();
    alert("⚠️ Laporan ditolak!");
    fetchLaporan();
  } catch (err) {
    alert("❌ Gagal menolak laporan!");
  }
}

// Hapus laporan
async function hapusLaporan(id) {
  if (!confirm("Hapus laporan ini secara permanen?")) return;
  try {
    const res = await fetch(`${API_BASE}/laporan/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    alert("🗑️ Laporan berhasil dihapus!");
    fetchLaporan();
  } catch (err) {
    alert("❌ Gagal menghapus laporan!");
  }
}


// ================== RISIKO BANJIR ==================
async function fetchRisiko() {
  try {
    const res = await fetch(`${API_BASE}/risiko`);
    const json = await res.json();
    const tbody = document.querySelector('#tableRisiko tbody');
    tbody.innerHTML = '';

    json.data.forEach(r => {
      const kategoriClass = {
        'Rendah': 'badge-rendah',
        'Sedang': 'badge-sedang',
        'Tinggi': 'badge-tinggi'
      }[r.kategori] || 'badge bg-secondary';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.id}</td>
        <td>${r.nama_desa}</td>
        <td>${r.rata_tinggi_air}</td>
        <td><span class="badge ${kategoriClass}">${r.kategori}</span></td>
        <td>${r.jumlah_laporan}</td>
        <td>${r.terakhir_diperbarui}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="editRisiko(${r.id})">Edit</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
  }
}


async function editRisiko(id) {
  const getData = await fetch(`${API_BASE}/risiko/${id}`);
  const oldJson = await getData.json();
  const oldData = oldJson.data;

  const { value: formValues } = await Swal.fire({
    title: "Edit Risiko Banjir",
    html: `
      <input id="desa-risiko" class="swal2-input" placeholder="Nama Desa" value="${oldData.nama_desa ?? ''}" disabled>
      <input id="tinggi-risiko" type="number" class="swal2-input" placeholder="Rata Tinggi Air" value="${oldData.rata_tinggi_air ?? ''}">
      <input id="kategori-risiko" class="swal2-input" placeholder="Kategori Risiko" value="${oldData.kategori ?? ''}">
      <input id="laporan-risiko" type="number" class="swal2-input" placeholder="Jumlah Laporan" value="${oldData.jumlah_laporan ?? ''}">
    `,
    confirmButtonText: "Simpan",
    confirmButtonColor: "#0d6efd",
    showCancelButton: true,
    cancelButtonText: "Batal",
    preConfirm: () => ({
      rata_tinggi_air: Number(document.getElementById("tinggi-risiko").value),
      kategori: document.getElementById("kategori-risiko").value.trim(),
      jumlah_laporan: Number(document.getElementById("laporan-risiko").value),
    }),
  });

  if (!formValues) return;

  const changed =
    formValues.rata_tinggi_air !== oldData.rata_tinggi_air ||
    formValues.kategori !== oldData.kategori ||
    formValues.jumlah_laporan !== oldData.jumlah_laporan;

  if (!changed) {
    return Swal.fire("📌 Tidak ada perubahan", "Silakan ubah minimal 1 field.", "info");
  }

  try {
    const res = await fetch(`${API_BASE}/risiko/update/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(formValues),
    });

    if (!res.ok) throw new Error();
    Swal.fire("✅ Berhasil!", "Risiko banjir berhasil diperbarui.", "success");
    fetchRisiko();
  } catch (err) {
    console.error(err);
    Swal.fire("❌ Gagal!", "Tidak bisa memperbarui risiko.", "error");
  }
}


// ================== INIT ==================
window.addEventListener('DOMContentLoaded', () => {
  fetchKecamatan();
  fetchDesa();
  fetchLaporan();
  fetchRisiko();
});
