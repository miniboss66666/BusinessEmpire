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
  function updateBalance() {
    // Chỉ update balance — gọi mỗi click qua rAF
    const balanceEl = document.getElementById('hud-balance');
    if (balanceEl) balanceEl.textContent = Format.money(STATE.balance);
  }

  function updateHUD() {
    // Balance trên card
    updateBalance();

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

  function confirm(msg, onYes, onNo) {
    showModal(`
      <div style="padding:8px 0">
        <div style="font-size:0.8rem;font-weight:600;color:var(--text-bright);margin-bottom:16px;line-height:1.5">${msg}</div>
        <div style="display:flex;gap:8px">
          <button id="ui-confirm-yes" style="flex:1;padding:10px;background:var(--red);border:none;border-radius:9px;color:#fff;font-weight:700;font-size:0.72rem;cursor:pointer">XÁC NHẬN</button>
          <button id="ui-confirm-no" style="flex:1;padding:10px;background:var(--bg3);border:1px solid var(--border2);border-radius:9px;color:var(--text-dim);font-weight:700;font-size:0.72rem;cursor:pointer">HỦY</button>
        </div>
      </div>
    `);
    document.getElementById('ui-confirm-yes')?.addEventListener('click', () => { closeModal(); onYes && onYes(); });
    document.getElementById('ui-confirm-no')?.addEventListener('click',  () => { closeModal(); onNo  && onNo();  });
  }

  return {
    showModal,
    closeModal,
    updateBalance,
    updateHUD,
    toast,
    confirm,
    setTheme,
    toggleTheme,
    init,
  };

})();
