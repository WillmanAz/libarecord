/**
 * main.js
 * Script utama untuk:
 *  - Single Page Nav (highlight nav link aktif)
 *  - Scroll effect pada navbar pill
 *  - Hamburger menu mobile
 *  - Smooth scroll antar section
 *
 * Membutuhkan jQuery, parallax.min.js, dan jquery.singlePageNav.min.js
 * yang sudah di-load sebelum file ini.
 */

$(function () {
    var tmNav = $('#tm-nav');

    // singlePageNav: highlight .current pada link aktif
    tmNav.singlePageNav({
        currentClass: 'current',
        selector: '.nav-link, .mobile-nav-link'
    });

    // Scroll: darken pill navbar saat sudah scroll > 80px
    $(document).scroll(function () {
        if ($(document).scrollTop() > 80) {
            tmNav.addClass('scroll');
        } else {
            tmNav.removeClass('scroll');
        }
    });

    // Mobile hamburger toggle
    $('#menu-toggle').on('click', function () {
        var mm = $('#mobile-menu');
        if (mm.is(':visible')) {
            mm.slideUp(200);
        } else {
            mm.slideDown(200);
        }
    });

    // Tutup mobile menu saat salah satu link diklik
    $('.mobile-nav-link').on('click', function () {
        $('#mobile-menu').slideUp(200);
    });

    // Smooth scroll untuk semua anchor link
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var href = this.getAttribute('href');
            if (href === '#') return;
            var target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});