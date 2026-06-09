// 1. Membuat opsi menu klik kanan saat ekstensi pertama kali diinstal
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "saveFanartNice",               // ID unik untuk menu ini
        title: "Save Fanart - Nice",        // Teks yang akan muncul di menu klik kanan
        contexts: ["image"]                 // PENTING: Opsi ini HANYA muncul saat pengguna klik kanan pada GAMBAR
    });
    chrome.contextMenus.create({
        id: "saveFanartWow",               // ID unik untuk menu ini
        title: "Save Fanart - Wow",        // Teks yang akan muncul di menu klik kanan
        contexts: ["image"]                // PENTING: Opsi ini HANYA muncul saat pengguna klik kanan pada GAMBAR
    });
    chrome.contextMenus.create({
        id: "saveFanartYooo",               // ID unik untuk menu ini
        title: "Save Fanart - YOOO",        // Teks yang akan muncul di menu klik kanan
        contexts: ["image"]                 // PENTING: Opsi ini HANYA muncul saat pengguna klik kanan pada GAMBAR
    });

    // set has more fanart
    saveToStorage('hasMoreFanart', 'true')
    // set update timestamp for 1st time
    saveToStorage('updateTimestamp', Date.now().toString())
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
        if(base64) scrapFanartList({key: info.menuItemId, postUrl, base64})
    } else if (info.menuItemId === "saveFanartWow") {
        const postUrl = info?.linkUrl || info?.pageUrl
        const imageUrl = info.srcUrl.replace(/name=.*/, 'name=120x120');
        const base64 = await convertImageToBase64(imageUrl);
        if(base64) scrapFanartList({key: info.menuItemId, postUrl, base64})
    } else if (info.menuItemId === "saveFanartYooo") {
        const postUrl = info?.linkUrl || info?.pageUrl
        const imageUrl = info.srcUrl.replace(/name=.*/, 'name=120x120');
        const base64 = await convertImageToBase64(imageUrl);
        if(base64) scrapFanartList({key: info.menuItemId, postUrl, base64})
    }
});

// infinity scroll param
let currentPage = 1

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    const fanartAPI = 'https://fanart-extension-api.netlify.app/.netlify/functions/api'
    const fanartToken = await getFromStorage('fanartToken')
    const fanartQueryParam = `?fanart_token=${fanartToken}`

    // check action
    if(request.action == 'getFanartFromRedis') {
        const limit = 20

        // is more fanart real
        const hasMoreFanart = await getFromStorage('hasMoreFanart')
        if(hasMoreFanart != 'true') {
            return responseFromBack({
                status: 400,
                message: 'no more fanart in redis',
                data: null,
                currentPage,
            }, sendResponse)
        }

        // get fanart from redis
        const fanartMoreQueryParam = `&page=${currentPage}&limit=${limit}`
        const fanartFetch = await (await fetch(fanartAPI+fanartQueryParam+fanartMoreQueryParam, {method: 'GET'})).json()

        // update infinite scroll params
        if(fanartFetch.status === 200) {
            currentPage += 1

            // check if there is more fanart in redis
            let fanartCounter = 0
            for(let [key, value] of Object.entries(fanartFetch.data)) {
                if(value?.length) fanartCounter += value.length
            }
            // if received fanart less than the limit, then no more fanart
            if(fanartCounter < limit) saveToStorage('hasMoreFanart', 'false')
        }
        
        return responseFromBack({...fanartFetch, currentPage}, sendResponse)
    } else if(request.action == 'updateFanartToRedis') {
        // update fanart to redis
        // get all new scrapped fanart list
        const {saveFanartNice, saveFanartWow, saveFanartYooo} = await getScrappedFanartList()

        // remove the array+object closures on start+end
        const wholeFanartList = {
            saveFanartNice: saveFanartNice?.replace('[{', '').replace('}]', ''), 
            saveFanartWow: saveFanartWow?.replace('[{', '').replace('}]', ''), 
            saveFanartYooo: saveFanartYooo?.replace('[{', '').replace('}]', ''),
        }

        const fanartFetch = await (await fetch(fanartAPI+fanartQueryParam, {
            method: 'PUT', 
            body: JSON.stringify(wholeFanartList)
        })).json()

        // set new update timestamp
        if(fanartFetch.status === 200) 
            saveToStorage('updateTimestamp', Date.now().toString())
        
        return responseFromBack(fanartFetch, sendResponse)
    }
    return true
})

function responseFromBack(data, sendResponse) {
    // sendResponse for chrome
    sendResponse({
        status: data.status, 
        message: data.message, 
        data: data.data,
        currentPage,
    })

    // basic return for firefox
    return {
        status: data.status, 
        message: data.message, 
        data: data.data,
        currentPage,
    }
}

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

async function getScrappedFanartList() {
    const saveFanartNice = await getFromStorage('saveFanartNice')
    const saveFanartWow = await getFromStorage('saveFanartWow')
    const saveFanartYooo = await getFromStorage('saveFanartYooo')
    
    // parse
    const parsedFanartNice = saveFanartNice ? JSON.parse(saveFanartNice) : []
    const parsedFanartWow = saveFanartWow ? JSON.parse(saveFanartWow) : []
    const parsedFanartYooo = saveFanartYooo ? JSON.parse(saveFanartYooo) : []

    // find new scrapped fanart
    const updateTimestamp = await getFromStorage('updateTimestamp')
    const scrappedFanartNice = []
    const scrappedFanartWow = []
    const scrappedFanartYooo = []

    for(let i=0; i<parsedFanartNice.length; i++) {
        const fanart = parsedFanartNice[i]
        if(+fanart.timestamp > +updateTimestamp) scrappedFanartNice.push(fanart)
    }
    for(let i=0; i<parsedFanartWow.length; i++) {
        const fanart = parsedFanartWow[i]
        if(+fanart.timestamp > +updateTimestamp) scrappedFanartWow.push(fanart)
    }
    for(let i=0; i<parsedFanartYooo.length; i++) {
        const fanart = parsedFanartYooo[i]
        if(+fanart.timestamp > +updateTimestamp) scrappedFanartYooo.push(fanart)
    }

    // check if all empty
    const stringFanartNice = JSON.stringify(scrappedFanartNice)
    const stringFanartWow = JSON.stringify(scrappedFanartWow)
    const stringFanartYooo = JSON.stringify(scrappedFanartYooo)

    // return data
    return {
        saveFanartNice: stringFanartNice == `[]` ? null : stringFanartNice, 
        saveFanartWow: stringFanartWow == `[]` ? null : stringFanartWow, 
        saveFanartYooo: stringFanartYooo == `[]` ? null : stringFanartYooo,
    }
}

/**
 * @description updating fanart from context menu action 
 */
async function scrapFanartList(props) {
    const {key, postUrl, base64} = props

    const fanartData = await getFromStorage(key)
    if(fanartData) {
        // data sudah ada, maka update list
        const fanartList = JSON.parse(fanartData)
        fanartList.unshift({url: postUrl, img: base64, timestamp: Date.now()})
        // hapus data duplikat
        const filterFanartList = fanartList.filter((v,i,arr) => i === arr.findIndex(w => v.url === w.url))
        saveToStorage(key, JSON.stringify(filterFanartList))
    } else {
        // data belum ada, maka set data pertama
        const fanartList = [{url: postUrl, img: base64, timestamp: Date.now()}]
        saveToStorage(key, JSON.stringify(fanartList))
    }
}

