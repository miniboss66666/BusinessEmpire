// @ts-nocheck
/* ============================================
   PHONE/Y.JS — Mạng xã hội Y (Twitter giả)
   Ấn tạo nội dung → follower → passive income
   ============================================ */

const PhoneY = (() => {

  // Buff từ assets/team
  function getViralBuff() {
    const team = PhoneTeam?.getViralBuff?.() || 0;
    const assets = PhoneAssets?.getYBuff?.() || 0;
    return 1 + team + assets;
  }

  function _state() {
    if (!STATE.phone) STATE.phone = {};
    if (!STATE.phone.y) STATE.phone.y = {
      followers: 0,
      posts: 0,
      postCooldown: 0,    // ms timestamp hết cooldown
      viral: 0,           // % viral hiện tại (0→100)
      totalIncome: 0,
    };
    return STATE.phone.y;
  }

  function getStats() {
    return { followers: _state().followers };
  }

  // Ấn post: +viral, chance nhận follower
  function doPost() {
    const s = _state();
    const now = Date.now();
    if (now < s.postCooldown) return;

    s.postCooldown = now + 3000; // cooldown 3s
    s.posts++;

    const buff = getViralBuff();
    const viralGain = (0.5 + Math.random() * 2) * buff;
    s.viral = Math.min(100, s.viral + viralGain);

    // Chance nhận follower phụ thuộc viral
    const base = s.followers < 1000 ? 0.3 :
                 s.followers < 10000 ? 0.15 :
                 s.followers < 1e6 ? 0.08 : 0.03;
    if (Math.random() < base * buff) {
      const gain = Math.max(1, Math.floor(
        (1 + s.followers / 10000) * (s.viral / 100) * buff * (0.5 + Math.random())
      ));
      s.followers += gain;
      return { gained: gain };
    }
    return { gained: 0 };
  }

  function init() { _state(); }

  function renderHTML() {
    const s = _state();
    const income = s.followers / 1000;
    const now = Date.now();
    const cdLeft = Math.max(0, s.postCooldown - now);
    const buff = getViralBuff();

    return `
      <div class="y-wrap">
        <!-- Stats top -->
        <div class="y-stats-row">
          <div class="y-stat">
            <span class="y-stat-val">📣 ${Format.money(s.followers)}</span>
            <span class="y-stat-lbl">Followers</span>
          </div>
          <div class="y-stat">
            <span class="y-stat-val" style="color:var(--green)">${Format.money(income)}/phútút</span>
            <span class="y-stat-lbl">Passive</span>
          </div>
          <div class="y-stat">
            <span class="y-stat-val" style="color:#f4a030">${s.viral.toFixed(1)}%</span>
            <span class="y-stat-lbl">Viral</span>
          </div>
          ${buff > 1 ? `
          <div class="y-stat">
            <span class="y-stat-val" style="color:var(--gold)">x${buff.toFixed(2)}</span>
            <span class="y-stat-lbl">Buff</span>
          </div>` : ''}
        </div>

        <!-- Viral bar -->
        <div class="y-viral-bar-wrap">
          <div class="y-viral-bar" style="width:${s.viral}%"></div>
        </div>

        <!-- Post button -->
        <div class="y-post-section">
          <button class="y-post-btn ${cdLeft > 0 ? 'cooling' : ''}"
                  id="btn-y-post"
                  ${cdLeft > 0 ? 'disabled' : ''}>
            ${cdLeft > 0
              ? `⏳ ${(cdLeft/1000).toFixed(1)}s`
              : '✍️ ĐĂNG NỘI DUNG'}
          </button>
          <div class="y-post-hint">Mỗi bài đăng tăng viral → nhận follower</div>
        </div>

        <!-- Follower milestones -->
        <div class="y-milestones">
          <div class="y-milestone-title">🏆 Mốc Nổi Tiếng</div>
          ${[
            [1000,    '💬 1K — Bắt đầu được chú ý'],
            [10000,   '🔥 10K — Micro influencer'],
            [100000,  '⭐ 100K — Nút Bạc'],
            [1000000, '🥇 1M — Nút Vàng'],
            [10000000,'💎 10M — Nút Kim Cương'],
          ].map(([req, label]) => `
            <div class="y-milestone ${s.followers >= req ? 'done' : ''}">
              ${s.followers >= req ? '✅' : '🔒'} ${label}
              ${s.followers < req ? `<span class="y-milestone-pct">${(s.followers/req*100).toFixed(1)}%</span>` : ''}
            </div>`).join('')}
        </div>
      </div>`;
  }

  function bindEvents() {
    const btn = document.getElementById('btn-y-post');
    btn?.addEventListener('click', () => {
      const res = doPost();
      if (res?.gained > 0) {
        UI.toast(`📣 +${Format.money(res.gained)} followers!`, 'success');
      }
      _refreshUI();
    });

    // Countdown timer cập nhật button
    _startCdTimer();
  }

  function _startCdTimer() {
    const s = _state();
    if (s.postCooldown <= Date.now()) return;
    const iv = setInterval(() => {
      const btn = document.getElementById('btn-y-post');
      if (!btn) { clearInterval(iv); return; }
      const left = Math.max(0, _state().postCooldown - Date.now());
      if (left <= 0) {
        btn.textContent = '✍️ ĐĂNG NỘI DUNG';
        btn.disabled = false;
        btn.classList.remove('cooling');
        clearInterval(iv);
      } else {
        btn.textContent = `⏳ ${(left/1000).toFixed(1)}s`;
      }
    }, 100);
  }

  function _refreshUI() {
    const el = document.getElementById('phone-app-content');
    if (el && document.querySelector('.y-wrap')) {
      el.innerHTML = renderHTML();
      bindEvents();
    }
  }

  // Engine tick: passive income + viral decay
  function tick() {
    const s = _state();
    if (s.followers > 0) {
      const income = s.followers / 1000 / 60; // per second
      STATE.balance += income;
      STATE.totalEarned += income;
    }
    // Viral decay 0.1%/s
    s.viral = Math.max(0, s.viral - 0.1);
  }

  return { init, renderHTML, bindEvents, tick, getStats };
})();