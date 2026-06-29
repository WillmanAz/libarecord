/* =========================================================
   script.js — logika halaman index.html (Verifikasi Peserta)
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("verifyForm");
  const nisInput = document.getElementById("nis");
  const kodeInput = document.getElementById("kode");
  const submitBtn = document.getElementById("submitBtn");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const loadingText = document.getElementById("loadingText");
  const progressFill = document.getElementById("progressFill");

  const loadingMessages = [
    "Sedang memverifikasi data peserta...",
    "Mencocokkan NIS dan kode pendaftaran...",
    "Menyiapkan halaman hasil seleksi..."
  ];

  function setFieldError(fieldId, hasError) {
    const field = document.getElementById(fieldId);
    field.classList.toggle("has-error", hasError);
  }

  function validate() {
    let valid = true;

    const nisVal = nisInput.value.trim();
    const kodeVal = kodeInput.value.trim();

    const nisOk = /^[0-9]+$/.test(nisVal);
    if (!nisOk) {
      setFieldError("field-nis", true);
      valid = false;
    } else {
      setFieldError("field-nis", false);
    }

    const kodeOk = kodeVal.length > 0;
    if (!kodeOk) {
      setFieldError("field-kode", true);
      valid = false;
    } else {
      setFieldError("field-kode", false);
    }

    return valid;
  }

  function runLoadingSequence(onDone) {
    loadingOverlay.classList.add("show");
    submitBtn.disabled = true;

    const totalDuration = 2400 + Math.random() * 600; // 2.4 - 3s
    const startTime = performance.now();

    let msgIndex = 0;
    loadingText.textContent = loadingMessages[0];
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % loadingMessages.length;
      loadingText.textContent = loadingMessages[msgIndex];
    }, 800);

    function tick(now) {
      const elapsed = now - startTime;
      const pct = Math.min(100, (elapsed / totalDuration) * 100);
      progressFill.style.width = pct + "%";

      if (elapsed < totalDuration) {
        requestAnimationFrame(tick);
      } else {
        clearInterval(msgInterval);
        progressFill.style.width = "100%";
        setTimeout(onDone, 200);
      }
    }
    requestAnimationFrame(tick);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!validate()) return;

    const nis = encodeURIComponent(nisInput.value.trim());
    const kode = encodeURIComponent(kodeInput.value.trim());

    runLoadingSequence(() => {
      window.location.href = `hasil.html?nis=${nis}&kode=${kode}`;
    });
  });

  // Clear error state as user types
  [nisInput, kodeInput].forEach((input) => {
    input.addEventListener("input", () => {
      input.parentElement.classList.remove("has-error");
    });
  });
});
