import { auth, db } from "./firebase-config.js";
import {
  collection, query, where, orderBy, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { $, el, btn, fmtDate, downloadFile, toCsv, mountCrud } from "./crud.js";

const host = $("sections"), toc = $("toc");
function section(id, title) {
  const s = el("section", "card"); s.id = id; host.append(s);
  const a = el("a", "underline", title); a.href = "#" + id; toc.append(a);
  return s;
}
const uidNow = () => auth.currentUser.uid;
const sortBy = (arr, f) => arr.sort((a, b) => f(a).localeCompare(f(b), "id"));

/* ---------- 1. Pengumuman ---------- */
function pengumuman() {
  mountCrud(section("s-pengumuman", "Pengumuman anggota"), {
    title: "Pengumuman internal (hanya dibaca anggota)", col: "pengumuman", max: 30,
    label: (x) => `${x.pinned ? "[Disematkan] " : ""}${x.title} (${fmtDate(x.createdAt)})`,
    fields: [
      { name: "title", label: "Judul", required: true, full: true },
      { name: "body", label: "Isi pengumuman", type: "textarea", required: true, rows: 4 },
      { name: "pinned", label: "Sematkan di atas", type: "checkbox" }
    ]
  });
}

/* ---------- 2. Kegiatan & kalender + pendaftar ---------- */
function kegiatan() {
  const box = section("s-kegiatan", "Kalender kegiatan & pendaftaran");
  const panel = el("div", "mt-6");
  async function showRegs(id, title) {
    panel.replaceChildren();
    const snap = await getDocs(query(collection(db, "registrations"), where("event", "==", id)));
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    const head = el("div", "flex justify-between items-center mb-2");
    head.append(el("h3", "font-semibold", `Pendaftar: ${title} (${rows.length})`),
      btn("Unduh CSV", "bg-green-600", async () => downloadFile(`pendaftar-${title}.csv`, toCsv([["Nama", "Email", "HP/WA", "Asal", "Catatan", "Waktu"], ...rows.map((r) => [r.name, r.email, r.phone, r.school, r.note, fmtDate(r.createdAt)])]))));
    const t = el("table", "w-full text-sm"); const tb = el("tbody"); t.append(tb);
    rows.forEach((r) => {
      const tr = tb.insertRow();
      tr.insertCell().textContent = `${r.name} (${r.email})${r.phone ? ", " + r.phone : ""}${r.school ? ", " + r.school : ""}`;
      const a = tr.insertCell(); a.className = "p-2 text-right";
      a.append(btn("Hapus", "bg-red-600", async () => { if (!confirm("Hapus pendaftar ini?")) throw new Error("batal"); await deleteDoc(doc(db, "registrations", r.id)); tr.remove(); }));
    });
    panel.append(head, rows.length ? t : el("p", "text-sm text-slate-500", "Belum ada pendaftar."));
  }
  mountCrud(box, {
    title: "Kegiatan (tampil di halaman Kalender)", col: "kegiatan", orderBy: ["date", "desc"], max: 60,
    hint: "Centang \"Buka pendaftaran online\" untuk OPREC atau lomba: tombol Daftar muncul di kalender.",
    label: (x) => `${fmtDate(x.date)} | ${x.type}: ${x.title}${x.registerOpen ? " (pendaftaran dibuka)" : ""}`,
    extra: (d, x) => [btn("Pendaftar", "bg-[#093C5D]", () => showRegs(d.id, x.title))],
    fields: [
      { name: "title", label: "Nama kegiatan", required: true, full: true },
      { name: "date", label: "Tanggal", type: "date", required: true },
      { name: "type", label: "Jenis", type: "select", options: ["Larut", "Rapat", "Lomba", "OPREC", "Lainnya"] },
      { name: "time", label: "Jam (opsional)" },
      { name: "place", label: "Tempat (opsional)" },
      { name: "description", label: "Keterangan", type: "textarea" },
      { name: "registerOpen", label: "Buka pendaftaran online", type: "checkbox" }
    ]
  });
  box.append(panel);
}

/* ---------- 3-6. Pengurus, proker, prestasi, galeri ---------- */
function simpleCruds() {
  mountCrud(section("s-pengurus", "Pengurus"), {
    title: "Pengurus (tampil di bagian Struktur)", col: "pengurus", orderBy: ["order", "asc"], max: 80,
    hint: "Divisi dikelompokkan otomatis, 3 divisi per slide, sesuai urutan. Nomor urut menentukan posisi.",
    label: (x) => `${x.order}. ${x.division}: ${x.name} (${x.role})`,
    fields: [
      { name: "division", label: "Divisi (mis. Pembina, Humas)", required: true },
      { name: "name", label: "Nama", required: true },
      { name: "role", label: "Jabatan", required: true },
      { name: "order", label: "Nomor urut", type: "number", required: true },
      { name: "photoUrl", label: "Foto (path mis. img/foto.jpg)", type: "imgpath", full: true, maxW: 300, maxChars: 30000 }
    ]
  });
  mountCrud(section("s-proker", "Proker"), {
    title: "Program kerja (tampil di slider Proker)", col: "timeline", orderBy: ["order", "asc"], max: 40,
    label: (x) => `${x.order}. ${x.title}${x.dateLabel ? " | " + x.dateLabel : ""}`,
    fields: [
      { name: "title", label: "Nama program", required: true },
      { name: "dateLabel", label: "Tanggal / keterangan waktu" },
      { name: "order", label: "Nomor urut", type: "number", required: true },
      { name: "imageUrl", label: "Gambar (path mis. img/proker-larut.png)", type: "imgpath", maxW: 400, maxChars: 40000 },
      { name: "description", label: "Deskripsi", type: "textarea", rows: 4 }
    ]
  });
  mountCrud(section("s-prestasi", "Prestasi"), {
    title: "Prestasi / Hall of Fame (halaman Prestasi)", col: "prestasi", orderBy: ["year", "desc"], max: 150,
    label: (x) => `${x.year} | ${x.achievement}: ${x.title} (${x.name})`,
    fields: [
      { name: "year", label: "Tahun", type: "number", required: true },
      { name: "level", label: "Tingkat", type: "select", options: ["Sekolah", "Kota/Kabupaten", "Provinsi", "Nasional", "Internasional"] },
      { name: "title", label: "Nama lomba", required: true, full: true },
      { name: "achievement", label: "Capaian (Juara 1, Medali Perak, Finalis ...)", required: true },
      { name: "name", label: "Nama peraih / tim", required: true },
      { name: "description", label: "Keterangan (opsional)", type: "textarea" }
    ]
  });
  mountCrud(section("s-galeri", "Galeri"), {
    title: "Galeri kegiatan (link album, bukan unggah foto)", col: "galeri", orderBy: ["date", "desc"], max: 60,
    label: (x) => `${fmtDate(x.date)} | ${x.title}`,
    fields: [
      { name: "title", label: "Judul album", required: true },
      { name: "date", label: "Tanggal", type: "date", required: true },
      { name: "albumUrl", label: "Link album (Google Drive/Photos/Instagram)", type: "url", required: true, full: true },
      { name: "thumb", label: "Gambar sampul kecil", type: "imgpath", full: true, maxW: 480, maxChars: 28000 },
      { name: "description", label: "Keterangan", type: "textarea" }
    ]
  });
}

/* ---------- 7. Kelola anggota ---------- */
const ROLES = { pending: "Menunggu", anggota: "Anggota", bph: "BPH", rejected: "Nonaktif / ditolak" };
async function anggota() {
  const box = section("s-anggota", "Anggota");
  const search = el("input", "in mb-3"); search.placeholder = "Cari nama atau email";
  const tb = el("tbody"), t = el("table", "w-full text-sm"); t.append(tb);
  box.append(el("h2", "font-semibold mb-3", "Kelola anggota"), search, t);
  const snap = await getDocs(collection(db, "users"));
  const users = sortBy(snap.docs.map((d) => ({ id: d.id, ...d.data() })), (u) => (u.displayName || u.email || "").toLowerCase());
  function render() {
    const q = search.value.toLowerCase(); tb.replaceChildren();
    users.filter((u) => !q || `${u.displayName} ${u.email}`.toLowerCase().includes(q)).forEach((u) => {
      const tr = tb.insertRow();
      tr.insertCell().textContent = `${u.displayName || "-"} (${u.email})`;
      const c = tr.insertCell(); c.className = "p-2 flex gap-2 justify-end";
      if (u.id === uidNow()) { c.append(el("span", "text-xs text-slate-500", "Akun Anda")); return; }
      const sel = el("select", "border rounded p-1 text-sm");
      Object.entries(ROLES).forEach(([k, v]) => { const o = el("option", "", v); o.value = k; sel.append(o); });
      sel.value = u.role || "pending";
      c.append(sel, btn("Simpan", "bg-[#093C5D]", async () => {
        if (sel.value === "bph" && !confirm("Jadikan BPH? BPH bisa mengubah semua data.")) throw new Error("batal");
        await updateDoc(doc(db, "users", u.id), { role: sel.value, verifiedAt: serverTimestamp(), verifiedBy: uidNow() });
        u.role = sel.value;
      }));
    });
  }
  search.addEventListener("input", render); render();
}

/* ---------- 8. Pengajuan karya anggota ---------- */
const BADGE = { diajukan: "bg-amber-100 text-amber-800", revisi: "bg-orange-100 text-orange-800", disetujui: "bg-green-100 text-green-800", ditolak: "bg-red-100 text-red-800" };
async function pengajuan() {
  const box = section("s-pengajuan", "Pengajuan karya");
  box.append(el("h2", "font-semibold mb-3", "Pengajuan karya anggota"));
  const tb = el("tbody"), t = el("table", "w-full text-sm"); t.append(tb); box.append(t);
  async function load() {
    tb.replaceChildren();
    const snap = await getDocs(query(collection(db, "submissions"), orderBy("createdAt", "desc")));
    if (snap.empty) { tb.insertRow().insertCell().textContent = "Belum ada pengajuan."; return; }
    snap.forEach((d) => {
      const x = d.data(), tr = tb.insertRow(), c = tr.insertCell(); c.className = "p-2";
      const line = el("div", "font-medium"); line.append(el("span", `text-xs rounded-full px-2 py-0.5 mr-2 ${BADGE[x.status] || ""}`, x.status), document.createTextNode(x.title));
      const a = el("a", "underline text-xs", "Buka file"); a.href = /^https?:\/\//.test(x.fileUrl) ? x.fileUrl : "#"; a.target = "_blank"; a.rel = "noopener noreferrer";
      c.append(line, el("div", "text-xs text-slate-500", `${x.authorName} | ${x.category || "-"} / ${x.bidang || "-"} | ${fmtDate(x.createdAt)}${x.note ? " | " + x.note : ""}`), a);
      if (x.feedback) c.append(el("div", "text-xs mt-1", "Catatan: " + x.feedback));
      const act = tr.insertCell(); act.className = "p-2 flex flex-wrap gap-2 justify-end";
      const review = (status, feedback) => updateDoc(d.ref, { status, feedback: feedback ?? x.feedback ?? "", reviewedBy: uidNow(), reviewedAt: serverTimestamp() });
      if (x.status !== "disetujui") act.append(btn("Setujui & arsipkan", "bg-green-600", async () => {
        const year = Number(prompt("Tahun karya untuk arsip:", new Date().getFullYear()));
        if (!year) throw new Error("batal");
        await review("disetujui");
        await addDoc(collection(db, "karya_ilmiah"), { title: x.title, authors: [x.authorName], year, category: x.category || "", bidang: x.bidang || "", abstract: x.note || "", fileUrl: x.fileUrl, createdAt: serverTimestamp(), createdBy: uidNow() });
        load();
      }));
      act.append(btn("Revisi", "bg-orange-600", async () => { const f = prompt("Catatan revisi untuk anggota:"); if (f === null) throw new Error("batal"); await review("revisi", f); load(); }),
                 btn("Tolak", "bg-red-600", async () => { const f = prompt("Alasan penolakan (opsional):"); if (f === null) throw new Error("batal"); await review("ditolak", f); load(); }));
    });
  }
  load().catch((e) => { console.error(e); tb.insertRow().insertCell().textContent = "Gagal memuat pengajuan."; });
}

/* ---------- 9. Rekap presensi ---------- */
function rekap() {
  const box = section("s-rekap", "Rekap presensi");
  const m = el("input", "in"); m.type = "month";
  const now = new Date(); m.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const out = el("div", "mt-4 overflow-x-auto"), bar = el("div", "flex gap-2 items-end");
  const wrap = el("div"); wrap.append(el("label", "", "Bulan"), m);
  let csvRows = [], label = "";
  bar.append(wrap, btn("Muat rekap", "bg-[#093C5D]", async () => {
    const [y, mo] = m.value.split("-").map(Number); label = m.value;
    const a = Timestamp.fromDate(new Date(y, mo - 1, 1)), b = Timestamp.fromDate(new Date(y, mo, 1));
    const [ss, at, us] = await Promise.all([
      getDocs(query(collection(db, "attendance_sessions"), where("createdAt", ">=", a), where("createdAt", "<", b), orderBy("createdAt"))),
      getDocs(query(collection(db, "attendance"), where("scannedAt", ">=", a), where("scannedAt", "<", b))),
      getDocs(collection(db, "users"))
    ]);
    const sessions = ss.docs.map((d) => ({ id: d.id, ...d.data() }));
    const present = new Map();
    at.forEach((d) => { const x = d.data(); if (!present.has(x.uid)) present.set(x.uid, new Set()); present.get(x.uid).add(x.sessionId); });
    const members = sortBy(us.docs.map((d) => ({ id: d.id, ...d.data() })).filter((u) => ["anggota", "bph"].includes(u.role)), (u) => (u.displayName || u.email).toLowerCase());
    const total = sessions.length;
    csvRows = [["Nama", "Email", ...sessions.map((s) => `${s.title} (${fmtDate(s.createdAt)})`), "Hadir", "Total sesi", "Persen"]];
    out.replaceChildren(el("p", "text-sm mb-2", `${total} sesi pada bulan ini, ${members.length} anggota.`));
    const t = el("table", "w-full text-sm"), tb = el("tbody"); t.append(tb);
    for (const u of members) {
      const set = present.get(u.id) || new Set(), n = sessions.filter((s) => set.has(s.id)).length, pct = total ? Math.round((n / total) * 100) : 0;
      csvRows.push([u.displayName || "", u.email, ...sessions.map((s) => (set.has(s.id) ? 1 : 0)), n, total, pct + "%"]);
      const tr = tb.insertRow(); tr.insertCell().textContent = u.displayName || u.email;
      tr.insertCell().textContent = `${n}/${total}`;
      const bc = tr.insertCell(); const bar2 = el("div", "h-2 rounded bg-slate-200 w-32"); const fill = el("div", "h-2 rounded bg-[#093C5D]"); fill.style.width = pct + "%"; bar2.append(fill); bc.append(bar2);
      tr.insertCell().textContent = pct + "%";
    }
    out.append(t);
  }), btn("Unduh CSV (Excel)", "bg-green-600", async () => { if (!csvRows.length) throw new Error("Muat rekap dulu."); downloadFile(`rekap-presensi-${label}.csv`, toCsv(csvRows)); }));
  box.append(el("h2", "font-semibold mb-1", "Rekap presensi bulanan"), el("p", "text-xs text-slate-500 mb-3", "Dihitung hanya saat tombol ditekan, supaya hemat kuota baca database."), bar, out);
}

/* ---------- 10. Cadangan data ---------- */
function backup() {
  const box = section("s-backup", "Cadangan");
  const COLS = ["users", "pengurus", "timeline", "publications", "karya_ilmiah", "materi_larut", "kegiatan", "registrations", "pengumuman", "submissions", "prestasi", "galeri", "shortlinks", "attendance_sessions", "attendance", "settings"];
  box.append(el("h2", "font-semibold mb-1", "Cadangan data"), el("p", "text-xs text-slate-500 mb-3", "Unduh semua data teks sebagai JSON (gambar kecil tidak ikut). Cukup sebulan sekali, karena setiap dokumen dihitung sebagai 1 bacaan."),
    btn("Unduh cadangan JSON", "bg-[#093C5D]", async () => {
      const all = {};
      for (const c of COLS) { const snap = await getDocs(collection(db, c)); all[c] = snap.docs.map((d) => ({ id: d.id, ...d.data() })); }
      const json = JSON.stringify(all, (k, v) => (v && typeof v.toDate === "function" ? v.toDate().toISOString() : typeof v === "string" && v.startsWith("data:image") ? "(gambar tidak disertakan)" : v), 2);
      downloadFile(`cadangan-liba-${new Date().toISOString().slice(0, 10)}.json`, json, "application/json");
    }));
}

export function initOrg() {
  const run = (fn) => Promise.resolve().then(fn).catch((e) => console.error(fn.name, e));
  [pengumuman, kegiatan, simpleCruds, anggota, pengajuan, rekap, backup].forEach(run);
}
