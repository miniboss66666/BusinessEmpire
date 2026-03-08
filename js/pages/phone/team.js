// @ts-nocheck
/* ============================================
   PHONE/TEAM.JS — Team manager (gói cố định)
   Thuê 1 lần, trả lương/phút, buff viral
   ============================================ */

const PhoneTeam = (() => {

  const TIERS = [
    { id:'junior',  emoji:'👶', name:'Junior',   salary:10,   viralBuff:0.05, price:500 },
    { id:'senior',  emoji:'👨', name:'Senior',   salary:50,   viralBuff:0.15, price:5000 },
    { id:'expert',  emoji:'👨‍💼', name:'Expert',   salary:200,  viralBuff:0.35, price:25000 },
    { id:'pro',     emoji:'🌟', name:'Pro',      salary:1000, viralBuff:0.60, price:150000 },
    { id:'legend',  emoji:'👑', name:'Legend',   salary:5000, viralBuff:1.00, price:1000000 },
  ];

  function _state() {
    if (!STATE.phone) STATE.phone = {};
    if (!STATE.phone.team) STATE.phone.team = { tier: -1 }; // -1 = không có
    return STATE.phone.team;
  }

  function getViralBuff() {
    const t = _state().tier;
    return t >= 0 ? TIERS[t].viralBuff : 0;
  }

  function init() { _state(); }

  function renderHTML() {
    const s = _state();
    const cur = s.tier >= 0 ? TIERS[s.tier] : null;
    const next = TIERS[s.tier + 1];

    return `
      <div class="team-wrap">
        <div class="team-header">
          <div class="team-title">👥 Team Manager</div>
          <div class="team-sub">Thuê team → buff viral cho Y & Tubeyou</div>
        </div>

        ${cur ? `
        <div class="team-current">
          <div class="team-cur-emoji">${cur.emoji}</div>
          <div class="team-cur-info">
            <div class="team-cur-name">${cur.name}</div>
            <div class="team-cur-stats">
              <span style="color:var(--red)">💸 ${Format.money(cur.salary)}/phútútút lương</span>
              <span style="color:var(--green)">📈 +${(cur.viralBuff*100).toFixed(0)}% viral</span>
            </div>
          </div>
        </div>` : `
        <div class="team-none">Chưa có team — viral tăng chậm hơn</div>`}

        <!-- Tier list -->
        <div class="team-tiers">
          ${TIERS.map((t, i) => {
            const isOwned = s.tier >= i;
            const isCurrent = s.tier === i;
            const isNext = s.tier + 1 === i;
            const canBuy = isNext && STATE.balance >= t.price;
            return `
            <div class="team-tier ${isOwned?'owned':''} ${isCurrent?'current':''}">
              <div class="team-tier-left">
                <span class="team-tier-emoji">${t.emoji}</span>
                <div>
                  <div class="team-tier-name">${t.name}</div>
                  <div class="team-tier-sub">
                    💸 ${Format.money(t.salary)}/phútút · 📈 +${(t.viralBuff*100).toFixed(0)}%
                  </div>
                </div>
              </div>
              <div class="team-tier-right">
                ${isOwned ? `<span class="team-owned-badge">✅</span>` :
                  isNext ? `
                  <button class="team-hire-btn" data-tier="${i}"
                          ${!canBuy?'disabled':''}>
                    ${isCurrent ? '⬆️' : '➕ THUÊ'} ${Format.money(t.price)}
                  </button>` :
                  `<span class="team-tier-price">${Format.money(t.price)}</span>`}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
  }

  function bindEvents() {
    document.querySelectorAll('.team-hire-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.tier);
        const t = TIERS[i];
        if (!t || STATE.balance < t.price) return;
        STATE.balance -= t.price;
        _state().tier = i;
        UI.toast(`${t.emoji} Thuê ${t.name}! +${(t.viralBuff*100).toFixed(0)}% viral`, 'success');
        _refresh();
      });
    });
  }

  // Engine tick: trừ lương mỗi phút
  function tick() {
    const s = _state();
    if (s.tier < 0) return;
    const cur = TIERS[s.tier];
    const salary = cur.salary / 60; // engine tick mỗi 1s → /60 = per second of per-minute salary
    STATE.balance = Math.max(0, STATE.balance - salary);
  }

  function _refresh() {
    const el = document.getElementById('phone-app-content');
    if (el && document.querySelector('.team-wrap')) {
      el.innerHTML = renderHTML();
      bindEvents();
    }
  }

  return { init, renderHTML, bindEvents, tick, getViralBuff };
})();