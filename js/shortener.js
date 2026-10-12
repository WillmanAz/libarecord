import { db } from "./firebase-config.js";
import { doc, getDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const msg = document.getElementById("msg");
const parts = location.pathname.split("/").filter(Boolean);
const slug = parts.length >= 2 && parts[parts.length - 2] === "s" ? parts[parts.length - 1].toLowerCase() : null;

try {
  if (!slug || !/^[a-z0-9-]{3,40}$/.test(slug)) throw new Error("slug");
  const ref = doc(db, "shortlinks", slug);
  const snap = await getDoc(ref);
  const url = snap.exists() ? snap.data().targetUrl : null;
  if (!url || !/^https?:\/\//i.test(url)) throw new Error("not-found");
  await updateDoc(ref, { clicks: increment(1) }).catch(() => {}); // counter, gagal pun tidak masalah
  location.replace(url);
} catch (e) {
  msg.textContent = slug ? "Tautan tidak ditemukan atau sudah dihapus." : "Halaman tidak ditemukan.";
}
