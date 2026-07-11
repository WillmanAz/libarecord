/* ==========================================================================
   Open Recruitment — Halaman Verifikasi (index.html) — script.js
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById('verifyForm');
  const nisInput = document.getElementById('nis');
  const kodeInput = document.getElementById('kode');

  const fieldNis = document.getElementById('field-nis');
  const fieldKode = document.getElementById('field-kode');

  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  const progressFill = document.getElementById('progressFill');
  const submitBtn = document.getElementById('submitBtn');

  function setFieldError(fieldEl, hasError) {
    fieldEl.classList.toggle('has-error', hasError);
  }

  function validate() {
    const nisVal = nisInput.value.trim();
    const kodeVal = kodeInput.value.trim();

    // NIS wajib diisi & hanya angka
    const nisValid = nisVal.length > 0 && /^[0-9]+$/.test(nisVal);
    setFieldError(fieldNis, !nisValid);

    // Kode pendaftaran wajib diisi
    const kodeValid = kodeVal.length > 0;
    setFieldError(fieldKode, !kodeValid);

    return nisValid && kodeValid;
  }

  // Hapus tanda error saat user mulai mengetik ulang
  nisInput.addEventListener('input', () => setFieldError(fieldNis, false));
  kodeInput.addEventListener('input', () => setFieldError(fieldKode, false));

  function showLoadingOverlay() {
    loadingOverlay.classList.add('show');

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      progressFill.style.width = progress + '%';
    }, 150);

    return interval;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validate()) return;

    submitBtn.disabled = true;
    loadingText.textContent = 'Sedang memverifikasi data peserta...';
    showLoadingOverlay();

    const nis = encodeURIComponent(nisInput.value.trim());
    const kode = encodeURIComponent(kodeInput.value.trim());

    // Beri jeda singkat agar animasi loading terlihat sebelum redirect
    setTimeout(() => {
      window.location.href = `hasil.html?nis=${nis}&kode=${kode}`;
    }, 900);
  });

});