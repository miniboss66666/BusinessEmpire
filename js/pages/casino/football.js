/* ============================================
   CASINO/FOOTBALL.JS
   - Mỗi đội random đội hình: 4-4-2 / 4-3-3 / 3-5-2 / 4-2-3-1 / 5-3-2
   - Bóng đi thẳng, chỉ bẻ lái khi gần cầu thủ
   - Tiền đạo bám bóng, hậu vệ lên/xuống theo Y bóng
   - Vào gôn → cộng điểm + reset
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

  // W x H canvas
  const W = 320, H = 180;
  const PR = 6.5; // player radius

  // ═══════════════════════════════════════════
  // ĐỘI HÌNH — tọa độ chuẩn hóa [0..1] cho đội HOME (trái→phải)
  // role: 'gk' | 'def' | 'mid' | 'fwd'
  // ═══════════════════════════════════════════
  const FORMATIONS = {
    '4-4-2': [
      {x:.08,y:.5,  role:'gk'},
      {x:.22,y:.2,  role:'def'},{x:.22,y:.4,role:'def'},
      {x:.22,y:.6,  role:'def'},{x:.22,y:.8,role:'def'},
      {x:.45,y:.15, role:'mid'},{x:.45,y:.38,role:'mid'},
      {x:.45,y:.62, role:'mid'},{x:.45,y:.85,role:'mid'},
      {x:.68,y:.35, role:'fwd'},{x:.68,y:.65,role:'fwd'},
    ],
    '4-3-3': [
      {x:.08,y:.5,  role:'gk'},
      {x:.22,y:.18, role:'def'},{x:.22,y:.38,role:'def'},
      {x:.22,y:.62, role:'def'},{x:.22,y:.82,role:'def'},
      {x:.45,y:.25, role:'mid'},{x:.45,y:.5, role:'mid'},{x:.45,y:.75,role:'mid'},
      {x:.68,y:.18, role:'fwd'},{x:.68,y:.5, role:'fwd'},{x:.68,y:.82,role:'fwd'},
    ],
    '3-5-2': [
      {x:.08,y:.5,  role:'gk'},
      {x:.22,y:.25, role:'def'},{x:.22,y:.5,role:'def'},{x:.22,y:.75,role:'def'},
      {x:.42,y:.12, role:'mid'},{x:.42,y:.33,role:'mid'},{x:.42,y:.5,role:'mid'},
      {x:.42,y:.67, role:'mid'},{x:.42,y:.88,role:'mid'},
      {x:.68,y:.35, role:'fwd'},{x:.68,y:.65,role:'fwd'},
    ],
    '4-2-3-1': [
      {x:.08,y:.5,  role:'gk'},
      {x:.2, y:.18, role:'def'},{x:.2,y:.4,role:'def'},
      {x:.2, y:.6,  role:'def'},{x:.2,y:.82,role:'def'},
      {x:.38,y:.35, role:'mid'},{x:.38,y:.65,role:'mid'},
      {x:.55,y:.15, role:'mid'},{x:.55,y:.5,role:'mid'},{x:.55,y:.85,role:'mid'},
      {x:.72,y:.5,  role:'fwd'},
    ],
    '5-3-2': [
      {x:.08,y:.5,  role:'gk'},
      {x:.2, y:.1,  role:'def'},{x:.2,y:.3,role:'def'},{x:.2,y:.5,role:'def'},
      {x:.2, y:.7,  role:'def'},{x:.2,y:.9,role:'def'},
      {x:.45,y:.25, role:'mid'},{x:.45,y:.5,role:'mid'},{x:.45,y:.75,role:'mid'},
      {x:.68,y:.35, role:'fwd'},{x:.68,y:.65,role:'fwd'},
    ],
  };

  const FORMATION_NAMES = Object.keys(FORMATIONS);

  // ═══════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════
  let canvas, ctx, animFrame;

  let S = {
    phase: 'select',
    matches: [],
    selected: null,
    betSide: null,
    bet: 0,
    elapsed: 0,
    score: [0,0],
    interval: null,
    // Players: [{x,y,bx,by,role,team,color,formation_x,formation_y}]
    players: [],
    // Ball
    ball: { x:W/2, y:H/2, vx:0, vy:0 },
    // Quả bóng đang ở cầu thủ nào (-1 = free)
    carrier: -1,
    // Gôn đang được chuẩn bị (từ pre-gen)
    nextGoal: null,
    goalAnim: 0, // countdown ticks khi gôn xảy ra
    pendingGoals: [],
  };

  // ═══════════════════════════════════════════
  // GENERATE MATCHES
  // ═══════════════════════════════════════════
  function generateMatches() {
    const shuffled = [...ALL_TEAMS].sort(()=>Math.random()-0.5);
    S.matches = [];
    for(let i=0;i<6;i++){
      const h=shuffled[i*2], a=shuffled[i*2+1];
      const hColor=TEAM_COLORS[i%TEAM_COLORS.length];
      const aColor=TEAM_COLORS[(i+7)%TEAM_COLORS.length];
      const hForm=FORMATION_NAMES[Math.floor(Math.random()*FORMATION_NAMES.length)];
      const aForm=FORMATION_NAMES[Math.floor(Math.random()*FORMATION_NAMES.length)];
      const homeOdds=+(1.4+Math.random()*2.2).toFixed(2);
      const awayOdds=+(1.6+Math.random()*2.8).toFixed(2);
      const drawOdds=+(2.6+Math.random()*1.8).toFixed(2);
      // Pre-gen bàn thắng
      const n=Math.floor(Math.random()*5);
      const goals=[];
      for(let g=0;g<n;g++){
        goals.push({
          minute: Math.floor(Math.random()*89)+1,
          team: Math.random()<0.5?'home':'away',
          shown: false,
        });
      }
      goals.sort((a,b)=>a.minute-b.minute);
      S.matches.push({home:h,away:a,hColor,aColor,hForm,aForm,homeOdds,awayOdds,drawOdds,goals});
    }
  }

  // ═══════════════════════════════════════════
  // KHỞI TẠO CẦU THỦ
  // ═══════════════════════════════════════════
  function initPlayers(matchIdx) {
    const m = S.matches[matchIdx];
    S.players = [];

    const hPositions = FORMATIONS[m.hForm];
    const aPositions = FORMATIONS[m.aForm];

    // Home team — trái, đánh sang phải
    hPositions.forEach((p,i)=>{
      S.players.push({
        team: 'home',
        role: p.role,
        color: m.hColor,
        // Vị trí đội hình chuẩn (pixels)
        bx: p.x * W,
        by: p.y * H,
        // Vị trí hiện tại
        x: p.x * W,
        y: p.y * H,
        id: i,
      });
    });

    // Away team — lật mirror (đánh ngược lại)
    aPositions.forEach((p,i)=>{
      S.players.push({
        team: 'away',
        role: p.role,
        color: m.aColor,
        bx: (1-p.x) * W,
        by: p.y * H,
        x:  (1-p.x) * W,
        y:  p.y * H,
        id: i,
      });
    });

    // Bóng giữa sân
    S.ball = { x:W/2, y:H/2, vx:(Math.random()-0.5)*1.5, vy:(Math.random()-0.5)*0.8 };
    S.carrier = -1;
    S.goalAnim = 0;
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
          ${S.matches.map((m,i)=>`
            <div class="fb-match-row" data-idx="${i}">
              <span class="fb-row-home" style="color:${m.hColor}">${m.home}</span>
              <div class="fb-row-center">
                <span class="fb-row-form" style="color:${m.hColor}33;border-color:${m.hColor}44">${m.hForm}</span>
                <span class="fb-row-odds-mid">
                  <span style="color:var(--gold)">×${m.homeOdds}</span>
                  <span style="color:var(--text-dim)">×${m.drawOdds}</span>
                  <span style="color:var(--gold)">×${m.awayOdds}</span>
                </span>
                <span class="fb-row-form" style="color:${m.aColor}33;border-color:${m.aColor}44">${m.aForm}</span>
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
          <button class="sport-odds-btn" data-side="home" id="fb-btn-home">
            <span class="odds-team" id="fb-label-home">Nhà</span>
            <span class="odds-val" id="fb-odds-home">×2.10</span>
          </button>
          <button class="sport-odds-btn" data-side="draw">
            <span class="odds-team">Hòa</span>
            <span class="odds-val" id="fb-odds-draw">×3.20</span>
          </button>
          <button class="sport-odds-btn" data-side="away" id="fb-btn-away">
            <span class="odds-team" id="fb-label-away">Khách</span>
            <span class="odds-val" id="fb-odds-away">×3.50</span>
          </button>
        </div>

        <div class="casino-result" id="fb-result"></div>
        ${Casino.renderBetControls('fb')}
        <button class="casino-play-btn" id="btn-fb-start" disabled>⚽ ĐẶT CƯỢC & BẮT ĐẦU</button>
      </div>
    `;
  }

  // ═══════════════════════════════════════════
  // BIND EVENTS
  // ═══════════════════════════════════════════
  function bindEvents() {
    document.querySelectorAll('.fb-match-row').forEach(row=>{
      row.addEventListener('click',()=>{
        if(S.phase!=='select') return;
        document.querySelectorAll('.fb-match-row').forEach(r=>r.classList.remove('selected'));
        row.classList.add('selected');
        selectMatch(parseInt(row.dataset.idx));
      });
    });
    document.querySelectorAll('.sport-odds-btn[data-side]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        if(S.phase!=='select') return;
        document.querySelectorAll('.sport-odds-btn[data-side]').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
        S.betSide=btn.dataset.side;
        updateStartBtn();
      });
    });
    document.getElementById('btn-fb-start')?.addEventListener('click', startMatch);
  }

  function selectMatch(idx) {
    S.selected=idx;
    const m=S.matches[idx];

    document.getElementById('fb-pitch-wrap').style.display='';
    document.getElementById('fb-odds').style.display='';

    document.getElementById('fb-pitch-home').textContent=m.home;
    document.getElementById('fb-pitch-home').style.color=m.hColor;
    document.getElementById('fb-pitch-hform').textContent=m.hForm;
    document.getElementById('fb-pitch-hform').style.color=m.hColor;
    document.getElementById('fb-pitch-away').textContent=m.away;
    document.getElementById('fb-pitch-away').style.color=m.aColor;
    document.getElementById('fb-pitch-aform').textContent=m.aForm;
    document.getElementById('fb-pitch-aform').style.color=m.aColor;

    document.getElementById('fb-label-home').textContent=m.home;
    document.getElementById('fb-label-away').textContent=m.away;
    document.getElementById('fb-odds-home').textContent='×'+m.homeOdds;
    document.getElementById('fb-odds-draw').textContent='×'+m.drawOdds;
    document.getElementById('fb-odds-away').textContent='×'+m.awayOdds;

    canvas=document.getElementById('fb-canvas');
    ctx=canvas?.getContext('2d');
    initPlayers(idx);
    drawFrame();

    S.betSide=null;
    document.querySelectorAll('.sport-odds-btn[data-side]').forEach(b=>b.classList.remove('selected'));
    updateStartBtn();
  }

  function updateStartBtn() {
    const btn=document.getElementById('btn-fb-start');
    if(btn) btn.disabled=!(S.selected!==null && S.betSide && S.phase==='select');
  }

  // ═══════════════════════════════════════════
  // VẼ SÂN
  // ═══════════════════════════════════════════
  function drawPitch() {
    if(!ctx) return;
    // Nền cỏ
    ctx.fillStyle='#1d5c1d';
    ctx.fillRect(0,0,W,H);
    // Sọc cỏ
    for(let i=0;i<8;i++){
      ctx.fillStyle=i%2===0?'rgba(255,255,255,0.03)':'rgba(0,0,0,0.06)';
      ctx.fillRect(i*(W/8),0,W/8,H);
    }
    ctx.strokeStyle='rgba(255,255,255,0.55)';
    ctx.lineWidth=1.2;
    // Biên
    ctx.strokeRect(5,5,W-10,H-10);
    // Giữa sân
    ctx.beginPath(); ctx.moveTo(W/2,5); ctx.lineTo(W/2,H-5); ctx.stroke();
    // Vòng giữa
    ctx.beginPath(); ctx.arc(W/2,H/2,22,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(W/2,H/2,2.5,0,Math.PI*2); ctx.fill();
    // Khung thành trái
    ctx.strokeRect(5,H/2-26,28,52);
    ctx.strokeRect(5,H/2-13,12,26);
    // Khung thành phải
    ctx.strokeRect(W-33,H/2-26,28,52);
    ctx.strokeRect(W-17,H/2-13,12,26);
    // Chấm penalty
    ctx.fillStyle='rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(46,H/2,2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(W-46,H/2,2,0,Math.PI*2); ctx.fill();
  }

  function drawPlayers() {
    if(!ctx) return;
    for(const p of S.players){
      const isCarrier = S.carrier===S.players.indexOf(p);
      // Shadow
      ctx.fillStyle='rgba(0,0,0,0.25)';
      ctx.beginPath(); ctx.ellipse(p.x,p.y+PR,PR*0.7,PR*0.25,0,0,Math.PI*2); ctx.fill();
      // Body
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x,p.y,PR,0,Math.PI*2); ctx.fill();
      // Viền
      ctx.strokeStyle = isCarrier ? '#ffffff' : 'rgba(0,0,0,0.5)';
      ctx.lineWidth = isCarrier ? 2 : 1.2;
      ctx.stroke();
      // Role indicator (nhỏ ở giữa)
      ctx.fillStyle='rgba(0,0,0,0.6)';
      ctx.font='bold 5px Arial';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      const roleChar = p.role==='gk'?'G':p.role==='def'?'D':p.role==='mid'?'M':'F';
      ctx.fillText(roleChar, p.x, p.y);
    }
  }

  function drawBall() {
    if(!ctx) return;
    const b=S.ball;
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(b.x,b.y+5,4,1.5,0,0,Math.PI*2); ctx.fill();
    // Bóng
    ctx.fillStyle='#ffffff';
    ctx.beginPath(); ctx.arc(b.x,b.y,4.5,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#333'; ctx.lineWidth=0.8; ctx.stroke();
    // Pattern
    ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=0.5;
    ctx.beginPath(); ctx.arc(b.x-1,b.y-1,2.5,0,Math.PI*2); ctx.stroke();
  }

  function drawGoalFlash() {
    if(S.goalAnim<=0) return;
    const alpha=S.goalAnim/20*0.4;
    ctx.fillStyle=`rgba(255,220,0,${alpha})`;
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle=`rgba(255,255,255,${alpha*1.5})`;
    ctx.font='bold 28px Orbitron, monospace';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('GOAL!',W/2,H/2);
    S.goalAnim--;
  }

  function drawFrame() {
    drawPitch();
    drawPlayers();
    drawBall();
    drawGoalFlash();
  }

  // ═══════════════════════════════════════════
  // SIMULATE — chạy mỗi ~50ms
  // ═══════════════════════════════════════════
  function simulate() {
    const b=S.ball;
    const m=S.matches[S.selected];

    // ── Tìm cầu thủ gần bóng nhất ──
    let nearest=-1, nearDist=Infinity;
    S.players.forEach((p,i)=>{
      const d=Math.hypot(p.x-b.x, p.y-b.y);
      if(d<nearDist){ nearDist=d; nearest=i; }
    });

    // ── Chỉ bẻ lái khi bóng SÁT cầu thủ ──
    const TOUCH_DIST = PR + 5;
    if(nearDist < TOUCH_DIST && nearest !== S.carrier){
      S.carrier = nearest;
      const p=S.players[nearest];

      // Xác định điểm đến tiếp theo của bóng
      // GK và def → đá lên trên
      // Fwd → đá về phía khung thành đối phương
      // Mid → truyền ngẫu nhiên

      let targetX, targetY;
      const isHome = p.team==='home';
      const goalX  = isHome ? W-10 : 10;
      const goalY  = H/2 + (Math.random()-0.5)*30;

      if(p.role==='fwd'){
        // Tiền đạo → thẳng vào gôn hoặc truyền ngang
        if(Math.random()<0.55){
          targetX=goalX; targetY=goalY;
        } else {
          // Truyền cho fwd đồng đội khác
          const partners=S.players.filter((_,j)=>j!==nearest&&S.players[j].team===p.team&&S.players[j].role==='fwd');
          if(partners.length>0){
            const t=partners[Math.floor(Math.random()*partners.length)];
            targetX=t.x+(Math.random()-0.5)*20; targetY=t.y+(Math.random()-0.5)*15;
          } else { targetX=goalX; targetY=goalY; }
        }
      } else if(p.role==='mid'){
        // Truyền cho fwd hoặc mid khác
        const fwds=S.players.filter((_,j)=>S.players[j].team===p.team&&S.players[j].role==='fwd');
        if(fwds.length>0&&Math.random()<0.5){
          const t=fwds[Math.floor(Math.random()*fwds.length)];
          targetX=t.x+(Math.random()-0.5)*25; targetY=t.y+(Math.random()-0.5)*20;
        } else {
          // Truyền ngang hoặc về phía trước
          targetX=b.x+(isHome?30:-30)+(Math.random()-0.5)*40;
          targetY=b.y+(Math.random()-0.5)*50;
        }
      } else {
        // Def / GK → đá lên mid hoặc fwd
        const ups=S.players.filter((_,j)=>S.players[j].team===p.team&&
          (S.players[j].role==='mid'||S.players[j].role==='fwd'));
        if(ups.length>0){
          const t=ups[Math.floor(Math.random()*ups.length)];
          targetX=t.x+(Math.random()-0.5)*30; targetY=t.y+(Math.random()-0.5)*25;
        } else {
          targetX=isHome?W*0.5:W*0.5; targetY=H/2+(Math.random()-0.5)*40;
        }
      }

      // Clamp trong sân
      targetX=Math.max(8,Math.min(W-8,targetX));
      targetY=Math.max(8,Math.min(H-8,targetY));

      const dx=targetX-b.x, dy=targetY-b.y;
      const dist=Math.hypot(dx,dy)||1;
      const spd=1.5+Math.random()*2;
      b.vx=(dx/dist)*spd; b.vy=(dy/dist)*spd;
    }

    // ── Di chuyển bóng ──
    b.x+=b.vx; b.y+=b.vy;
    b.vx*=0.985; b.vy*=0.985; // ma sát nhẹ

    // ── Bóng ra ngoài biên trên/dưới → đổi hướng ──
    if(b.y<7||b.y>H-7){
      b.vy*=-1;
      b.y=Math.max(7,Math.min(H-7,b.y));
      S.carrier=-1;
    }

    // ── Bóng ra biên trái/phải (không phải gôn) → throw-in ──
    if(b.x<7&&(b.y<H/2-26||b.y>H/2+26)){
      b.vx=Math.abs(b.vx); S.carrier=-1;
      b.x=8;
    }
    if(b.x>W-7&&(b.y<H/2-26||b.y>H/2+26)){
      b.vx=-Math.abs(b.vx); S.carrier=-1;
      b.x=W-8;
    }

    // ── GÔOOOOL ──
    const inLeftGoal  = b.x<7  && b.y>H/2-26 && b.y<H/2+26;
    const inRightGoal = b.x>W-7 && b.y>H/2-26 && b.y<H/2+26;

    if((inLeftGoal||inRightGoal) && S.goalAnim===0){
      // Kiểm tra có pre-gen goal ở phút này không
      if(S.nextGoal && !S.nextGoal.scored){
        S.nextGoal.scored=true;
        const scoringTeam = inRightGoal?'home':'away';
        if(scoringTeam==='home') S.score[0]++;
        else S.score[1]++;

        document.getElementById('fb-score-h').textContent=S.score[0];
        document.getElementById('fb-score-a').textContent=S.score[1];
        addGoalEvent(scoringTeam, S.elapsed);
        S.goalAnim=25;
      }
      // Reset bóng về giữa
      b.x=W/2; b.y=H/2+(Math.random()-0.5)*10;
      b.vx=(Math.random()-0.5)*1.5; b.vy=(Math.random()-0.5)*0.8;
      S.carrier=-1;
    }

    // ── Di chuyển cầu thủ ──
    movePlayers();
  }

  // ═══════════════════════════════════════════
  // DI CHUYỂN CẦU THỦ theo vai trò + vị trí bóng
  // ═══════════════════════════════════════════
  function movePlayers() {
    const b=S.ball;
    const ballNormX = b.x/W; // 0→1
    const ballNormY = b.y/H;

    S.players.forEach((p,i)=>{
      const isHome=p.team==='home';
      const isCarrier=S.carrier===i;

      // ── Tính target position ──
      let tx=p.bx, ty=p.by; // mặc định về đội hình

      if(p.role==='gk'){
        // GK: chỉ di chuyển dọc theo khung thành
        tx=p.bx;
        ty=p.by*0.3 + b.y*0.7; // theo Y bóng
        ty=Math.max(H/2-24,Math.min(H/2+24,ty));

      } else if(p.role==='def'){
        // Hậu vệ: bóng lên cao (về phía đối phương) → lên theo
        // bóng thấp (về phía mình) → về phòng thủ
        const ballInOwnHalf = isHome ? ballNormX < 0.5 : ballNormX > 0.5;
        if(ballInOwnHalf){
          // Bóng đang ở phần sân mình → kéo về phòng thủ
          tx=p.bx;
          ty=p.by*0.6+b.y*0.4;
        } else {
          // Bóng sang phần sân đối → hậu vệ lên chút
          const pushUp = isHome ? 0.12 : -0.12;
          tx=p.bx + pushUp*W;
          ty=p.by*0.5+b.y*0.5;
        }

      } else if(p.role==='mid'){
        // Tiền vệ: theo bóng vừa phải
        const fwdPush = isHome ?
          (ballNormX-0.5)*0.15*W :
          -(ballNormX-0.5)*0.15*W;
        tx=p.bx+fwdPush;
        ty=p.by*0.55+b.y*0.45;

      } else if(p.role==='fwd'){
        // Tiền đạo: tiến mạnh theo bóng
        // X: bám theo bóng nhưng giữ phần sân tấn công
        const fwdZoneX = isHome ? Math.max(p.bx, b.x-30) : Math.min(p.bx, b.x+30);
        tx=p.bx*0.3+fwdZoneX*0.7;
        // Y: bám theo Y bóng
        ty=p.by*0.25+b.y*0.75;
        // Giữ trong biên
        tx=Math.max(isHome?W*0.4:8, Math.min(isHome?W-8:W*0.6, tx));
      }

      // Cầu thủ đang giữ bóng → di chuyển chậm cùng bóng
      if(isCarrier){
        tx=b.x + (isHome?-PR*1.5:PR*1.5);
        ty=b.y;
      }

      // Clamp trong sân
      tx=Math.max(8,Math.min(W-8,tx));
      ty=Math.max(8,Math.min(H-8,ty));

      // Smooth move
      const spd = isCarrier ? 0.35 : (p.role==='fwd'?0.06:p.role==='mid'?0.04:0.03);
      p.x+=(tx-p.x)*spd;
      p.y+=(ty-p.y)*spd;
    });
  }

  function addGoalEvent(team, minute) {
    const m=S.matches[S.selected];
    const teamName = team==='home'?m.home:m.away;
    const color    = team==='home'?m.hColor:m.aColor;
    const evEl=document.getElementById('fb-events');
    if(evEl){
      evEl.innerHTML+=`<div class="sport-event" style="color:${color}">⚽ ${minute}' — ${teamName.toUpperCase()}</div>`;
      evEl.scrollTop=evEl.scrollHeight;
    }
  }

  // ═══════════════════════════════════════════
  // START
  // ═══════════════════════════════════════════
  function startMatch() {
    if(S.phase!=='select'||S.selected===null||!S.betSide) return;
    const bet=Casino.deductBet('fb');
    if(bet===false) return;

    S.bet=bet; S.phase='playing';
    S.elapsed=0; S.score=[0,0];
    S.goalAnim=0; S.nextGoal=null;

    const m=S.matches[S.selected];
    S.pendingGoals=[...m.goals].map(g=>({...g,scored:false}));

    document.getElementById('fb-result').className='casino-result';
    document.getElementById('fb-events').innerHTML='';
    document.getElementById('fb-score-h').textContent='0';
    document.getElementById('fb-score-a').textContent='0';
    document.getElementById('fb-match-list').style.display='none';
    document.querySelectorAll('.sport-odds-btn[data-side]').forEach(b=>b.disabled=true);
    const sb=document.getElementById('btn-fb-start');
    if(sb){sb.disabled=true; sb.textContent='⏳ ĐANG THI ĐẤU...';}

    initPlayers(S.selected);
    Casino.updateAllBalances();

    // Animation loop
    let lastSim=0;
    function loop(ts){
      if(S.phase!=='playing') return;
      if(ts-lastSim>=50){ lastSim=ts; simulate(); }
      drawFrame();
      animFrame=requestAnimationFrame(loop);
    }
    animFrame=requestAnimationFrame(loop);

    // Game clock: 1s thật = 1 phút bóng đá
    S.interval=setInterval(()=>{
      S.elapsed++;
      const bar=document.getElementById('fb-bar');
      if(bar) bar.style.width=(S.elapsed/90*100)+'%';
      const tl=document.getElementById('fb-time');
      if(tl) tl.textContent=S.elapsed+"'";

      // Set nextGoal nếu đến phút pre-gen
      const due=S.pendingGoals.find(g=>g.minute===S.elapsed&&!g.scored);
      if(due) S.nextGoal=due;

      if(S.elapsed>=90){
        clearInterval(S.interval);
        cancelAnimationFrame(animFrame);
        // Vẽ frame cuối
        setTimeout(()=>{ drawFrame(); finish(); },200);
      }
    },1000);
  }

  // ═══════════════════════════════════════════
  // FINISH
  // ═══════════════════════════════════════════
  function finish() {
    S.phase='done';
    const m=S.matches[S.selected];
    const [h,a]=S.score;
    const winner=h>a?'home':a>h?'away':'draw';
    const won=winner===S.betSide;
    const odds=S.betSide==='home'?m.homeOdds:S.betSide==='away'?m.awayOdds:m.drawOdds;
    const bet=S.bet;

    if(won){
      const pay=Math.floor(bet*odds);
      Casino.addWin(pay);
      Casino.showResult('fb-result','win',`THẮNG! +${Format.money(pay-bet)} (×${odds}) | ${h}–${a}`);
    } else {
      Casino.showResult('fb-result','lose',`THUA! −${Format.money(bet)} | KQ: ${h}–${a}`);
    }

    const sb=document.getElementById('btn-fb-start');
    if(sb){sb.disabled=false; sb.textContent='⚽ CHƠI LẠI';}

    setTimeout(()=>{
      S.phase='select'; S.selected=null; S.betSide=null;
      generateMatches();
      document.getElementById('fb-match-list').style.display='';
      document.getElementById('fb-pitch-wrap').style.display='none';
      document.getElementById('fb-odds').style.display='none';
      document.getElementById('fb-result').className='casino-result';

      // Re-render match list
      const list=document.getElementById('fb-match-list');
      if(list){
        list.innerHTML=`<div class="fb-list-title">⚽ CHỌN TRẬN ĐẤU</div>`
          +S.matches.map((m,i)=>`
            <div class="fb-match-row" data-idx="${i}">
              <span class="fb-row-home" style="color:${m.hColor}">${m.home}</span>
              <div class="fb-row-center">
                <span class="fb-row-form" style="color:${m.hColor}33;border-color:${m.hColor}44">${m.hForm}</span>
                <span class="fb-row-odds-mid">
                  <span style="color:var(--gold)">×${m.homeOdds}</span>
                  <span style="color:var(--text-dim)">×${m.drawOdds}</span>
                  <span style="color:var(--gold)">×${m.awayOdds}</span>
                </span>
                <span class="fb-row-form" style="color:${m.aColor}33;border-color:${m.aColor}44">${m.aForm}</span>
              </div>
              <span class="fb-row-away" style="color:${m.aColor}">${m.away}</span>
            </div>`).join('');
        list.querySelectorAll('.fb-match-row').forEach(row=>{
          row.addEventListener('click',()=>{
            if(S.phase!=='select') return;
            list.querySelectorAll('.fb-match-row').forEach(r=>r.classList.remove('selected'));
            row.classList.add('selected');
            selectMatch(parseInt(row.dataset.idx));
          });
        });
      }
      document.querySelectorAll('.sport-odds-btn[data-side]').forEach(b=>b.disabled=false);
      updateStartBtn();
    },3000);

    Casino.updateAllBalances();
  }

  return { renderHTML, bindEvents };
})();
