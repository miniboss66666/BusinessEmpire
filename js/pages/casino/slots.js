/* ============================================
   CASINO/SLOTS.JS
   ============================================ */

const CasinoSlots = (() => {

  const SYMBOLS  = ['🍒','🍋','🍊','🍇','💎','7️⃣','⭐','🔔'];
  const WEIGHTS  = [30, 25, 20, 15, 5, 3, 1.5, 0.5];
  const PAYOUTS  = {
    '💎💎💎':50,'7️⃣7️⃣7️⃣':30,'⭐⭐⭐':20,'🔔🔔🔔':15,
    '🍇🍇🍇':10,'🍊🍊🍊':8,'🍋🍋🍋':5,'🍒🍒🍒':3,'🍒🍒':1.5,
  };

  let spinning = false;

  function pick() {
    let r = Math.random() * WEIGHTS.reduce((a,b)=>a+b,0);
    for (let i=0;i<SYMBOLS.length;i++) { r -= WEIGHTS[i]; if(r<=0) return SYMBOLS[i]; }
    return SYMBOLS[0];
  }

  function calcPayout(r) {
    const k3 = r.join('');
    if (PAYOUTS[k3]) return PAYOUTS[k3];
    if (r[0]==='🍒'&&r[1]==='🍒') return PAYOUTS['🍒🍒'];
    return 0;
  }

  function renderHTML() {
    STATE.casino = STATE.casino || {};
    return `
      <div class="casino-game-wrap">
        <div class="casino-stats">
          <div class="casino-stat">
            <div class="casino-stat-label">Đã thắng</div>
            <div class="casino-stat-value" id="slots-won">${Format.money(STATE.casino.slotsWon||0)}</div>
          </div>
          <div class="casino-stat">
            <div class="casino-stat-label">Số lần quay</div>
            <div class="casino-stat-value" id="slots-spins">${STATE.casino.slotsSpins||0}</div>
          </div>
        </div>

        <div class="slots-machine">
          <div class="slots-reels">
            <div class="slots-reel" id="reel-0">🍒</div>
            <div class="slots-reel" id="reel-1">🍋</div>
            <div class="slots-reel" id="reel-2">🍊</div>
          </div>
          <div class="slots-paytable">
            ${Object.entries(PAYOUTS).map(([k,v])=>`
              <div class="slots-pay-row">
                <span class="slots-pay-icons">${k}</span>
                <span class="slots-pay-mult">×${v}</span>
              </div>`).join('')}
          </div>
        </div>

        <div class="casino-result" id="slots-result"></div>
        ${Casino.renderBetControls('slots')}
        <button class="casino-play-btn" id="btn-slots-spin">🎰 QUAY</button>
      </div>
    `;
  }

  function bindEvents() {
    document.getElementById('btn-slots-spin')?.addEventListener('click', spin);
  }

  function spin() {
    if (spinning) return;
    const bet = Casino.deductBet('slots');
    if (bet === false) return;
    spinning = true;

    const btn = document.getElementById('btn-slots-spin');
    if (btn) btn.disabled = true;
    document.getElementById('slots-result').className = 'casino-result';

    const reels = [0,1,2].map(i => document.getElementById('reel-'+i));
    reels.forEach(r => r?.classList.add('spinning'));

    const final = [pick(), pick(), pick()];

    setTimeout(()=>stopReel(reels[0], final[0]), 600);
    setTimeout(()=>stopReel(reels[1], final[1]), 900);
    setTimeout(()=>{
      stopReel(reels[2], final[2]);
      const mult = calcPayout(final);
      const won  = mult > 0 ? Math.floor(bet * mult) : 0;

      STATE.casino.slotsSpins = (STATE.casino.slotsSpins||0) + 1;
      if (won > 0) {
        Casino.addWin(won);
        STATE.casino.slotsWon = (STATE.casino.slotsWon||0) + won;
        reels.forEach(r => r?.classList.add('win-reel'));
        Casino.showResult('slots-result','win',`+${Format.money(won)} (×${mult})`);
      } else {
        Casino.showResult('slots-result','lose',`−${Format.money(bet)}`);
      }

      document.getElementById('slots-won').textContent  = Format.money(STATE.casino.slotsWon||0);
      document.getElementById('slots-spins').textContent = STATE.casino.slotsSpins;

      spinning = false;
      if (btn) btn.disabled = false;
      Casino.updateAllBalances();
    }, 1300);
  }

  function stopReel(el, sym) {
    el?.classList.remove('spinning');
    if (el) el.textContent = sym;
  }

  return { renderHTML, bindEvents };
})();