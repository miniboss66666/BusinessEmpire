// @ts-nocheck
/* UNDERGROUND/PRINTER.JS — Máy In Tiền */

const UGPrinter = (() => {

  const MODELS = [
    { level:1, name:'Máy Cũ',        incomePerMin:200,    suspPerMin:0.05, price:0 },
    { level:2, name:'Máy HP',        incomePerMin:1000,   suspPerMin:0.08, price:10000 },
    { level:3, name:'Máy Công Nghiệp',incomePerMin:5000,  suspPerMin:0.12, price:80000 },
    { level:4, name:'Máy Siêu Tốc',  incomePerMin:25000,  suspPerMin:0.18, price:500000 },
    { level:5, name:'Máy Lượng Tử',  incomePerMin:200000, suspPerMin:0.25, price:5000000 },
  ];

  function _s() {
    const u = _ug();
    if (!u.printer) u.printer = { level:1, on:false };
    return u.printer;
  }

  function renderHTML() {
    const s = _s();
    const cur = MODELS[s.level - 1];
    const next = MODELS[s.level];

    return `
      <div class="ug-section">
        <div class="ug-section-title">🖨️ Máy In Tiền</div>
        <div class="printer-card ${s.on ? 'on' : 'off'}">
          <div class="printer-info">
            <div class="printer-name">${cur.name}</div>
            <div class="printer-stats">
              <span style="color:var(--green)">+${Format.money(cur.incomePerMin)}/phút</span>
              <span style="color:var(--red)">+${cur.suspPerMin}% nghi vấn/phút</span>
            </div>
          </div>
          <button class="printer-toggle-btn ${s.on?'stop':'start'}" id="btn-printer-toggle">
            ${s.on ? '⏹ TẮT' : '▶️ BẬT'}
          </button>
        </div>
        ${s.on ? `
        <div class="printer-running">
          <span class="printer-pulse">●</span> Đang in tiền...
        </div>` : ''}
        ${next ? `
        <button class="ug-upgrade-btn" id="btn-printer-upgrade"
                ${STATE.balance < next.price ? 'disabled' : ''}>
          ⬆️ Nâng lên ${next.name} — ${Format.money(next.price)}
        </button>` : `<div class="ug-maxed">👑 MAX LEVEL</div>`}
      </div>`;
  }

  function bindEvents() {
    document.getElementById('btn-printer-toggle')?.addEventListener('click', () => {
      const s = _s();
      s.on = !s.on;
      UI.toast(s.on ? '🖨️ Máy in bật!' : '⏹ Máy in tắt', s.on ? 'success' : 'error');
      _refresh();
    });
    document.getElementById('btn-printer-upgrade')?.addEventListener('click', () => {
      const s = _s();
      const next = MODELS[s.level];
      if (!next || STATE.balance < next.price) return;
      STATE.balance -= next.price;
      s.level++;
      UI.toast(`🖨️ Nâng cấp: ${MODELS[s.level-1].name}!`, 'success');
      _refresh();
    });
  }

  function tick() {
    const s = _s();
    if (!s.on) return;
    const cur = MODELS[s.level - 1];
    _ug().dirtyMoney = (_ug().dirtyMoney || 0) + cur.incomePerMin / 60;
    UGSuspicion.add(cur.suspPerMin / 60);
  }

  function _refresh() {
    const el = document.getElementById('ug-printer-section');
    if (el) { el.innerHTML = renderHTML(); bindEvents(); }
  }

  return { renderHTML, bindEvents, tick };
})();