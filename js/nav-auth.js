// Menyisipkan menu portal ke navbar LAMA tanpa mengubah desainnya.
import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getRole, logout } from "./auth.js";

const desktop = document.querySelector("#nav-links");
const mobile = document.querySelector("#mobile-menu ul");

function addItem(label, href, onclick, variant) {
  for (const [list, cls] of [[desktop, "nav-link"], [mobile, "mobile-nav-link"]]) {
    if (!list) continue;
    const li = document.createElement("li");
    li.dataset.portal = "1";
    const a = document.createElement("a");
    a.className = cls;
    // class tombol hanya untuk hamburger; CSS-nya di-scope ke #mobile-menu
    if (variant && list === mobile) a.classList.add("nav-auth-btn", variant);
    a.textContent = label;
    a.href = href;
    if (onclick) a.addEventListener("click", (e) => { e.preventDefault(); onclick(); });
    li.append(a);
    list.append(li);
  }
}

function render(role) {
  document.querySelectorAll("[data-portal]").forEach((n) => n.remove());
  if (role === "guest") {
    addItem("Masuk", "login.html", null, "nav-auth-login");
  } else if (role === "pending" || role === "rejected") {
    addItem("Status akun", "pending.html", null, "nav-auth-portal");
    addItem("Keluar", "#", logout, "nav-auth-logout");
  } else {
    addItem("Portal", "portal.html", null, "nav-auth-portal");
    if (role === "bph") addItem("Admin", "admin.html", null, "nav-auth-portal");
    addItem("Keluar", "#", logout, "nav-auth-logout");
  }
}

onAuthStateChanged(auth, async (user) => {
  render(user ? await getRole(user).catch(() => "pending") : "guest");
});
