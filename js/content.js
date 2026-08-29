// content_script.js

let savedImageUrls = new Set();

async function getFromStorage(key) {
    // this shit return object even if the storage is empty
    const data = await chrome.storage.local.get([key])
    return Object.keys(data).length > 0 ? data[key] : null
}

// 1. Ambil semua data gambar yang pernah disimpan dari Storage
async function loadSavedImages() {
    const keys = ['saveFanartNice', 'saveFanartWow', 'saveFanartYooo'];
    for(let key of keys) {
        const fanartList = await getFromStorage(key);
        if (fanartList) {
            const list = JSON.parse(fanartList);
            list.forEach(item => {
                if (item.url) savedImageUrls.add(item.url);
            });
        }
    }
}

// 2. Fungsi untuk menempelkan centang hijau ke gambar
function markSavedImages(articleElement, listElement) {
    let imgContainers = null, 
        imgElements = null,
        anchorElement = null;

    // Untuk gambar dengan struktur grid
    if(listElement) {
        // Ambil anchor element untuk link ke tweet
        anchorElement = listElement.querySelector('a[role=link][href*=status]')
        // Set <li> element sebagai img container
        imgContainers = [listElement]
        // Lewati jika gambar sudah pernah dicek agar performa tetap ringan
        if(imgContainers[0].dataset.fanartChecked) return
        imgContainers[0].dataset.fanartChecked = "true"
    }
    // Untuk gambar dengan struktur per tweet
    else if(articleElement) {
        // Ambil anchor element untuk link ke tweet
        anchorElement = articleElement.querySelector('a[role=link][href*=status]')
        // Tunggu sampai img element di render
        imgContainers = articleElement.querySelectorAll('div[data-testid="tweetPhoto"]')
        if(!imgContainers || imgContainers.length === 0) return
        imgElements = articleElement.querySelectorAll('img')
        if(!imgElements || imgElements.length === 0) return

        // Lewati jika gambar sudah pernah dicek agar performa tetap ringan
        imgContainers.forEach(container => {
            if(container.dataset.fanartChecked) return
            container.dataset.fanartChecked = "true"
        })
    }

    // Normalisasi URL gambar yang ada di layar
    const cleanAnchorHref = anchorElement.href.replace(/\/photo\/\d|\/video\/\d/, '')

    // memasukkan gambar ke Live Preview saat ada di tab media (elon kontol revert update tab media)
    if(imgElements && livePanel.style.display != 'none') addImageToLivePanel(imgElements, cleanAnchorHref);
    
    // Cek apakah URL gambar ini ada di dalam list yang sudah kita simpan
    let isSaved = false;
    for (let savedUrl of savedImageUrls) {
        if (savedUrl.includes(cleanAnchorHref)) {
            isSaved = true;
            break;
        }
    }
    if (isSaved) {
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
                // Fokus memantau saat "Foto" muncul, bukan artikelnya.
                // Jika node yang baru muncul adalah container foto atau gambar itu sendiri
                if (node.matches && (node.matches('div[data-testid="tweetPhoto"]') || node.matches('img'))) {
                    // Cari elemen artikel induk dari foto ini
                    const parentArticle = node.closest('article[data-testid="tweet"]');
                    if (parentArticle) markSavedImages(parentArticle);
                } 
                // Jika node yang baru muncul adalah div besar yang mengandung container foto di dalamnya
                else if (node.querySelectorAll) {
                    // Ambil element dari tab media-photo
                    const photos_1 = node.querySelectorAll('a[role="link"][href*="status"]');
                    // Ambil element dari tab media-video
                    const photos_2 = node.querySelectorAll('div[data-testid="tweetPhoto"]');
                    
                    if(photos_1.length > 0) {
                        photos_1.forEach(photo => {
                            const parentList = photo.closest('li[role="listitem"]');
                            if (parentList) markSavedImages(null, parentList);
                        });
                    } else if(photos_2.length > 0) {
                        photos_2.forEach(photo => {
                            const parentArticle = photo.closest('article[data-testid="tweet"]');
                            if (parentArticle) markSavedImages(parentArticle);
                        });
                    }
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