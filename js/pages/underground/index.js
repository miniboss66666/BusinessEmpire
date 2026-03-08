// @ts-nocheck
/* UNDERGROUND/INDEX.JS — Main page + Suspicion system */

// Helper toàn cục để các sub-module access state
function _ug() {
  if (!STATE.underground) STATE.underground = {
    dirtyMoney: 0,
    suspicion: 0,       // 0→100%
    isWashing: false,
    lockedUntil: 0,
    hack: null, plant: null, printer: null, laundry: null,
  };
  return STATE.underground;
}

// ── Suspicion system ─────────────────────────
const UGSuspicion = (() => {
  let _washing = false;

  function get() { return _ug().suspicion || 0; }
  function add(pct) {
    const u = _ug();
    u.suspicion = Math.min(100, (u.suspicion || 0) + pct);
    if (u.suspicion >= 100) _arrest();
  }
  function setWashing(v) { _washing = v; _ug().isWashing = v; }

  function tick() {
    const u = _ug();
    if (!u.isWashing && u.suspicion > 0) {
      u.suspicion = Math.max(0, u.suspicion - (1 / 120)); // -1%/2 phút
    }
    // Check arrest
    if (u.suspicion >= 100) _arrest();
  }

  function _arrest() {
    const u = _ug();
    const lost = u.dirtyMoney || 0;
    const lockMins = Math.min(1440, 30 * Math.pow(2, Math.floor(u.suspicion / 25)));
    u.dirtyMoney = 0;
    u.suspicion = 0;
    u.lockedUntil = Date.now() + lockMins * 60 * 1000;
    UI.toast(`🚔 BỊ BẮT! Mất ${Format.money(lost)} tiền bẩn · Bị khóa ${lockMins} phút!`, 'error');
  }

  return { get, add, setWashing, tick };
})();

// ── Main page ────────────────────────────────
const UndergroundPage = (() => {

  let currentTab = 'sources'; // 'sources' | 'laundry'

  function init() { render(); }

  function render() {
    const page = document.getElementById('page-underground');
    if (!page) return;
    page.innerHTML = renderHTML();
    bindEvents();
  }

  function renderHTML() {
    const u = _ug();
    const locked = u.lockedUntil > Date.now();
    const lockLeft = locked ? Math.ceil((u.lockedUntil - Date.now()) / 60000) : 0;
    const susp = UGSuspicion.get();
    const suspColor = susp < 30 ? 'var(--green)' : susp < 60 ? '#f4a030' : 'var(--red)';

    return `
      <div class="ug-wrap">
        <!-- Header: suspicion bar -->
        <div class="ug-header">
          <div class="ug-header-row">
            <span class="ug-title">🌑 UNDERGROUND</span>
            <span class="ug-dirty-money">💰 ${Format.money(u.dirtyMoney || 0)} bẩn</span>
          </div>
          <div class="ug-susp-row">
            <span class="ug-susp-label">🔴 Nghi Vấn</span>
            <div class="ug-susp-bar-wrap">
              <div class="ug-susp-bar" style="width:${susp.toFixed(1)}%;background:${suspColor}"></div>
            </div>
            <span class="ug-susp-val" style="color:${suspColor}">${susp.toFixed(1)}%</span>
          </div>
          ${u.isWashing ? `<div class="ug-washing-warn">⚠️ Đang rửa tiền — nghi vấn không giảm</div>` : ''}
        </div>

        <!-- Locked overlay -->
        ${locked ? `
        <div class="ug-locked">
          🚔 BỊ KHÓA
          <div style="font-size:0.7rem;margin-top:6px">Còn ${lockLeft} phút</div>
          <div style="font-size:0.62rem;color:var(--text-dim);margin-top:4px">Cảnh sát đang theo dõi</div>
        </div>` : `

        <!-- Tabs -->
        <div class="stock-tabs">
          <button class="stock-tab ${currentTab==='sources'?'active':''}" data-tab="sources">⚡ Kiếm Tiền Bẩn</button>
          <button class="stock-tab ${currentTab==='laundry'?'active':''}" data-tab="laundry">🧺 Rửa Tiền</button>
        </div>

        <!-- Content -->
        <div class="ug-content">
          ${currentTab === 'sources' ? `
            <div id="ug-hack-section">${UGHack.renderHTML()}</div>
            <div id="ug-plant-section">${UGPlant.renderHTML()}</div>
            <div id="ug-printer-section">${UGPrinter.renderHTML()}</div>
            <div class="ug-section ug-coming-soon">
              <div style="font-size:2rem">❓</div>
              <div style="font-size:0.75rem;color:var(--gold);margin-top:6px">Coming Soon</div>
            </div>
          ` : `
            <div id="ug-laundry-section">${UGLaundry.renderHTML()}</div>
          `}
        </div>`}
      </div>`;
  }

  function bindEvents() {
    document.querySelectorAll('.stock-tab[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentTab = btn.dataset.tab;
        render();
      });
    });
    UGHack.bindEvents();
    UGPlant.bindEvents();
    UGPrinter.bindEvents();
    UGLaundry.bindEvents();
  }

  function tick() {
    UGSuspicion.tick();
    UGPrinter.tick();
    UGLaundry.tick();
    // Realtime suspicion bar update (không re-render toàn trang)
    const susp = UGSuspicion.get();
    const bar = document.querySelector('.ug-susp-bar');
    const val = document.querySelector('.ug-susp-val');
    const color = susp < 30 ? 'var(--green)' : susp < 60 ? '#f4a030' : 'var(--red)';
    if (bar) { bar.style.width = susp.toFixed(1) + '%'; bar.style.background = color; }
    if (val) { val.textContent = susp.toFixed(1) + '%'; val.style.color = color; }
    // Update dirty money display
    const dm = document.querySelector('.ug-dirty-money');
    if (dm) dm.textContent = '💰 ' + Format.money(_ug().dirtyMoney || 0) + ' bẩn';
  }

  return { init, render, tick };
})();