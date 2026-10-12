import { guardPage } from "./auth.js";
import { db } from "./firebase-config.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const { user } = await guardPage("anggota");
const status = document.getElementById("status");
const retry = document.getElementById("retry");
const scanner = new Html5Qrcode("reader");

function say(msg, ok) {
  status.textContent = msg;
  status.className = "mt-4 text-center font-medium " + (ok ? "text-green-700" : "text-red-700");
}

async function onScan(text) {
  const [tag, sid, token, rawTitle] = text.split("|");
  const title = rawTitle ? decodeURIComponent(rawTitle) : "";
  if (tag !== "LIBA" || !/^[A-Za-z0-9]{10,40}$/.test(sid || "") || !token || !title) return say("QR ini bukan QR presensi LIBA.", false);
  await scanner.stop().catch(() => {});
  try {
    await setDoc(doc(db, "attendance", `${sid}_${user.uid}`), {
      sessionId: sid, uid: user.uid, title, token, scannedAt: serverTimestamp()
    });
    say("Presensi tercatat. Terima kasih!", true);
  } catch (e) {
    say("Presensi ditolak: QR kedaluwarsa, sesi ditutup, atau kamu sudah absen.", false);
    retry.classList.remove("hidden");
  }
}

function start() {
  retry.classList.add("hidden");
  say("Arahkan kamera ke QR presensi.", true);
  scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 240 }, onScan)
    .catch(() => say("Kamera tidak bisa dibuka. Izinkan akses kamera di browser.", false));
}
retry.addEventListener("click", start);
start();
