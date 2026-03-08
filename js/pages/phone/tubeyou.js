// @ts-nocheck
/* ============================================
   PHONE/TUBEYOU.JS — Youtube giả
   Upload video → sub → passive + milestones
   ============================================ */

const PhoneTubeyou = (() => {

  const MILESTONES = [
    { req:1000,      id:'live',     label:'🔴 Live Stream',  buff:'Mở Live' },
    { req:10000,     id:'member',   label:'💎 Membership',   buff:'Mở Member' },
    { req:100000,    id:'silver',   label:'🥈 Nút Bạc',      buff:'+10% viral' },
    { req:1000000,   id:'gold',     label:'🥇 Nút Vàng',     buff:'+25% viral' },
    { req:10000000,  id:'diamond',  label:'💎 Nút KD',       buff:'+50% viral' },
    { req:100000000, id:'ruby',     label:'👑 Nút Ruby',     buff:'+100% viral' },
  ];

  function getMilestoneBuff() {
    const s = _state();
    let bonus = 0;
    if (s.subscribers >= 100000)    bonus += 0.10;
    if (s.subscribers >= 1000000)   bonus += 0.25;
    if (s.subscribers >= 10000000)  bonus += 0.50;
    if (s.subscribers >= 100000000) bonus += 1.00;
    return bonus;
  }

  function getViralBuff() {
    const team = PhoneTeam?.getViralBuff?.() || 0;
    const assets = PhoneAssets?.getTubeyouBuff?.() || 0;
    return 1 + team + assets + getMilestoneBuff();
  }

  function _state() {
    if (!STATE.phone) STATE.phone = {};
    if (!STATE.phone.tubeyou) STATE.phone.tubeyou = {
      subscribers: 0,
      videos: 0,
      uploadCooldown: 0,
      viral: 0,
    };
    return STATE.phone.tubeyou;
  }

  function getStats() { return { subscribers: _state().subscribers }; }

  function doUpload() {
    const s = _state();
    const now = Date.now();
    if (now < s.uploadCooldown) return { gained: 0 };

    s.uploadCooldown = now + 5000; // 5s cooldown
    s.videos++;

    const buff = getViralBuff();
    s.viral = Math.min(100, s.viral + (1 + Math.random() * 3) * buff);

    const base = s.subscribers < 1000 ? 0.4 :
                 s.subscribers < 100000 ? 0.2 :
                 s.subscribers < 1e6 ? 0.1 : 0.04;

    if (Math.random() < base * buff) {
      const gain = Math.max(1, Math.floor(
        (1 + s.subscribers / 5000) * (s.viral / 100) * buff * (0.5 + Math.random())
      ));
      s.subscribers += gain;
      return { gained: gain };
    }
    return { gained: 0 };
  }

  function init() { _state(); }

  function renderHTML() {
    const s = _state();
    const income = s.subscribers / 1000;
    const buff = getViralBuff();
    const now = Date.now();
    const cdLeft = Math.max(0, s.uploadCooldown - now);

    return `
      <div class="y-wrap">
        <div class="y-stats-row">
          <div class="y-stat">
            <span class="y-stat-val">📺 ${Format.money(s.subscribers)}</span>
            <span class="y-stat-lbl">Subscribers</span>
          </div>
          <div class="y-stat">
            <span class="y-stat-val" style="color:var(--green)">${Format.money(income)}/phútút</span>
            <span class="y-stat-lbl">Passive</span>
          </div>
          <div class="y-stat">
            <span class="y-stat-val" style="color:#f4a030">${s.viral.toFixed(1)}%</span>
            <span class="y-stat-lbl">Viral</span>
          </div>
          <div class="y-stat">
            <span class="y-stat-val" style="color:var(--gold)">x${buff.toFixed(2)}</span>
            <span class="y-stat-lbl">Buff</span>
          </div>
        </div>

        <div class="y-viral-bar-wrap">
          <div class="y-viral-bar" style="width:${s.viral}%;background:var(--red)"></div>
        </div>

        <div class="y-post-section">
          <button class="y-post-btn ${cdLeft > 0 ? 'cooling' : ''}"
                  id="btn-yt-upload" style="--btn-color:#c00"
                  ${cdLeft > 0 ? 'disabled' : ''}>
            ${cdLeft > 0 ? `⏳ ${(cdLeft/1000).toFixed(1)}s` : '🎬 UPLOAD VIDEO'}
          </button>
          <div class="y-post-hint">Upload video tăng viral → nhận subscriber</div>
        </div>

        <!-- Milestones -->
        <div class="y-milestones">
          <div class="y-milestone-title">🏆 Mốc Creator</div>
          ${MILESTONES.map(m => `
            <div class="y-milestone ${s.subscribers >= m.req ? 'done' : ''}">
              ${s.subscribers >= m.req ? '✅' : '🔒'} ${m.label}
              <span class="y-milestone-buff" style="color:var(--gold)">${m.buff}</span>
              ${s.subscribers < m.req ? `<span class="y-milestone-pct">${(s.subscribers/m.req*100).toFixed(2)}%</span>` : ''}
            </div>`).join('')}
        </div>
      </div>`;
  }

  function bindEvents() {
    document.getElementById('btn-yt-upload')?.addEventListener('click', () => {
      const res = doUpload();
      if (res?.gained > 0) UI.toast(`📺 +${Format.money(res.gained)} subscribers!`, 'success');
      _refreshUI();
    });
    _startCdTimer();
  }

  function _startCdTimer() {
    const s = _state();
    if (s.uploadCooldown <= Date.now()) return;
    const iv = setInterval(() => {
      const btn = document.getElementById('btn-yt-upload');
      if (!btn) { clearInterval(iv); return; }
      const left = Math.max(0, _state().uploadCooldown - Date.now());
      if (left <= 0) {
        btn.textContent = '🎬 UPLOAD VIDEO';
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

  function tick() {
    const s = _state();
    if (s.subscribers > 0) {
      const income = s.subscribers / 1000 / 60;
      STATE.balance += income;
      STATE.totalEarned += income;
    }
    s.viral = Math.max(0, s.viral - 0.08);
  }

  return { init, renderHTML, bindEvents, tick, getStats };
})();