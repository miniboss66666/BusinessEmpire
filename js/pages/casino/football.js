/* ============================================
   CASINO/FOOTBALL.JS — 90 giây
   ============================================ */

const CasinoFootball = (() => {

  const TEAMS=[
    ['Man City','Arsenal'],['Real Madrid','Barcelona'],['Liverpool','Chelsea'],
    ['PSG','Bayern'],['Inter','Juventus'],['Dortmund','Leipzig'],
    ['Atletico','Sevilla'],['Ajax','PSV'],['Benfica','Porto'],['Flamengo','Palmeiras'],
  ];

  let state={phase:'idle', interval:null, elapsed:0, score:[0,0],
             betSide:null, bet:0, odds:{}, events:[], home:'', away:''};

  function renderHTML() {
    return `
      <div class="casino-game-wrap">
        <div class="sport-match-card">
          <div class="sport-match-teams">
            <div class="sport-team" id="fb-home">— VS —</div>
            <div class="sport-score" id="fb-score">0 – 0</div>
            <div class="sport-team" id="fb-away"></div>
          </div>
          <div class="sport-timer">
            <div class="sport-timer-bar-wrap">
              <div class="sport-timer-bar" id="fb-bar" style="width:0%"></div>
            </div>
            <div class="sport-timer-label" id="fb-time">0:00</div>
          </div>
          <div class="sport-events" id="fb-events"></div>
        </div>

        <div class="sport-bet-odds">
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

  function bindEvents() {
    document.querySelectorAll('.sport-odds-btn[data-side]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        if(state.phase!=='idle') return;
        document.querySelectorAll('.sport-odds-btn[data-side]').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
        state.betSide=btn.dataset.side;
        const sb=document.getElementById('btn-fb-start'); if(sb) sb.disabled=false;
      });
    });
    document.getElementById('btn-fb-start')?.addEventListener('click', start);
  }

  function start() {
    if(state.phase!=='idle') return;
    if(!state.betSide){ UI.toast('Chọn kèo trước!','warn'); return; }
    const bet=Casino.deductBet('fb');
    if(bet===false) return;

    const [home,away]=TEAMS[Math.floor(Math.random()*TEAMS.length)];
    const homeOdds=+(1.5+Math.random()*2).toFixed(2);
    const awayOdds=+(1.8+Math.random()*2.5).toFixed(2);
    const drawOdds=+(2.8+Math.random()*1.5).toFixed(2);

    // Pre-generate goals
    const goals=[];
    const n=Math.floor(Math.random()*5);
    for(let i=0;i<n;i++){
      goals.push({minute:Math.floor(Math.random()*90)+1, team:Math.random()<0.5?'home':'away', shown:false});
    }
    goals.sort((a,b)=>a.minute-b.minute);

    Object.assign(state,{phase:'playing',bet,elapsed:0,score:[0,0],
      home,away,odds:{home:homeOdds,away:awayOdds,draw:drawOdds},events:goals});

    // Update UI
    document.getElementById('fb-home').textContent=home.toUpperCase();
    document.getElementById('fb-away').textContent=away.toUpperCase();
    document.getElementById('fb-label-home').textContent=home;
    document.getElementById('fb-label-away').textContent=away;
    document.getElementById('fb-odds-home').textContent='×'+homeOdds;
    document.getElementById('fb-odds-away').textContent='×'+awayOdds;
    document.getElementById('fb-odds-draw').textContent='×'+drawOdds;
    document.getElementById('fb-result').className='casino-result';
    document.getElementById('fb-events').innerHTML='';

    const sb=document.getElementById('btn-fb-start');
    if(sb){sb.disabled=true; sb.textContent='⏳ ĐANG THI ĐẤU...';}
    document.querySelectorAll('.sport-odds-btn[data-side]').forEach(b=>b.disabled=true);
    Casino.updateAllBalances();

    // 1 tick = 1 giây thật = 1 phút bóng đá
    state.interval=setInterval(()=>{
      state.elapsed++;
      const bar=document.getElementById('fb-bar');
      if(bar) bar.style.width=(state.elapsed/90*100)+'%';
      const tl=document.getElementById('fb-time');
      if(tl) tl.textContent=state.elapsed+':00';

      // Goals
      for(const ev of state.events){
        if(ev.minute===state.elapsed&&!ev.shown){
          ev.shown=true;
          if(ev.team==='home') state.score[0]++; else state.score[1]++;
          const sc=document.getElementById('fb-score');
          if(sc) sc.textContent=state.score[0]+' – '+state.score[1];
          const evEl=document.getElementById('fb-events');
          if(evEl){
            const team=ev.team==='home'?state.home:state.away;
            evEl.innerHTML+=`<div class="sport-event">⚽ ${ev.minute}' — ${team.toUpperCase()}</div>`;
            evEl.scrollTop=evEl.scrollHeight;
          }
        }
      }

      if(state.elapsed>=90){ clearInterval(state.interval); finish(); }
    }, 1000);
  }

  function finish() {
    state.phase='done';
    const [h,a]=state.score;
    const winner=h>a?'home':a>h?'away':'draw';
    const won=winner===state.betSide;
    const odds=state.odds[state.betSide];
    const bet=state.bet;

    if(won){
      const pay=Math.floor(bet*odds);
      Casino.addWin(pay);
      Casino.showResult('fb-result','win',`THẮNG! +${Format.money(pay-bet)} (×${odds}) | KQ: ${h}–${a}`);
    } else {
      Casino.showResult('fb-result','lose',`THUA! −${Format.money(bet)} | KQ: ${h}–${a}`);
    }

    const sb=document.getElementById('btn-fb-start');
    if(sb){sb.disabled=false; sb.textContent='⚽ ĐẶT CƯỢC & BẮT ĐẦU';}
    document.querySelectorAll('.sport-odds-btn[data-side]').forEach(b=>{
      b.disabled=false; b.classList.remove('selected');
    });
    state.phase='idle'; state.betSide=null;
    Casino.updateAllBalances();
  }

  return { renderHTML, bindEvents };
})();