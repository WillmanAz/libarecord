// Modul CRUD umum untuk dashboard admin (tambah / edit / hapus) + utilitas bersama.
import { auth, db } from "./firebase-config.js";
import {
  collection, query, orderBy, limit, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const $ = (id) => document.getElementById(id);
export const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
export const pad = (n) => String(n).padStart(2, "0");
export const ymd = (ts) => { const d = ts.toDate(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
export const fromYmd = (v) => new Date(`${v}T12:00:00`);
export const fmtDate = (ts) => ts ? ts.toDate().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";

export function btn(label, color, handler) {
  const b = el("button", `${color} text-white px-3 py-1 rounded text-sm`, label);
  b.type = "button";
  b.addEventListener("click", async () => {
    b.disabled = true;
    try { await handler(); } catch (e) { if (e.message !== "batal") alert("Gagal: " + e.message); }
    b.disabled = false;
  });
  return b;
}

export function downloadFile(name, text, type = "text/csv;charset=utf-8") {
  const a = el("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + text], { type })); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
export const toCsv = (rows) => rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");

// Kompres gambar di browser jadi JPEG kecil (teks), tanpa Storage.
export async function compressImage(file, maxW = 900, maxChars = 150000) {
  if (!file.type.startsWith("image/")) throw new Error("File harus berupa gambar.");
  const bmp = await createImageBitmap(file);
  let w = Math.min(maxW, bmp.width);
  for (let pass = 0; pass < 6; pass++) {
    const c = document.createElement("canvas");
    c.width = w; c.height = Math.round((bmp.height * w) / bmp.width);
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(bmp, 0, 0, c.width, c.height);
    for (let q = 0.8; q >= 0.45; q -= 0.1) { const out = c.toDataURL("image/jpeg", q); if (out.length <= maxChars) return out; }
    w = Math.round(w * 0.8);
  }
  throw new Error("Foto terlalu besar, pilih foto lain.");
}

/*
 cfg: { title, hint, col, orderBy:[field,dir], max, label:(x)=>string, extra:(doc,x)=>[buttons],
        transform:(data)=>data, fields:[{name,label,type,required,full,options|optionsFn,maxW,maxChars}] }
 type: text | url | number | textarea | date | select | checkbox | list | imgpath
*/
export function mountCrud(box, cfg) {
  let editId = null;
  const form = el("form", "grid sm:grid-cols-2 gap-3 mb-5");
  const inputs = {};
  for (const f of cfg.fields) {
    const wrap = el("div", f.full || f.type === "textarea" ? "sm:col-span-2" : "");
    wrap.append(el("label", "", f.label));
    let inp;
    if (f.type === "textarea") { inp = el("textarea", "in"); inp.rows = f.rows || 3; }
    else if (f.type === "select") inp = el("select", "in");
    else if (f.type === "checkbox") { inp = el("input"); inp.type = "checkbox"; }
    else { inp = el("input", "in"); inp.type = f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "url" ? "url" : "text"; }
    if (f.required) inp.required = true;
    wrap.append(inp); inputs[f.name] = inp;
    if (f.type === "imgpath") {
      const file = el("input", "in mt-1"); file.type = "file"; file.accept = "image/*"; wrap.append(file); inp._file = file;
      wrap.append(el("p", "text-xs text-slate-500", "Isi path/URL gambar, atau pilih file (otomatis dikecilkan). Isi tanda - untuk menghapus."));
    }
    form.append(wrap);
  }
  const submit = el("button", "btnp", "Simpan"); const cancel = el("button", "hidden border rounded-lg px-4", "Batal edit"); cancel.type = "button";
  const bar = el("div", "flex gap-2 sm:col-span-2"); bar.append(submit, cancel); form.append(bar);
  const mode = el("p", "text-xs text-slate-500 mb-3", cfg.hint || "");
  const tbody = el("tbody"); const table = el("table", "w-full text-sm"); table.append(tbody);
  box.append(el("h2", "font-semibold mb-1", cfg.title), mode, form, table);

  async function refreshOptions() {
    for (const f of cfg.fields) if (f.type === "select") {
      const list = f.optionsFn ? await f.optionsFn() : f.options, cur = inputs[f.name].value;
      inputs[f.name].replaceChildren();
      list.forEach((v) => { const o = el("option", "", v); o.value = v; inputs[f.name].append(o); });
      if (cur) inputs[f.name].value = cur;
    }
  }
  function reset() { editId = null; form.reset(); for (const f of cfg.fields) if (f.type === "imgpath") inputs[f.name]._orig = ""; submit.textContent = "Simpan"; cancel.classList.add("hidden"); }
  function fill(x) {
    for (const f of cfg.fields) {
      const i = inputs[f.name], v = x[f.name];
      if (f.type === "checkbox") i.checked = !!v;
      else if (f.type === "date") i.value = v ? ymd(v) : "";
      else if (f.type === "list") i.value = (v || []).join(", ");
      else if (f.type === "imgpath") { const isData = typeof v === "string" && v.startsWith("data:"); i._orig = isData ? v : ""; i.value = isData ? "" : (v || ""); i._file.value = ""; }
      else i.value = v ?? "";
    }
  }
  async function collect() {
    const d = {};
    for (const f of cfg.fields) {
      const i = inputs[f.name];
      if (f.type === "checkbox") d[f.name] = i.checked;
      else if (f.type === "number") d[f.name] = i.value === "" ? null : Number(i.value);
      else if (f.type === "date") d[f.name] = i.value ? Timestamp.fromDate(fromYmd(i.value)) : null;
      else if (f.type === "list") d[f.name] = i.value.split(",").map((s) => s.trim()).filter(Boolean);
      else if (f.type === "imgpath") {
        const file = i._file.files[0], t = i.value.trim();
        d[f.name] = file ? await compressImage(file, f.maxW || 320, f.maxChars || 40000) : t === "-" ? "" : t || i._orig || "";
      } else d[f.name] = i.value.trim();
    }
    return cfg.transform ? cfg.transform(d) : d;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); submit.disabled = true;
    try {
      const d = await collect();
      if (editId) await updateDoc(doc(db, cfg.col, editId), { ...d, updatedAt: serverTimestamp() });
      else await addDoc(collection(db, cfg.col), { ...d, createdAt: serverTimestamp(), createdBy: auth.currentUser.uid });
      reset(); await load();
    } catch (err) { alert("Gagal: " + err.message); }
    submit.disabled = false;
  });
  cancel.addEventListener("click", reset);

  async function load() {
    tbody.replaceChildren();
    const [fld, dir] = cfg.orderBy || ["createdAt", "desc"];
    const snap = await getDocs(query(collection(db, cfg.col), orderBy(fld, dir), limit(cfg.max || 100)));
    if (snap.empty) { const td = tbody.insertRow().insertCell(); td.className = "p-3 text-center text-gray-500"; td.textContent = "Belum ada data."; return; }
    snap.forEach((d) => {
      const x = d.data(), tr = tbody.insertRow();
      tr.insertCell().textContent = cfg.label(x);
      const a = tr.insertCell(); a.className = "p-2 flex flex-wrap gap-2 justify-end";
      (cfg.extra ? cfg.extra(d, x) : []).forEach((b) => a.append(b));
      a.append(btn("Edit", "bg-[#355872]", async () => { editId = d.id; fill(x); submit.textContent = "Simpan perubahan"; cancel.classList.remove("hidden"); form.scrollIntoView({ behavior: "smooth", block: "center" }); }),
               btn("Hapus", "bg-red-600", async () => { if (!confirm("Hapus data ini?")) throw new Error("batal"); await deleteDoc(d.ref); tr.remove(); }));
    });
  }
  refreshOptions().catch(console.error);
  load().catch((e) => { console.error(cfg.col, e); tbody.replaceChildren(); const td = tbody.insertRow().insertCell(); td.textContent = "Gagal memuat (cek rules / koneksi)."; });
  return { reload: load, refreshOptions };
}
