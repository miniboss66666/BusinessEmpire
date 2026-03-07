/* ============================================
   HOME.JS - Trang Home
   ============================================ */

const HomePage = (() => {

  const SKIN_DATA = [
    { price: 0,          buff: 0,    name: 'Default' },
    { price: 10000,      buff: 0.05, name: 'Onyx' },
    { price: 50000,      buff: 0.1,  name: 'Bronze' },
    { price: 250000,     buff: 0.15, name: 'Navy' },
    { price: 1000000,    buff: 0.2,  name: 'Cosmos' },
    { price: 5000000,    buff: 0.25, name: 'Obsidian' },
    { price: 25000000,   buff: 0.3,  name: 'Emerald' },
    { price: 100000000,  buff: 0.35, name: 'Gold II' },
    { price: 500000000,  buff: 0.4,  name: 'Nebula' },
    { price: 7000000000, buff: 0.5,  name: 'Gold MAX' },
  ];

  const SKIN_GRADIENTS = [
    'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)',
    'linear-gradient(135deg,#0d0d0d,#1a1a1a,#2d2d2d)',
    'linear-gradient(135deg,#1a0a00,#3d1500,#7a2d00)',
    'linear-gradient(135deg,#000428,#004e92)',
    'linear-gradient(135deg,#0f0c29,#302b63,#24243e)',
    'linear-gradient(135deg,#000000,#434343)',
    'linear-gradient(135deg,#093028,#237a57)',
    'linear-gradient(135deg,#1f1c18,#3d3520,#7a6c30)',
    'linear-gradient(135deg,#0a0a0a,#1a0a2e,#2d0a5e)',
    'linear-gradient(135deg,#000000,#c0a000,#ffd700)',
  ];

  let initialized = false;

  function init() {
    if (initialized) return;
    initialized = true;
    render();
  }

  function render() {
    try {
      const container = document.getElementById('page-home');
      if (!container) { console.error('[HomePage] #page-home không tìm thấy!'); return; }
    container.innerHTML = `
      <button class="home-settings-btn" id="home-settings-btn" title="Cài đặt">⚙️</button>

      <!-- Bank Card — click để chọn skin -->
      <div class="bank-card skin-${STATE.cardSkin}" id="bank-card" title="Nhấn để đổi skin">
        <div class="card-chip"></div>
        <div class="card-balance-label">BALANCE</div>
        <div class="card-balance" id="hud-balance">${Format.money(STATE.balance)}</div>
        <div class="card-bottom">
          <div class="card-name">${STATE.profile?.username || STATE.user?.email?.split('@')[0] || 'PLAYER'}</div>
          <div class="card-visa">VISA</div>
        </div>
      </div>

      <!-- Income/phút -->
      <div class="income-display">
        <div class="income-label">THU NHẬP</div>
        <div class="income-value" id="hud-income">${Format.money(STATE.incomePerMin)}/phút</div>
      </div>

      <!-- Click Upgrade -->
      <div class="click-upgrade" id="click-upgrade-box">
        <div class="click-upgrade-info">
          <div class="click-upgrade-title">⚡ Click Power — Lv.${STATE.clickLevel}</div>
          <div class="click-upgrade-sub" id="click-upgrade-sub">${getClickUpgradeSub()}</div>
        </div>
        <button class="click-upgrade-btn" id="btn-click-upgrade"
          ${State_clickMaxed() ? 'disabled' : ''}>
          ${getClickUpgradeLabel()}
        </button>
      </div>

      <!-- Click Zone -->
      <div class="click-zone" id="click-zone">
        <div class="click-zone-inner">
          <span class="click-zone-icon">💰</span>
          <div class="click-zone-label">NHẤN ĐỂ KIẾM TIỀN</div>
          <div class="click-zone-value">+${Format.money(Engine.getClickValue())}/click</div>
        </div>
      </div>
    `;

    bindEvents();
    } catch(e) {
      console.error('[HomePage] render() lỗi:', e);
    }
  }

  function State_clickMaxed() { return STATE.clickLevel >= 20; }

  function getClickUpgradeSub() {
    if (State_clickMaxed()) return 'Đã đạt cấp tối đa!';
    return `Lên Lv.${STATE.clickLevel + 1} — ${Format.money(Engine.getClickUpgradePrice())}`;
  }

  function getClickUpgradeLabel() {
    return State_clickMaxed() ? 'MAX' : 'NÂNG CẤP';
  }

  function bindEvents() {
    const zone = document.getElementById('click-zone');
    zone?.addEventListener('click', (e) => {
      const earned = Engine.handleClick();
      spawnFloatText(e.clientX, e.clientY, '+' + Format.money(earned));
      spawnRipple(zone, e);
      updateClickZone();
    });

    document.getElementById('btn-click-upgrade')?.addEventListener('click', () => {
      const success = Engine.upgradeClick();
      if (success) {
        updateClickUpgrade();
        updateClickZone();
        UI.toast('⚡ Click Power nâng cấp!', 'success');
      } else if (!State_clickMaxed()) {
        UI.toast('Không đủ tiền!', 'error');
      }
    });

    // Click card → mở skin picker
    document.getElementById('bank-card')?.addEventListener('click', openSkinPicker);

    document.getElementById('home-settings-btn')?.addEventListener('click', openSettings);
  }

  function updateClickUpgrade() {
    const title = document.querySelector('.click-upgrade-title');
    const sub = document.getElementById('click-upgrade-sub');
    const btn = document.getElementById('btn-click-upgrade');
    if (title) title.textContent = `⚡ Click Power — Lv.${STATE.clickLevel}`;
    if (sub) sub.textContent = getClickUpgradeSub();
    if (btn) {
      btn.textContent = getClickUpgradeLabel();
      btn.disabled = State_clickMaxed();
      if (State_clickMaxed()) btn.classList.add('maxed');
    }
  }

  function updateClickZone() {
    const valEl = document.querySelector('.click-zone-value');
    if (valEl) valEl.textContent = '+' + Format.money(Engine.getClickValue()) + '/click';
  }

  // Giới hạn tối đa 5 float text cùng lúc để tránh DOM bloat
  let _floatCount = 0;
  function spawnFloatText(x, y, text) {
    if (_floatCount >= 5) return; // bỏ qua nếu đang có quá nhiều
    _floatCount++;
    const el = document.createElement('div');
    el.className = 'float-text';
    el.textContent = text;
    el.style.cssText = `left:${x - 20}px;top:${y - 20}px`;
    document.body.appendChild(el);
    setTimeout(() => { el.remove(); _floatCount--; }, 800);
  }

  // Giới hạn 1 ripple tại 1 thời điểm
  let _rippleEl = null;
  function spawnRipple(zone, e) {
    if (_rippleEl) { _rippleEl.remove(); _rippleEl = null; }
    const rect = zone.getBoundingClientRect();
    const ripple = document.createElement('div');
    ripple.className = 'click-ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size/2}px;top:${e.clientY - rect.top - size/2}px`;
    zone.appendChild(ripple);
    _rippleEl = ripple;
    setTimeout(() => { ripple.remove(); if (_rippleEl === ripple) _rippleEl = null; }, 500);
  }

  // ============================================
  // Skin Picker — mở khi click vào card
  // ============================================
  function openSkinPicker() {
    UI.showModal(`
      <div class="settings-modal">
        <div class="settings-title">🎴 SKIN THẺ</div>
        <div class="skin-grid" style="margin-top:8px">
          ${SKIN_DATA.map((s, i) => `
            <div>
              <div class="skin-option ${STATE.cardSkin === i ? 'selected' : ''}
                   ${!STATE.unlockedSkins.includes(i) ? 'skin-locked' : ''}"
                   style="background:${SKIN_GRADIENTS[i]}"
                   data-skin="${i}"></div>
              <div class="skin-price" style="color:var(--text)">${s.name}</div>
              <div class="skin-price">
                ${STATE.unlockedSkins.includes(i)
                  ? (i === 0 ? 'Free' : '<span style="color:var(--green)">✓ Đã có</span>')
                  : Format.money(s.price)
                }
              </div>
              ${s.buff > 0
                ? `<div class="skin-price" style="color:var(--gold)">+${s.buff*100}% 💰</div>`
                : '<div class="skin-price">—</div>'
              }
            </div>
          `).join('')}
        </div>
      </div>
    `);

    document.querySelectorAll('.skin-option').forEach(el => {
      el.addEventListener('click', () => {
        const i = parseInt(el.dataset.skin);
        if (!STATE.unlockedSkins.includes(i)) {
          const price = SKIN_DATA[i].price;
          if (STATE.balance < price) return UI.toast('Không đủ tiền!', 'error');
          STATE.balance -= price;
          STATE.unlockedSkins.push(i);
          UI.toast(`🎴 Mở khóa ${SKIN_DATA[i].name}!`, 'success');
        }
        STATE.cardSkin = i;
        document.getElementById('bank-card')?.setAttribute('class', `bank-card skin-${i}`);
        document.querySelectorAll('.skin-option').forEach(s => s.classList.remove('selected'));
        el.classList.add('selected');
        Engine.recalcIncome();
      });
    });
  }

  // ============================================
  // Settings Modal — không còn skin ở đây
  // ============================================
  function openSettings() {
    UI.showModal(`
      <div class="settings-modal">
        <div class="settings-title">⚙️ CÀI ĐẶT</div>

        <div class="settings-row">
          <div>
            <div class="settings-label">Giao diện</div>
            <div class="settings-sub">Sáng / Tối</div>
          </div>
          <div class="toggle ${STATE.settings.theme === 'light' ? 'on' : ''}" id="theme-toggle"></div>
        </div>

        <div class="settings-row">
          <div>
            <div class="settings-label">Format số</div>
            <div class="settings-sub">K/M/B hoặc khoa học</div>
          </div>
          <select class="format-select" id="format-select">
            <option value="shorthand" ${STATE.settings.numberFormat === 'shorthand' ? 'selected' : ''}>K/M/B/T</option>
            <option value="scientific" ${STATE.settings.numberFormat === 'scientific' ? 'selected' : ''}>e9/e10</option>
          </select>
        </div>

        <div class="settings-row">
          <div class="settings-label">🎟️ Redeem Code</div>
          <button class="click-upgrade-btn" onclick="Redeem.openModal()">NHẬP MÃ</button>
        </div>

        <div class="settings-row">
          <div class="settings-label">🚪 Đăng xuất</div>
          <button class="click-upgrade-btn" style="border-color:var(--red);color:var(--red)"
                  onclick="Auth.logout()">LOGOUT</button>
        </div>

        <div class="settings-row">
          <div>
            <div class="settings-label" style="color:var(--red)">⚠️ Reset tài khoản</div>
            <div class="settings-sub">Xóa toàn bộ tiến trình</div>
          </div>
          <button class="click-upgrade-btn" style="border-color:var(--red);color:var(--red)"
                  onclick="confirmReset()">RESET</button>
        </div>

        <!-- Version -->
        <div style="text-align:center;padding-top:4px">
          <span style="font-family:'Orbitron',monospace;font-size:0.65rem;
                       color:var(--text-dim);letter-spacing:2px;opacity:0.5">
            BUSINESS EMPIRE v${CONFIG.VERSION}
          </span>
        </div>
      </div>
    `);

    document.getElementById('theme-toggle')?.addEventListener('click', function() {
      UI.toggleTheme();
      this.classList.toggle('on');
    });

    document.getElementById('format-select')?.addEventListener('change', function() {
      STATE.settings.numberFormat = this.value;
    });
  }

  // ============================================
  // Reset với mã xác nhận
  // ============================================
  window.confirmReset = function() {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    let countdown = 5;

    UI.showModal(`
      <div style="text-align:center">
        <div style="font-size:2rem;margin-bottom:12px">⚠️</div>
        <div style="font-family:'Orbitron',monospace;font-size:0.9rem;
                    color:var(--red);margin-bottom:12px">RESET TÀI KHOẢN</div>
        <p style="color:var(--text-dim);font-size:0.85rem;margin-bottom:16px">
          Toàn bộ tiến trình sẽ bị xóa vĩnh viễn!<br>
          Nhập mã xác nhận để tiếp tục:
        </p>
        <div style="font-family:'Orbitron',monospace;font-size:1.4rem;
                    font-weight:700;color:var(--gold);margin-bottom:12px;
                    letter-spacing:4px">${code}</div>
        <input type="text" id="reset-code-input" placeholder="Nhập mã xác nhận"
               style="width:100%;padding:10px;background:var(--bg3);
                      border:1px solid var(--border2);border-radius:8px;
                      color:var(--text);font-family:'Orbitron',monospace;
                      font-size:1rem;text-align:center;letter-spacing:3px;
                      margin-bottom:12px;outline:none"/>
        <button class="btn-primary" id="btn-confirm-reset" disabled
                style="background:var(--red-dark)">
          XÁC NHẬN (<span id="reset-countdown">${countdown}</span>s)
        </button>
        <button onclick="UI.closeModal()"
                style="margin-top:8px;width:100%;padding:10px;background:transparent;
                       border:1px solid var(--border);border-radius:8px;
                       color:var(--text-dim);cursor:pointer">HỦY</button>
      </div>
    `);

    const timer = setInterval(() => {
      countdown--;
      const cdEl = document.getElementById('reset-countdown');
      const btn = document.getElementById('btn-confirm-reset');
      if (cdEl) cdEl.textContent = countdown;
      if (countdown <= 0) {
        clearInterval(timer);
        if (btn) { btn.disabled = false; btn.textContent = 'XÁC NHẬN RESET'; }
      }
    }, 1000);

    document.getElementById('btn-confirm-reset')?.addEventListener('click', async () => {
      const input = document.getElementById('reset-code-input')?.value.toUpperCase();
      if (input !== code) return UI.toast('Mã không đúng!', 'error');
      await Save.resetSave();
      location.reload();
    });
  };

  return { init, render, openSkinPicker };

})();