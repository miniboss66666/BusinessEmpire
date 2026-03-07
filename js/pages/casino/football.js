/* ============================================
   CASINO/FOOTBALL.JS — Giả lập sân bóng
   ============================================ */

const CasinoFootball = (() => {

  // 30 đội bóng
  const ALL_TEAMS = [
    'Man City','Arsenal','Liverpool','Chelsea','Man United','Tottenham',
    'Real Madrid','Barcelona','Atletico','Sevilla','Valencia','Villarreal',
    'PSG','Lyon','Marseille','Monaco','Lille',
    'Bayern','Dortmund','Leipzig','Leverkusen','Frankfurt',
    'Inter','Juventus','Milan','Napoli','Roma',
    'Ajax','Porto','Benfica',
  ];

  // Màu sắc ngẫu nhiên cho đội
  const TEAM_COLORS = [
    '#e63946','#457b9d','#2a9d8f','#e9c46a','#f4a261',
    '#264653','#a8dadc','#6a994e','#bc4749','#7209b7',
  ];

  const FIELD_W = 320, FIELD_H = 180;
  const PLAYER_R = 7;
  let canvas, ctx, animFrame;

  // Trạng thái game
  let state = {
    phase: 'select', // select | playing | done
    matches: [],     // danh sách 6 trận upcoming
    selected: null,  // index trong matches
    betSide: null,
    bet: 0,
    elapsed: 0,
    score: [0,0],
    events: [],
    interval: null,
    // Players simulation
    players: [],     // [{x,y,vx,vy,team,id}]
    ball: {x:FIELD_W/2, y:FIELD_H/2, vx:0, vy:0, owner:null},
  };

  // =========================================
  // GENERATE MATCHES
  // =========================================
  function generateMatches() {
    const shuffled = [...ALL_TEAMS].sort(()=>Math.random()-0.5);
    state.matches = [];
    for(let i=0;i<6;i++){
      const h=shuffled[i*2], a=shuffled[i*2+1];
      const hColor=TEAM_COLORS[i*2%TEAM_COLORS.length];
      const aColor=TEAM_COLORS[(i*2+1)%TEAM_COLORS.length];
      const homeOdds=+(1.4+Math.random()*2.2).toFixed(2);
      const awayOdds=+(1.6+Math.random()*2.8).toFixed(2);
      const drawOdds=+(2.6+Math.random()*1.8).toFixed(2);
      // Pre-generate goals
      const nGoals=Math.floor(Math.random()*5);
      const goals=[];
      for(let g=0;g<nGoals;g++){
        goals.push({minute:Math.floor(Math.random()*89)+1, team:Math.random()<0.5?'home':'away', shown:false});
      }
      goals.sort((a,b)=>a.minute-b.minute);
      state.matches.push({home:h,away:a,hColor,aColor,homeOdds,awayOdds,drawOdds,goals});
    }
  }

  // =========================================
  // RENDER HTML
  // =========================================
  function renderHTML() {
    generateMatches();
    state.phase='select';
    state.selected=null;
    state.betSide=null;

    return `
      <div class="casino-game-wrap">
        <!-- Danh sách trận -->
        <div class="fb-match-list" id="fb-match-list">
          <div class="fb-list-title">⚽ CHỌN TRẬN ĐẤU</div>
          ${state.matches.map((m,i)=>`
            <div class="fb-match-row" data-idx="${i}" id="fb-row-${i}">
              <span class="fb-row-home" style="color:${m.hColor}">${m.home}</span>
              <span class="fb-row-odds">
                <span>×${m.homeOdds}</span>
                <span class="fb-row-draw">×${m.drawOdds}</span>
                <span>×${m.awayOdds}</span>
              </span>
              <span class="fb-row-away" style="color:${m.aColor}">${m.away}</span>
            </div>`).join('')}
        </div>

        <!-- Sân bóng (ẩn cho đến khi chọn trận) -->
        <div id="fb-pitch-wrap" style="display:none">
          <div class="fb-pitch-header">
            <span class="fb-pitch-team" id="fb-pitch-home"></span>
            <div class="fb-score-box">
              <span id="fb-score-h">0</span>
              <span style="color:var(--text-dim)"> – </span>
              <span id="fb-score-a">0</span>
            </div>
            <span class="fb-pitch-team" id="fb-pitch-away"></span>
          </div>
          <div class="fb-pitch-container">
            <canvas id="fb-canvas" width="${FIELD_W}" height="${FIELD_H}"></canvas>
          </div>
          <div class="fb-timer-row">
            <div class="sport-timer-bar-wrap" style="flex:1">
              <div class="sport-timer-bar" id="fb-bar" style="width:0%"></div>
            </div>
            <div class="fb-timer-label" id="fb-time">0'</div>
          </div>
          <div class="sport-events" id="fb-events"></div>
        </div>

        <!-- Kèo cược -->
        <div class="sport-bet-odds" id="fb-odds" style="display:none">
          <button class="sport-odds-btn" data-side="home" id="fb-btn-home">
            <span class="odds-team" id="fb-label-home">Nhà</span>
            <span class="odds-val" id="fb-odds-home">×2.10</span>
          </button>
          <button class="sport-odds-btn" data-side="draw" id="fb-btn-draw">
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

  // =========================================
  // BIND EVENTS
  // =========================================
  function bindEvents() {
    // Chọn trận
    document.querySelectorAll('.fb-match-row').forEach(row=>{
      row.addEventListener('click',()=>{
        if(state.phase!=='select') return;
        document.querySelectorAll('.fb-match-row').forEach(r=>r.classList.remove('selected'));
        row.classList.add('selected');
        selectMatch(parseInt(row.dataset.idx));
      });
    });

    // Kèo
    document.querySelectorAll('.sport-odds-btn[data-side]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        if(state.phase!=='select') return;
        document.querySelectorAll('.sport-odds-btn[data-side]').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
        state.betSide=btn.dataset.side;
        updateStartBtn();
      });
    });

    document.getElementById('btn-fb-start')?.addEventListener('click', start);
  }

  function selectMatch(idx) {
    state.selected=idx;
    const m=state.matches[idx];

    // Hiện pitch + odds
    document.getElementById('fb-pitch-wrap').style.display='';
    document.getElementById('fb-odds').style.display='';

    document.getElementById('fb-pitch-home').textContent=m.home;
    document.getElementById('fb-pitch-home').style.color=m.hColor;
    document.getElementById('fb-pitch-away').textContent=m.away;
    document.getElementById('fb-pitch-away').style.color=m.aColor;

    document.getElementById('fb-label-home').textContent=m.home;
    document.getElementById('fb-label-away').textContent=m.away;
    document.getElementById('fb-odds-home').textContent='×'+m.homeOdds;
    document.getElementById('fb-odds-draw').textContent='×'+m.drawOdds;
    document.getElementById('fb-odds-away').textContent='×'+m.awayOdds;

    // Vẽ sân tĩnh
    canvas=document.getElementById('fb-canvas');
    ctx=canvas?.getContext('2d');
    if(ctx) drawField();

    state.betSide=null;
    document.querySelectorAll('.sport-odds-btn[data-side]').forEach(b=>b.classList.remove('selected'));
    updateStartBtn();
  }

  function updateStartBtn() {
    const btn=document.getElementById('btn-fb-start');
    if(btn) btn.disabled=!(state.selected!==null && state.betSide && state.phase==='select');
  }

  // =========================================
  // CANVAS — VẼ SÂN + CẦU THỦ
  // =========================================
  function drawField() {
    if(!ctx) return;
    const W=FIELD_W, H=FIELD_H;

    // Nền cỏ
    ctx.fillStyle='#1a4a1a';
    ctx.fillRect(0,0,W,H);

    // Sọc cỏ
    for(let i=0;i<8;i++){
      ctx.fillStyle = i%2===0 ? 'rgba(255,255,255,0.03)':'rgba(0,0,0,0.05)';
      ctx.fillRect(i*(W/8),0,W/8,H);
    }

    ctx.strokeStyle='rgba(255,255,255,0.5)';
    ctx.lineWidth=1.5;

    // Đường biên
    ctx.strokeRect(6,6,W-12,H-12);

    // Đường giữa sân
    ctx.beginPath(); ctx.moveTo(W/2,6); ctx.lineTo(W/2,H-6); ctx.stroke();

    // Vòng giữa
    ctx.beginPath(); ctx.arc(W/2,H/2,25,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.arc(W/2,H/2,3,0,Math.PI*2); ctx.fill();

    // Khung thành trái
    ctx.strokeRect(6,H/2-28,30,56);
    ctx.strokeRect(6,H/2-14,14,28);

    // Khung thành phải
    ctx.strokeRect(W-36,H/2-28,30,56);
    ctx.strokeRect(W-20,H/2-14,14,28);

    // Chấm penalty
    ctx.fillStyle='rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.arc(50,H/2,2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(W-50,H/2,2,0,Math.PI*2); ctx.fill();
  }

  function drawPlayers() {
    if(!ctx||!canvas) return;
    drawField();

    const m=state.matches[state.selected];

    // Vẽ cầu thủ
    for(const p of state.players){
      const color=p.team==='home'?m.hColor:m.aColor;
      // Shadow
      ctx.fillStyle='rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(p.x,p.y+PLAYER_R,PLAYER_R*0.7,PLAYER_R*0.3,0,0,Math.PI*2); ctx.fill();

      // Body
      ctx.fillStyle=color;
      ctx.beginPath(); ctx.arc(p.x,p.y,PLAYER_R,0,Math.PI*2); ctx.fill();

      // Viền
      ctx.strokeStyle=p.team==='home'?'#ffffff':'rgba(0,0,0,0.7)';
      ctx.lineWidth=1.5;
      ctx.stroke();

      // Số áo
      ctx.fillStyle=p.team==='home'?'rgba(0,0,0,0.8)':'rgba(255,255,255,0.9)';
      ctx.font='bold 6px Arial';
      ctx.textAlign='center';
      ctx.textBaseline='middle';
      ctx.fillText(p.id+1,p.x,p.y);
    }

    // Vẽ bóng
    const b=state.ball;
    ctx.fillStyle='#ffffff';
    ctx.beginPath(); ctx.arc(b.x,b.y,4.5,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#333'; ctx.lineWidth=0.8; ctx.stroke();

    // Hexagon pattern on ball
    ctx.strokeStyle='rgba(0,0,0,0.3)';
    ctx.lineWidth=0.5;
    ctx.beginPath(); ctx.arc(b.x,b.y,4.5,0,Math.PI*2); ctx.stroke();
  }

  // =========================================
  // KHỞI TẠO CẦU THỦ
  // =========================================
  function initPlayers() {
    state.players=[];
    // 6 cầu thủ mỗi đội (đơn giản, đủ để thấy)
    const homePositions=[
      [45,H2()],[30,H2()-35],[30,H2()+35],
      [80,H2()-50],[80,H2()],[80,H2()+50],
    ];
    const awayPositions=[
      [FIELD_W-45,H2()],[FIELD_W-30,H2()-35],[FIELD_W-30,H2()+35],
      [FIELD_W-80,H2()-50],[FIELD_W-80,H2()],[FIELD_W-80,H2()+50],
    ];
    for(let i=0;i<6;i++){
      state.players.push({x:homePositions[i][0],y:homePositions[i][1],vx:0,vy:0,team:'home',id:i});
      state.players.push({x:awayPositions[i][0],y:awayPositions[i][1],vx:0,vy:0,team:'away',id:i});
    }
    state.ball={x:FIELD_W/2,y:FIELD_H/2,vx:(Math.random()-0.5)*1.5,vy:(Math.random()-0.5)*1.5,owner:null};
  }

  function H2(){ return FIELD_H/2; }

  // =========================================
  // SIMULATE PLAYERS
  // =========================================
  function simulatePlayers(elapsed, totalGoals) {
    const ball=state.ball;
    const MARGIN=12, SPEED=0.8;

    // Xác định đội đang tấn công (random đổi mỗi 5 giây)
    const attacking = Math.floor(elapsed/5) % 2 === 0 ? 'home' : 'away';

    for(const p of state.players){
      let tx, ty;
      const isAttacking = p.team===attacking;

      if(isAttacking){
        // Tiến về phía bóng/khung thành
        if(Math.abs(p.x-ball.x)<60 && Math.abs(p.y-ball.y)<40){
          // Tranh bóng
          tx=ball.x; ty=ball.y;
        } else {
          // Tiến lên tấn công
          tx = p.team==='home' ? FIELD_W*0.65+Math.random()*30 : FIELD_W*0.35-Math.random()*30;
          ty = FIELD_H/2 + (Math.random()-0.5)*50;
        }
      } else {
        // Phòng thủ
        tx = p.team==='home' ? FIELD_W*0.35+Math.random()*30 : FIELD_W*0.65-Math.random()*30;
        ty = p.y + (Math.random()-0.5)*3;
      }

      // Di chuyển về target
      const dx=tx-p.x, dy=ty-p.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist>2){
        p.vx=(dx/dist)*SPEED*(0.5+Math.random()*0.5);
        p.vy=(dy/dist)*SPEED*(0.5+Math.random()*0.5);
      } else {
        p.vx+=(Math.random()-0.5)*0.3;
        p.vy+=(Math.random()-0.5)*0.3;
      }

      p.x+=p.vx; p.y+=p.vy;
      // Giới hạn sân
      p.x=Math.max(MARGIN,Math.min(FIELD_W-MARGIN,p.x));
      p.y=Math.max(MARGIN,Math.min(FIELD_H-MARGIN,p.y));
    }

    // Di chuyển bóng
    ball.x+=ball.vx; ball.y+=ball.vy;
    ball.vx*=0.97; ball.vy*=0.97;

    // Bóng nẩy thành
    if(ball.x<14||ball.x>FIELD_W-14){ ball.vx*=-1; ball.x=Math.max(14,Math.min(FIELD_W-14,ball.x)); }
    if(ball.y<14||ball.y>FIELD_H-14){ ball.vy*=-1; ball.y=Math.max(14,Math.min(FIELD_H-14,ball.y)); }

    // Cầu thủ gần bóng nhất kick bóng
    let nearest=null, nearDist=Infinity;
    for(const p of state.players){
      const d=Math.sqrt((p.x-ball.x)**2+(p.y-ball.y)**2);
      if(d<nearDist){nearDist=d;nearest=p;}
    }
    if(nearest && nearDist<15){
      // Kick về phía khung thành đối phương + random
      const targetX=nearest.team==='home'?FIELD_W-15:15;
      const targetY=FIELD_H/2+(Math.random()-0.5)*40;
      const dx=targetX-ball.x, dy=targetY-ball.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      ball.vx=(dx/dist)*(1.5+Math.random()*2);
      ball.vy=(dy/dist)*(1.5+Math.random()*2)+(Math.random()-0.5);
    }
  }

  // =========================================
  // START GAME
  // =========================================
  function start() {
    if(state.phase!=='select'||state.selected===null||!state.betSide) return;
    const bet=Casino.deductBet('fb');
    if(bet===false) return;

    state.bet=bet;
    state.phase='playing';
    state.elapsed=0;
    state.score=[0,0];

    const m=state.matches[state.selected];
    // Reset events shown
    m.goals.forEach(g=>g.shown=false);

    document.getElementById('fb-result').className='casino-result';
    document.getElementById('fb-events').innerHTML='';
    document.getElementById('fb-score-h').textContent='0';
    document.getElementById('fb-score-a').textContent='0';

    // Ẩn danh sách, disable odds
    document.getElementById('fb-match-list').style.display='none';
    document.querySelectorAll('.sport-odds-btn[data-side]').forEach(b=>b.disabled=true);
    const sb=document.getElementById('btn-fb-start');
    if(sb){sb.disabled=true; sb.textContent='⏳ ĐANG THI ĐẤU...';}

    canvas=document.getElementById('fb-canvas');
    ctx=canvas?.getContext('2d');
    initPlayers();
    Casino.updateAllBalances();

    // Timer 1 tick = 1 giây = 1 phút bóng đá
    // Animation frame cho simulation
    let lastTick=0;
    let simAccum=0;

    function loop(ts){
      if(state.phase!=='playing') return;
      const dt=ts-lastTick; lastTick=ts;
      simAccum+=dt;

      // Simulate vật lý mỗi 50ms
      if(simAccum>=50){
        simAccum=0;
        simulatePlayers(state.elapsed, m.goals.length);
      }
      drawPlayers();
      animFrame=requestAnimationFrame(loop);
    }
    animFrame=requestAnimationFrame(loop);

    // Game clock: 1 giây thật = 1 phút bóng đá, 90 giây tổng
    state.interval=setInterval(()=>{
      state.elapsed++;
      const bar=document.getElementById('fb-bar');
      if(bar) bar.style.width=(state.elapsed/90*100)+'%';
      const tl=document.getElementById('fb-time');
      if(tl) tl.textContent=state.elapsed+"'";

      // Goals
      for(const ev of m.goals){
        if(ev.minute===state.elapsed&&!ev.shown){
          ev.shown=true;
          if(ev.team==='home') state.score[0]++; else state.score[1]++;
          document.getElementById('fb-score-h').textContent=state.score[0];
          document.getElementById('fb-score-a').textContent=state.score[1];

          const evEl=document.getElementById('fb-events');
          const team=ev.team==='home'?m.home:m.away;
          const color=ev.team==='home'?m.hColor:m.aColor;
          if(evEl){
            evEl.innerHTML+=`<div class="sport-event" style="color:${color}">⚽ ${ev.minute}' — ${team.toUpperCase()}</div>`;
            evEl.scrollTop=evEl.scrollHeight;
          }

          // Kick bóng về phía khung thành sau khi ghi bàn
          state.ball={x:FIELD_W/2,y:FIELD_H/2,vx:(Math.random()-0.5)*2,vy:(Math.random()-0.5)*2,owner:null};
        }
      }

      if(state.elapsed>=90){
        clearInterval(state.interval);
        cancelAnimationFrame(animFrame);
        finish();
      }
    }, 1000);
  }

  // =========================================
  // FINISH
  // =========================================
  function finish() {
    state.phase='done';
    const m=state.matches[state.selected];
    const [h,a]=state.score;
    const winner=h>a?'home':a>h?'away':'draw';
    const won=winner===state.betSide;
    const odds=m[state.betSide==='home'?'homeOdds':state.betSide==='away'?'awayOdds':'drawOdds'];
    const bet=state.bet;

    // Vẽ frame cuối cùng
    if(ctx) drawPlayers();

    if(won){
      const pay=Math.floor(bet*odds);
      Casino.addWin(pay);
      Casino.showResult('fb-result','win',`THẮNG! +${Format.money(pay-bet)} (×${odds}) | ${h}–${a}`);
    } else {
      Casino.showResult('fb-result','lose',`THUA! −${Format.money(bet)} | KQ: ${h}–${a}`);
    }

    const sb=document.getElementById('btn-fb-start');
    if(sb){sb.disabled=false; sb.textContent='⚽ CHƠI LẠI';}

    // Hiện lại danh sách
    setTimeout(()=>{
      state.phase='select';
      state.selected=null;
      state.betSide=null;
      generateMatches();
      document.getElementById('fb-match-list').style.display='';
      document.getElementById('fb-pitch-wrap').style.display='none';
      document.getElementById('fb-odds').style.display='none';
      document.getElementById('fb-result').className='casino-result';

      // Re-render match list
      const list=document.getElementById('fb-match-list');
      if(list){
        list.innerHTML=`<div class="fb-list-title">⚽ CHỌN TRẬN ĐẤU</div>`
          +state.matches.map((m,i)=>`
            <div class="fb-match-row" data-idx="${i}" id="fb-row-${i}">
              <span class="fb-row-home" style="color:${m.hColor}">${m.home}</span>
              <span class="fb-row-odds">
                <span>×${m.homeOdds}</span>
                <span class="fb-row-draw">×${m.drawOdds}</span>
                <span>×${m.awayOdds}</span>
              </span>
              <span class="fb-row-away" style="color:${m.aColor}">${m.away}</span>
            </div>`).join('');
        list.querySelectorAll('.fb-match-row').forEach(row=>{
          row.addEventListener('click',()=>{
            if(state.phase!=='select') return;
            list.querySelectorAll('.fb-match-row').forEach(r=>r.classList.remove('selected'));
            row.classList.add('selected');
            selectMatch(parseInt(row.dataset.idx));
          });
        });
      }

      document.querySelectorAll('.sport-odds-btn[data-side]').forEach(b=>b.disabled=false);
      updateStartBtn();
    }, 3000);

    Casino.updateAllBalances();
  }

  return { renderHTML, bindEvents };
})();