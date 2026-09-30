const shareButton = document.querySelector('#sharePage');
const toast = document.querySelector('#shareToast');
const year = document.querySelector('#currentYear');

if (year) year.textContent = String(new Date().getFullYear());

let toastTimer;
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2400);
}

shareButton?.addEventListener('click', async () => {
  const shareData = {
    title: 'Casa Oito Del Mare · Búzios',
    text: 'Conheça a Casa Oito Del Mare, um refúgio à beira-mar em Búzios.',
    url: window.location.href
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(shareData.url);
    showToast('Link copiado para compartilhar.');
  } catch (error) {
    if (error?.name !== 'AbortError') showToast('Não foi possível compartilhar agora.');
  }
});
