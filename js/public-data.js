import { db } from "./firebase-config.js";
import { collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loadPress(container) {
  const snap = await getDocs(query(collection(db, "publications"), orderBy("createdAt", "desc"), limit(20)));
  container.replaceChildren();
  if (snap.empty) {
    const p = document.createElement("p");
    p.className = "text-white/80"; p.textContent = "Belum ada press release.";
    return container.append(p);
  }
  snap.forEach((d) => {
    const x = d.data();
    const card = document.createElement("article");
    card.className = "bg-white/90 rounded-xl p-6 shadow";
    const h = document.createElement("h2"); h.className = "text-xl font-semibold text-[#093C5D]"; h.textContent = x.title;
    const date = document.createElement("p"); date.className = "text-xs text-[#355872] mb-2";
    date.textContent = x.createdAt ? x.createdAt.toDate().toLocaleDateString("id-ID", { dateStyle: "long" }) : "";
    const body = document.createElement("p"); body.className = "text-[#355872] whitespace-pre-line"; body.textContent = x.content || x.excerpt;
    card.append(h, date, body);
    container.append(card);
  });
}
