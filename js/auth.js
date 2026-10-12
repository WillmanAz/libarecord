import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const ACCESS = {
  public:  null,
  auth:    ["pending", "anggota", "bph", "rejected"],
  anggota: ["anggota", "bph"],
  bph:     ["bph"]
};
const HOME_BY_ROLE = { bph: "admin.html", anggota: "portal.html", pending: "pending.html", rejected: "pending.html" };
const PAGE_LEVEL = { "arsip.html": "anggota", "presensi.html": "anggota", "portal.html": "anggota", "akun.html": "anggota", "admin.html": "bph", "admin-organisasi.html": "bph" };

function safeNext(raw) { return /^[a-z0-9_-]+\.html$/i.test(raw || "") ? raw : null; }
function canAccess(role, page) {
  const level = PAGE_LEVEL[page] || "public";
  return level === "public" || ACCESS[level].includes(role);
}

async function ensureUserDoc(user, displayName) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();
  const data = {
    uid: user.uid,
    email: user.email,
    displayName: displayName || user.displayName || user.email.split("@")[0],
    role: "pending",
    createdAt: serverTimestamp()
  };
  await setDoc(ref, data);
  return { ...data, role: "pending" };
}

export async function getRole(user) {
  return (await ensureUserDoc(user)).role || "pending";
}

export async function register(name, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await ensureUserDoc(cred.user, name);
  location.href = "pending.html";
}

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const role = await getRole(cred.user);
  const next = safeNext(new URLSearchParams(location.search).get("next"));
  location.href = next && canAccess(role, next) ? next : (HOME_BY_ROLE[role] || "pending.html");
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function logout() {
  await signOut(auth);
  location.href = "index.html";
}

// Middleware: panggil di halaman privat. Halaman disembunyikan sampai lolos cek.
export function guardPage(level = document.body.dataset.access || "public") {
  return new Promise((resolve) => {
    const reveal = () => (document.documentElement.style.visibility = "visible");
    if (level === "public") { reveal(); return resolve(null); }

    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub();
      if (!user) {
        const page = location.pathname.split("/").pop() || "index.html";
        return location.replace(`login.html?next=${encodeURIComponent(page)}`);
      }
      let role;
      try { role = await getRole(user); }
      catch (e) { console.error(e); return location.replace("login.html"); }

      if (!ACCESS[level].includes(role)) {
        return location.replace(["pending", "rejected"].includes(role) ? "pending.html" : "index.html");
      }
      reveal();
      resolve({ user, role });
    });
  });
}

// Nav dinamis: <a data-auth="guest|member|bph">
export function initNavState() {
  onAuthStateChanged(auth, async (user) => {
    const role = user ? await getRole(user).catch(() => "pending") : "guest";
    document.querySelectorAll("[data-auth]").forEach((el) => {
      const t = el.dataset.auth;
      const show = (t === "guest" && role === "guest")
        || (t === "member" && ["anggota", "bph"].includes(role))
        || (t === "bph" && role === "bph");
      el.style.display = show ? "" : "none";
    });
  });
}
