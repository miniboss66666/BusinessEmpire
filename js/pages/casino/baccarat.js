/* ============================================
   CASINO/BACCARAT.JS
   ============================================ */

const CasinoBaccarat = (() => {

  // Baccarat: Ace=1, 2-9=face, 10/J/Q/K=0, chỉ lấy chữ số hàng đơn vị
  function buildDeck() {
    const suits=['♠','♥','♦','♣'], ranks=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const d=[];
    for(const s of suits) for(const r of ranks) d.push({r,s});
    for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}
    return d;
  }

  function bVal(c) {
    if(c.r==='A') return 1;
    if(['10','J','Q','K'].includes(c.r)) return 0;
    return parseInt(c.r);
  }

  function bTotal(hand) { return hand.reduce((s,c)=>s+bVal(c),0) % 10; }
  function isRed(c){ return c.s==='♥'||c.s==='♦'; }
  function cardHTML(c){ return `<div class="bj-card ${isRed(c)?'red':'black'}">${c.r}${c.s}</div>`; }

  let deck=[], playerH=[], bankerH=[], phase='idle';

  function renderHTML() {
    return `
      <div class="casino-game-wrap">
        <div class="baccarat-table">
          <div class="bacc-side">
            <div class="bj-area-label">BANKER</div>
            <div class="bj-cards" id="bacc-banker"></div>
            <div class="bj-score" id="bacc-bscore">—</div>
          </div>
          <div class="bacc-vs">VS</div>
          <div class="bacc-side">
            <div class="bj-area-label">PLAYER</div>
            <div class="bj-cards" id="bacc-player"></div>
            <div class="bj-score" id="bacc-pscore">—</div>
          </div>
        </div>

        <div class="sport-bet-odds" style="margin:8px 0">
          <button class="sport-odds-btn" data-side="player" id="bacc-btn-player">
            <span class="odds-team">Player</span>
            <span class="odds-val">×1.95</span>
          </button>
          <button class="sport-odds-btn" data-side="tie" id="bacc-btn-tie">
            <span class="odds-team">Hòa</span>
            <span class="odds-val">×8</span>
          </button>
          <button class="sport-odds-btn" data-side="banker" id="bacc-btn-banker">
            <span class="odds-team">Banker</span>
            <span class="odds-val">×1.90</span>
          </button>
        </div>

        <div class="casino-result" id="bacc-result"></div>
        ${Casino.renderBetControls('bacc')}
        <button class="casino-play-btn" id="btn-bacc-deal" disabled>🎴 DEAL</button>
      </div>
    `;
  }

  let betSide=null;

  function bindEvents() {
    document.querySelectorAll('.sport-odds-btn[data-side]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        document.querySelectorAll('.sport-odds-btn[data-side]').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
        betSide=btn.dataset.side;
        const db=document.getElementById('btn-bacc-deal'); if(db) db.disabled=false;
      });
    });
    document.getElementById('btn-bacc-deal')?.addEventListener('click', dealBaccarat);
  }

  function dealBaccarat() {
    if(!betSide){ UI.toast('Chọn cửa trước!','warn'); return; }
    const bet=Casino.deductBet('bacc');
    if(bet===false) return;
    phase='playing';

    deck=buildDeck();
    playerH=[deck.pop(),deck.pop()];
    bankerH=[deck.pop(),deck.pop()];

    let pt=bTotal(playerH), bt=bTotal(bankerH);

    // Third card rules
    if(pt<=5) playerH.push(deck.pop());
    if(bt<=5) bankerH.push(deck.pop());
    pt=bTotal(playerH); bt=bTotal(bankerH);

    // Render
    document.getElementById('bacc-player').innerHTML=playerH.map(cardHTML).join('');
    document.getElementById('bacc-banker').innerHTML=bankerH.map(cardHTML).join('');
    document.getElementById('bacc-pscore').textContent=pt;
    document.getElementById('bacc-bscore').textContent=bt;

    setTimeout(()=>{
      let winner = pt>bt?'player':bt>pt?'banker':'tie';
      let won = winner===betSide;
      const mult = betSide==='tie'?8:betSide==='player'?1.95:1.90;

      if(won){
        const pay=Math.floor(bet*mult);
        Casino.addWin(pay);
        Casino.showResult('bacc-result','win',`${winner.toUpperCase()} THẮNG! +${Format.money(pay-bet)}`);
      } else if(!won&&winner==='tie'&&betSide!=='tie'){
        // Tie — hoàn cược nếu không đặt tie
        Casino.addWin(bet);
        Casino.showResult('bacc-result','push','HÒA — hoàn cược');
      } else {
        Casino.showResult('bacc-result','lose',`THUA! −${Format.money(bet)} | ${winner.toUpperCase()} thắng`);
      }

      // Reset
      document.querySelectorAll('.sport-odds-btn[data-side]').forEach(b=>b.classList.remove('selected'));
      betSide=null;
      const db=document.getElementById('btn-bacc-deal'); if(db) db.disabled=true;
      phase='idle';
      Casino.updateAllBalances();
    }, 800);

    Casino.updateAllBalances();
  }

  return { renderHTML, bindEvents };
})();