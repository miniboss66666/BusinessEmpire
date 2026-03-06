/* ============================================
   HOME.JS - Trang Home
   ============================================ */

const HomePage = (() => {

  // ============================================
  // Data
  // ============================================
  const SKIN_DATA = [
    { price: 0,          buff: 0,    name: 'Default' },
    { price: 10000,      buff: 0.05, name: 'Onyx' },
    { price: 50000,      buff: 0.1,  name: 'Bronze' },
    { price: 250000,     buff: 0.15, name: 'Navy' },
    { price: 1000000,    buff: 0.2,  name: 'Cosmos' },
    { price: 5000000,    buff: 0.25, name: 'Obsidian' },
    { price: 25000000,   buff: 0.3,  name: 'Emerald' },
    { price: 100000000,  buff: 0.35, name: 'Bronze II' },
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

  // ============================================
  // Init (chỉ chạy 1 lần)
  // ============================================
  let initialized = false;

  function init() {
    if (initialized) return;
    initialized = true;
    render();
  }

  // ============================================
  // Render HTML
  // ============================================
  function render() {
    const container = document.getElementById('page-home');
    container.innerHTML = `
      <button class="home-settings-btn" id="home-settings-btn" title="Cài đặt">⚙️</button>

      <!-- Bank Card -->
      <div class="bank-card skin-${STATE.cardSkin}" id="bank-card">
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
  }

  // ============================================
  // Helpers
  // ============================================
  function State_clickMaxed() {
    return STATE.clickLevel >= 20;
  }

  function getClickUpgradeSub() {
    if (State_clickMaxed()) return 'Đã đạt cấp tối đa!';
    const price = Engine.getClickUpgradePrice();
    return `Lên Lv.${STATE.clickLevel + 1} — ${Format.money(price)}`;
  }

  function getClickUpgradeLabel() {
    if (State_clickMaxed()) return 'MAX';
    return 'NÂNG CẤP';
  }

  // ============================================
  // Bind Events
  // ============================================
  function bindEvents() {
    // Click zone
    const zone = document.getElementById('click-zone');
    zone?.addEventListener('click', (e) => {
      const earned = Engine.handleClick();
      spawnFloatText(e.clientX, e.clientY, '+' + Format.money(earned));
      spawnRipple(zone, e);
      updateClickZone();
    });

    // Upgrade click
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

    // Settings
    document.getElementById('home-settings-btn')?.addEventListener('click', openSettings);
  }

  // ============================================
  // Update UI
  // ============================================
  function updateClickUpgrade() {
    const box = document.getElementById('click-upgrade-box');
    if (!box) return;

    const title = box.querySelector('.click-upgrade-title');
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

  // ============================================
  // Hiệu ứng click
  // ============================================
  function spawnFloatText(x, y, text) {
    const el = document.createElement('div');
    el.className = 'float-text';
    el.textContent = text;
    el.style.left = (x - 20) + 'px';
    el.style.top = (y - 20) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }

  function spawnRipple(zone, e) {
    const rect = zone.getBoundingClientRect();
    const ripple = document.createElement('div');
    ripple.className = 'click-ripple';
    const size = Math.max(rect.width, rect.height);
    Object.assign(ripple.style, {
      width: size + 'px',
      height: size + 'px',
      left: (e.clientX - rect.left - size / 2) + 'px',
      top: (e.clientY - rect.top - size / 2) + 'px',
    });
    zone.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
  }

  // ============================================
  // Settings Modal
  // ============================================
  function openSettings() {
    UI.showModal(`
      <div class="settings-modal">
        <div class="settings-title">⚙️ CÀI ĐẶT</div>

        <!-- Theme -->
        <div class="settings-row">
          <div>
            <div class="settings-label">Giao diện</div>
            <div class="settings-sub">Sáng / Tối</div>
          </div>
          <div class="toggle ${STATE.settings.theme === 'light' ? 'on' : ''}"
               id="theme-toggle"></div>
        </div>

        <!-- Number format -->
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

        <!-- Card skins -->
        <div class="settings-row" style="flex-direction:column;align-items:flex-start;gap:8px">
          <div class="settings-label">🎴 Card Skin</div>
          <div class="skin-grid" style="width:100%">
            ${SKIN_DATA.map((s, i) => `
              <div>
                <div class="skin-option ${STATE.cardSkin === i ? 'selected' : ''}
                     ${!STATE.unlockedSkins.includes(i) ? 'skin-locked' : ''}"
                     style="background:${SKIN_GRADIENTS[i]}"
                     data-skin="${i}"></div>
                <div class="skin-price">${i === 0 ? 'Free' : Format.money(s.price)}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Redeem -->
        <div class="settings-row">
          <div class="settings-label">🎟️ Redeem Code</div>
          <button class="click-upgrade-btn" onclick="Redeem.openModal()">NHẬP MÃ</button>
        </div>

        <!-- Logout -->
        <div class="settings-row">
          <div class="settings-label">🚪 Đăng xuất</div>
          <button class="click-upgrade-btn" style="border-color:var(--red);color:var(--red)"
                  onclick="Auth.logout()">LOGOUT</button>
        </div>

        <!-- Reset -->
        <div class="settings-row">
          <div>
            <div class="settings-label" style="color:var(--red)">⚠️ Reset tài khoản</div>
            <div class="settings-sub">Xóa toàn bộ tiến trình</div>
          </div>
          <button class="click-upgrade-btn" style="border-color:var(--red);color:var(--red)"
                  onclick="confirmReset()">RESET</button>
        </div>
      </div>
    `);

    // Theme toggle
    document.getElementById('theme-toggle')?.addEventListener('click', function() {
      UI.toggleTheme();
      this.classList.toggle('on');
    });

    // Format select
    document.getElementById('format-select')?.addEventListener('change', function() {
      STATE.settings.numberFormat = this.value;
    });

    // Skin select
    document.querySelectorAll('.skin-option').forEach(el => {
      el.addEventListener('click', () => {
        const i = parseInt(el.dataset.skin);
        if (!STATE.unlockedSkins.includes(i)) {
          // Mua skin
          const price = SKIN_DATA[i].price;
          if (STATE.balance < price) return UI.toast('Không đủ tiền!', 'error');
          STATE.balance -= price;
          STATE.unlockedSkins.push(i);
        }
        STATE.cardSkin = i;
        document.getElementById('bank-card')?.setAttribute(
          'class', `bank-card skin-${i}`
        );
        document.querySelectorAll('.skin-option').forEach(s => s.classList.remove('selected'));
        el.classList.add('selected');
        Engine.recalcIncome();
      });
    });
  }

  // Reset với mã xác nhận
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
        <input type="text" id="reset-code-input"
               placeholder="Nhập mã xác nhận"
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

    // Countdown
    const timer = setInterval(() => {
      countdown--;
      const cdEl = document.getElementById('reset-countdown');
      const btn = document.getElementById('btn-confirm-reset');
      if (cdEl) cdEl.textContent = countdown;
      if (countdown <= 0) {
        clearInterval(timer);
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'XÁC NHẬN RESET';
        }
      }
    }, 1000);

    document.getElementById('btn-confirm-reset')?.addEventListener('click', async () => {
      const input = document.getElementById('reset-code-input')?.value.toUpperCase();
      if (input !== code) return UI.toast('Mã không đúng!', 'error');
      await Save.resetSave();
      location.reload();
    });
  };

  return { init, render };

})();