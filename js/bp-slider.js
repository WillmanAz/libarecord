/**
 * bp-slider.js
 * Mengatur slider Badan Pengurus Harian (BPH):
 *  - Outer group slider (3 grup divisi)
 *  - Inner member slider (anggota per divisi)
 */

(function () {

    /* ---- Inner member sliders ---- */
    var memberStates = {};

    function initMemberSlider(trackId) {
        var track = document.getElementById(trackId);
        if (!track) return;
        var slides = track.querySelectorAll('.bp-member-slide');
        var total  = slides.length;
        memberStates[trackId] = { current: 0, total: total };
    }

    function memberGoTo(trackId, n) {
        var state = memberStates[trackId];
        if (!state) return;
        state.current = (n + state.total) % state.total;

        var track = document.getElementById(trackId);
        track.style.transform = 'translateX(-' + (state.current * 100) + '%)';

        document.querySelectorAll('[data-track="' + trackId + '"][data-idx]').forEach(function (dot) {
            var idx = parseInt(dot.dataset.idx);
            dot.className = 'bp-mini-dot ' + (idx === state.current ? 'active' : 'inactive');
        });
    }

    function attachMemberNav() {
        // Tombol prev/next per divisi
        document.querySelectorAll('.bp-mini-btn[data-track]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var trackId = this.dataset.track;
                var dir     = parseInt(this.dataset.dir);
                var state   = memberStates[trackId];
                if (state) memberGoTo(trackId, state.current + dir);
            });
        });

        // Dot per anggota
        document.querySelectorAll('.bp-mini-dot[data-track]').forEach(function (dot) {
            dot.addEventListener('click', function () {
                memberGoTo(this.dataset.track, parseInt(this.dataset.idx));
            });
        });
    }

    /* ---- Outer group slider ---- */
    var groupCurrent = 0;
    var groupTotal   = 3;

    function groupGoTo(n) {
        groupCurrent = (n + groupTotal) % groupTotal;

        var track = document.getElementById('bp-group-track');
        track.style.transform = 'translateX(-' + (groupCurrent * 100) + '%)';

        document.querySelectorAll('.bp-group-dot').forEach(function (d, i) {
            d.className = 'bp-group-dot ' + (i === groupCurrent ? 'active' : 'inactive');
        });

        var label = document.getElementById('bp-slide-label');
        if (label) label.textContent = groupCurrent + 1;
    }

    function init() {
        // Inisialisasi semua inner member slider
        [
            'mt-pembina', 'mt-ketua',  'mt-wakil',
            'mt-sekre',   'mt-bendahara', 'mt-humas',
            'mt-diklat',  'mt-media'
        ].forEach(initMemberSlider);

        attachMemberNav();

        // Outer group nav
        document.getElementById('bp-next').addEventListener('click', function () {
            groupGoTo(groupCurrent + 1);
        });
        document.getElementById('bp-prev').addEventListener('click', function () {
            groupGoTo(groupCurrent - 1);
        });

        document.querySelectorAll('.bp-group-dot').forEach(function (d) {
            d.addEventListener('click', function () {
                groupGoTo(parseInt(this.dataset.gi));
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();