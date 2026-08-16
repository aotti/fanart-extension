// content_script.js

let savedImageUrls = [];

async function getFromStorage(key) {
    // this shit return object even if the storage is empty
    const data = await chrome.storage.local.get([key])
    return Object.keys(data).length > 0 ? data[key] : null
}

// 1. Ambil semua data gambar yang pernah disimpan dari Storage
async function loadSavedImages() {
    const keys = ['saveFanartNice', 'saveFanartWow', 'saveFanartYooo'];
    // loop keys
    for(let key of keys) {
        const fanartList = await getFromStorage(key)
        if (fanartList) {
            const list = JSON.parse(fanartList);
            list.forEach(item => savedImageUrls.push(item.url));
        }
    }
}

// 2. Fungsi untuk menempelkan centang hijau ke gambar
function markSavedImages(anchorElement) {
    // Tunggu sampai img element di render
    const imgElement = anchorElement.querySelector('img')
    if(!imgElement) return

    // Lewati jika gambar sudah pernah dicek agar performa tetap ringan
    if (anchorElement.dataset.fanartChecked) return; 
    anchorElement.dataset.fanartChecked = "true";

    // Normalisasi URL gambar yang ada di layar
    const cleanAnchorHref = anchorElement.href.replace(/\/photo\/\d|\/video\/\d/, '')

    // memasukkan gambar ke Live Preview
    addImageToLivePanel(imgElement, cleanAnchorHref);
    
    // Cek apakah URL gambar ini ada di dalam list yang sudah kita simpan
    if (savedImageUrls.find(v => v.match(cleanAnchorHref))) {
        const parent = anchorElement.parentElement;
        
        // Pastikan parent relative agar centang (absolute) tidak lari ke mana-mana
        if (window.getComputedStyle(parent).position === 'static') {
            parent.style.position = 'relative'; 
        }

        // Buat elemen centang
        const checkmark = document.createElement('div');
        checkmark.className = 'fanart-saved-checkmark';
        // Kamu bisa mengganti icon ini dengan <img> atau <svg> centang milikmu sendiri
        checkmark.textContent = '✅'; 
        
        parent.appendChild(checkmark);
    }
}

// Gunakan MutationObserver untuk memantau scroll dinamis (Infinite Scroll)
const observer = new MutationObserver((mutations) => {
    // Karena Twitter adalah SPA (Single Page App), halaman tidak reload saat pindah tab.
    // Kita cek URL setiap kali ada mutasi (perubahan) terjadi di web.
    checkMediaTabVisibility();
    
    // Looping hanya pada bagian yang berubah di layar
    for (const mutation of mutations) {
        // Cek node (elemen HTML) yang baru ditambahkan
        for (const node of mutation.addedNodes) {
            // Pastikan itu adalah elemen HTML (tipe 1)
            if (node.nodeType === 1) {
                // // Skenario A: Node yang ditambahkan langsung berupa tag <img>
                // if (node.tagName === 'IMG') {
                //     markSavedImages(node);
                // } 
                // Skenario B: Node yang ditambahkan adalah container (div) yang berisi <img> di dalamnya
                if (node.querySelectorAll) {
                    const imageAnchors = document.querySelectorAll('a[role="link"][href*="photo"], a[role="link"][href*="video"]');
                    imageAnchors.forEach(markSavedImages);
                }
            }
        }
    }
});

// 4. Jalankan script saat halaman web dimuat
loadSavedImages().then(() => {
    // tampilkan live fanart list saat membuka tab media twitter
    initLivePanel()
    initZoomOverlay();
    checkMediaTabVisibility();
    
    // markSavedImages(); // Cek gambar yang sudah ada saat pertama kali load
    observer.observe(document.body, { childList: true, subtree: true }); // Mulai pantau scroll
});