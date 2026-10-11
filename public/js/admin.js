import { auth, db } from "./firebase-config.js";
import {
  collection, query, where, orderBy, limit, getDocs, getDoc, doc,
  addDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const isHttp = (u) => /^https?:\/\/\S+$/i.test(u);

function btn(label, color, handler) {
  const b = el("button", `${color} text-white px-3 py-1 rounded text-sm`, label);
  b.addEventListener("click", async () => {
    b.disabled = true;
    try { await handler(); } catch (e) { alert("Gagal: " + e.message); b.disabled = false; }
  });
  return b;
}
function emptyRow(tbody, cols, msg) {
  const td = tbody.insertRow().insertCell();
  td.colSpan = cols; td.className = "p-4 text-center text-gray-500"; td.textContent = msg;
}

/* ===== 1. Verifikasi anggota ===== */
export async function loadPendingMembers() {
  const snap = await getDocs(query(collection(db, "users"), where("role", "==", "pending")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}
export async function setMemberRole(uid, role) {
  await updateDoc(doc(db, "users", uid), { role, verifiedAt: serverTimestamp(), verifiedBy: auth.currentUser.uid });
}
export const verifyMember = (uid) => setMemberRole(uid, "anggota");
export const rejectMember = (uid) => setMemberRole(uid, "rejected");

async function renderPending() {
  const tbody = $("pending-body");
  tbody.replaceChildren();
  const members = await loadPendingMembers();
  if (!members.length) return emptyRow(tbody, 3, "Tidak ada pendaftar yang menunggu verifikasi.");
  for (const m of members) {
    const tr = tbody.insertRow();
    tr.insertCell().textContent = m.displayName || "-";
    tr.insertCell().textContent = m.email;
    const a = tr.insertCell(); a.className = "flex gap-2 p-2";
    a.append(
      btn("Verifikasi", "bg-green-600", async () => { await verifyMember(m.id); tr.remove(); }),
      btn("Tolak", "bg-red-600", async () => { await rejectMember(m.id); tr.remove(); })
    );
  }
}

/* ===== 2. Press release ===== */
async function renderPress() {
  const tbody = $("press-body");
  tbody.replaceChildren();
  const snap = await getDocs(query(collection(db, "publications"), orderBy("createdAt", "desc"), limit(20)));
  if (snap.empty) return emptyRow(tbody, 2, "Belum ada press release.");
  snap.forEach((d) => {
    const tr = tbody.insertRow();
    tr.insertCell().textContent = d.data().title;
    const a = tr.insertCell(); a.className = "p-2";
    a.append(btn("Hapus", "bg-red-600", async () => {
      if (!confirm("Hapus press release ini?")) throw new Error("dibatalkan");
      await deleteDoc(d.ref); tr.remove();
    }));
  });
}
function wirePress() {
  $("press-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    await addDoc(collection(db, "publications"), {
      title: f.title.value.trim(), excerpt: f.excerpt.value.trim(), content: f.content.value.trim(),
      coverUrl: isHttp(f.coverUrl.value.trim()) ? f.coverUrl.value.trim() : "",
      createdAt: serverTimestamp(), createdBy: auth.currentUser.uid
    });
    f.reset(); renderPress();
  });
}

/* ===== 3. Karya ilmiah (simpan link file) ===== */
function wireKarya() {
  $("karya-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    if (!isHttp(f.fileUrl.value.trim())) return alert("Link file harus diawali http(s)://");
    await addDoc(collection(db, "karya_ilmiah"), {
      title: f.title.value.trim(),
      authors: f.authors.value.split(",").map((s) => s.trim()).filter(Boolean),
      year: Number(f.year.value), category: f.category.value.trim(),
      abstract: f.abstract.value.trim(), fileUrl: f.fileUrl.value.trim(),
      createdAt: serverTimestamp(), createdBy: auth.currentUser.uid
    });
    f.reset(); alert("Karya ilmiah tersimpan.");
  });
}

/* ===== 4. URL pendek ===== */
const randSlug = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => "abcdefghijkmnpqrstuvwxyz23456789"[b % 32]).join("");
function wireShort() {
  $("short-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const url = f.targetUrl.value.trim();
    const slug = (f.slug.value.trim() || randSlug()).toLowerCase();
    if (!isHttp(url)) return alert("URL tujuan harus diawali http(s)://");
    if (!/^[a-z0-9-]{3,40}$/.test(slug)) return alert("Slug: huruf kecil, angka, tanda minus (3-40 karakter).");
    if ((await getDoc(doc(db, "shortlinks", slug))).exists()) return alert("Slug sudah dipakai.");
    await setDoc(doc(db, "shortlinks", slug), { targetUrl: url, clicks: 0, createdAt: serverTimestamp(), createdBy: auth.currentUser.uid });
    $("short-result").textContent = `${location.origin}/s/${slug}`;
    f.reset();
  });
}

/* ===== 5. QR presensi ===== */
const randToken = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join("");

async function renderSessions() {
  const tbody = $("sesi-body");
  tbody.replaceChildren();
  const snap = await getDocs(query(collection(db, "attendance_sessions"), orderBy("createdAt", "desc"), limit(10)));
  if (snap.empty) return emptyRow(tbody, 3, "Belum ada sesi presensi.");
  snap.forEach((d) => {
    const s = d.data();
    const live = s.active && s.expiresAt.toMillis() > Date.now();
    const tr = tbody.insertRow();
    tr.insertCell().textContent = s.title;
    tr.insertCell().textContent = live ? "Aktif" : "Ditutup";
    const a = tr.insertCell(); a.className = "flex gap-2 p-2";
    a.append(btn("Kehadiran", "bg-[#355872]", () => showAttendance(d.id, s.title)));
    if (live) {
      a.append(btn("Tutup", "bg-red-600", async () => { await updateDoc(d.ref, { active: false }); renderSessions(); }));
      a.append(btn("Tampilkan QR", "bg-[#093C5D]", async () => showQr(d.id, s.token, s.title)));
    }
  });
}
function showQr(id, token, title) {
  const box = $("qr-box");
  box.replaceChildren();
  new QRCode(box, { text: `LIBA|${id}|${token}`, width: 240, height: 240 });
  $("qr-title").textContent = title;
}
async function showAttendance(sid, title) {
  const [att, users] = await Promise.all([
    getDocs(query(collection(db, "attendance"), where("sessionId", "==", sid))),
    getDocs(collection(db, "users"))
  ]);
  const names = Object.fromEntries(users.docs.map((u) => [u.id, u.data().displayName || u.data().email]));
  $("hadir-title").textContent = `${title}: ${att.size} hadir`;
  const ul = $("hadir-list"); ul.replaceChildren();
  att.forEach((d) => ul.append(el("li", "", names[d.data().uid] || d.data().uid)));
}
function wireQr() {
  $("qr-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const token = randToken();
    const ref = await addDoc(collection(db, "attendance_sessions"), {
      title: f.title.value.trim(), token, active: true,
      expiresAt: Timestamp.fromMillis(Date.now() + Number(f.minutes.value) * 60000),
      createdAt: serverTimestamp(), createdBy: auth.currentUser.uid
    });
    showQr(ref.id, token, f.title.value.trim());
    f.reset(); renderSessions();
  });
}

export function initAdmin() {
  wirePress(); wireKarya(); wireShort(); wireQr();
  renderPending(); renderPress(); renderSessions();
}
