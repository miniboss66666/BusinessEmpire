/* ============================================
   CASINO/HORSE.JS — 7 con ngựa, kịch tính
   ============================================ */

const CasinoHorse = (() => {

  const HORSES=[
    {name:'⚡ Thunder', color:'#f5c518'},
    {name:'🌊 Storm',   color:'#00d4ff'},
    {name:'🔥 Blaze',   color:'#ff4455'},
    {name:'🌙 Shadow',  color:'#a855f7'},
    {name:'🌟 Star',    color:'#00ff88'},
    {name:'🍀 Lucky',   color:'#ff6b35'},
    {name:'👑 King',    color:'#ffd700'},
  ];

  const FINISH = 90; // % track

  let state={
    phase:'idle', betHorse:null, bet:0, interval:null,
    positions: new Array(7).fill(0),
    // Mỗi con ngựa có state riêng
    horses: [], // [{speed, targetSpeed, burstTimer, restTimer, stamina}]
    odds: [],
    winner: -1,
    finished: [],
  };

  function randomOdds() {
    return HORSES.map(()=>parseFloat((1.3+Math.random()*5).toFixed(1)));
  }

  // Khởi tạo "tính cách" mỗi con ngựa
  function initHorseStates() {
    state.horses = HORSES.map((_, i) => {
      const baseSpeed = 0.04 + Math.random() * 0.04; // tốc độ nền
      return {
        speed:       baseSpeed,
        targetSpeed: baseSpeed,
        baseSpeed,
        // Stamina: con có stamina cao thì cuối đường về mạnh hơn
        stamina:     0.3 + Math.random() * 0.7,
        // Burst: đếm ngược đến lần bứt tốc tiếp theo
        burstCooldown: Math.random() * 30,
        // Đang trong trạng thái nào
        mode: 'normal', // 'normal' | 'burst' | 'tired'
        modeTicks: 0,
      };
    });
  }

  function renderHTML() {
    if(state.phase==='idle') state.odds=randomOdds();
    return `
      <div class="casino-game-wrap">
        <div class="horse-track" id="horse-track">
          ${HORSES.map((h,i)=>`
            <div class="horse-lane">
              <div class="horse-name" style="color:${h.color}">${h.name}</div>
              <div class="horse-lane-track">
                <div class="horse-runner" id="horse-${i}" style="color:${h.color}">🐎</div>
              </div>
              <div class="horse-odds-tag" id="horse-odds-${i}">×${state.odds[i]}</div>
            </div>`).join('')}
          <div class="horse-finish-line"></div>
        </div>

        <div class="horse-bet-grid">
          ${HORSES.map((h,i)=>`
            <button class="horse-pick-btn" data-horse="${i}" style="border-color:${h.color}">
              <span style="color:${h.color};font-size:.68rem">${h.name}</span>
              <span class="horse-pick-odds" id="pick-odds-${i}">×${state.odds[i]}</span>
            </button>`).join('')}
        </div>

        <div class="casino-result" id="horse-result"></div>
        ${Casino.renderBetControls('horse')}
        <button class="casino-play-btn" id="btn-horse-start" disabled>🏇 ĐẶT CƯỢC & XUẤT PHÁT</button>
      </div>
    `;
  }

  function bindEvents() {
    document.querySelectorAll('.horse-pick-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        if(state.phase!=='idle') return;
        document.querySelectorAll('.horse-pick-btn').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
        state.betHorse=parseInt(btn.dataset.horse);
        const sb=document.getElementById('btn-horse-start'); if(sb) sb.disabled=false;
      });
    });
    document.getElementById('btn-horse-start')?.addEventListener('click', start);
  }

  function start() {
    if(state.phase!=='idle') return;
    if(state.betHorse===null){ UI.toast('Chọn ngựa trước!','warn'); return; }
    const bet=Casino.deductBet('horse');
    if(bet===false) return;

    state.bet=bet;
    state.phase='running';
    state.positions=new Array(7).fill(0);
    state.finished=[];
    state.winner=-1;

    // Giữ nguyên odds đã hiển thị khi người chơi chọn — KHÔNG random lại

    initHorseStates();

    document.getElementById('horse-result').className='casino-result';
    document.querySelectorAll('.horse-pick-btn').forEach(b=>b.disabled=true);
    const sb=document.getElementById('btn-horse-start');
    if(sb){sb.disabled=true; sb.textContent='🏇 ĐANG ĐUA...';}
    Casino.updateAllBalances();

    state.interval=setInterval(tick, 80);
  }

  function tick() {
    const progress = Math.max(...state.positions) / FINISH; // 0→1 tiến độ chung

    for(let i=0;i<7;i++){
      if(state.positions[i]>=FINISH) continue;

      const h=state.horses[i];

      // ── Cập nhật mode ──────────────────────────
      h.modeTicks--;
      if(h.modeTicks<=0){
        h.burstCooldown--;
        if(h.burstCooldown<=0){
          // Quyết định mode tiếp theo
          const roll=Math.random();

          if(roll<0.35){
            // BURST — bứt tốc!
            h.mode='burst';
            h.modeTicks = 8 + Math.floor(Math.random()*12); // 0.6–1.6 giây
            h.targetSpeed = h.baseSpeed * (1.8 + Math.random()*1.2);
            h.burstCooldown = 15 + Math.floor(Math.random()*20);
          } else if(roll<0.55){
            // TIRED — hụt hơi
            h.mode='tired';
            h.modeTicks = 10 + Math.floor(Math.random()*15);
            h.targetSpeed = h.baseSpeed * (0.3 + Math.random()*0.3);
            h.burstCooldown = 8 + Math.floor(Math.random()*12);
          } else {
            // NORMAL
            h.mode='normal';
            h.modeTicks = 5 + Math.floor(Math.random()*10);
            h.targetSpeed = h.baseSpeed * (0.8 + Math.random()*0.5);
            h.burstCooldown = 5 + Math.floor(Math.random()*10);
          }
        }
      }

      // Cuối đường — stamina cao thì bứt phá, thấp thì chậm lại
      if(progress > 0.75){
        if(h.stamina>0.6 && h.mode!=='burst'){
          h.mode='burst';
          h.targetSpeed=h.baseSpeed*(1.5+h.stamina*0.8);
        } else if(h.stamina<0.4 && h.mode!=='tired'){
          h.mode='tired';
          h.targetSpeed=h.baseSpeed*0.4;
        }
      }

      // Smooth acceleration / deceleration
      const accel = h.mode==='burst' ? 0.012 : 0.008;
      if(h.speed < h.targetSpeed) h.speed = Math.min(h.speed+accel, h.targetSpeed);
      else                        h.speed = Math.max(h.speed-accel, h.targetSpeed);

      // Tiny noise để trông tự nhiên
      const noise = (Math.random()-0.5)*0.008;

      state.positions[i] += Math.max(0.005, h.speed + noise);

      if(state.positions[i]>=FINISH){
        state.positions[i]=FINISH;
        state.finished.push(i);
        const rank=state.finished.length;
        if(rank===1) state.winner=i;
        const el=document.getElementById('horse-'+i);
        if(el) el.textContent = rank===1?'🥇':rank===2?'🥈':rank===3?'🥉':'✅';
      }

      const el=document.getElementById('horse-'+i);
      if(el) el.style.left=state.positions[i]+'%';
    }

    // Kết thúc khi tất cả về đích
    if(state.finished.length===7){
      clearInterval(state.interval);
      finish();
    }
  }

  function finish() {
    state.phase='done';
    const winner=state.winner;
    const won=winner===state.betHorse;
    const odds=state.odds[state.betHorse];
    const bet=state.bet;
    const myRank=state.finished.indexOf(state.betHorse)+1;

    if(won){
      const pay=Math.floor(bet*odds);
      Casino.addWin(pay);
      Casino.showResult('horse-result','win',
        `${HORSES[winner].name} THẮNG! +${Format.money(pay-bet)} (×${odds})`);
    } else {
      Casino.showResult('horse-result','lose',
        `${HORSES[winner].name} THẮNG! Ngựa bạn về thứ ${myRank} −${Format.money(bet)}`);
    }

    const sb=document.getElementById('btn-horse-start');
    if(sb){sb.disabled=false; sb.textContent='🏇 ĐẶT CƯỢC & XUẤT PHÁT';}
    document.querySelectorAll('.horse-pick-btn').forEach(b=>{
      b.disabled=false; b.classList.remove('selected');
    });

    setTimeout(()=>{
      state.betHorse=null; state.phase='idle';
      state.positions=new Array(7).fill(0);
      state.finished=[]; state.winner=-1;
      state.odds=randomOdds();
      for(let i=0;i<7;i++){
        const el=document.getElementById('horse-'+i);
        const odEl=document.getElementById('horse-odds-'+i);
        const pkEl=document.getElementById('pick-odds-'+i);
        if(el){el.style.left='0%'; el.textContent='🐎';}
        if(odEl) odEl.textContent='×'+state.odds[i];
        if(pkEl) pkEl.textContent='×'+state.odds[i];
      }
    }, 3000);

    Casino.updateAllBalances();
  }

  return { renderHTML, bindEvents };
})();