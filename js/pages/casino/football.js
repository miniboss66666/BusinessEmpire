/* ============================================
   CASINO/FOOTBALL.JS
   - Bóng di chuyển tự do, KHÔNG bị kẹt
   - Chỉ bẻ lái khi đến gần "receiver" được chỉ định
   - Possession: đội giỏi giữ bóng lâu hơn
   - Cầu thủ đứng đội hình, di chuyển theo vai trò
   ============================================ */

const CasinoFootball = (() => {

  const ALL_TEAMS = [
    'Man City','Arsenal','Liverpool','Chelsea','Man United','Tottenham',
    'Real Madrid','Barcelona','Atletico','Sevilla','Valencia','Villarreal',
    'PSG','Lyon','Marseille','Monaco','Lille',
    'Bayern','Dortmund','Leipzig','Leverkusen','Frankfurt',
    'Inter','Juventus','Milan','Napoli','Roma',
    'Ajax','Porto','Benfica',
  ];

  // Rating ảnh hưởng possession & độ chính xác truyền bóng
  const TEAM_RATINGS = {};
  ALL_TEAMS.forEach(t => { TEAM_RATINGS[t] = 55 + Math.floor(Math.random() * 40); });

  const TEAM_COLORS = [
    '#e63946','#457b9d','#2a9d8f','#e9c46a','#f4a261',
    '#264653','#a8dadc','#6a994e','#bc4749','#7209b7',
    '#e76f51','#48cae4','#f72585','#4cc9f0','#fb8500',
  ];

  const W = 320, H = 180;
  const PR = 6.5;

  const FORMATIONS = {
    '4-4-2': [
      {x:.08,y:.5,role:'gk'},
      {x:.22,y:.2,role:'def'},{x:.22,y:.4,role:'def'},{x:.22,y:.6,role:'def'},{x:.22,y:.8,role:'def'},
      {x:.45,y:.15,role:'mid'},{x:.45,y:.38,role:'mid'},{x:.45,y:.62,role:'mid'},{x:.45,y:.85,role:'mid'},
      {x:.68,y:.35,role:'fwd'},{x:.68,y:.65,role:'fwd'},
    ],
    '4-3-3': [
      {x:.08,y:.5,role:'gk'},
      {x:.22,y:.18,role:'def'},{x:.22,y:.38,role:'def'},{x:.22,y:.62,role:'def'},{x:.22,y:.82,role:'def'},
      {x:.45,y:.25,role:'mid'},{x:.45,y:.5,role:'mid'},{x:.45,y:.75,role:'mid'},
      {x:.68,y:.18,role:'fwd'},{x:.68,y:.5,role:'fwd'},{x:.68,y:.82,role:'fwd'},
    ],
    '3-5-2': [
      {x:.08,y:.5,role:'gk'},
      {x:.22,y:.25,role:'def'},{x:.22,y:.5,role:'def'},{x:.22,y:.75,role:'def'},
      {x:.42,y:.12,role:'mid'},{x:.42,y:.33,role:'mid'},{x:.42,y:.5,role:'mid'},{x:.42,y:.67,role:'mid'},{x:.42,y:.88,role:'mid'},
      {x:.68,y:.35,role:'fwd'},{x:.68,y:.65,role:'fwd'},
    ],
    '4-2-3-1': [
      {x:.08,y:.5,role:'gk'},
      {x:.2,y:.18,role:'def'},{x:.2,y:.4,role:'def'},{x:.2,y:.6,role:'def'},{x:.2,y:.82,role:'def'},
      {x:.38,y:.35,role:'mid'},{x:.38,y:.65,role:'mid'},
      {x:.55,y:.15,role:'mid'},{x:.55,y:.5,role:'mid'},{x:.55,y:.85,role:'mid'},
      {x:.72,y:.5,role:'fwd'},
    ],
    '5-3-2': [
      {x:.08,y:.5,role:'gk'},
      {x:.2,y:.1,role:'def'},{x:.2,y:.3,role:'def'},{x:.2,y:.5,role:'def'},{x:.2,y:.7,role:'def'},{x:.2,y:.9,role:'def'},
      {x:.45,y:.25,role:'mid'},{x:.45,y:.5,role:'mid'},{x:.45,y:.75,role:'mid'},
      {x:.68,y:.35,role:'fwd'},{x:.68,y:.65,role:'fwd'},
    ],
  };

  const FORMATION_NAMES = Object.keys(FORMATIONS);

  let canvas, ctx, animFrame;

  let S = {
    phase: 'select',
    matches: [], selected: null, betSide: null,
    bet: 0, elapsed: 0, score: [0,0],
    interval: null,
    players: [],
    // BALL STATE
    ball: { x: W/2, y: H/2, vx: 0, vy: 0 },
    // Cầu thủ đang "nhận bóng" tiếp theo (index trong players[])
    // Bóng đi về phía này, khi đến gần thì bẻ lái tiếp
    receiver: -1,
    receiverTarget: null, // {x,y} điểm đến sau khi nhận
    // Đội đang có possession ('home'|'away')
    possession: 'home',
    possessionTimer: 0,
    pendingGoals: [],
    nextGoal: null,
    goalAnim: 0,
  };

  // ═══════════════════════════════════════════
  // GENERATE MATCHES
  // ═══════════════════════════════════════════
  function generateMatches() {
    const shuffled = [...ALL_TEAMS].sort(() => Math.random() - 0.5);
    S.matches = [];
    for (let i = 0; i < 6; i++) {
      const h = shuffled[i*2], a = shuffled[i*2+1];
      const hRating = TEAM_RATINGS[h], aRating = TEAM_RATINGS[a];
      const hColor = TEAM_COLORS[i % TEAM_COLORS.length];
      const aColor = TEAM_COLORS[(i+7) % TEAM_COLORS.length];
      const hForm = FORMATION_NAMES[Math.floor(Math.random() * FORMATION_NAMES.length)];
      const aForm = FORMATION_NAMES[Math.floor(Math.random() * FORMATION_NAMES.length)];
      // Odds dựa theo rating
      const ratingDiff = (hRating - aRating) / 100;
      const homeOdds = +(Math.max(1.3, 2.1 - ratingDiff * 2 + Math.random() * 0.4)).toFixed(2);
      const awayOdds = +(Math.max(1.3, 2.1 + ratingDiff * 2 + Math.random() * 0.4)).toFixed(2);
      const drawOdds = +(2.8 + Math.random() * 1.5).toFixed(2);
      // Pre-gen goals — đội mạnh hơn ghi nhiều hơn
      const n = Math.floor(Math.random() * 5);
      const goals = [];
      for (let g = 0; g < n; g++) {
        const homeChance = hRating / (hRating + aRating);
        goals.push({
          minute: Math.floor(Math.random() * 89) + 1,
          team: Math.random() < homeChance ? 'home' : 'away',
          scored: false,
        });
      }
      goals.sort((a, b) => a.minute - b.minute);
      S.matches.push({ home:h, away:a, hColor, aColor, hForm, aForm,
        homeOdds, awayOdds, drawOdds, goals, hRating, aRating });
    }
  }

  // ═══════════════════════════════════════════
  // INIT PLAYERS
  // ═══════════════════════════════════════════
  function initPlayers(idx) {
    const m = S.matches[idx];
    S.players = [];
    FORMATIONS[m.hForm].forEach((p, i) => {
      S.players.push({ team:'home', role:p.role, color:m.hColor,
        bx:p.x*W, by:p.y*H, x:p.x*W, y:p.y*H, id:i });
    });
    FORMATIONS[m.aForm].forEach((p, i) => {
      S.players.push({ team:'away', role:p.role, color:m.aColor,
        bx:(1-p.x)*W, by:p.y*H, x:(1-p.x)*W, y:p.y*H, id:i });
    });
    S.ball = { x:W/2, y:H/2, vx:1.2, vy:0.5 };
    S.receiver = -1;
    S.receiverTarget = null;
    S.possession = Math.random() < 0.5 ? 'home' : 'away';
    S.possessionTimer = 0;
    S.goalAnim = 0;

    // Kick off — chọn receiver đầu tiên
    scheduleNextPass();
  }

  // ═══════════════════════════════════════════
  // RENDER HTML
  // ═══════════════════════════════════════════
  function renderHTML() {
    generateMatches();
    S.phase='select'; S.selected=null; S.betSide=null;
    return `
      <div class="casino-game-wrap">
        <div class="fb-match-list" id="fb-match-list">
          <div class="fb-list-title">⚽ CHỌN TRẬN ĐẤU</div>
          ${S.matches.map((m,i) => `
            <div class="fb-match-row" data-idx="${i}">
              <span class="fb-row-home" style="color:${m.hColor}">${m.home}</span>
              <div class="fb-row-center">
                <span class="fb-row-form" style="color:${m.hColor}55;border-color:${m.hColor}44">${m.hForm}</span>
                <span class="fb-row-odds-mid">
                  <span style="color:var(--gold)">×${m.homeOdds}</span>
                  <span style="color:var(--text-dim)">×${m.drawOdds}</span>
                  <span style="color:var(--gold)">×${m.awayOdds}</span>
                </span>
                <span class="fb-row-form" style="color:${m.aColor}55;border-color:${m.aColor}44">${m.aForm}</span>
              </div>
              <span class="fb-row-away" style="color:${m.aColor}">${m.away}</span>
            </div>`).join('')}
        </div>

        <div id="fb-pitch-wrap" style="display:none">
          <div class="fb-pitch-header">
            <div class="fb-pitch-team-info">
              <span class="fb-pitch-team" id="fb-pitch-home"></span>
              <span class="fb-pitch-form" id="fb-pitch-hform"></span>
            </div>
            <div class="fb-score-box">
              <span id="fb-score-h">0</span>
              <span style="color:var(--text-dim)"> – </span>
              <span id="fb-score-a">0</span>
            </div>
            <div class="fb-pitch-team-info" style="align-items:flex-end">
              <span class="fb-pitch-team" id="fb-pitch-away"></span>
              <span class="fb-pitch-form" id="fb-pitch-aform"></span>
            </div>
          </div>
          <div class="fb-pitch-container">
            <canvas id="fb-canvas" width="${W}" height="${H}"></canvas>
          </div>
          <div class="fb-timer-row">
            <div class="sport-timer-bar-wrap" style="flex:1">
              <div class="sport-timer-bar" id="fb-bar" style="width:0%"></div>
            </div>
            <div class="fb-timer-label" id="fb-time">0'</div>
          </div>
          <div class="sport-events" id="fb-events"></div>
        </div>

        <div class="sport-bet-odds" id="fb-odds" style="display:none">
          <button class="sport-odds-btn" data-side="home">
            <span class="odds-team" id="fb-label-home">Nhà</span>
            <span class="odds-val" id="fb-odds-home">×2.10</span>
          </button>
          <button class="sport-odds-btn" data-side="draw">
            <span class="odds-team">Hòa</span>
            <span class="odds-val" id="fb-odds-draw">×3.20</span>
          </button>
          <button class="sport-odds-btn" data-side="away">
            <span class="odds-team" id="fb-label-away">Khách</span>
            <span class="odds-val" id="fb-odds-away">×3.50</span>
          </button>
        </div>

        <div class="casino-result" id="fb-result"></div>
        ${Casino.renderBetControls('fb')}
        <button class="casino-play-btn" id="btn-fb-start" disabled>⚽ ĐẶT CƯỢC & BẮT ĐẦU</button>
      </div>`;
  }

  // ═══════════════════════════════════════════
  // BIND EVENTS
  // ═══════════════════════════════════════════
  function bindEvents() {
    document.querySelectorAll('.fb-match-row').forEach(row => {
      row.addEventListener('click', () => {
        if (S.phase !== 'select') return;
        document.querySelectorAll('.fb-match-row').forEach(r => r.classList.remove('selected'));
        row.classList.add('selected');
        selectMatch(parseInt(row.dataset.idx));
      });
    });
    document.querySelectorAll('.sport-odds-btn[data-side]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (S.phase !== 'select') return;
        document.querySelectorAll('.sport-odds-btn[data-side]').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        S.betSide = btn.dataset.side;
        updateStartBtn();
      });
    });
    document.getElementById('btn-fb-start')?.addEventListener('click', startMatch);
  }

  function selectMatch(idx) {
    S.selected = idx;
    const m = S.matches[idx];
    document.getElementById('fb-pitch-wrap').style.display = '';
    document.getElementById('fb-odds').style.display = '';
    document.getElementById('fb-pitch-home').textContent = m.home;
    document.getElementById('fb-pitch-home').style.color = m.hColor;
    document.getElementById('fb-pitch-hform').textContent = m.hForm;
    document.getElementById('fb-pitch-hform').style.color = m.hColor;
    document.getElementById('fb-pitch-away').textContent = m.away;
    document.getElementById('fb-pitch-away').style.color = m.aColor;
    document.getElementById('fb-pitch-aform').textContent = m.aForm;
    document.getElementById('fb-pitch-aform').style.color = m.aColor;
    document.getElementById('fb-label-home').textContent = m.home;
    document.getElementById('fb-label-away').textContent = m.away;
    document.getElementById('fb-odds-home').textContent = '×' + m.homeOdds;
    document.getElementById('fb-odds-draw').textContent = '×' + m.drawOdds;
    document.getElementById('fb-odds-away').textContent = '×' + m.awayOdds;
    canvas = document.getElementById('fb-canvas');
    ctx = canvas?.getContext('2d');
    initPlayers(idx);
    drawFrame();
    S.betSide = null;
    document.querySelectorAll('.sport-odds-btn[data-side]').forEach(b => b.classList.remove('selected'));
    updateStartBtn();
  }

  function updateStartBtn() {
    const btn = document.getElementById('btn-fb-start');
    if (btn) btn.disabled = !(S.selected !== null && S.betSide && S.phase === 'select');
  }

  // ═══════════════════════════════════════════
  // POSSESSION — chọn receiver tiếp theo
  // Nguyên tắc: chọn cầu thủ GẦN BÓNG NHẤT trong đội đang có possession
  // ═══════════════════════════════════════════
  function scheduleNextPass() {
    if (!S.matches[S.selected]) return;
    if (S.receiver !== -1) return; // đã có receiver rồi, không override
    const m = S.matches[S.selected];
    const possTeam = S.possession;
    const rating = possTeam === 'home' ? m.hRating : m.aRating;
    const isHome = possTeam === 'home';
    const b = S.ball;

    // Lấy tất cả cầu thủ đội đang có bóng (trừ GK)
    const candidates = S.players
      .map((p, i) => ({ p, i, dist: Math.hypot(p.x - b.x, p.y - b.y) }))
      .filter(({ p }) => p.team === possTeam && p.role !== 'gk');

    if (!candidates.length) return;

    // Sắp xếp theo khoảng cách bóng — gần nhất lên đầu
    candidates.sort((a, b) => a.dist - b.dist);

    // Chọn trong 3 người gần nhất (random nhẹ để không quá predict)
    const topN = candidates.slice(0, Math.min(3, candidates.length));
    // Weight: gần hơn = ưu tiên hơn, role fwd ưu tiên nếu đang gần khung thành đối
    const goalX = isHome ? W : 0;
    const weighted = topN.map(c => {
      const distToGoal = Math.abs(c.p.x - goalX);
      const roleBonus = c.p.role === 'fwd' ? 1.5 : c.p.role === 'mid' ? 1.1 : 0.9;
      // Gần bóng = điểm cao, gần gôn = điểm cao nếu là fwd
      return { ...c, w: (1 / (c.dist + 1)) * roleBonus + (c.p.role === 'fwd' ? 30 / (distToGoal + 1) : 0) };
    });
    weighted.sort((a, b) => b.w - a.w);
    const chosen = weighted[0]; // Lấy người điểm cao nhất

    S.receiver = chosen.i;
    const p = chosen.p;

    // Target sau khi nhận bóng
    const shootGoalX = isHome ? W - 8 : 8; // vị trí TRONG gôn
    const shootGoalY = H / 2 + (Math.random() - 0.5) * 28; // trong xà ngang

    let nextTargetX, nextTargetY;
    const distToGoal = isHome ? (W - p.x) : p.x;

    if (p.role === 'fwd' && distToGoal < W * 0.35) {
      // Fwd gần gôn → sút thẳng vào trong khung thành
      nextTargetX = shootGoalX;
      nextTargetY = shootGoalY;
    } else if (p.role === 'fwd') {
      // Fwd xa → tiến về phía gôn
      nextTargetX = isHome ? Math.min(W-10, p.x + 50 + Math.random()*30) : Math.max(10, p.x - 50 - Math.random()*30);
      nextTargetY = H/2 + (Math.random()-0.5)*40;
    } else if (p.role === 'mid') {
      // Mid → truyền về phía fwd hoặc tiến lên
      const fwds = S.players.filter(fp => fp.team === possTeam && fp.role === 'fwd');
      if (fwds.length && Math.random() < 0.6) {
        const target = fwds[Math.floor(Math.random()*fwds.length)];
        nextTargetX = target.x + (Math.random()-0.5)*20;
        nextTargetY = target.y + (Math.random()-0.5)*15;
      } else {
        nextTargetX = isHome ? Math.min(W-10, p.x+35+Math.random()*30) : Math.max(10, p.x-35-Math.random()*30);
        nextTargetY = p.y + (Math.random()-0.5)*50;
      }
    } else {
      // Def → build up, truyền cho mid gần nhất
      const mids = S.players
        .filter(fp => fp.team === possTeam && fp.role === 'mid')
        .sort((a,z) => Math.hypot(a.x-b.x,a.y-b.y) - Math.hypot(z.x-b.x,z.y-b.y));
      if (mids.length) {
        nextTargetX = mids[0].x + (Math.random()-0.5)*20;
        nextTargetY = mids[0].y + (Math.random()-0.5)*15;
      } else {
        nextTargetX = isHome ? p.x+40 : p.x-40;
        nextTargetY = p.y + (Math.random()-0.5)*30;
      }
    }

    nextTargetX = Math.max(8, Math.min(W-8, nextTargetX));
    nextTargetY = Math.max(8, Math.min(H-8, nextTargetY));
    S.receiverTarget = { x: nextTargetX, y: nextTargetY };

    // Thỉnh thoảng đội yếu mất bóng
    const loseChance = 0.06 + (100 - rating) / 600;
    if (Math.random() < loseChance) {
      const delay = 600 + Math.random() * 1000;
      setTimeout(() => {
        if (S.phase !== 'playing') return;
        S.possession = S.possession === 'home' ? 'away' : 'home';
        S.receiver = -1;
        scheduleNextPass();
      }, delay);
    }
  }

  // ═══════════════════════════════════════════
  // SIMULATE — bóng + cầu thủ
  // ═══════════════════════════════════════════
  function simulate() {
    const b = S.ball;

    // ── Di chuyển bóng thẳng (KHÔNG bị chặn bởi cầu thủ) ──
    b.x += b.vx;
    b.y += b.vy;

    // Ma sát rất nhẹ
    b.vx *= 0.992;
    b.vy *= 0.992;

    // Bounce biên trên/dưới
    if (b.y < 7)  { b.vy = Math.abs(b.vy);  b.y = 7; }
    if (b.y > H-7){ b.vy = -Math.abs(b.vy); b.y = H-7; }

    // Tốc độ tối thiểu — bóng luôn di chuyển
    const speed = Math.hypot(b.vx, b.vy);
    if (speed < 0.8) {
      const angle = Math.atan2(b.vy, b.vx);
      b.vx = Math.cos(angle) * 1.0;
      b.vy = Math.sin(angle) * 1.0;
    }

    // ── Kiểm tra đến gần RECEIVER ──
    if (S.receiver >= 0 && S.receiver < S.players.length) {
      const recv = S.players[S.receiver];
      const dist = Math.hypot(b.x - recv.x, b.y - recv.y);

      if (dist < PR * 2.5) {
        // Bóng đã đến tay receiver → bẻ lái về target tiếp theo
        const tgt = S.receiverTarget || { x: W/2, y: H/2 };
        const dx = tgt.x - b.x, dy = tgt.y - b.y;
        const d = Math.hypot(dx, dy) || 1;
        const spd = 2.0 + Math.random() * 1.5;
        b.vx = (dx / d) * spd;
        b.vy = (dy / d) * spd;
        S.receiver = -1;

        // Schedule pass tiếp theo sau delay ngắn
        const m = S.matches[S.selected];
        const rating = S.possession === 'home' ? m.hRating : m.aRating;
        const delay = 400 + Math.random() * (800 - rating * 4); // team giỏi pass nhanh hơn
        setTimeout(() => {
          if (S.phase === 'playing') scheduleNextPass();
        }, Math.max(200, delay));
      }
    } else if (S.receiver === -1) {
      // Không có receiver → schedule lại
      scheduleNextPass();
    }

    // ── GOAL ──
    // Khung thành trái: x=5..33, y=H/2-26..H/2+26 (theo drawPitch)
    // Khung thành phải: x=W-33..W-5
    // Bóng vào gôn = vượt qua cột dọc ngoài cùng
    const inLeftGoal  = b.x < 14 && b.y > H/2-22 && b.y < H/2+22;
    const inRightGoal = b.x > W-14 && b.y > H/2-22 && b.y < H/2+22;

    // Bóng chạm cột dọc (biên) nhưng không vào gôn → bounce
    if (b.x < 8 && !inLeftGoal)  { b.vx =  Math.abs(b.vx) * 0.8; b.x = 9;   S.receiver = -1; S.possession = 'home'; scheduleNextPass(); }
    if (b.x > W-8 && !inRightGoal){ b.vx = -Math.abs(b.vx) * 0.8; b.x = W-9; S.receiver = -1; S.possession = 'away'; scheduleNextPass(); }

    if ((inLeftGoal || inRightGoal) && S.goalAnim === 0) {
      if (S.nextGoal && !S.nextGoal.scored) {
        // Pre-gen goal → ghi bàn
        S.nextGoal.scored = true;
        const team = inRightGoal ? 'home' : 'away';
        if (team === 'home') S.score[0]++; else S.score[1]++;
        document.getElementById('fb-score-h').textContent = S.score[0];
        document.getElementById('fb-score-a').textContent = S.score[1];
        addEvent(team, S.elapsed);
        S.goalAnim = 30;
        S.receiver = -1;

        setTimeout(() => {
          if (S.phase !== 'playing') return;
          b.x = W/2; b.y = H/2 + (Math.random()-0.5)*10;
          b.vx = (Math.random()-0.5)*2; b.vy = (Math.random()-0.5)*1.5;
          S.possession = team === 'home' ? 'away' : 'home';
          scheduleNextPass();
        }, 1800);
      } else {
        // Chưa đến lúc ghi bàn → bóng bật ra khỏi gôn (thủ môn cản)
        b.vx = inLeftGoal ? Math.abs(b.vx) * 1.1 : -Math.abs(b.vx) * 1.1;
        b.vy += (Math.random()-0.5)*0.5;
        b.x = inLeftGoal ? 20 : W-20;
        S.receiver = -1;
        // Possession về đội phòng thủ (thủ môn giữ bóng)
        S.possession = inLeftGoal ? 'home' : 'away';
        scheduleNextPass();
      }
    }

    // ── Di chuyển cầu thủ theo vai trò ──
    movePlayers();

    if (S.goalAnim > 0) S.goalAnim--;
  }

  // ═══════════════════════════════════════════
  // DI CHUYỂN CẦU THỦ
  // ═══════════════════════════════════════════
  function movePlayers() {
    const b = S.ball;
    S.players.forEach((p, i) => {
      const isHome = p.team === 'home';
      const hasPossession = S.possession === p.team;
      const isReceiver = S.receiver === i;
      let tx = p.bx, ty = p.by;

      if (p.role === 'gk') {
        // GK theo Y bóng khi bóng gần
        tx = p.bx;
        ty = p.by * 0.3 + b.y * 0.7;
        ty = Math.max(H/2-24, Math.min(H/2+24, ty));

      } else if (p.role === 'def') {
        const ballInOwnHalf = isHome ? b.x < W/2 : b.x > W/2;
        if (ballInOwnHalf) {
          tx = p.bx; ty = p.by * 0.5 + b.y * 0.5;
        } else {
          tx = p.bx + (isHome ? 0.08*W : -0.08*W);
          ty = p.by * 0.6 + b.y * 0.4;
        }

      } else if (p.role === 'mid') {
        const push = isHome ? (b.x/W - 0.5)*0.12*W : -(b.x/W - 0.5)*0.12*W;
        tx = p.bx + push;
        ty = p.by * 0.5 + b.y * 0.5;

      } else if (p.role === 'fwd') {
        if (hasPossession) {
          // Tiến lên khi đội đang có bóng
          const fwdX = isHome ? Math.max(p.bx, b.x - 25) : Math.min(p.bx, b.x + 25);
          tx = p.bx * 0.3 + fwdX * 0.7;
          ty = p.by * 0.2 + b.y * 0.8;
          tx = isHome ? Math.max(W*0.4, Math.min(W-10, tx)) : Math.max(10, Math.min(W*0.6, tx));
        } else {
          // Đội không có bóng → fwd ở giữa chờ cơ hội
          tx = p.bx * 0.7 + W/2 * 0.3;
          ty = p.by * 0.5 + b.y * 0.5;
        }
      }

      // Receiver di chuyển về phía bóng chủ động
      if (isReceiver) {
        tx = b.x + (isHome ? -15 : 15);
        ty = b.y;
      }

      tx = Math.max(10, Math.min(W-10, tx));
      ty = Math.max(10, Math.min(H-10, ty));

      const spd = isReceiver ? 0.15 : (p.role==='fwd' ? 0.05 : p.role==='mid' ? 0.035 : 0.025);
      p.x += (tx - p.x) * spd;
      p.y += (ty - p.y) * spd;
    });
  }

  // ═══════════════════════════════════════════
  // DRAW
  // ═══════════════════════════════════════════
  function drawPitch() {
    if (!ctx) return;
    ctx.fillStyle = '#1d5c1d';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i%2===0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)';
      ctx.fillRect(i*(W/8), 0, W/8, H);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(5, 5, W-10, H-10);
    ctx.beginPath(); ctx.moveTo(W/2, 5); ctx.lineTo(W/2, H-5); ctx.stroke();
    ctx.beginPath(); ctx.arc(W/2, H/2, 22, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(W/2, H/2, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.strokeRect(5, H/2-26, 28, 52);
    ctx.strokeRect(5, H/2-13, 12, 26);
    ctx.strokeRect(W-33, H/2-26, 28, 52);
    ctx.strokeRect(W-17, H/2-13, 12, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(46, H/2, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(W-46, H/2, 2, 0, Math.PI*2); ctx.fill();
  }

  function drawPlayers() {
    if (!ctx) return;
    S.players.forEach((p, i) => {
      const isReceiver = S.receiver === i;
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath(); ctx.ellipse(p.x, p.y+PR, PR*0.7, PR*0.25, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, PR, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = isReceiver ? '#fff' : 'rgba(0,0,0,0.5)';
      ctx.lineWidth = isReceiver ? 2 : 1.2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.font = 'bold 5px Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p.role==='gk'?'G':p.role==='def'?'D':p.role==='mid'?'M':'F', p.x, p.y);
    });
  }

  function drawBall() {
    if (!ctx) return;
    const b = S.ball;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(b.x, b.y+5, 4, 1.5, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(b.x, b.y, 4.5, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 0.8; ctx.stroke();
  }

  function drawGoalFlash() {
    if (S.goalAnim <= 0) return;
    const a = S.goalAnim / 30 * 0.5;
    ctx.fillStyle = `rgba(255,220,0,${a})`;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = `rgba(255,255,255,${a * 1.8})`;
    ctx.font = 'bold 26px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('GOAL!', W/2, H/2);
  }

  function drawFrame() {
    drawPitch(); drawPlayers(); drawBall(); drawGoalFlash();
  }

  function addEvent(team, minute) {
    const m = S.matches[S.selected];
    const name  = team === 'home' ? m.home : m.away;
    const color = team === 'home' ? m.hColor : m.aColor;
    const el = document.getElementById('fb-events');
    if (el) {
      el.innerHTML += `<div class="sport-event" style="color:${color}">⚽ ${minute}' — ${name.toUpperCase()}</div>`;
      el.scrollTop = el.scrollHeight;
    }
  }

  // ═══════════════════════════════════════════
  // START
  // ═══════════════════════════════════════════
  function startMatch() {
    if (S.phase !== 'select' || S.selected === null || !S.betSide) return;
    const bet = Casino.deductBet('fb');
    if (bet === false) return;
    S.bet = bet; S.phase = 'playing';
    S.elapsed = 0; S.score = [0,0]; S.goalAnim = 0; S.nextGoal = null;
    const m = S.matches[S.selected];
    S.pendingGoals = m.goals.map(g => ({ ...g, scored:false }));
    document.getElementById('fb-result').className = 'casino-result';
    document.getElementById('fb-events').innerHTML = '';
    document.getElementById('fb-score-h').textContent = '0';
    document.getElementById('fb-score-a').textContent = '0';
    document.getElementById('fb-match-list').style.display = 'none';
    document.querySelectorAll('.sport-odds-btn[data-side]').forEach(b => b.disabled = true);
    const sb = document.getElementById('btn-fb-start');
    if (sb) { sb.disabled = true; sb.textContent = '⏳ ĐANG THI ĐẤU...'; }
    initPlayers(S.selected);
    Casino.updateAllBalances();

    let lastSim = 0;
    function loop(ts) {
      if (S.phase !== 'playing') return;
      if (ts - lastSim >= 50) { lastSim = ts; simulate(); }
      drawFrame();
      animFrame = requestAnimationFrame(loop);
    }
    animFrame = requestAnimationFrame(loop);

    S.interval = setInterval(() => {
      S.elapsed++;
      const bar = document.getElementById('fb-bar');
      if (bar) bar.style.width = (S.elapsed / 90 * 100) + '%';
      const tl = document.getElementById('fb-time');
      if (tl) tl.textContent = S.elapsed + "'";
      const due = S.pendingGoals.find(g => g.minute === S.elapsed && !g.scored);
      if (due) S.nextGoal = due;
      if (S.elapsed >= 90) {
        clearInterval(S.interval);
        cancelAnimationFrame(animFrame);
        setTimeout(() => { drawFrame(); finish(); }, 200);
      }
    }, 1000);
  }

  // ═══════════════════════════════════════════
  // FINISH
  // ═══════════════════════════════════════════
  function finish() {
    S.phase = 'done';
    const m = S.matches[S.selected];
    const [h, a] = S.score;
    const winner = h > a ? 'home' : a > h ? 'away' : 'draw';
    const won = winner === S.betSide;
    const odds = S.betSide==='home' ? m.homeOdds : S.betSide==='away' ? m.awayOdds : m.drawOdds;
    if (won) {
      const pay = Math.floor(S.bet * odds);
      Casino.addWin(pay);
      Casino.showResult('fb-result', 'win', `THẮNG! +${Format.money(pay-S.bet)} (×${odds}) | ${h}–${a}`);
    } else {
      Casino.showResult('fb-result', 'lose', `THUA! −${Format.money(S.bet)} | KQ: ${h}–${a}`);
    }
    const sb = document.getElementById('btn-fb-start');
    if (sb) { sb.disabled = false; sb.textContent = '⚽ CHƠI LẠI'; }
    setTimeout(() => {
      S.phase = 'select'; S.selected = null; S.betSide = null;
      generateMatches();
      document.getElementById('fb-match-list').style.display = '';
      document.getElementById('fb-pitch-wrap').style.display = 'none';
      document.getElementById('fb-odds').style.display = 'none';
      document.getElementById('fb-result').className = 'casino-result';
      const list = document.getElementById('fb-match-list');
      if (list) {
        list.innerHTML = `<div class="fb-list-title">⚽ CHỌN TRẬN ĐẤU</div>` +
          S.matches.map((m,i) => `
            <div class="fb-match-row" data-idx="${i}">
              <span class="fb-row-home" style="color:${m.hColor}">${m.home}</span>
              <div class="fb-row-center">
                <span class="fb-row-form" style="color:${m.hColor}55;border-color:${m.hColor}44">${m.hForm}</span>
                <span class="fb-row-odds-mid">
                  <span style="color:var(--gold)">×${m.homeOdds}</span>
                  <span style="color:var(--text-dim)">×${m.drawOdds}</span>
                  <span style="color:var(--gold)">×${m.awayOdds}</span>
                </span>
                <span class="fb-row-form" style="color:${m.aColor}55;border-color:${m.aColor}44">${m.aForm}</span>
              </div>
              <span class="fb-row-away" style="color:${m.aColor}">${m.away}</span>
            </div>`).join('');
        list.querySelectorAll('.fb-match-row').forEach(row => {
          row.addEventListener('click', () => {
            if (S.phase !== 'select') return;
            list.querySelectorAll('.fb-match-row').forEach(r => r.classList.remove('selected'));
            row.classList.add('selected');
            selectMatch(parseInt(row.dataset.idx));
          });
        });
      }
      document.querySelectorAll('.sport-odds-btn[data-side]').forEach(b => b.disabled = false);
      updateStartBtn();
    }, 3000);
    Casino.updateAllBalances();
  }

  return { renderHTML, bindEvents };
})();