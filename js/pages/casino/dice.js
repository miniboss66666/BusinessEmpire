/* ============================================
   CASINO/DICE.JS — Xúc Xắc
   ============================================ */

const CasinoDice = (() => {

  // Chọn tổng 2 xúc xắc (2-12) hoặc over/under 7
  const BETS = [
    {id:'under7', label:'< 7',    mult:1.8},
    {id:'exactly7',label:'= 7',  mult:4.5},
    {id:'over7',  label:'> 7',   mult:1.8},
    {id:'even',   label:'Chẵn',  mult:1.9},
    {id:'odd',    label:'Lẻ',    mult:1.9},
    {id:'double', label:'Đôi',   mult:6  },
  ];

  const FACES = ['','⚀','⚁','⚂','⚃','⚄','⚅'];
  let rolling=false, betType=null;

  function wins(d1,d2,bt){
    const sum=d1+d2;
    if(bt==='under7')   return sum<7;
    if(bt==='exactly7') return sum===7;
    if(bt==='over7')    return sum>7;
    if(bt==='even')     return sum%2===0;
    if(bt==='odd')      return sum%2===1;
    if(bt==='double')   return d1===d2;
    return false;
  }

  function renderHTML() {
    return `
      <div class="casino-game-wrap">
        <div class="dice-display">
          <div class="dice-face" id="dice-1">⚄</div>
          <div class="dice-plus">+</div>
          <div class="dice-face" id="dice-2">⚂</div>
          <div class="dice-sum" id="dice-sum">= 7</div>
        </div>

        <div class="dice-bet-grid">
          ${BETS.map(b=>`
            <button class="dice-bet-btn" data-bet="${b.id}">
              <span class="dice-bet-label">${b.label}</span>
              <span class="dice-bet-mult">×${b.mult}</span>
            </button>`).join('')}
        </div>

        <div class="casino-result" id="dice-result"></div>
        ${Casino.renderBetControls('dice')}
        <button class="casino-play-btn" id="btn-dice-roll" disabled>🎯 LĂN</button>
      </div>
    `;
  }

  function bindEvents() {
    document.querySelectorAll('.dice-bet-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        document.querySelectorAll('.dice-bet-btn').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
        betType=btn.dataset.bet;
        const rb=document.getElementById('btn-dice-roll'); if(rb) rb.disabled=false;
      });
    });
    document.getElementById('btn-dice-roll')?.addEventListener('click', roll);
  }

  function roll() {
    if(rolling||!betType) return;
    const bet=Casino.deductBet('dice');
    if(bet===false) return;
    rolling=true;

    const btn=document.getElementById('btn-dice-roll'); if(btn) btn.disabled=true;
    document.getElementById('dice-result').className='casino-result';

    // Animate rolls
    let ticks=0;
    const anim=setInterval(()=>{
      const r1=Math.ceil(Math.random()*6), r2=Math.ceil(Math.random()*6);
      document.getElementById('dice-1').textContent=FACES[r1];
      document.getElementById('dice-2').textContent=FACES[r2];
      document.getElementById('dice-sum').textContent=`= ${r1+r2}`;
      ticks++;
      if(ticks>=12){
        clearInterval(anim);
        finish(bet, r1, r2);
      }
    }, 80);
  }

  function finish(bet,d1,d2){
    rolling=false;
    const bd=BETS.find(b=>b.id===betType);
    const won=wins(d1,d2,betType);
    const sum=d1+d2;

    if(won){
      const pay=Math.floor(bet*bd.mult);
      Casino.addWin(pay);
      Casino.showResult('dice-result','win',`${FACES[d1]}+${FACES[d2]}=${sum} — THẮNG +${Format.money(pay-bet)}`);
    } else {
      Casino.showResult('dice-result','lose',`${FACES[d1]}+${FACES[d2]}=${sum} — THUA −${Format.money(bet)}`);
    }

    const btn=document.getElementById('btn-dice-roll'); if(btn) btn.disabled=false;
    Casino.updateAllBalances();
  }

  return { renderHTML, bindEvents };
})();