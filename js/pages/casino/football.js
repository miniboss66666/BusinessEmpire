// @ts-nocheck
/* ============================================
   CASINO/FOOTBALL.JS — Simulation thực tế hơn
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

  const TEAM_COLORS = [
    '#e63946','#457b9d','#2a9d8f','#e9c46a','#f4a261',
    '#264653','#a8dadc','#6a994e','#bc4749','#7209b7',
    '#e76f51','#48cae4','#f72585','#4cc9f0','#fb8500',
  ];

  const W = 320, H = 180;
  const PR = 6;
  const BR = 4.5;
  const TACKLE_RANGE  = 14;
  const RECEIVE_RANGE = 12;

  const FORMATIONS = {
    '4-4-2': [
      {x:.08,y:.5,role:'gk'},
      {x:.22,y:.2,role:'def'},{x:.22,y:.4,role:'def'},{x:.22,y:.6,role:'def'},{x:.22,y:.8,role:'def'},
      {x:.45,y:.18,role:'mid'},{x:.45,y:.38,role:'mid'},{x:.45,y:.62,role:'mid'},{x:.45,y:.82,role:'mid'},
      {x:.7,y:.38,role:'fwd'},{x:.7,y:.62,role:'fwd'},
    ],
    '4-3-3': [
      {x:.08,y:.5,role:'gk'},
      {x:.22,y:.18,role:'def'},{x:.22,y:.38,role:'def'},{x:.22,y:.62,role:'def'},{x:.22,y:.82,role:'def'},
      {x:.45,y:.28,role:'mid'},{x:.45,y:.5,role:'mid'},{x:.45,y:.72,role:'mid'},
      {x:.7,y:.18,role:'fwd'},{x:.7,y:.5,role:'fwd'},{x:.7,y:.82,role:'fwd'},
    ],
    '3-5-2': [
      {x:.08,y:.5,role:'gk'},
      {x:.22,y:.25,role:'def'},{x:.22,y:.5,role:'def'},{x:.22,y:.75,role:'def'},
      {x:.38,y:.1,role:'mid'},{x:.38,y:.3,role:'mid'},{x:.38,y:.5,role:'mid'},{x:.38,y:.7,role:'mid'},{x:.38,y:.9,role:'mid'},
      {x:.7,y:.38,role:'fwd'},{x:.7,y:.62,role:'fwd'},
    ],
    '4-2-3-1': [
      {x:.08,y:.5,role:'gk'},
      {x:.2,y:.18,role:'def'},{x:.2,y:.4,role:'def'},{x:.2,y:.6,role:'def'},{x:.2,y:.82,role:'def'},
      {x:.38,y:.35,role:'mid'},{x:.38,y:.65,role:'mid'},
      {x:.56,y:.15,role:'mid'},{x:.56,y:.5,role:'mid'},{x:.56,y:.85,role:'mid'},
      {x:.74,y:.5,role:'fwd'},
    ],
  };

  const FORMATION_NAMES = Object.keys(FORMATIONS);
  const MAX_SPD = { gk:1.2, def:1.6, mid:1.9, fwd:2.2 };

  // Goal zone: x < GOAL_X_L or x > GOAL_X_R, y in [H/2-22, H/2+22]
  const GOAL_X_L = 10;
  const GOAL_X_R = W - 10;
  const GOAL_Y1  = H/2 - 22;
  const GOAL_Y2  = H/2 + 22;

  let canvas, ctx, animFrame;

  let S = {
    phase:'select', matches:[], selected:null, betSide:null,
    bet:0, elapsed:0, score:[0,0],
    interval:null,
    players:[],
    ball:{ x:W/2, y:H/2, vx:0, vy:0 },
    holder:-1, receiver:-1,
    action:null, actionTimer:0,
    pendingGoals:[], nextGoal:null,
    goalAnim:0, goalCooldown:0,
    passIntercepted:false,
  };

  // ═══════════════════════════════════════════
  // GENERATE MATCHES
  // ═══════════════════════════════════════════
  function generateMatches() {
    const shuffled = [...ALL_TEAMS].sort(() => Math.random() - 0.5);
    S.matches = [];
    for (let i = 0; i < 6; i++) {
      const h = shuffled[i*2], a = shuffled[i*2+1];
      const hRating = 55 + Math.floor(Math.random()*40);
      const aRating = 55 + Math.floor(Math.random()*40);
      const hColor  = TEAM_COLORS[i % TEAM_COLORS.length];
      const aColor  = TEAM_COLORS[(i+7) % TEAM_COLORS.length];
      const hForm   = FORMATION_NAMES[Math.floor(Math.random()*FORMATION_NAMES.length)];
      const aForm   = FORMATION_NAMES[Math.floor(Math.random()*FORMATION_NAMES.length)];
      const diff    = (hRating - aRating) / 100;
      const homeOdds = +(Math.max(1.25, 2.0 - diff*2.5 + Math.random()*0.4)).toFixed(2);
      const awayOdds = +(Math.max(1.25, 2.0 + diff*2.5 + Math.random()*0.4)).toFixed(2);
      const drawOdds = +(2.8 + Math.random()*1.5).toFixed(2);
      const n = Math.floor(Math.random()*5);
      const goals = [];
      for (let g = 0; g < n; g++) {
        goals.push({
          minute: Math.floor(Math.random()*88)+1,
          team: Math.random() < hRating/(hRating+aRating) ? 'home' : 'away',
          scored: false,
        });
      }
      goals.sort((a,b) => a.minute - b.minute);
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
    FORMATIONS[m.hForm].forEach(p => {
      S.players.push({
        team:'home', role:p.role, color:m.hColor,
        bx:p.x*W, by:p.y*H, x:p.x*W, y:p.y*H,
        vx:0, vy:0, id:S.players.length, rating:m.hRating,
      });
    });
    FORMATIONS[m.aForm].forEach(p => {
      S.players.push({
        team:'away', role:p.role, color:m.aColor,
        bx:(1-p.x)*W, by:p.y*H, x:(1-p.x)*W, y:p.y*H,
        vx:0, vy:0, id:S.players.length, rating:m.aRating,
      });
    });
    S.ball = { x:W/2, y:H/2, vx:0, vy:0 };
    S.holder = -1; S.receiver = -1;
    S.action = null; S.actionTimer = 0;
    S.goalAnim = 0; S.goalCooldown = 0;
    const kickOff = S.players.find(p => p.team==='home' && p.role==='mid');
    if (kickOff) {
      kickOff.x = W/2 + 5; kickOff.y = H/2;
      S.holder = kickOff.id;
      S.ball.x = kickOff.x; S.ball.y = kickOff.y;
      decideAction(kickOff.id);
    }
  }

  // ═══════════════════════════════════════════
  // DECIDE ACTION
  // ═══════════════════════════════════════════
  function decideAction(pid) {
    const p = S.players[pid];
    if (!p) return;
    const isHome = p.team === 'home';
    const goalX  = isHome ? W-8 : 8;
    const distToGoal = Math.abs(p.x - goalX);

    let pShoot = 0, pPass = 0, pDribble = 0;
    if (p.role === 'gk') {
      pPass = 1.0;
    } else if (distToGoal < W*0.2 && p.role === 'fwd') {
      pShoot = 0.55; pPass = 0.30; pDribble = 0.15;
    } else if (distToGoal < W*0.3) {
      pShoot = 0.20; pPass = 0.50; pDribble = 0.30;
    } else {
      pPass = 0.45; pDribble = 0.40; pShoot = 0.15;
    }

    const r = Math.random();
    let action;
    if (r < pShoot)              action = 'shoot';
    else if (r < pShoot + pPass) action = 'pass';
    else                         action = 'dribble';

    if (action === 'pass' && !choosePasstarget(pid)) action = 'dribble';

    S.action = action;
    S.actionTimer = action === 'dribble' ? 8 : 5;
  }

  function choosePasstarget(pid) {
    const p = S.players[pid];
    const isHome = p.team === 'home';
    const goalX  = isHome ? W : 0;
    const mates  = S.players.filter(m => m.team === p.team && m.id !== pid && m.role !== 'gk');
    if (!mates.length) return null;
    const scored = mates.map(m => {
      const fwd = isHome ? (m.x - p.x) : (p.x - m.x);
      if (fwd < -60) return { m, score:-999 };
      return { m, score: fwd*0.5 + (W - Math.abs(m.x-goalX))*0.3 + Math.random()*20 };
    });
    scored.sort((a,b) => b.score - a.score);
    return scored[0]?.score > -999 ? scored[0].m : null;
  }

  function executePass(pid) {
    const p   = S.players[pid];
    const tgt = choosePasstarget(pid);
    if (!tgt) { S.action = 'dribble'; S.actionTimer = 6; return; }

    const interceptChance = Math.max(0.05, 0.35 - (p.rating - 55) / 200);
    const pressers = S.players.filter(q => q.team !== p.team && q.role !== 'gk');
    const inLane = pressers.filter(q => {
      const t = Math.max(0, Math.min(1,
        ((q.x-p.x)*(tgt.x-p.x)+(q.y-p.y)*(tgt.y-p.y)) /
        (Math.pow(Math.hypot(tgt.x-p.x,tgt.y-p.y),2)||1)
      ));
      const cx = p.x + t*(tgt.x-p.x), cy = p.y + t*(tgt.y-p.y);
      return Math.hypot(q.x-cx,q.y-cy) < 18;
    });
    const finalIntercept = Math.min(0.7, interceptChance + inLane.length*0.12);
    const intercepted    = Math.random() < finalIntercept;

    const dx = tgt.x - p.x, dy = tgt.y - p.y;
    const d  = Math.hypot(dx,dy) || 1;
    const spd = 3.5 + Math.random()*1.5;
    const err = (100 - p.rating) / 500;
    S.ball.vx = (dx/d)*spd + (Math.random()-0.5)*err*spd;
    S.ball.vy = (dy/d)*spd + (Math.random()-0.5)*err*spd;
    S.ball.x = p.x; S.ball.y = p.y;
    S.holder = -1;

    if (intercepted && inLane.length > 0) {
      S.receiver = inLane[Math.floor(Math.random()*inLane.length)].id;
      S.passIntercepted = true;
    } else {
      S.receiver = tgt.id;
      S.passIntercepted = false;
    }
  }

  function executeShoot(pid) {
    const p = S.players[pid];
    const isHome = p.team === 'home';
    const goalX  = isHome ? W-8 : 8;
    const goalY  = H/2 + (Math.random()-0.5)*28;
    const dx = goalX - p.x, dy = goalY - p.y;
    const d  = Math.hypot(dx,dy)||1;
    const spd = 5 + Math.random()*2.5;
    S.ball.vx = (dx/d)*spd;
    S.ball.vy = (dy/d)*spd;
    S.ball.x  = p.x; S.ball.y = p.y;
    S.holder = -1; S.receiver = -1; S.action = null;
  }

  // ═══════════════════════════════════════════
  // SIMULATE TICK
  // ═══════════════════════════════════════════
  function simulate() {
    const b = S.ball;

    if (S.goalCooldown > 0) { S.goalCooldown--; return; }

    // ── Holder đang cầm bóng ──
    if (S.holder >= 0) {
      const p = S.players[S.holder];
      if (!p) { S.holder = -1; return; }

      b.x = p.x; b.y = p.y; b.vx = 0; b.vy = 0;

      // Di chuyển TẤT CẢ cầu thủ kể cả khi holder giữ bóng
      movePlayers();

      if (S.actionTimer > 0) {
        S.actionTimer--;
        if (S.action === 'dribble') moveDribbler(p);
        return;
      }

      if (S.action === 'pass')    { executePass(S.holder); return; }
      if (S.action === 'shoot')   { executeShoot(S.holder); return; }
      if (S.action === 'dribble') {
        moveDribbler(p);
        if (Math.random() < 0.15) decideAction(S.holder);
        return;
      }
      decideAction(S.holder);
      return;
    }

    // ── Bóng đang bay ──
    b.x += b.vx;
    b.y += b.vy;
    b.vx *= 0.97;
    b.vy *= 0.97;

    // Bounce biên trên/dưới
    if (b.y < 7)   { b.vy =  Math.abs(b.vy)*0.8; b.y = 7; }
    if (b.y > H-7) { b.vy = -Math.abs(b.vy)*0.8; b.y = H-7; }

    // ── GOAL CHECK — detect khi bóng đi vào vùng gôn ──
    const inGoalY = b.y > GOAL_Y1 && b.y < GOAL_Y2;

    if (inGoalY && b.x < GOAL_X_L) {
      // Bóng vào gôn trái → away ghi bàn
      triggerGoal('away');
      return;
    }
    if (inGoalY && b.x > GOAL_X_R) {
      // Bóng vào gôn phải → home ghi bàn
      triggerGoal('home');
      return;
    }

    // Bóng ra ngoài biên ngang (không phải gôn)
    if (b.x < 8 && !inGoalY) {
      b.vx = Math.abs(b.vx)*0.7; b.x = 10;
      pickupNearby('home');
    }
    if (b.x > W-8 && !inGoalY) {
      b.vx = -Math.abs(b.vx)*0.7; b.x = W-10;
      pickupNearby('away');
    }

    // Bóng dừng
    const spd = Math.hypot(b.vx, b.vy);
    if (spd < 0.3) {
      const nearest = S.players
        .filter(p => p.role !== 'gk')
        .sort((a,z) => Math.hypot(a.x-b.x,a.y-b.y) - Math.hypot(z.x-b.x,z.y-b.y))[0];
      if (nearest && Math.hypot(nearest.x-b.x, nearest.y-b.y) < 30) {
        pickupBall(nearest.id);
      } else {
        b.vx = (Math.random()-0.5)*0.5;
        b.vy = (Math.random()-0.5)*0.5;
      }
    }

    // Receiver đón bóng
    if (S.receiver >= 0) {
      const recv = S.players[S.receiver];
      if (recv && Math.hypot(b.x-recv.x, b.y-recv.y) < RECEIVE_RANGE) {
        pickupBall(S.receiver);
        movePlayers();
        return;
      }
    }

    // Pressing
    const attackers = S.players.filter(p =>
      p.team !== (S.receiver >= 0 ? S.players[S.receiver]?.team : null) && p.role !== 'gk'
    );
    for (const p of attackers) {
      if (Math.hypot(b.x-p.x, b.y-p.y) < TACKLE_RANGE) {
        const tackleChance = 0.10 + (100 - p.rating) / 800;
        if (Math.random() < tackleChance) {
          pickupBall(p.id);
          movePlayers();
          return;
        }
      }
    }

    movePlayers();
    if (S.goalAnim > 0) S.goalAnim--;
  }

  // ═══════════════════════════════════════════
  // TRIGGER GOAL — tách riêng để rõ ràng
  // ═══════════════════════════════════════════
  function triggerGoal(scoringTeam) {
    if (S.goalCooldown > 0) return;

    // Kiểm tra xem có pending goal phù hợp không
    if (S.nextGoal && !S.nextGoal.scored && S.nextGoal.team === scoringTeam) {
      S.nextGoal.scored = true;
      if (scoringTeam === 'home') S.score[0]++;
      else                        S.score[1]++;
    } else if (S.nextGoal && !S.nextGoal.scored) {
      // Ghi bàn nhưng sai đội — vẫn tính (scripted)
      S.nextGoal.scored = true;
      if (scoringTeam === 'home') S.score[0]++;
      else                        S.score[1]++;
    } else {
      // Không có pending goal → bóng bị GK cản, bật ra
      const b = S.ball;
      b.vx = scoringTeam === 'home' ? -Math.abs(b.vx)*1.3 : Math.abs(b.vx)*1.3;
      b.vy += (Math.random()-0.5)*1.5;
      b.x   = scoringTeam === 'home' ? W-22 : 22;
      S.holder = -1; S.receiver = -1;
      pickupNearby(scoringTeam === 'home' ? 'away' : 'home');
      return;
    }

    // Goal xác nhận
    document.getElementById('fb-score-h').textContent = S.score[0];
    document.getElementById('fb-score-a').textContent = S.score[1];
    addEvent(scoringTeam, S.elapsed);
    S.goalAnim    = 40;
    S.goalCooldown = 80; // ~3s cooldown sau mỗi bàn
    S.holder = -1; S.receiver = -1;
    S.ball.vx = 0; S.ball.vy = 0;

    setTimeout(() => {
      if (S.phase !== 'playing') return;
      S.ball.x = W/2; S.ball.y = H/2 + (Math.random()-0.5)*10;
      S.ball.vx = 0; S.ball.vy = 0;
      S.goalCooldown = 0;
      const kickTeam = scoringTeam === 'home' ? 'away' : 'home';
      const ko = S.players.find(p => p.team === kickTeam && p.role === 'mid');
      if (ko) {
        ko.x = W/2 + (kickTeam==='home'?5:-5); ko.y = H/2;
        pickupBall(ko.id);
      }
    }, 2500);
  }

  // ═══════════════════════════════════════════
  // PICKUP HELPERS
  // ═══════════════════════════════════════════
  function pickupBall(pid) {
    const p = S.players[pid];
    if (!p) return;
    S.holder = pid; S.receiver = -1; S.passIntercepted = false;
    S.ball.x = p.x; S.ball.y = p.y; S.ball.vx = 0; S.ball.vy = 0;
    decideAction(pid);
  }

  function pickupNearby(team) {
    const gk = S.players.find(p => p.team === team && p.role === 'gk');
    if (gk) pickupBall(gk.id);
  }

  // ═══════════════════════════════════════════
  // DRIBBLE MOVEMENT
  // ═══════════════════════════════════════════
  function moveDribbler(p) {
    const isHome = p.team === 'home';
    const goalX  = isHome ? W - 12 : 12;
    const dx = goalX - p.x, dy = H/2 - p.y;
    const dist = Math.hypot(dx, dy) || 1;
    const spd  = MAX_SPD[p.role] || 2.0;
    const wobbleY = (Math.random()-0.5) * 8;
    p.x = Math.max(8, Math.min(W-8, p.x + (dx/dist)*spd));
    p.y = Math.max(8, Math.min(H-8, p.y + (dy/dist)*(spd*0.35) + wobbleY*0.2));
    S.ball.x = p.x + (isHome ? 5 : -5);
    S.ball.y = p.y;

    const opponents = S.players.filter(q =>
      q.team !== p.team && q.role !== 'gk' &&
      Math.hypot(q.x-p.x, q.y-p.y) < TACKLE_RANGE
    );
    if (opponents.length > 0 && Math.random() < 0.06 + opponents.length*0.035) {
      pickupBall(opponents[Math.floor(Math.random()*opponents.length)].id);
    }
  }

  // ═══════════════════════════════════════════
  // MOVE ALL PLAYERS — luôn chạy mỗi tick
  // ═══════════════════════════════════════════
  function _step(p, tx, ty, fraction) {
    tx = Math.max(10, Math.min(W-10, tx));
    ty = Math.max(10, Math.min(H-10, ty));
    const dx = tx - p.x, dy = ty - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.4) return;
    const maxPx = MAX_SPD[p.role] || 1.8;
    const step  = Math.min(dist * fraction, maxPx);
    p.x += (dx/dist)*step;
    p.y += (dy/dist)*step;
  }

  function movePlayers() {
    const b = S.ball;
    const holderTeam = S.holder >= 0 ? S.players[S.holder]?.team : null;

    S.players.forEach((p, i) => {
      const isHome        = p.team === 'home';
      const hasBall       = S.holder === i;
      const isRecv        = S.receiver === i;
      const myTeamHasBall = holderTeam === p.team;
      const goalX         = isHome ? W-12 : 12;
      const ownGoalX      = isHome ? 12 : W-12;

      // GK
      if (p.role === 'gk') {
        const ty = Math.hypot(b.x-p.bx, b.y-p.by) < W*0.4
          ? H/2 + (b.y - H/2)*0.65 : p.by;
        _step(p, p.bx, Math.max(H/2-26, Math.min(H/2+26, ty)), 0.15);
        return;
      }

      // Holder: chỉ dribble mới tự di chuyển riêng, pass/shoot đứng yên
      if (hasBall && S.action !== 'dribble') return;
      if (hasBall) return; // dribble handled in moveDribbler

      // Receiver
      if (isRecv) {
        _step(p, b.x + (isHome ? -8 : 8), b.y, 0.5);
        return;
      }

      // Đội không có bóng: pressing
      if (!myTeamHasBall) {
        const ballPos = S.holder >= 0 ? S.players[S.holder] : b;
        if (p.role === 'fwd') {
          _step(p, ballPos.x + (Math.random()-0.5)*12, ballPos.y + (Math.random()-0.5)*12, 0.4);
        } else if (p.role === 'mid') {
          _step(p, p.bx*0.3 + ballPos.x*0.7, p.by*0.4 + ballPos.y*0.6, 0.3);
        } else {
          _step(p, p.bx*0.55 + ownGoalX*0.2 + ballPos.x*0.25, p.by*0.55 + ballPos.y*0.45, 0.25);
        }
        return;
      }

      // Đội có bóng: support run
      const holderP = S.players[S.holder];
      const hx = holderP?.x ?? b.x;

      if (p.role === 'fwd') {
        const runX = isHome ? Math.max(p.bx, hx+25) : Math.min(p.bx, hx-25);
        _step(p,
          p.bx*0.2 + runX*0.4 + goalX*0.4,
          Math.max(H*0.1, Math.min(H*0.9, p.by*0.45 + b.y*0.35 + H/2*0.2)),
          0.35);
      } else if (p.role === 'mid') {
        const advX = isHome
          ? Math.min(W*0.7, p.bx + (b.x-W/2)*0.25)
          : Math.max(W*0.3, p.bx + (b.x-W/2)*0.25);
        _step(p, advX, p.by*0.5 + b.y*0.5, 0.25);
      } else {
        const capX = isHome
          ? Math.min(W*0.52, p.bx + (b.x-W/2)*0.12)
          : Math.max(W*0.48, p.bx + (b.x-W/2)*0.12);
        _step(p, capX, p.by*0.65 + b.y*0.35, 0.2);
      }
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
      ctx.fillStyle = i%2===0 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.05)';
      ctx.fillRect(i*(W/8), 0, W/8, H);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(5, 5, W-10, H-10);
    ctx.beginPath(); ctx.moveTo(W/2,5); ctx.lineTo(W/2,H-5); ctx.stroke();
    ctx.beginPath(); ctx.arc(W/2, H/2, 22, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(W/2, H/2, 2.5, 0, Math.PI*2); ctx.fill();
    // Goal posts
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.strokeRect(0, H/2-22, 10, 44);
    ctx.strokeRect(W-10, H/2-22, 10, 44);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.2;
    ctx.strokeRect(5, H/2-26, 28, 52);
    ctx.strokeRect(5, H/2-13, 12, 26);
    ctx.strokeRect(W-33, H/2-26, 28, 52);
    ctx.strokeRect(W-17, H/2-13, 12, 26);
  }

  function drawPlayers() {
    if (!ctx) return;
    S.players.forEach((p, i) => {
      const hasBall = S.holder === i;
      const isRecv  = S.receiver === i;
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath(); ctx.ellipse(p.x, p.y+PR, PR*0.7, PR*0.22, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, PR, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = hasBall ? '#fff' : isRecv ? '#ffff00' : 'rgba(0,0,0,0.5)';
      ctx.lineWidth   = hasBall ? 2.5 : isRecv ? 1.8 : 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.font = 'bold 5px Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const lbl = p.role==='gk'?'G':p.role==='def'?'D':p.role==='mid'?'M':'F';
      ctx.fillText(lbl, p.x, p.y);
    });
  }

  function drawBall() {
    if (!ctx) return;
    const b = S.ball;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(b.x, b.y+5, 4, 1.5, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(b.x, b.y, BR, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 0.8; ctx.stroke();
    if (S.holder < 0 && (Math.abs(S.ball.vx) > 0.5 || Math.abs(S.ball.vy) > 0.5)) {
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx*4, b.y - b.vy*4);
      ctx.stroke();
    }
  }

  function drawGoalFlash() {
    if (S.goalAnim <= 0) return;
    const a = (S.goalAnim / 40) * 0.45;
    ctx.fillStyle = `rgba(255,220,0,${a})`;
    ctx.fillRect(0, 0, W, H);
    if (S.goalAnim > 20) {
      ctx.fillStyle = `rgba(255,255,255,${a*2})`;
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('GOAL! ⚽', W/2, H/2);
    }
    S.goalAnim--;
  }

  function drawFrame() {
    drawPitch(); drawPlayers(); drawBall(); drawGoalFlash();
  }

  // ═══════════════════════════════════════════
  // RENDER HTML & EVENTS
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
    ['home','away'].forEach(side => {
      const team  = side==='home' ? m.home : m.away;
      const color = side==='home' ? m.hColor : m.aColor;
      const form  = side==='home' ? m.hForm : m.aForm;
      const elT = document.getElementById(`fb-pitch-${side}`);
      const elF = document.getElementById(`fb-pitch-${side==='home'?'hform':'aform'}`);
      if (elT) { elT.textContent = team; elT.style.color = color; }
      if (elF) { elF.textContent = form; elF.style.color = color; }
      document.getElementById(`fb-label-${side}`).textContent = team;
      document.getElementById(`fb-odds-${side}`).textContent = '×' + (side==='home'?m.homeOdds:m.awayOdds);
    });
    document.getElementById('fb-odds-draw').textContent = '×' + m.drawOdds;
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

  function startMatch() {
    if (S.phase !== 'select' || S.selected === null || !S.betSide) return;
    const bet = Casino.deductBet('fb');
    if (bet === false) return;
    S.bet = bet; S.phase = 'playing';
    S.elapsed = 0; S.score = [0,0];
    S.goalAnim = 0; S.goalCooldown = 0; S.nextGoal = null;
    const m = S.matches[S.selected];
    S.pendingGoals = m.goals.map(g => ({...g, scored:false}));
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
      if (ts - lastSim >= 40) {
        lastSim = ts;
        simulate();
      }
      drawFrame();
      animFrame = requestAnimationFrame(loop);
    }
    animFrame = requestAnimationFrame(loop);

    S.interval = setInterval(() => {
      S.elapsed++;
      const bar = document.getElementById('fb-bar');
      if (bar) bar.style.width = (S.elapsed/90*100) + '%';
      const tl = document.getElementById('fb-time');
      if (tl) tl.textContent = S.elapsed + "'";

      // Đặt nextGoal khi đến phút định sẵn
      const due = S.pendingGoals.find(g => g.minute === S.elapsed && !g.scored);
      if (due) {
        S.nextGoal = due;
        // Force bóng về hướng gôn của đội ghi bàn để trigger goal
        const scorer = S.players.find(p =>
          p.team === due.team && (p.role === 'fwd' || p.role === 'mid')
        );
        if (scorer) {
          const isHome = due.team === 'home';
          const goalX  = isHome ? W - 8 : 8;
          const goalY  = H/2 + (Math.random()-0.5)*20;
          S.holder = -1;
          S.ball.x  = scorer.x; S.ball.y = scorer.y;
          const dx = goalX - scorer.x, dy = goalY - scorer.y;
          const d  = Math.hypot(dx, dy) || 1;
          S.ball.vx = (dx/d) * 6;
          S.ball.vy = (dy/d) * 6;
          S.receiver = -1;
        }
      }

      if (S.elapsed >= 90) {
        clearInterval(S.interval);
        cancelAnimationFrame(animFrame);
        setTimeout(() => { drawFrame(); finish(); }, 500);
      }
    }, 1000);
  }

  function finish() {
    S.phase = 'done';
    const m = S.matches[S.selected];
    const [h, a] = S.score;
    const winner = h>a?'home':a>h?'away':'draw';
    const won    = winner === S.betSide;
    const odds   = S.betSide==='home'?m.homeOdds:S.betSide==='away'?m.awayOdds:m.drawOdds;
    if (won) {
      const pay = Math.floor(S.bet * odds);
      Casino.addWin(pay);
      Casino.showResult('fb-result','win',`THẮNG! +${Format.money(pay-S.bet)} (×${odds}) | ${h}–${a}`);
    } else {
      Casino.showResult('fb-result','lose',`THUA! −${Format.money(S.bet)} | KQ: ${h}–${a}`);
    }
    const sb = document.getElementById('btn-fb-start');
    if (sb) { sb.disabled = false; sb.textContent = '⚽ CHƠI LẠI'; }
    setTimeout(() => {
      S.phase = 'select'; S.selected = null; S.betSide = null;
      generateMatches();
      const list = document.getElementById('fb-match-list');
      if (list) {
        list.style.display = '';
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
      document.getElementById('fb-pitch-wrap').style.display = 'none';
      document.getElementById('fb-odds').style.display = 'none';
      document.querySelectorAll('.sport-odds-btn[data-side]').forEach(b => b.disabled = false);
      updateStartBtn();
    }, 3500);
    Casino.updateAllBalances();
  }

  return { renderHTML, bindEvents };
})();