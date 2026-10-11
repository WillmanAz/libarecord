# LIBA Website: Firebase RBAC (tambahan di atas web lama)

Isi `public/` digabung ke folder web LIBA yang ada (css/, img/, js/ lama tetap dipakai).

- `index.html`  : web lama + tambahan (menu portal, Struktur dari Firestore, Press Release di Publikasi). Hanya 1 baris lama dipindah: `js/bp-slider.js`.
- `login.html`, `pending.html`, `arsip.html`, `presensi.html`, `admin.html`, `press.html`, `go.html` : halaman baru.
- `js/` baru: firebase-config, auth, admin, presensi, public-data, shortener, nav-auth.
- `seed-pengurus.html` : sekali pakai, hanya BPH, mengisi koleksi `pengurus`. Hapus setelah dipakai.

Setup: isi `js/firebase-config.js` dan `.firebaserc`; aktifkan Auth Email/Password + Firestore;
`firebase deploy --only firestore:rules,hosting`; ubah `users/{uid}.role` jadi `bph` manual di Console (BPH pertama);
buka `/seed-pengurus.html` sebagai BPH.
