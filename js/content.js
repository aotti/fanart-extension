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
function markSavedImages(articleElement) {
    // Ambil anchor element untuk link ke tweet
    const anchorElement = articleElement.querySelector('a[role=link][href*=status]')
    // Tunggu sampai img element di render
    const imgContainers = articleElement.querySelectorAll('div[data-testid="tweetPhoto"]')
    if(!imgContainers) return
    const imgElements = articleElement.querySelectorAll('img')
    if(!imgElements) return

    // Lewati jika gambar sudah pernah dicek agar performa tetap ringan
    imgContainers.forEach(container => {
        if(container.dataset.fanartChecked) return
        container.dataset.fanartChecked = "true"
    })

    // Normalisasi URL gambar yang ada di layar
    const cleanAnchorHref = anchorElement.href.replace(/\/photo\/\d|\/video\/\d/, '')

    // memasukkan gambar ke Live Preview saat ada di tab media
    if(livePanel.style.display != 'none') addImageToLivePanel(imgElements, cleanAnchorHref);
    
    // Cek apakah URL gambar ini ada di dalam list yang sudah kita simpan
    if (savedImageUrls.find(v => v.match(cleanAnchorHref))) {
        // Pastikan img container relative agar centang (absolute) tidak lari ke mana-mana
        if (window.getComputedStyle(imgContainers[0]).position === 'static') {
            imgContainers[0].style.position = 'relative'; 
        }

        // Buat elemen centang
        const checkmark = document.createElement('div');
        checkmark.className = 'fanart-saved-checkmark';
        // Kamu bisa mengganti icon ini dengan <img> atau <svg> centang milikmu sendiri
        checkmark.textContent = '✅'; 
        
        imgContainers[0].appendChild(checkmark);
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
                    // ### ambil element article
                    // ### untuk link tweet dari jam - a[role=link][href*=status]
                    // ### untuk gambar dan checkmark ke element img + parentnya
                    // const selector = `a[role="link"][href*="photo"], div[aria-label="Embedded video"]`
                    const imageAnchors = document.querySelectorAll('article[data-testid="tweet"]');
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