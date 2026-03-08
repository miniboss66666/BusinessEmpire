// @ts-nocheck
/* UNDERGROUND/HACK.JS — Thẻ Hack */

const UGHack = (() => {

  const UPGRADES = [
    { level:1, name:'Script Cơ Bản',   clickValue:100,   suspPerClick:0.1,  price:0 },
    { level:2, name:'Keylogger',        clickValue:500,   suspPerClick:0.08, price:5000 },
    { level:3, name:'Botnet Nhỏ',       clickValue:2000,  suspPerClick:0.06, price:25000 },
    { level:4, name:'Ransomware',       clickValue:10000, suspPerClick:0.04, price:150000 },
    { level:5, name:'Zero-Day Exploit', clickValue:50000, suspPerClick:0.02, price:1000000 },
  ];

  function _s() {
    const u = _ug();
    if (!u.hack) u.hack = { level:1, clicks:0, cooldown:0 };
    return u.hack;
  }

  function renderHTML() {
    const s = _s();
    const cur = UPGRADES[s.level - 1];
    const next = UPGRADES[s.level];
    const now = Date.now();
    const cdLeft = Math.max(0, s.cooldown - now);

    return `
      <div class="ug-section">
        <div class="ug-section-title">💻 Thẻ Hack</div>
        <div class="ug-hack-card">
          <div class="ug-hack-info">
            <span class="ug-hack-level">${cur.name}</span>
            <span class="ug-hack-val">+${Format.money(cur.clickValue)} tiền bẩn/click</span>
            <span style="color:var(--red);font-size:0.62rem">+${cur.suspPerClick}% nghi vấn/10 clicks</span>
          </div>
          <button class="ug-hack-btn ${cdLeft>0?'cooling':''}"
                  id="btn-hack-click" ${cdLeft>0?'disabled':''}>
            ${cdLeft>0 ? `⏳ ${(cdLeft/1000).toFixed(1)}s` : '💻 HACK'}
          </button>
        </div>
        <div class="ug-hack-progress">
          <div class="ug-hack-bar" style="width:${(s.clicks%10)*10}%"></div>
        </div>
        <div style="font-size:0.6rem;color:var(--text-dim);text-align:center">
          ${s.clicks%10}/10 clicks → +1% nghi vấn
        </div>
        ${next ? `
        <button class="ug-upgrade-btn" id="btn-hack-upgrade"
                ${STATE.balance < next.price ? 'disabled' : ''}>
          ⬆️ Nâng lên ${next.name} — ${Format.money(next.price)}
        </button>` : `<div class="ug-maxed">👑 MAX LEVEL</div>`}
      </div>`;
  }

  function bindEvents() {
    document.getElementById('btn-hack-click')?.addEventListener('click', () => {
      const s = _s();
      const cur = UPGRADES[s.level - 1];
      if (Date.now() < s.cooldown) return;
      s.cooldown = Date.now() + 800;
      s.clicks++;
      _ug().dirtyMoney = (_ug().dirtyMoney || 0) + cur.clickValue;
      if (s.clicks % 10 === 0) {
        UGSuspicion.add(cur.suspPerClick * 10);
        UI.toast('🚨 +' + (cur.suspPerClick*10).toFixed(1) + '% nghi vấn!', 'error');
      }
      _refreshSection();
      _startCd(s);
    });
    document.getElementById('btn-hack-upgrade')?.addEventListener('click', () => {
      const s = _s();
      const next = UPGRADES[s.level];
      if (!next || STATE.balance < next.price) return;
      STATE.balance -= next.price;
      s.level++;
      UI.toast(`💻 Nâng cấp: ${UPGRADES[s.level-1].name}!`, 'success');
      _refreshSection();
    });
    _startCd(_s());
  }

  function _startCd(s) {
    if (s.cooldown <= Date.now()) return;
    const iv = setInterval(() => {
      const btn = document.getElementById('btn-hack-click');
      if (!btn) { clearInterval(iv); return; }
      const left = Math.max(0, _s().cooldown - Date.now());
      if (left <= 0) {
        btn.textContent = '💻 HACK'; btn.disabled = false;
        btn.classList.remove('cooling'); clearInterval(iv);
      } else {
        btn.textContent = `⏳ ${(left/1000).toFixed(1)}s`;
      }
    }, 100);
  }

  function _refreshSection() {
    const el = document.getElementById('ug-hack-section');
    if (el) { el.innerHTML = renderHTML(); bindEvents(); }
  }

  return { renderHTML, bindEvents };
})();