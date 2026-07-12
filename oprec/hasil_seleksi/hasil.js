/* =========================================================
   hasil.js — logika halaman hasil.html
   ========================================================= */

(function () {
  // Ganti dengan URL Web App Apps Script kamu (Deploy → Manage deployments)
  const API_URL = "https://script.google.com/macros/s/AKfycbxyhA7E5u3fKO1eVteU5uo0qeNOaQ1BeAyr-KQ7NReh7ngmHr5YuMGN1VIk0zBSJAVLnw/exec";

  /**
   * Mencari data peserta lewat Google Apps Script (data disimpan di Google Sheet privat).
   * Server hanya mengembalikan 1 peserta yang cocok, bukan seluruh database.
   * @param {string} nis
   * @param {string} kode
   * @returns {Promise<object|null>}
   */
  async function findPeserta(nis, kode) {
    const url = `${API_URL}?nis=${encodeURIComponent(nis)}&kode=${encodeURIComponent(kode)}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.found ? data.peserta : null;
  }

  function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      nis: params.get("nis") || "",
      kode: params.get("kode") || ""
    };
  }


  function show(el) { el.style.display = ""; }
  function hide(el) { el.style.display = "none"; }

  function renderNotFound() {
    hide(document.getElementById("loadingState"));
    show(document.getElementById("notFoundState"));
  }

  function fireConfetti() {
    if (typeof confetti !== "function") return;
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors: ["#c9a227", "#0a1f3d", "#ffffff", "#d9b94f"]
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        colors: ["#c9a227", "#0a1f3d", "#ffffff", "#d9b94f"]
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }

  function renderResult(peserta) {
    hide(document.getElementById("loadingState"));

    const resultCard = document.getElementById("resultCard");
    const isLolos = peserta.status === "LOLOS";

    const statusBanner = document.getElementById("statusBanner");
    const statusTitle = document.getElementById("statusTitle");
    const statusPill = document.getElementById("statusPill");
    const resultDesc = document.getElementById("resultDesc");

    statusBanner.classList.add(isLolos ? "lolos" : "gagal");
    statusTitle.textContent = isLolos ? "SELAMAT" : "TERIMA KASIH";
    statusPill.classList.add(isLolos ? "lolos" : "gagal");
    statusPill.textContent = isLolos ? "L O L O S" : "BELUM LOLOS";

    resultDesc.innerHTML = isLolos
      ? `Berdasarkan hasil seleksi yang telah dilakukan oleh Panitia Open Recruitment KIR Ulil Albab (KIR LIBA) 2026/2027, peserta dengan identitas berikut dinyatakan <b>LOLOS</b> seleksi Open Recruitment KIR LIBA 2026.`
      : `Berdasarkan hasil seleksi yang telah dilakukan oleh Panitia Open Recruitment KIR Ulil Albab (KIR LIBA) 2026/2027, peserta dengan identitas berikut <b>belum dinyatakan lolos</b> pada seleksi tahun ini.`;

    document.getElementById("dataNama").textContent = peserta.nama;
    document.getElementById("dataNis").textContent = peserta.nis;
    document.getElementById("dataKode").textContent = peserta.kode;
    document.getElementById("dataNoReg").textContent = peserta.noRegistrasi;
    document.getElementById("dataTanggal").textContent = peserta.tanggalPengumuman;

    const dataStatusEl = document.getElementById("dataStatus");
    dataStatusEl.textContent = isLolos ? "LOLOS" : "BELUM LOLOS";
    dataStatusEl.classList.add(isLolos ? "status-lolos" : "status-gagal");

    if (isLolos) {
      show(document.getElementById("qrSection"));
      hide(document.getElementById("motivationBox"));
      show(document.getElementById("linkgrup"));

      const qrPayload = JSON.stringify({
        nama: peserta.nama,
        nis: peserta.nis,
        kode: peserta.kode,
        status: peserta.status,
        noRegistrasi: peserta.noRegistrasi
      });

      // eslint-disable-next-line no-undef
      new QRCode(document.getElementById("qrcode"), {
        text: qrPayload,
        width: 160,
        height: 160,
        colorDark: "#0a1f3d",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });
    } else {
      hide(document.getElementById("qrSection"));
      hide(document.getElementById("linkgrup"));
      hide(document.getElementById("printBtn"));
      show(document.getElementById("motivationBox"));
    }

    show(resultCard);
    resultCard.classList.add("result-card-enter");

    if (isLolos) {
      setTimeout(fireConfetti, 250);
    }

    setupActions(peserta, isLolos);
  }

  function setupActions(peserta, isLolos) {
    const printBtn = document.getElementById("printBtn");
    const downloadBtn = document.getElementById("downloadPdfBtn");

    printBtn.addEventListener("click", () => window.print());

    if (!isLolos) {
      // Tidak ada bukti kelulusan untuk peserta yang belum lolos
      downloadBtn.style.display = "none";
      return;
    }

    downloadBtn.addEventListener("click", () => generatePdf(peserta));
  }

  function generatePdf(peserta) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const navy = [10, 31, 61];
    const gold = [201, 162, 39];
    const gray = [120, 130, 150];

    // Header band
    doc.setFillColor(...navy);
    doc.rect(0, 0, pageWidth, 90, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("KIR Ulil Albab (KIR LIBA)", pageWidth / 2, 38, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Open Recruitment KIR Ulil Albab (KIR LIBA) 2026", pageWidth / 2, 58, { align: "center" });

    doc.setDrawColor(...gold);
    doc.setLineWidth(2);
    doc.line(pageWidth / 2 - 40, 70, pageWidth / 2 + 40, 70);

    // Title
    doc.setTextColor(...navy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("BUKTI KELULUSAN SELEKSI", pageWidth / 2, 130, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...gray);
    doc.text(
      "Dokumen ini menyatakan bahwa peserta berikut telah dinyatakan LOLOS",
      pageWidth / 2,
      148,
      { align: "center" }
    );
    doc.text(
      "dalam seleksi Open Recruitment KIR Ulil Albab (KIR LIBA) 2026.",
      pageWidth / 2,
      161,
      { align: "center" }
    );

    // Data box
    const boxX = 70;
    const boxY = 185;
    const boxW = pageWidth - 140;
    const boxH = 160;

    doc.setDrawColor(220, 224, 230);
    doc.setLineWidth(1);
    doc.roundedRect(boxX, boxY, boxW, boxH, 8, 8);

    const rows = [
      ["Nama", peserta.nama],
      ["NIS", peserta.nis],
      ["Kode Pendaftaran", peserta.kode],
      ["Nomor Registrasi", peserta.noRegistrasi],
      ["Status", "LOLOS"],
      ["Tanggal Pengumuman", peserta.tanggalPengumuman]
    ];

    let rowY = boxY + 28;
    doc.setFontSize(11);
    rows.forEach(([label, value]) => {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...gray);
      doc.text(label, boxX + 24, rowY);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(...navy);
      const isStatus = label === "Status";
      if (isStatus) doc.setTextColor(31, 122, 77);
      doc.text(String(value), boxX + 200, rowY);

      rowY += 22;
    });

    // QR code image
    const qrCanvas = document.querySelector("#qrcode canvas");
    if (qrCanvas) {
      const qrDataUrl = qrCanvas.toDataURL("image/png");
      const qrSize = 110;
      const qrX = pageWidth / 2 - qrSize / 2;
      const qrY = boxY + boxH + 30;
      doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(...gray);
      doc.text(
        "QR Code ini merupakan bukti resmi kelulusan dan digunakan saat registrasi ulang.",
        pageWidth / 2,
        qrY + qrSize + 20,
        { align: "center" }
      );
    }

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...gray);
    doc.text(
      "Dokumen ini dihasilkan secara otomatis oleh Sistem Pengumuman Open Recruitment KIR Ulil Albab (KIR LIBA) 2026.",
      pageWidth / 2,
      pageHeight - 30,
      { align: "center" }
    );

    doc.save(`Bukti-Kelulusan-${peserta.nis}.pdf`);
  }

  // ===== Main flow =====
  document.addEventListener("DOMContentLoaded", async () => {
    const { nis, kode } = getQueryParams();

    if (!nis || !kode) {
      renderNotFound();
      return;
    }

    try {
      const peserta = await findPeserta(nis, kode);

      if (!peserta) {
        renderNotFound();
        return;
      }

      renderResult(peserta);
    } catch (err) {
      console.error("Gagal mengambil data peserta:", err);
      renderNotFound();
    }
  });
})();