
// Menunggu hingga seluruh DOM popup selesai dimuat
document.addEventListener('DOMContentLoaded', async function() {
    // load fanart list
    await createFanartList()
    // load author list
    setupAuthorDropdown();
    // check fanart token
    checkFanartToken()

    // ANCHOR ONCLICK EVENT
    // ambil semua anchor element
    const openLinkAnchors = document.querySelectorAll('a');
    // cek tombol yang di klik
    for(let anchor of openLinkAnchors) {
        anchor.onclick = (event) => {
            const url = event.currentTarget.href
            const rawUrl = url.split('#')[1]
            openLinkNewTab(rawUrl)
        }
    }

    // set fanart token
    const fanartTokenButton = document.querySelector('#setFanartToken')
    fanartTokenButton.onclick = () => setFanartToken()

    // notif
    const notifElement = document.querySelector('.notif')
    
    // get fanart from redis
    const getFanartRedisButton = document.querySelector('#getFromRedis')
    getFanartRedisButton.onclick = event => {
        notifElement.textContent = 'getting fanart..'
        getFromRedisCommand(event)
    }
    
    // update fanart to redis
    const updateFanartRedisButton = document.querySelector('#updateToRedis')
    updateFanartRedisButton.onclick = event => {
        notifElement.textContent = 'uploading fanart..'
        updateToRedisCommand(event)
    }
});

async function updateFanartList(key, newFanartList) {
    const fanartData = await getFromStorage(key)
    if(fanartData) {
        // data sudah ada, maka update list
        const oldFanartList = JSON.parse(fanartData)
        // hapus data duplikat
        const filterFanartList = [...oldFanartList, ...newFanartList]
                                .filter((v,i,arr) => i === arr.findIndex(w => v.url === w.url))
        saveToStorage(key, JSON.stringify(filterFanartList))
    } else {
        // data belum ada, maka set data pertama
        saveToStorage(key, JSON.stringify(newFanartList))
    }
}

function convertResDataToArray(value) {
    const objectString = value.map(v => `{${v}}`)
    const arrayString = `[${objectString.join(',')}]`
    return JSON.parse(arrayString)
}

function getFromRedisCommand(event) {
    chrome.runtime.sendMessage(
        {action: 'getFanartFromRedis'},
        res => {
            if(res && res.status === 200) {
                // loop res data
                for(let [key, value] of Object.entries(res.data)) {
                    // parse data
                    switch(key) {
                        case 'saveFanartNice':
                            // modify data so it can be parse to array
                            const niceArray = convertResDataToArray(value)
                            updateFanartList(key, niceArray)
                            break
                        case 'saveFanartWow':
                            const wowArray = convertResDataToArray(value)
                            updateFanartList(key, wowArray)
                            break
                        case 'saveFanartYooo':
                            const yoooArray = convertResDataToArray(value)
                            updateFanartList(key, yoooArray)
                            break
                    }
                }
                // response success
                responseToFront(res, event, `get from redis (${res.currentPage})`)
            } else {
                // response error
                responseToFront(res, event, `get from redis (${res.currentPage})`)
            }
        }
    )
}

function updateToRedisCommand(event) {
    chrome.runtime.sendMessage(
        {action: 'updateFanartToRedis'},
        res => responseToFront(res, event, 'update to redis')
    )
}

function responseToFront(res, event, eventText) {
    const notifElement = document.querySelector('.notif')
    notifElement.textContent = res.message
    setTimeout(() => notifElement.textContent = '', 3000);

    if(res && res.status === 200) {
        // response success
        event.target.classList.add('fanart-fetch-success')
        event.target.textContent = `${eventText} ✅`
        setTimeout(() => {
            event.target.classList.remove('fanart-fetch-success')
            event.target.textContent = event.target.textContent.replace(' ✅', '')
        }, 3000);
    } else {
        // response error
        event.target.classList.add('fanart-fetch-failed')
        event.target.textContent = `${eventText} ❌`
        setTimeout(() => {
            event.target.classList.remove('fanart-fetch-failed')
            event.target.textContent = event.target.textContent.replace(' ❌', '')
        }, 3000);
    }
}

// Fungsi universal untuk membuka tab baru
function openLinkNewTab(url) {
    chrome.tabs.create({ url });
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

function setFanartToken() {
    const token = prompt('input fanart token:')

    chrome.storage.local.set({ fanartToken: token }, () => {
        const time = new Date().toLocaleString('id', {timeStyle: 'short', hour12: true})
        console.log(`Token berhasil disimpan! (${time})`);
    });
}

function checkFanartToken() {
    getFromStorage('fanartToken').then(res => {
        if(!res) return
        const fanartTokenButton = document.querySelector('#setFanartToken')
        fanartTokenButton.textContent = 'set fanart token ✅'
    })
}