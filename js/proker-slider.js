/**
 * proker-slider.js
 * Mengatur slider Program Kerja (Proker) di section Visi, Misi & Proker.
 * Auto-slide setiap 4 detik, bisa dikontrol via tombol prev/next dan dots.
 */

(function () {
    var current = 0;
    var total   = 8;

    function init() {
        var track = document.getElementById('proker-track');
        var dots  = document.querySelectorAll('.proker-dot');

        if (!track) return;

        function goTo(n) {
            current = (n + total) % total;
            track.style.transform = 'translateX(-' + (current * 100) + '%)';
            dots.forEach(function (d, i) {
                d.className = 'proker-dot ' + (i === current ? 'active' : 'inactive');
            });
        }

        document.getElementById('proker-next').addEventListener('click', function () {
            goTo(current + 1);
        });

        document.getElementById('proker-prev').addEventListener('click', function () {
            goTo(current - 1);
        });

        dots.forEach(function (d) {
            d.addEventListener('click', function () {
                goTo(parseInt(this.dataset.index));
            });
        });

        // Auto-slide setiap 4 detik
        setInterval(function () {
            goTo(current + 1);
        }, 4000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();