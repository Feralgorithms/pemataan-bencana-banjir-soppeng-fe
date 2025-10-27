import { getKecamatan, getDesaByKecamatan, getSungaiByKecamatan, getKecamatanById, getLaporanBanjir } from './api.js';


// Inisialisasi Leaflet Map
const map = L.map('map', { zoomControl: false }).setView([-4.35, 119.87], 10);

// ====== Basemap ======


const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
});


const cartoLight = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap & CartoDB',
  subdomains: 'abcd',
  maxZoom: 19
});


const cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap & CartoDB',
  subdomains: 'abcd',
  maxZoom: 19
});


const hot = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors, Humanitarian OpenStreetMap Team'
});


const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  maxZoom: 17,
  attribution: '&copy; OpenStreetMap contributors, SRTM | Map style: OpenTopoMap'
});

// basemap default
osm.addTo(map);


const baseMaps = {
  "🗺️ OpenStreetMap": osm,
  "🌤️ Carto Light (Positron)": cartoLight,
  "🌙 Carto Dark (Night Mode)": cartoDark,
  "🚨 Humanitarian OSM": hot,
  "🏔️ OpenTopoMap": topo
};

L.control.layers(baseMaps, null, { position: 'bottomleft' }).addTo(map);


L.control.zoom({
  position: 'bottomright'
}).addTo(map);



let kecamatanLayer,desaLayer, sungaiLayer, laporanLayer;


//Load daftar kecamatan ke dropdown
async function loadKecamatanOptions() {
  try {
    const kecamatanList = await getKecamatan();
    const select = document.getElementById('selectKecamatan');

    kecamatanList.forEach(kec => {
      const opt = document.createElement('option');
      opt.value = kec.id;
      opt.textContent = kec.nama_kecamatan || kec.nama;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('Gagal memuat kecamatan:', err);
  }
}

// memilih kecamatan
document.getElementById('selectKecamatan').addEventListener('change', async (e) => {
  const idKecamatan = e.target.value;
  if (!idKecamatan) {
    console.warn('Kecamatan belum dipilih');
    return;
  }

  
  if (desaLayer) map.removeLayer(desaLayer);
  if (kecamatanLayer) map.removeLayer(kecamatanLayer);
  if (sungaiLayer) map.removeLayer(sungaiLayer);

  try {

     // ambil dta kecamatan
    const kecamatanData = await getKecamatanById(idKecamatan)
    if (kecamatanData && kecamatanData.features) {
      kecamatanLayer = L.geoJSON(kecamatanData, {
        style: { 
          color: '#ffffffff', 
          fillColor: '#0022ffff', 
          weight: 1.2, 
          fillOpacity: 0.5 },
        onEachFeature: (feature, layer) => {
          const props = feature.properties;
          layer.bindPopup(`
            <b>${props.nama_kecamatan}</b><br>
            Luas: ${props.luas || '-'}Km<sup>2</sup><br>
            Kode: ${props.kode_kec}
          `);
        }
      }).addTo(map);
      map.fitBounds(kecamatanLayer.getBounds());
    }


    // Ambil data desa
const desaData = await getDesaByKecamatan(idKecamatan);
console.log(desaData)
if (desaData && desaData.features) {
  desaLayer = L.geoJSON(desaData, {
    style: function (feature) {
      return {
        color: '#ffffffff',  
        fillColor: '#00ff26',
        weight: 1.2,
        fillOpacity: 1
      };
    },
    onEachFeature: function (feature, layer) {
      const props = feature.properties;

      // Tentukan warna risiko
      let risikoBox = '';
      if (props.kategori_risiko) {
        let warna = '#ccc'; 
        if (props.kategori_risiko.toLowerCase() === 'rendah') warna = 'green';
        else if (props.kategori_risiko.toLowerCase() === 'sedang') warna = 'yellow';
        else if (props.kategori_risiko.toLowerCase() === 'tinggi') warna = 'red';

        risikoBox = `
          <div style="
            display:inline-block;
            width:16px; height:16px;
            background:${warna};
            border:1px solid #000;
            margin-right:5px;
            vertical-align:middle;
          "></div>
          ${props.kategori_risiko}
        `;
      } else {
        risikoBox = 'Belum ada data';
      }

    
      layer.bindPopup(`
        <div class="popup-blur">
        <b>${props.nama_desa}</b><br>
        Luas: ${props.luas || '-'} Ha<br>
        Jumlah Penduduk: ${props.jumlah_penduduk || '-'}<br>
        Risiko Banjir: ${risikoBox}<br>
        Jumlah Laporan: ${props.jumlah_laporan}<br>
        Rata Ketinggian Air: ${props.rata_tinggi_air}<br>
        </div>
      `);
    }
  });
}



    // dta sungai
    const sungaiData = await getSungaiByKecamatan(idKecamatan);
    if (sungaiData && sungaiData.features) {
      const filePath = sungaiData.features[0]?.properties?.file_path;

      if (filePath) {
        try {
          const geoRes = await fetch(filePath);
          const geoJson = await geoRes.json();

          sungaiLayer = L.geoJSON(geoJson, {
            style: { color: '#00bfff', weight: 1.5 },
            onEachFeature: (feature, layer) => {
              layer.bindPopup(`<b>${feature.properties.nama_sungai || 'Sungai Tanpa Nama'}</b>`);
            }
          })

        } catch (err) {
          console.error("Gagal memuat file GeoJSON sungai:", err);
        }
      } else {
        console.warn("File path GeoJSON sungai tidak ditemukan di respons API.");
      }
    }


  } catch (error) {
    console.error('Gagal memuat data kecamatan:', error);
  }
});


async function loadLaporanBanjir() {
  try {
    const geojsonData = await getLaporanBanjir();
    if (!geojsonData) return;

    laporanLayer = L.geoJSON(geojsonData, {
      pointToLayer: (feature, latlng) =>
        L.marker(latlng, {
          icon: L.icon({
            iconUrl: "../legenda/banjir.png",
            iconSize: [45, 45],
            iconAnchor: [34, 48],
            popupAnchor: [0, -45]
          })
        }),
      onEachFeature: (feature, layer) => {
        const props = feature.properties;
        layer.bindPopup(`
          <div class="popup-blur">
            <h4 style="margin-bottom:10px;">Laporan Banjir Terbaru</h4>
            <div><b>Tinggi Air:</b> ${props.tinggi_air} cm</div>
            <div><b>Deskripsi:</b> ${props.deskripsi}</div>
            <div><b>Tanggal/Waktu:</b> ${new Date(props.tanggal).toLocaleString()}</div>
            ${props.foto_url ? `<img src="${props.foto_url}" class="popup-img">` : ''}
          </div>
        `);
      }
    }).addTo(map);

  } catch (err) {
    console.error("Gagal memuat laporan banjir:", err);
  }
}


loadKecamatanOptions();
loadLaporanBanjir();


// FUNGSI TOGGLE
// Tombol Toggle kecemaatn
const toggleKecamatan = document.getElementById('toggleKecamatan');
toggleKecamatan.addEventListener('change', () => {
  if (kecamatanLayer) {
    if (toggleKecamatan.checked) {
      map.addLayer(kecamatanLayer);
    } else {
      map.removeLayer(kecamatanLayer);
    }
  }
});

// Tombol Toggle Desa
const toggleDesa = document.getElementById('toggleDesa');
toggleDesa.checked = false
toggleDesa.addEventListener('change', () => {
  if (desaLayer) {
    if (toggleDesa.checked) {
      map.addLayer(desaLayer);
      map.fitBounds(desaLayer.getBounds());
    } else {
      map.removeLayer(desaLayer);
    }
  }
});

// Tombol Toggle Sungai
const toggleSungai = document.getElementById('toggleSungai');
toggleSungai.checked = false; 
toggleSungai.addEventListener('change', () => {
  if (sungaiLayer) {
    if (toggleSungai.checked) {
      map.addLayer(sungaiLayer);
    } else {
      map.removeLayer(sungaiLayer);
    }
  }
});
