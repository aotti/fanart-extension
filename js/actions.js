
// Menunggu hingga seluruh DOM popup selesai dimuat
document.addEventListener('DOMContentLoaded', async function() {
    
    // load fanart list
    await createFanartList()

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
    
    // --- Kode logika perpindahan tab Anda yang sebelumnya tetap ditaruh di bawah sini ---
});

// Fungsi universal untuk membuka tab baru
function openLinkNewTab(url) {
    chrome.tabs.create({ url });
}

async function createFanartList() {
    const fanartTabs = document.querySelectorAll('.tab-content')
    const containerList = document.querySelectorAll('.fanart-container')
    for(let tab of fanartTabs) {
        // tab1 = nice | tab2 = wow | tab3 = yooo
        switch(tab.id) {
            case 'tab1':
                const getNiceData = await getFromStorage('saveFanartNice')
                const fanartNiceList = getNiceData ? JSON.parse(getNiceData) : []
                createFanartItem(containerList[0], fanartNiceList)
                break
            case 'tab2':
                const getWowData = await getFromStorage('saveFanartWow')
                const fanartWowList = getWowData ? JSON.parse(getWowData) : []
                createFanartItem(containerList[1], fanartWowList)
                break
            case 'tab3':
                const getYoooData = await getFromStorage('saveFanartYooo')
                const fanartYoooList = getYoooData ? JSON.parse(getYoooData) : []
                createFanartItem(containerList[2], fanartYoooList)
                break
        }
    }
}

function createFanartItem(container, fanartList) {
    for(let fanart of fanartList) {
        // create fanart item
        const fanartDiv = document.createElement('div')
        fanartDiv.classList.add('fanart-item')
        // image 
        const fanartImg = document.createElement('img')
        fanartImg.src = fanart.img

        // action div
        const fanartActionDiv = document.createElement('div')
        fanartActionDiv.classList.add('fanart-action')
        // anchor
        const fanartAnchor = document.createElement('a')
        fanartAnchor.href = `#${fanart.url}`
        fanartAnchor.textContent = 'open'
        // copy
        const fanartCopy = document.createElement('button')
        fanartCopy.textContent = 'copy'
        fanartCopy.onclick = (event) => {
            navigator.clipboard.writeText(fanart.url)
            .then(() => {
                event.target.textContent += ' ✅'
                setTimeout(() => event.target.textContent = 'copy', 1000);
            })
        }

        // append action elements
        fanartActionDiv.appendChild(fanartAnchor)
        fanartActionDiv.appendChild(fanartCopy)

        // append image and anchor to div
        fanartDiv.appendChild(fanartImg)
        fanartDiv.appendChild(fanartActionDiv)

        // append to fanart container
        container.appendChild(fanartDiv)
    }
}

async function getFromStorage(key) {
    // this shit return object even if the storage is empty
    const data = await chrome.storage.local.get([key])
    return Object.keys(data).length > 0 ? data[key] : null
}