// Pilihan kategori & bidang karya ilmiah (bisa diubah admin, disimpan di settings/karya_options)
import { db } from "./firebase-config.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const DEFAULTS = {
  kategori: ["Karya Tulis Ilmiah", "Esai", "Artikel Jurnal", "Proposal Penelitian"],
  bidang: ["Sains", "Teknologi", "Sosial Humaniora", "Agama dan Budaya", "Lingkungan", "Kesehatan"]
};
const ref = () => doc(db, "settings", "karya_options");

export async function getKaryaOptions() {
  try {
    const s = await getDoc(ref());
    if (s.exists()) {
      const d = s.data();
      return { kategori: d.kategori || [...DEFAULTS.kategori], bidang: d.bidang || [...DEFAULTS.bidang] };
    }
  } catch (e) { console.warn("Opsi karya memakai bawaan", e); }
  return { kategori: [...DEFAULTS.kategori], bidang: [...DEFAULTS.bidang] };
}
export const saveKaryaOptions = (o) => setDoc(ref(), { kategori: o.kategori, bidang: o.bidang });
