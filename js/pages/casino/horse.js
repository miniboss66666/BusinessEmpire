/* ============================================
   CASINO/HORSE.JS — 7 con ngựa, 10 giây
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

  let state={phase:'idle', betHorse:null, bet:0, interval:null,
             positions:new Array(7).fill(0), speeds:[], odds:[]};

  function randomOdds() {
    return HORSES.map(()=>parseFloat((1.3+Math.random()*5).toFixed(1)));
  }

  function renderHTML() {
    const odds=state.phase==='idle'?randomOdds():state.odds;
    if(state.phase==='idle') state.odds=odds;
    return `
      <div class="casino-game-wrap">
        <div class="horse-track" id="horse-track">
          ${HORSES.map((h,i)=>`
            <div class="horse-lane">
              <div class="horse-name" style="color:${h.color}">${h.name}</div>
              <div class="horse-lane-track">
                <div class="horse-runner" id="horse-${i}" style="color:${h.color}">🐎</div>
              </div>
              <div class="horse-odds-tag" id="horse-odds-${i}">×${odds[i]}</div>
            </div>`).join('')}
          <div class="horse-finish-line"></div>
        </div>

        <div class="horse-bet-grid">
          ${HORSES.map((h,i)=>`
            <button class="horse-pick-btn" data-horse="${i}" style="border-color:${h.color}">
              <span style="color:${h.color};font-size:.68rem">${h.name}</span>
              <span class="horse-pick-odds" id="pick-odds-${i}">×${odds[i]}</span>
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

    state.bet=bet; state.phase='running';
    state.positions=new Array(7).fill(0);

    // Refresh odds
    state.odds=randomOdds();
    HORSES.forEach((_,i)=>{
      const el=document.getElementById('horse-odds-'+i);
      const pk=document.getElementById('pick-odds-'+i);
      if(el) el.textContent='×'+state.odds[i];
      if(pk) pk.textContent='×'+state.odds[i];
    });

    // Tốc độ có bias: odds thấp = nhanh hơn (nhẹ)
    state.speeds=state.odds.map(o=>1/o + Math.random()*0.12);

    document.getElementById('horse-result').className='casino-result';
    document.querySelectorAll('.horse-pick-btn').forEach(b=>b.disabled=true);
    const sb=document.getElementById('btn-horse-start');
    if(sb){sb.disabled=true; sb.textContent='🏇 ĐANG ĐUA...';}
    Casino.updateAllBalances();

    const FINISH=72; // % của track
    let elapsed=0;
    state.interval=setInterval(()=>{
      elapsed+=0.1;
      let winner=-1;
      for(let i=0;i<7;i++){
        state.positions[i]+=state.speeds[i]*0.85;
        if(state.positions[i]>=FINISH&&winner===-1) winner=i;
        state.positions[i]=Math.min(state.positions[i],FINISH);
        const el=document.getElementById('horse-'+i);
        if(el) el.style.left=state.positions[i]+'%';
      }
      if(winner!==-1||elapsed>=10){
        clearInterval(state.interval);
        // Winner = vị trí xa nhất
        const w=state.positions.indexOf(Math.max(...state.positions));
        finish(w);
      }
    }, 100);
  }

  function finish(winner) {
    state.phase='done';
    const won=winner===state.betHorse;
    const odds=state.odds[state.betHorse];
    const bet=state.bet;

    const winEl=document.getElementById('horse-'+winner);
    if(winEl) winEl.textContent='🏆';

    if(won){
      const pay=Math.floor(bet*odds);
      Casino.addWin(pay);
      Casino.showResult('horse-result','win',`${HORSES[winner].name} THẮNG! +${Format.money(pay-bet)} (×${odds})`);
    } else {
      Casino.showResult('horse-result','lose',`${HORSES[winner].name} THẮNG! Ngựa bạn thua −${Format.money(bet)}`);
    }

    const sb=document.getElementById('btn-horse-start');
    if(sb){sb.disabled=false; sb.textContent='🏇 ĐẶT CƯỢC & XUẤT PHÁT';}
    document.querySelectorAll('.horse-pick-btn').forEach(b=>{
      b.disabled=false; b.classList.remove('selected');
    });

    setTimeout(()=>{
      state.betHorse=null; state.phase='idle';
      state.positions=new Array(7).fill(0);
      for(let i=0;i<7;i++){
        const el=document.getElementById('horse-'+i);
        if(el){el.style.left='0%'; el.textContent='🐎';}
      }
    }, 2000);

    Casino.updateAllBalances();
  }

  return { renderHTML, bindEvents };
})();