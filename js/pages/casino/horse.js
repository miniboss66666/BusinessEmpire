/* ============================================
   CASINO/HORSE.JS — Nhanh hơn + chạy nền
   ============================================ */

const CasinoHorse = (() => {

  const HORSES = [
    { name:'⚡ Thunder', color:'#f5c518' },
    { name:'🌊 Storm',   color:'#00d4ff' },
    { name:'🔥 Blaze',   color:'#ff4455' },
    { name:'🌙 Shadow',  color:'#a855f7' },
    { name:'🌟 Star',    color:'#00ff88' },
    { name:'🍀 Lucky',   color:'#ff6b35' },
    { name:'👑 King',    color:'#ffd700' },
  ];

  const FINISH = 90;

  // State toàn cục — tồn tại kể cả khi chuyển tab
  let G = {
    phase: 'idle',
    betHorse: null, bet: 0,
    interval: null,
    positions: new Array(7).fill(0),
    horses: [],
    odds: [],
    winner: -1,
    finished: [],
    betType: 'clean',
  };

  function randomOdds() {
    return HORSES.map(() => parseFloat((1.3 + Math.random() * 5).toFixed(1)));
  }

  function initHorseStates() {
    G.horses = HORSES.map(() => {
      const baseSpeed = 0.18 + Math.random() * 0.14; // nhanh hơn ~4x
      return {
        speed: baseSpeed, targetSpeed: baseSpeed, baseSpeed,
        stamina: 0.3 + Math.random() * 0.7,
        burstCooldown: Math.random() * 15,
        mode: 'normal', modeTicks: 0,
      };
    });
  }

  // ── Tick vật lý (chạy ngầm dù không ở tab horse) ──
  function tick() {
    if (G.phase !== 'running') return;
    const progress = Math.max(...G.positions) / FINISH;

    for (let i = 0; i < 7; i++) {
      if (G.positions[i] >= FINISH) continue;
      const h = G.horses[i];

      h.modeTicks--;
      if (h.modeTicks <= 0) {
        h.burstCooldown--;
        if (h.burstCooldown <= 0) {
          const roll = Math.random();
          if (roll < 0.35) {
            h.mode = 'burst'; h.modeTicks = 6 + Math.floor(Math.random() * 10);
            h.targetSpeed = h.baseSpeed * (1.8 + Math.random() * 1.2);
            h.burstCooldown = 10 + Math.floor(Math.random() * 15);
          } else if (roll < 0.55) {
            h.mode = 'tired'; h.modeTicks = 8 + Math.floor(Math.random() * 12);
            h.targetSpeed = h.baseSpeed * (0.3 + Math.random() * 0.3);
            h.burstCooldown = 6 + Math.floor(Math.random() * 10);
          } else {
            h.mode = 'normal'; h.modeTicks = 4 + Math.floor(Math.random() * 8);
            h.targetSpeed = h.baseSpeed * (0.8 + Math.random() * 0.5);
            h.burstCooldown = 4 + Math.floor(Math.random() * 8);
          }
        }
      }

      if (progress > 0.75) {
        if (h.stamina > 0.6 && h.mode !== 'burst') {
          h.mode = 'burst'; h.targetSpeed = h.baseSpeed * (1.5 + h.stamina * 0.8);
        } else if (h.stamina < 0.4 && h.mode !== 'tired') {
          h.mode = 'tired'; h.targetSpeed = h.baseSpeed * 0.4;
        }
      }

      const accel = h.mode === 'burst' ? 0.015 : 0.01;
      if (h.speed < h.targetSpeed) h.speed = Math.min(h.speed + accel, h.targetSpeed);
      else                         h.speed = Math.max(h.speed - accel, h.targetSpeed);

      const noise = (Math.random() - 0.5) * 0.012;
      G.positions[i] += Math.max(0.01, h.speed + noise);

      if (G.positions[i] >= FINISH) {
        G.positions[i] = FINISH;
        G.finished.push(i);
        if (G.finished.length === 1) G.winner = i;
      }
    }

    // Cập nhật DOM nếu đang xem tab horse
    _syncDOM();

    if (G.finished.length === 7) {
      clearInterval(G.interval);
      G.interval = null;
      G.phase = 'done';
      _finish();
    }
  }

  // ── Sync vị trí ngựa vào DOM (nếu đang hiển thị) ──
  function _syncDOM() {
    for (let i = 0; i < 7; i++) {
      const el = document.getElementById('horse-' + i);
      if (!el) return; // tab không hiển thị
      el.style.left = G.positions[i] + '%';
      const rank = G.finished.indexOf(i);
      if (rank >= 0) {
        el.textContent = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : '✅';
      } else {
        el.textContent = '🐎';
      }
    }
  }

  function renderHTML() {
    if (G.phase === 'idle') G.odds = randomOdds();
    return `
      <div class="casino-game-wrap">
        <div class="horse-track" id="horse-track">
          ${HORSES.map((h, i) => `
            <div class="horse-lane">
              <div class="horse-name" style="color:${h.color}">${h.name}</div>
              <div class="horse-lane-track">
                <div class="horse-runner" id="horse-${i}"
                  style="color:${h.color};left:${G.positions[i]}%">
                  ${G.finished.indexOf(i) === 0 ? '🥇'
                  : G.finished.indexOf(i) === 1 ? '🥈'
                  : G.finished.indexOf(i) === 2 ? '🥉'
                  : G.finished.indexOf(i) > 2   ? '✅' : '🐎'}
                </div>
              </div>
              <div class="horse-odds-tag" id="horse-odds-${i}">×${G.odds[i]}</div>
            </div>`).join('')}
          <div class="horse-finish-line"></div>
        </div>

        <div class="horse-bet-grid">
          ${HORSES.map((h, i) => `
            <button class="horse-pick-btn ${G.betHorse === i ? 'selected' : ''}"
              data-horse="${i}" style="border-color:${h.color}"
              ${G.phase === 'running' ? 'disabled' : ''}>
              <span style="color:${h.color};font-size:.68rem">${h.name}</span>
              <span class="horse-pick-odds" id="pick-odds-${i}">×${G.odds[i]}</span>
            </button>`).join('')}
        </div>

        <div class="casino-result" id="horse-result">
          ${G.phase === 'done' ? _resultText() : ''}
        </div>
        ${Casino.renderBetControls('horse')}
        <button class="casino-play-btn" id="btn-horse-start"
          ${G.phase === 'running' || G.betHorse === null ? 'disabled' : ''}>
          ${G.phase === 'running' ? '🏇 ĐANG ĐUA...' : '🏇 ĐẶT CƯỢC & XUẤT PHÁT'}
        </button>
      </div>`;
  }

  function _resultText() {
    if (G.winner < 0) return '';
    const won = G.winner === G.betHorse;
    const odds = G.odds[G.betHorse];
    const myRank = G.finished.indexOf(G.betHorse) + 1;
    if (won) {
      const pay = Math.floor(G.bet * odds);
      return `THẮNG! +${Format.money(pay - G.bet)} (×${odds})`;
    }
    return `${HORSES[G.winner].name} THẮNG! Ngựa bạn về thứ ${myRank} −${Format.money(G.bet)}`;
  }

  function bindEvents() {
    document.querySelectorAll('.horse-pick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (G.phase === 'running') return;
        document.querySelectorAll('.horse-pick-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        G.betHorse = parseInt(btn.dataset.horse);
        const sb = document.getElementById('btn-horse-start');
        if (sb) sb.disabled = false;
      });
    });
    document.getElementById('btn-horse-start')?.addEventListener('click', _start);

    // Nếu đang chạy thì sync ngay
    if (G.phase === 'running') {
      _syncDOM();
    }
  }

  function _start() {
    if (G.phase === 'running') return;
    if (G.betHorse === null) { UI.toast('Chọn ngựa trước!', 'warn'); return; }
    const bet = Casino.deductBet('horse');
    if (bet === false) return;

    G.bet = bet;
    G.betType = document.getElementById('bet-type-horse')?.value || 'clean';
    G.phase = 'running';
    G.positions = new Array(7).fill(0);
    G.finished = []; G.winner = -1;

    initHorseStates();
    document.getElementById('horse-result').className = 'casino-result';
    document.getElementById('horse-result').textContent = '';
    document.querySelectorAll('.horse-pick-btn').forEach(b => b.disabled = true);
    const sb = document.getElementById('btn-horse-start');
    if (sb) { sb.disabled = true; sb.textContent = '🏇 ĐANG ĐUA...'; }
    Casino.updateAllBalances();

    // Chạy nhanh hơn: 30ms/tick thay vì 80ms
    if (G.interval) clearInterval(G.interval);
    G.interval = setInterval(tick, 30);
  }

  function _finish() {
    const won = G.winner === G.betHorse;
    const odds = G.odds[G.betHorse];
    const myRank = G.finished.indexOf(G.betHorse) + 1;

    if (won) {
      const pay = Math.floor(G.bet * odds);
      Casino.addWin(pay);
      Casino.showResult('horse-result', 'win',
        `${HORSES[G.winner].name} THẮNG! +${Format.money(pay - G.bet)} (×${odds})`);
    } else {
      Casino.showResult('horse-result', 'lose',
        `${HORSES[G.winner].name} THẮNG! Ngựa bạn về thứ ${myRank} −${Format.money(G.bet)}`);
    }

    const sb = document.getElementById('btn-horse-start');
    if (sb) { sb.disabled = false; sb.textContent = '🏇 ĐẶT CƯỢC & XUẤT PHÁT'; }
    document.querySelectorAll('.horse-pick-btn').forEach(b => b.disabled = false);

    setTimeout(() => {
      G.betHorse = null; G.phase = 'idle';
      G.positions = new Array(7).fill(0);
      G.finished = []; G.winner = -1;
      G.odds = randomOdds();
      // Reset DOM nếu đang xem
      for (let i = 0; i < 7; i++) {
        const el = document.getElementById('horse-' + i);
        if (el) { el.style.left = '0%'; el.textContent = '🐎'; }
        const od = document.getElementById('horse-odds-' + i);
        if (od) od.textContent = '×' + G.odds[i];
        const pk = document.getElementById('pick-odds-' + i);
        if (pk) pk.textContent = '×' + G.odds[i];
      }
      document.querySelectorAll('.horse-pick-btn').forEach(b => b.classList.remove('selected'));
      const sb2 = document.getElementById('btn-horse-start');
      if (sb2) sb2.disabled = true;
    }, 3000);

    Casino.updateAllBalances();
  }

  return { renderHTML, bindEvents };
})();