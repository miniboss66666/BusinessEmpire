/* ============================================
   UI.JS - Modal, HUD, toast, helpers
   ============================================ */

const UI = (() => {

  // ============================================
  // Modal
  // ============================================
  function showModal(html) {
    document.getElementById('modal-box').innerHTML = html;
    document.getElementById('modal-overlay').classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-box').innerHTML = '';
  }

  function initModal() {
    // Click overlay để đóng
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('modal-overlay')) closeModal();
    });
  }

  // ============================================
  // HUD update (balance + income)
  // Được gọi mỗi tick từ engine
  // ============================================
  function updateHUD() {
    // Balance trên card
    const balanceEl = document.getElementById('hud-balance');
    if (balanceEl) balanceEl.textContent = Format.money(STATE.balance);

    // Income/phút
    const incomeEl = document.getElementById('hud-income');
    if (incomeEl) incomeEl.textContent = Format.money(STATE.incomePerMin) + '/phút';
  }

  // ============================================
  // Toast notification
  // ============================================
  function toast(msg, type = 'info', duration = 2500) {
    const el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.textContent = msg;

    const colors = {
      info:    'var(--accent)',
      success: 'var(--green)',
      error:   'var(--red)',
      warn:    'var(--gold)',
    };

    Object.assign(el.style, {
      position: 'fixed',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--bg2)',
      border: `1px solid ${colors[type] || colors.info}`,
      color: colors[type] || colors.info,
      padding: '10px 20px',
      borderRadius: '8px',
      fontFamily: "'Barlow', sans-serif",
      fontWeight: '600',
      fontSize: '0.85rem',
      zIndex: '1000',
      whiteSpace: 'nowrap',
      boxShadow: 'var(--shadow)',
      animation: 'fadeInUp 0.3s ease',
    });

    document.body.appendChild(el);
    setTimeout(() => el.remove(), duration);
  }

  // ============================================
  // Theme toggle
  // ============================================
  function setTheme(theme) {
    STATE.settings.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
  }

  function toggleTheme() {
    const next = STATE.settings.theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }

  // ============================================
  // Init
  // ============================================
  function init() {
    initModal();
    setTheme(STATE.settings.theme);
  }

  return {
    showModal,
    closeModal,
    updateHUD,
    toast,
    setTheme,
    toggleTheme,
    init,
  };

})();