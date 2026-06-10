const authorList = []
const checkedAuthorList = []
let fanartLimitCounter = 0

document.addEventListener('DOMContentLoaded', function() {
    // Mengambil semua tombol tab dan konten tab
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Menambahkan event click pada setiap tombol tab
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
        
        // 1. Hapus status 'active' dari semua tombol dan konten
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // 2. Tambahkan status 'active' pada tombol yang diklik
        button.classList.add('active');

        // 3. Tampilkan konten yang sesuai dengan atribut data-target
        const targetId = button.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
        });
    });
});

async function createFanartList() {
    const fanartTabs = document.querySelectorAll('.tab-btn')
    const fanartContentList = document.querySelectorAll('.tab-content')
    for(let i=0; i<fanartContentList.length; i++) {
        const fanartContent = fanartContentList.item(i)
        
        // tab1 = nice | tab2 = wow | tab3 = yooo
        switch(fanartContent.id) {
            case 'tab1':
                const getNiceData = await getFromStorage('saveFanartNice')
                const fanartNiceList = getNiceData ? JSON.parse(getNiceData) : []
                // fanart count
                fanartLimitCounter += fanartNiceList.length
                fanartTabs[i].textContent += ` (${fanartNiceList.length})`
                createFanartItem(fanartContent.children[0], fanartNiceList)
                break
            case 'tab2':
                const getWowData = await getFromStorage('saveFanartWow')
                const fanartWowList = getWowData ? JSON.parse(getWowData) : []
                // fanart count
                fanartLimitCounter += fanartWowList.length
                fanartTabs[i].textContent += ` (${fanartWowList.length})`
                createFanartItem(fanartContent.children[0], fanartWowList)
                break
            case 'tab3':
                const getYoooData = await getFromStorage('saveFanartYooo')
                const fanartYoooList = getYoooData ? JSON.parse(getYoooData) : []
                // fanart count
                fanartLimitCounter += fanartYoooList.length
                fanartTabs[i].textContent += ` (${fanartYoooList.length})`
                createFanartItem(fanartContent.children[0], fanartYoooList)
                break
        }
    }
}

function createFanartItem(container, fanartList) {
    for(let fanart of fanartList) {
        const author = fanart.url.replace('https://', '').split('/')[1]
        const findAuthor = authorList.map(v => v.author).indexOf(author)
        if(findAuthor === -1)
            authorList.push({author, count: 1})
        else 
            authorList[findAuthor].count += 1

        // create fanart item
        const fanartDiv = document.createElement('div')
        fanartDiv.classList.add('fanart-item')
        // image 
        const fanartImg = document.createElement('img')
        fanartImg.src = fanart.img
        fanartImg.alt = 'fanart-img'
        fanartImg.title = `@${author}`
        // fanartImg.height = 120

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

// Tambahkan fungsi ini untuk membuka dropdown
function setupAuthorDropdown() {
    const dropdownBtn = document.getElementById('authorDropdownBtn');
    const dropdownContent = document.getElementById('authorDropdownContent');

    // Toggle (buka/tutup) dropdown saat tombol ditekan
    dropdownBtn.addEventListener('click', (event) => {
        event.stopPropagation(); // Mencegah klik menyebar ke window
        dropdownContent.classList.toggle('show');
    });

    // Generate list author menjadi checkbox
    authorList.forEach(data => {
        // Buat label sebagai container agar tulisan juga bisa diklik
        const labelItem = document.createElement('label');
        labelItem.classList.add('author-item');

        // Buat checkbox
        const checkboxItem = document.createElement('input');
        checkboxItem.type = 'checkbox';
        checkboxItem.value = data.author;

        // Tangkap event ketika checkbox dicentang/dihilangkan
        checkboxItem.addEventListener('change', event => {
            const isChecked = event.target.checked;
            const author = event.target.value;
            // Nanti Anda bisa menambahkan logika filter gambar di sini
            if(isChecked) checkedAuthorList.push(author)
            else {
                const findAuthor = checkedAuthorList.indexOf(author)
                checkedAuthorList.splice(findAuthor, 1)
            }
            // show fanart for selected author
            showFanartForSelectedAuthor()
        });

        // Masukkan checkbox dan teks ke dalam label
        labelItem.appendChild(checkboxItem);
        labelItem.appendChild(document.createTextNode(`${data.author} (${data.count})`));

        // Masukkan label ke dalam konten dropdown
        dropdownContent.appendChild(labelItem);
    });

    // Mencegah dropdown tertutup otomatis saat mengklik area di DALAM dropdown (saat centang box)
    dropdownContent.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    // Menutup dropdown secara otomatis jika user mengklik area KOSONG di LUAR dropdown
    window.addEventListener('click', () => {
        if (dropdownContent.classList.contains('show')) {
            dropdownContent.classList.remove('show');
        }
    });
}

function showFanartForSelectedAuthor() {
    // get all img elements
    const allFanartDiv = document.querySelectorAll('.fanart-item')
    for(let fanartDiv of allFanartDiv) {
        const fanartImg = fanartDiv.children.item(0)
        if(checkedAuthorList.length > 0 && checkedAuthorList.indexOf(fanartImg.title.replace('@','')) === -1) {
            fanartDiv.classList.add('hide')
        } else if(checkedAuthorList.length === authorList.length) {
            const allCheckbox = document.querySelectorAll('input[type="checkbox"]')
            for(let input of allCheckbox) input.checked = false
            fanartDiv.classList.remove('hide')
        } else {
            fanartDiv.classList.remove('hide')
        }
    }
}