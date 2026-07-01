/* =========================================================
   data.js
   Database peserta Open Recruitment LIBA Science Club 2026.

   CARA MENAMBAH PESERTA BARU:
   Cukup tambahkan satu object baru ke dalam array PESERTA_DATA
   di bawah ini, dengan format yang sama. Tidak perlu mengubah
   file lain (script.js / hasil.js) karena logika pencarian
   peserta sudah generik.

   Field:
   - nis            : Nomor Induk Siswa (string, sesuai input)
   - kode           : Kode Pendaftaran (string, sesuai input)
   - nama           : Nama lengkap peserta
   - noRegistrasi   : Nomor registrasi resmi (unik)
   - status         : "LOLOS" atau "TIDAK_LOLOS"
   - tanggalPengumuman : format bebas, tampil apa adanya
   ========================================================= */

const PESERTA_DATA = [
  {
    nis: "240710",
    kode: "OPREC-LIBA29_001",
    nama: "KINANTI PINARING GUSTI",
    noRegistrasi: "REG/LIBA29/0001",
    status: "LOLOS",
    tanggalPengumuman: "29 Juni 2026"
  },
  {
    nis: "5981",
    kode: "OPREC-LIBA29_002",
    nama: "Bagas Nugroho Saputra",
    noRegistrasi: "REG/LIBA29/0002",
    status: "TIDAK_LOLOS",
    tanggalPengumuman: "29 Juni 2026"
  },
  {
    nis: "5982",
    kode: "OPREC-LIBA29_003",
    nama: "Citra Maharani Dewi",
    noRegistrasi: "REG/LIBA29/0003",
    status: "LOLOS",
    tanggalPengumuman: "29 Juni 2026"
  }
];

/**
 * Mencari data peserta berdasarkan NIS dan Kode Pendaftaran.
 * Pencocokan tidak case-sensitive dan mengabaikan spasi berlebih.
 * @param {string} nis
 * @param {string} kode
 * @returns {object|null}
 */
function findPeserta(nis, kode) {
  const normalize = (v) => String(v || "").trim().toLowerCase();
  const nisQ = normalize(nis);
  const kodeQ = normalize(kode);

  return (
    PESERTA_DATA.find(
      (p) => normalize(p.nis) === nisQ && normalize(p.kode) === kodeQ
    ) || null
  );
}
