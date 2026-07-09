
// Menunggu hingga seluruh DOM popup selesai dimuat
document.addEventListener('DOMContentLoaded', async function() {
    // load fanart list
    await createFanartList()
    // load author list
    setupAuthorDropdown();
    // check fanart token
    checkFanartToken()
    // check fanart limit
    fanartLimitWarning()

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
    const notifElement = document.querySelector('#notif')
    
    // get fanart from redis
    const getFanartRedisButton = document.querySelector('#getFromRedis')
    getFanartRedisButton.onclick = event => {
        notifElement.textContent = 'getting fanart..'
        getFromRedisCommand(event)
    }

    // load more fanart from redis
    const loadMoreFanartButton = document.querySelector('#loadMoreFanart')
    loadMoreFanartButton.onclick = event => {
        notifElement.textContent = 'load more fanart..'
        loadMoreFromRedisCommand(event)
    }
    
    // update fanart to redis
    const updateFanartRedisButton = document.querySelector('#updateToRedis')
    updateFanartRedisButton.onclick = event => {
        notifElement.textContent = 'uploading fanart..'
        updateToRedisCommand(event)
    }

    // compare fanart redis with local
    const compareFanartButton = document.querySelector('#compareFanart')
    compareFanartButton.onclick = event => {
        notifElement.textContent = 'comparing fanart redis with local..'
        compareFanartCommand(event)
    }

    // remove some fanart
    const removeFanartButton = document.querySelector('#removeFanart')
    removeFanartButton.onclick = async () => {
        if(confirm('Are you sure wanna remove 100 nice fanarts?')) {
            if(fanartLimitCounter < 900) 
                notifElement.textContent = 'your fanart still < 900'
            else {
                notifElement.textContent = 'removing 100 nice fanarts.. 😢'
                await removeFanartList()
            }
        }
        setTimeout(() => notifElement.textContent = '', 3000);
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

async function removeFanartList() {
    const getNiceData = await getFromStorage('saveFanartNice')
    const parsedFanartNice = getNiceData ? JSON.parse(getNiceData) : []
    if(parsedFanartNice.length >  0) {
        const slicedFanartNice = parsedFanartNice.slice(0, -100)
        saveToStorage('saveFanartNice', JSON.stringify(slicedFanartNice))
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
                displayResponse(res, event, `get from redis (${res.currentPage-1})`)
            } else {
                // response error
                displayResponse(res, event, `get from redis (${res.currentPage-1})`)
            }
        }
    )
}

function loadMoreFromRedisCommand(event) {
    chrome.runtime.sendMessage(
        {action: 'loadMoreFanartFromRedis'},
        async res => {
            if(res && res.status === 200) {
                // loop res data
                for(let [key, value] of Object.entries(res.data)) {
                    // parse data 
                    // set into html directly (to prevent big local storage)
                    switch(key) {
                        case 'saveFanartNice':
                            // modify data so it can be parse to array
                            const niceArray = convertResDataToArray(value)
                            await createFanartList('tab1', niceArray)
                            break
                        case 'saveFanartWow':
                            const wowArray = convertResDataToArray(value)
                            await createFanartList('tab2', wowArray)
                            break
                        case 'saveFanartYooo':
                            const yoooArray = convertResDataToArray(value)
                            await createFanartList('tab3', yoooArray)
                            break
                    }
                }
                // response success
                displayResponse(res, event, `load more from redis (${res.loadMorePage})`)
            } else {
                // response error
                displayResponse(res, event, `load more from redis (${res.loadMorePage})`)
            }
        }
    )
}

function updateToRedisCommand(event) {
    chrome.runtime.sendMessage(
        {action: 'updateFanartToRedis'},
        res => displayResponse(res, event, 'update to redis')
    )
}

async function compareFanartCommand(event) {
    const getNiceData = await getFromStorage('saveFanartNice')
    const fanartNiceList = getNiceData ? JSON.parse(getNiceData) : []
    const getWowData = await getFromStorage('saveFanartWow')
    const fanartWowList = getWowData ? JSON.parse(getWowData) : []
    const getYoooData = await getFromStorage('saveFanartYooo')
    const fanartYoooList = getYoooData ? JSON.parse(getYoooData) : []

    const notifElement = document.querySelector('#notif')
    const fanartType = prompt(`wow = SaveFanartWow \nyooo = SaveFanartYooo \ninput fanart type:`)
    notifElement.textContent += `(${fanartType})`
    chrome.runtime.sendMessage(
        {action: 'compareFanartRedisWithLocal', fanart_type: fanartType},
        res => {
            if(res && res.status === 200) {
                let comparedWow = null, comparedYooo = null
                // loop res data
                for(let [key, value] of Object.entries(res.data)) {
                    // parse data
                    switch(key) {
                        case 'saveFanartWow':
                            if(value && fanartWowList.length > 0) {
                                const wowArray = convertResDataToArray(value)
                                comparedWow = compareFanart(fanartWowList, wowArray)
                            }
                            break
                        case 'saveFanartYooo':
                            if(value && fanartYoooList.length > 0) {
                                const yoooArray = convertResDataToArray(value)
                                comparedYooo = compareFanart(fanartYoooList, yoooArray)
                            }
                            break
                    }
                }

                // confirmation before upload compared fanart
                const missedFanartCount = comparedWow?.length || comparedYooo?.length || 0
                if(missedFanartCount > 0 && confirm(`do you wanna update missed fanart to redis? (${missedFanartCount})`)) {
                    notifElement.textContent = `updating ${fanartType.toUpperCase()} fanart..`
                    if(comparedWow) updateComparedFanartCommand(event, fanartType, JSON.stringify(comparedWow))
                    else if(comparedYooo) updateComparedFanartCommand(event, fanartType, JSON.stringify(comparedYooo))
                } else {
                    notifElement.textContent = `${fanartType.toUpperCase()} fanart is up to date`
                    setTimeout(() => notifElement.textContent = '', 3000);
                }
            } else {
                // response error
                displayResponse(res, event, `compare fanart 🔀`)
            }
        }
    )
}

function compareFanart(localFanartList, redisFanartList) {
    const comparedFanart = []
    for(let local of localFanartList) {
        const isFanartExist = redisFanartList.map(v => v.url).indexOf(local.url)
        if(isFanartExist === -1) comparedFanart.push(local)
    }
    return comparedFanart
}

function updateComparedFanartCommand(event, fanartType, fanartList) {
    chrome.runtime.sendMessage(
        {
            action: 'updateComparedFanartToRedis',
            fanart_type: fanartType,
            fanart_list: fanartList,
        },
        res => displayResponse(res, event, 'compare fanart 🔀')
    )
}

function displayResponse(res, event, eventText) {
    const notifElement = document.querySelector('#notif')
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

function fanartLimitWarning() {
    if(fanartLimitCounter >= 1000) {
        const fanartTabs = document.querySelectorAll('.tab-btn')
        let fanartAmount = 0
        fanartTabs.forEach(e => fanartAmount += +e.textContent.match(/\d+/)[0])
        alert(`❗ ITS OVER 1000 FANARTS ❗ (${fanartAmount})`)
    }
}