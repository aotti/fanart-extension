// === FITUR LIVE PREVIEW BOX ===
let livePanel = null;
let liveGridContainer = null;
let addedLiveUrls = new Set();

// 1. Fungsi Membuat Panel Kanan (Dijalankan sekali di awal)
function initLivePanel() {
    livePanel = document.createElement('div');
    livePanel.className = 'fanart-live-panel';

    const header = document.createElement('div');
    header.className = 'fanart-live-header';
    header.innerText = 'LIVE FANART LIST';

    liveGridContainer = document.createElement('div');
    liveGridContainer.className = 'fanart-live-grid';

    livePanel.appendChild(header);
    livePanel.appendChild(liveGridContainer);
    document.body.appendChild(livePanel);
}

// 2. Fungsi Mengontrol Visibilitas Panel (Muncul hanya di tab /media)
function checkMediaTabVisibility() {
    if (!livePanel) return;
    
    // Cek apakah URL Twitter saat ini diakhiri dengan /media
    if (window.location.pathname.includes('/media')) {
        livePanel.style.display = 'flex';
    } else {
        livePanel.style.display = 'none';
    }
}

// 3. Fungsi Menambahkan Gambar ke Live Panel
function addImageToLivePanel(imgElement, originalUrl) {
    // Abaikan jika gambar bukan dari media Twitter (seperti ikon atau avatar)
    if (!imgElement.src || !imgElement.src.includes('pbs.twimg.com/media')) return;

    // Bersihkan URL: Gunakan ukuran 'small' untuk thumbnail di panel agar ringan di RAM
    const thumbnailUrl = imgElement.src.replace(/name=.*/, 'name=360x360')
    const zoomUrl = imgElement.src.replace(/name=.*/, 'name=small')

    // Cek duplikasi di panel
    if (addedLiveUrls.has(thumbnailUrl)) return;
    addedLiveUrls.add(thumbnailUrl);

    const gridItem = document.createElement('div');
    gridItem.className = 'fanart-live-item';

    const gridImg = document.createElement('img');
    gridImg.src = thumbnailUrl;

    // --- TIMING LOGIC UNTUK SINGLE VS DOUBLE CLICK ---
    let clickTimer = null;

    // Klik 1x: Tampilkan Zoom Preview
    gridImg.addEventListener('click', (e) => {
        e.stopPropagation();
        if (clickTimer) clearTimeout(clickTimer);
        
        clickTimer = setTimeout(() => {
            showZoomPreview(zoomUrl);
        }, 200); // Wait 200ms to ensure it's not a double click
    });

    // Klik 2x (Double Click): Buka Link di Tab Baru
    gridImg.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        if (clickTimer) clearTimeout(clickTimer); // Batal jalankan Zoom
        
        window.open(originalUrl, '_blank', 'noopener,noreferrer');
    });

    gridItem.appendChild(gridImg);
    liveGridContainer.prepend(gridItem);

    // FITUR KEAMANAN MEMORI: Batasi grid maksimal 150 gambar agar browser tidak lag
    if (liveGridContainer.children.length > 150) {
        const firstChild = liveGridContainer.firstElementChild;
        const removedUrl = firstChild.querySelector('img').src;
        addedLiveUrls.delete(removedUrl);
        liveGridContainer.removeChild(firstChild);
    }
}

// Variable Global untuk Modal Zoom
let zoomOverlay = null;
let zoomImage = null;

// 1. Inisialisasi Overlay Zoom (Panggil fungsi ini di initLivePanel)
function initZoomOverlay() {
    zoomOverlay = document.createElement('div');
    zoomOverlay.className = 'fanart-zoom-overlay';

    zoomImage = document.createElement('img');
    zoomOverlay.appendChild(zoomImage);
    
    // PENTING: Append ke livePanel, BUKAN ke document.body
    if (livePanel) {
        livePanel.appendChild(zoomOverlay);
    }

    zoomOverlay.addEventListener('click', () => {
        zoomOverlay.classList.remove('active');
    });
}

// 2. Fungsi Menampilkan Gambar Zoom
function showZoomPreview(url) {
    if (!zoomOverlay || !zoomImage) return;
    zoomImage.src = url;
    zoomOverlay.classList.add('active');
}