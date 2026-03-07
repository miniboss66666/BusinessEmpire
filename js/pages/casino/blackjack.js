/* ============================================
   CASINO/BLACKJACK.JS
   ============================================ */

const CasinoBlackjack = (() => {

  let deck=[], player=[], dealer=[], phase='idle', betAmt=0;

  function buildDeck() {
    const suits=['♠','♥','♦','♣'], ranks=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const d=[];
    for(const s of suits) for(const r of ranks) d.push({r,s});
    for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}
    return d;
  }

  function val(c){if(['J','Q','K'].includes(c.r))return 10;if(c.r==='A')return 11;return parseInt(c.r);}
  function total(h){let t=0,a=0;for(const c of h){t+=val(c);if(c.r==='A')a++;}while(t>21&&a>0){t-=10;a--;}return t;}
  function isRed(c){return c.s==='♥'||c.s==='♦';}

  function card(c, back=false) {
    if(back) return `<div class="bj-card back"></div>`;
    return `<div class="bj-card ${isRed(c)?'red':'black'}">${c.r}${c.s}</div>`;
  }

  function renderHTML() {
    return `
      <div class="casino-game-wrap">
        <div class="bj-table">
          <div class="bj-area-label">DEALER</div>
          <div class="bj-cards" id="bj-dealer"><div class="bj-card back"></div><div class="bj-card back"></div></div>
          <div class="bj-score" id="bj-dscore">?</div>
          <div style="border-top:1px solid rgba(255,255,255,0.08);margin:8px 0"></div>
          <div class="bj-area-label">PLAYER</div>
          <div class="bj-cards" id="bj-player"><div class="bj-card back"></div><div class="bj-card back"></div></div>
          <div class="bj-score" id="bj-pscore">?</div>
        </div>

        <div class="casino-result" id="bj-result"></div>

        <div class="bj-actions">
          <button class="bj-btn" id="bj-hit"    disabled>HIT</button>
          <button class="bj-btn" id="bj-stand"  disabled>STAND</button>
          <button class="bj-btn" id="bj-double" disabled>DOUBLE</button>
        </div>

        ${Casino.renderBetControls('bj')}
        <button class="casino-play-btn" id="bj-deal">🃏 DEAL</button>
      </div>
    `;
  }

  function bindEvents() {
    document.getElementById('bj-deal')  ?.addEventListener('click', deal);
    document.getElementById('bj-hit')   ?.addEventListener('click', hit);
    document.getElementById('bj-stand') ?.addEventListener('click', stand);
    document.getElementById('bj-double')?.addEventListener('click', dbl);
  }

  function renderHands(hideDealer) {
    document.getElementById('bj-dealer').innerHTML = dealer.map((c,i)=>card(c,hideDealer&&i===0)).join('');
    document.getElementById('bj-player').innerHTML = player.map(c=>card(c)).join('');
    const pt=total(player),dt=total(dealer);
    document.getElementById('bj-pscore').textContent = `${pt}${pt>21?' BUST':''}`;
    document.getElementById('bj-dscore').textContent = hideDealer?'?':`${dt}${dt>21?' BUST':''}`;
  }

  function setActions(on) {
    ['bj-hit','bj-stand','bj-double'].forEach(id=>{
      const b=document.getElementById(id); if(b) b.disabled=!on;
    });
    const d=document.getElementById('bj-deal'); if(d) d.disabled=on;
  }

  function deal() {
    const bet = Casino.deductBet('bj');
    if(bet===false) return;
    if(phase!=='idle'&&phase!=='done') return;
    betAmt=bet; phase='playing';
    deck=buildDeck();
    player=[deck.pop(),deck.pop()];
    dealer=[deck.pop(),deck.pop()];
    document.getElementById('bj-result').className='casino-result';
    renderHands(true); setActions(true);
    if(total(player)===21) setTimeout(stand,500);
    Casino.updateAllBalances();
  }

  function hit() {
    if(phase!=='playing') return;
    player.push(deck.pop()); renderHands(true);
    if(total(player)>21) end('bust');
    else if(total(player)===21) setTimeout(stand,300);
  }

  function stand() {
    if(phase!=='playing') return;
    phase='dealer'; setActions(false); renderHands(false);
    const draw=()=>{
      if(total(dealer)<17){
        setTimeout(()=>{ dealer.push(deck.pop()); renderHands(false); draw(); },400);
      } else { setTimeout(resolve,400); }
    };
    setTimeout(draw,400);
  }

  function dbl() {
    if(phase!=='playing') return;
    if(STATE.balance<betAmt){ UI.toast('Không đủ tiền double!','error'); return; }
    STATE.balance -= betAmt; betAmt*=2;
    player.push(deck.pop()); renderHands(true);
    Casino.updateAllBalances();
    if(total(player)>21) end('bust'); else setTimeout(stand,300);
  }

  function resolve() {
    const p=total(player), d=total(dealer);
    const bj=player.length===2&&p===21;
    if(d>21||p>d) end('win',bj);
    else if(p===d) end('push');
    else end('lose');
  }

  function end(result, isBJ=false) {
    phase='done'; renderHands(false); setActions(false);
    if(result==='win'){
      const pay=isBJ?Math.floor(betAmt*2.5):betAmt*2;
      Casino.addWin(pay);
      Casino.showResult('bj-result','win',isBJ?`BLACKJACK! +${Format.money(pay-betAmt)}`:`THẮNG! +${Format.money(betAmt)}`);
    } else if(result==='push'){
      Casino.addWin(betAmt);
      Casino.showResult('bj-result','push','HÒA — hoàn cược');
    } else if(result==='bust'){
      Casino.showResult('bj-result','lose',`BỊ VƯỢT 21! −${Format.money(betAmt)}`);
    } else {
      Casino.showResult('bj-result','lose',`THUA! −${Format.money(betAmt)}`);
    }
    const d=document.getElementById('bj-deal'); if(d) d.textContent='🃏 DEAL LẠI';
    Casino.updateAllBalances();
  }

  return { renderHTML, bindEvents };
})();