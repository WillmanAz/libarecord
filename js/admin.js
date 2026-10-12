import { auth, db } from "./firebase-config.js";
import {
  collection, query, where, orderBy, limit, getDocs, getDoc, doc,
  addDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { resetPassword } from "./auth.js";
import { getKaryaOptions, saveKaryaOptions } from "./options.js";
import { mountCrud, compressImage } from "./crud.js";

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const isHttp = (u) => /^https?:\/\/\S+$/i.test(u);
const pad = (n) => String(n).padStart(2, "0");
const ymd = (ts) => { const d = ts.toDate(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const fromYmd = (v) => new Date(`${v}T12:00:00`);
const fmt = (ts) => ts ? ts.toDate().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";

function btn(label, color, handler) {
  const b = el("button", `${color} text-white px-3 py-1 rounded text-sm`, label);
  b.type = "button";
  b.addEventListener("click", async () => {
    b.disabled = true;
    try { await handler(); } catch (e) { if (e.message !== "batal") alert("Gagal: " + e.message); }
    b.disabled = false;
  });
  return b;
}
function emptyRow(tbody, cols, msg) {
  const td = tbody.insertRow().insertCell();
  td.colSpan = cols; td.className = "p-3 text-center text-gray-500"; td.textContent = msg;
}
const ask = (msg) => { if (!confirm(msg)) throw new Error("batal"); };

/* ===== Verifikasi anggota ===== */
export async function loadPendingMembers() {
  const snap = await getDocs(query(collection(db, "users"), where("role", "==", "pending")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}
export async function setMemberRole(uid, role) {
  await updateDoc(doc(db, "users", uid), { role, verifiedAt: serverTimestamp(), verifiedBy: auth.currentUser.uid });
}
export const verifyMember = (uid) => setMemberRole(uid, "anggota");
export const rejectMember = (uid) => setMemberRole(uid, "rejected");

async function renderPending() {
  const tbody = $("pending-body"); tbody.replaceChildren();
  const members = await loadPendingMembers();
  if (!members.length) return emptyRow(tbody, 3, "Tidak ada pendaftar yang menunggu verifikasi.");
  for (const m of members) {
    const tr = tbody.insertRow();
    tr.insertCell().textContent = m.displayName || "-";
    tr.insertCell().textContent = m.email;
    const a = tr.insertCell(); a.className = "flex gap-2 p-2";
    a.append(btn("Verifikasi", "bg-green-600", async () => { await verifyMember(m.id); tr.remove(); }),
             btn("Tolak", "bg-red-600", async () => { await rejectMember(m.id); tr.remove(); }));
  }
}

/* ===== Reset kata sandi ===== */
function wireReset() {
  $("reset-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim();
    try { await resetPassword(email); alert("Jika email terdaftar, tautan reset kata sandi sudah dikirim ke " + email + ". Minta anggota cek folder Spam."); e.target.reset(); }
    catch (err) { alert("Gagal: " + err.message); }
  });
}

/* ===== Press release (tambah / edit / hapus) ===== */
let editId = null;
function resetPressForm() {
  editId = null;
  const f = $("press-form"); f.reset();
  f.publishedAt.value = ymd(Timestamp.now());
  $("press-mode").textContent = "Tulis press release baru";
  $("press-submit").textContent = "Terbitkan";
  $("press-cancel").classList.add("hidden");
  $("cover-preview").replaceChildren();
}
function startEdit(id, x) {
  editId = id;
  const f = $("press-form");
  f.title.value = x.title || ""; f.excerpt.value = x.excerpt || ""; f.content.value = x.content || "";
  f.publishedAt.value = ymd(x.publishedAt || x.createdAt || Timestamp.now());
  f.cover.value = ""; f.removeCover.checked = false;
  const prev = $("cover-preview"); prev.replaceChildren();
  const src = x.thumb || x.cover || x.coverUrl;
  if (src) { const i = el("img", "h-24 rounded"); i.src = src; i.alt = "Foto saat ini"; prev.append(i); }
  $("press-mode").textContent = "Mengedit: " + x.title;
  $("press-submit").textContent = "Simpan perubahan";
  $("press-cancel").classList.remove("hidden");
  f.scrollIntoView({ behavior: "smooth", block: "center" });
}
async function renderPress() {
  const tbody = $("press-body"); tbody.replaceChildren();
  const snap = await getDocs(query(collection(db, "publications"), orderBy("createdAt", "desc"), limit(30)));
  if (snap.empty) return emptyRow(tbody, 3, "Belum ada press release.");
  snap.forEach((d) => {
    const x = d.data();
    const tr = tbody.insertRow();
    tr.insertCell().textContent = x.title;
    tr.insertCell().textContent = fmt(x.publishedAt || x.createdAt);
    const a = tr.insertCell(); a.className = "flex gap-2 p-2";
    a.append(btn("Edit", "bg-[#355872]", async () => startEdit(d.id, x)),
             btn("Hapus", "bg-red-600", async () => { ask("Hapus press release ini?"); await deleteDoc(d.ref); await deleteDoc(doc(db, "publication_covers", d.id)).catch(() => {}); tr.remove(); }));
  });
}
function wirePress() {
  resetPressForm();
  $("press-cancel").addEventListener("click", resetPressForm);
  $("press-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, b = $("press-submit"); b.disabled = true;
    try {
      const data = {
        title: f.title.value.trim(), excerpt: f.excerpt.value.trim(), content: f.content.value.trim(),
        publishedAt: Timestamp.fromDate(fromYmd(f.publishedAt.value))
      };
      const file = f.cover.files[0], remove = f.removeCover.checked;
      let full = null;
      if (file) { data.thumb = await compressImage(file, 480, 28000); full = await compressImage(file, 900, 150000); data.cover = ""; data.coverUrl = ""; }
      else if (remove) { data.thumb = ""; data.cover = ""; data.coverUrl = ""; }
      let id = editId;
      if (editId) await updateDoc(doc(db, "publications", editId), { ...data, updatedAt: serverTimestamp() });
      else { const ref = await addDoc(collection(db, "publications"), { thumb: "", cover: "", ...data, createdAt: serverTimestamp(), createdBy: auth.currentUser.uid }); id = ref.id; }
      if (full) await setDoc(doc(db, "publication_covers", id), { data: full });
      else if (remove) await deleteDoc(doc(db, "publication_covers", id)).catch(() => {});
      resetPressForm(); renderPress();
    } catch (err) { alert("Gagal: " + err.message); }
    b.disabled = false;
  });
}

/* ===== Karya ilmiah (kategori/bidang) + materi latihan: tambah, EDIT, hapus ===== */
let opts, karyaCrud;
function renderChips(key) {
  const box = $("chips-" + key); box.replaceChildren();
  opts[key].forEach((v, i) => {
    const chip = el("span", "inline-flex items-center gap-1 bg-slate-100 rounded-full px-3 py-1 text-sm", v);
    const x = el("button", "text-red-600 font-bold ml-1", "\u00d7"); x.type = "button"; x.setAttribute("aria-label", "Hapus " + v);
    x.onclick = async () => { if (!confirm(`Hapus "${v}" dari pilihan? Karya lama tetap menyimpan labelnya.`)) return; opts[key].splice(i, 1); await saveKaryaOptions(opts); loadOptions(); };
    chip.append(x); box.append(chip);
  });
}
async function loadOptions() {
  opts = await getKaryaOptions();
  renderChips("kategori"); renderChips("bidang");
  if (karyaCrud) karyaCrud.refreshOptions();
}
function wireKarya() {
  for (const key of ["kategori", "bidang"]) {
    $("add-" + key).addEventListener("submit", async (e) => {
      e.preventDefault();
      const v = e.target.v.value.trim();
      if (!v || opts[key].includes(v)) return;
      opts[key].push(v); await saveKaryaOptions(opts); e.target.reset(); loadOptions();
    });
  }
  karyaCrud = mountCrud($("crud-karya"), {
    title: "Karya ilmiah", col: "karya_ilmiah", orderBy: ["createdAt", "desc"], max: 50,
    label: (x) => `${x.title} (${[x.year, x.category, x.bidang].filter(Boolean).join(" / ")})`,
    fields: [
      { name: "title", label: "Judul", required: true, full: true },
      { name: "authors", label: "Penulis (pisahkan dengan koma)", type: "list", required: true },
      { name: "year", label: "Tahun", type: "number", required: true },
      { name: "category", label: "Kategori", type: "select", optionsFn: async () => (await getKaryaOptions()).kategori },
      { name: "bidang", label: "Bidang", type: "select", optionsFn: async () => (await getKaryaOptions()).bidang },
      { name: "fileUrl", label: "Link file (Drive dll., https://...)", type: "url", required: true, full: true },
      { name: "abstract", label: "Abstrak", type: "textarea" }
    ]
  });
}
function wireMateri() {
  mountCrud($("crud-materi"), {
    title: "Materi latihan rutin (Larut)", col: "materi_larut", orderBy: ["date", "desc"], max: 50,
    label: (x) => `${x.hari || ""}, ${fmt(x.date)}: ${x.title}`,
    transform: (d) => ({ ...d, hari: d.date ? d.date.toDate().toLocaleDateString("id-ID", { weekday: "long" }) : "" }),
    fields: [
      { name: "date", label: "Tanggal pertemuan", type: "date", required: true },
      { name: "title", label: "Judul materi", required: true },
      { name: "fileUrl", label: "Link file materi (https://...)", type: "url", required: true, full: true },
      { name: "description", label: "Keterangan (opsional)", type: "textarea" }
    ]
  });
}

/* ===== URL pendek ===== */
const randSlug = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => "abcdefghijkmnpqrstuvwxyz23456789"[b % 32]).join("");
function wireShort() {
  $("short-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, url = f.targetUrl.value.trim(), slug = (f.slug.value.trim() || randSlug()).toLowerCase();
    if (!isHttp(url)) return alert("URL tujuan harus diawali http(s)://");
    if (!/^[a-z0-9-]{3,40}$/.test(slug)) return alert("Slug: huruf kecil, angka, tanda minus (3-40 karakter).");
    if ((await getDoc(doc(db, "shortlinks", slug))).exists()) return alert("Slug sudah dipakai.");
    await setDoc(doc(db, "shortlinks", slug), { targetUrl: url, clicks: 0, createdAt: serverTimestamp(), createdBy: auth.currentUser.uid });
    $("short-result").textContent = `${location.origin}/s/${slug}`; f.reset();
  });
}

/* ===== QR presensi ===== */
const randToken = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join("");
async function renderSessions() {
  const tbody = $("sesi-body"); tbody.replaceChildren();
  const snap = await getDocs(query(collection(db, "attendance_sessions"), orderBy("createdAt", "desc"), limit(10)));
  if (snap.empty) return emptyRow(tbody, 3, "Belum ada sesi presensi.");
  snap.forEach((d) => {
    const s = d.data(), live = s.active && s.expiresAt.toMillis() > Date.now(), tr = tbody.insertRow();
    tr.insertCell().textContent = s.title; tr.insertCell().textContent = live ? "Aktif" : "Ditutup";
    const a = tr.insertCell(); a.className = "flex flex-wrap gap-2 p-2";
    a.append(btn("Kehadiran", "bg-[#355872]", () => showAttendance(d.id, s.title)));
    if (live) {
      a.append(btn("Tutup", "bg-red-600", async () => { await updateDoc(d.ref, { active: false }); renderSessions(); }),
               btn("QR", "bg-[#093C5D]", async () => showQr(d.id, s.token, s.title)));
    }
  });
}
function showQr(id, token, title) {
  const box = $("qr-box"); box.replaceChildren();
  new QRCode(box, { text: `LIBA|${id}|${token}|${encodeURIComponent(title)}`, width: 280, height: 280, correctLevel: QRCode.CorrectLevel.M });
  $("qr-title").textContent = title;
}
async function showAttendance(sid, title) {
  const [att, users] = await Promise.all([getDocs(query(collection(db, "attendance"), where("sessionId", "==", sid))), getDocs(collection(db, "users"))]);
  const names = Object.fromEntries(users.docs.map((u) => [u.id, u.data().displayName || u.data().email]));
  $("hadir-title").textContent = `${title}: ${att.size} hadir`;
  const ul = $("hadir-list"); ul.replaceChildren();
  att.forEach((d) => ul.append(el("li", "", names[d.data().uid] || d.data().uid)));
}
function wireQr() {
  $("qr-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, token = randToken();
    const ref = await addDoc(collection(db, "attendance_sessions"), {
      title: f.title.value.trim(), token, active: true,
      expiresAt: Timestamp.fromMillis(Date.now() + Number(f.minutes.value) * 60000),
      createdAt: serverTimestamp(), createdBy: auth.currentUser.uid
    });
    showQr(ref.id, token, f.title.value.trim()); f.reset(); renderSessions();
  });
}

export function initAdmin() {
  wireReset(); wirePress(); wireKarya(); wireMateri(); wireShort(); wireQr();
  const safe = (fn) => fn().catch((e) => console.error(fn.name, e));
  [renderPending, renderPress, renderSessions, loadOptions].forEach(safe);
}
