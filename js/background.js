// 1. Membuat opsi menu klik kanan saat ekstensi pertama kali diinstal
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "saveFanartNice",               // ID unik untuk menu ini
        title: "Save Fanart - Nice",        // Teks yang akan muncul di menu klik kanan
        contexts: ["image"]                 // PENTING: Opsi ini HANYA muncul saat pengguna klik kanan pada GAMBAR
    });
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "saveFanartWow",               // ID unik untuk menu ini
        title: "Save Fanart - Wow",        // Teks yang akan muncul di menu klik kanan
        contexts: ["image"]                 // PENTING: Opsi ini HANYA muncul saat pengguna klik kanan pada GAMBAR
    });
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "saveFanartYooo",               // ID unik untuk menu ini
        title: "Save Fanart - YOOO",        // Teks yang akan muncul di menu klik kanan
        contexts: ["image"]                 // PENTING: Opsi ini HANYA muncul saat pengguna klik kanan pada GAMBAR
    });
});

// 2. Mendengarkan aksi ketika menu "Save Fanart" diklik oleh pengguna
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "saveFanartNice") {
        
        // ambil url postingan untuk disimpan
        const postUrl = info?.linkUrl || info?.pageUrl
        // Karena kita menggunakan contexts: ["image"], kita bisa langsung mendapatkan URL gambar tersebut
        // Lalu ubah ukuran gambar dengan mengganti parameter 'name'
        const imageUrl = info.srcUrl.replace(/name=.*/, 'name=120x120');

        // [OPSI LANJUTAN]: Menghubungkan dengan diskusi Base64 sebelumnya
        // Anda bisa memproses gambarnya di sini menggunakan fungsi fetch & FileReader
        const base64 = await convertImageToBase64(imageUrl);

        // Simpan hasil Base64 ke storage agar bisa dibaca oleh popup.html
        if(base64) updateFanartList({key: info.menuItemId, postUrl, base64})
    } else if (info.menuItemId === "saveFanartWow") {
        const postUrl = info?.linkUrl || info?.pageUrl
        const imageUrl = info.srcUrl.replace(/name=.*/, 'name=120x120');
        const base64 = await convertImageToBase64(imageUrl);
        if(base64) updateFanartList({key: info.menuItemId, postUrl, base64})
    } else if (info.menuItemId === "saveFanartYooo") {
        const postUrl = info?.linkUrl || info?.pageUrl
        const imageUrl = info.srcUrl.replace(/name=.*/, 'name=120x120');
        const base64 = await convertImageToBase64(imageUrl);
        if(base64) updateFanartList({key: info.menuItemId, postUrl, base64})
    }
});

// Contoh fungsi memproses gambar di background script (Bebas CORS)
async function convertImageToBase64(url) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        
        // Di Service Worker (background.js), FileReader tidak tersedia secara native.
        // Sebagai alternatif, kita bisa mengubah blob menjadi ArrayBuffer lalu ke Base64,
        // atau menyimpannya langsung ke chrome.storage lokal.
        
        const buffer = await blob.arrayBuffer();
        const bufferString = String.fromCharCode(...new Uint8Array(buffer))
        const base64String = btoa(bufferString);
        
        const base64 = `data:image/jpeg;base64,${base64String}`;
        return base64
    } catch (error) {
        console.error("Gagal memproses gambar dari klik kanan:", error);
        return null
    }
}

async function getFromStorage(key) {
    // this shit return object even if the storage is empty
    const data = await chrome.storage.local.get([key])
    return Object.keys(data).length > 0 ? data[key] : null
}

function saveToStorage(key, value) {
    chrome.storage.local.set({ [key]: value }, () => {
        const time = new Date().toLocaleString('id', {timeStyle: 'short', hour12: true})
        console.log(`Gambar berhasil disimpan! (${time})`);
    });
}

async function updateFanartList(props) {
    const {key, postUrl, base64} = props

    const fanartData = await getFromStorage(key)
    console.log(fanartData);
    
    if(fanartData) {
        // data sudah ada, maka update list
        const fanartList = JSON.parse(fanartData)
        fanartList.push({url: postUrl, img: base64})
        // hapus data duplikat
        const filterFanartList = fanartList.filter((v,i,arr) => i === arr.findIndex(w => v.url === w.url))
        saveToStorage(key, JSON.stringify(filterFanartList))
    } else {
        // data belum ada, maka set data pertama
        const fanartList = [{url: postUrl, img: base64}]
        saveToStorage(key, JSON.stringify(fanartList))
    }
}