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