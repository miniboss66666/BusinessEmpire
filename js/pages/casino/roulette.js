/* ============================================
   CASINO/ROULETTE.JS
   ============================================ */

const CasinoRoulette = (() => {

  const RED = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  const BETS = [
    {id:'red',   label:'🔴 Đỏ',   cls:'red-btn',   mult:2 },
    {id:'black', label:'⚫ Đen',   cls:'black-btn', mult:2 },
    {id:'green', label:'🟢 Xanh',  cls:'green-btn', mult:35},
    {id:'odd',   label:'Lẻ',       cls:'',          mult:2 },
    {id:'even',  label:'Chẵn',     cls:'',          mult:2 },
    {id:'low',   label:'1–18',     cls:'',          mult:2 },
    {id:'high',  label:'19–36',    cls:'',          mult:2 },
    {id:'1st12', label:'1–12',     cls:'',          mult:3 },
    {id:'2nd12', label:'13–24',    cls:'',          mult:3 },
  ];

  let spinning=false, betType=null, rotation=0;

  function wins(num, bt) {
    if(bt==='green') return num===0;
    if(bt==='red')   return RED.includes(num);
    if(bt==='black') return num>0&&!RED.includes(num);
    if(bt==='odd')   return num>0&&num%2===1;
    if(bt==='even')  return num>0&&num%2===0;
    if(bt==='low')   return num>=1&&num<=18;
    if(bt==='high')  return num>=19&&num<=36;
    if(bt==='1st12') return num>=1&&num<=12;
    if(bt==='2nd12') return num>=13&&num<=24;
    return false;
  }

  function renderHTML() {
    return `
      <div class="casino-game-wrap">
        <div class="roulette-wheel-wrap">
          <div style="position:relative;display:inline-block">
            <div class="roulette-pointer"></div>
            <div class="roulette-wheel" id="roulette-wheel"></div>
          </div>
        </div>

        <div class="casino-result" id="roulette-result"></div>

        <div class="roulette-bets">
          ${BETS.map(b=>`
            <button class="roulette-bet-btn ${b.cls}" data-bet="${b.id}">
              ${b.label}<br>
              <span style="font-size:.55rem;opacity:.7">×${b.mult}</span>
            </button>`).join('')}
        </div>

        ${Casino.renderBetControls('roulette')}
        <button class="casino-play-btn" id="btn-roulette-spin" disabled>🎲 QUAY</button>
      </div>
    `;
  }

  function bindEvents() {
    document.querySelectorAll('.roulette-bet-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.roulette-bet-btn').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
        betType = btn.dataset.bet;
        const s=document.getElementById('btn-roulette-spin'); if(s) s.disabled=false;
      });
    });
    document.getElementById('btn-roulette-spin')?.addEventListener('click', spin);
  }

  function spin() {
    if(spinning||!betType) return;
    const bet = Casino.deductBet('roulette');
    if(bet===false) return;
    spinning=true;

    const spinBtn=document.getElementById('btn-roulette-spin');
    if(spinBtn) spinBtn.disabled=true;
    document.getElementById('roulette-result').className='casino-result';

    const num = Math.floor(Math.random()*37);
    rotation += (5+Math.floor(Math.random()*3))*360 + num*(360/37);
    const wheel=document.getElementById('roulette-wheel');
    if(wheel) wheel.style.transform=`rotate(${rotation}deg)`;

    setTimeout(()=>{
      spinning=false;
      const bd=BETS.find(b=>b.id===betType);
      const won=wins(num,betType);
      const col=num===0?'🟢':RED.includes(num)?'🔴':'⚫';

      if(won){
        const pay=Math.floor(bet*bd.mult);
        Casino.addWin(pay);
        Casino.showResult('roulette-result','win',`${col} ${num} — THẮNG +${Format.money(pay-bet)}`);
      } else {
        Casino.showResult('roulette-result','lose',`${col} ${num} — THUA −${Format.money(bet)}`);
      }
      if(spinBtn) spinBtn.disabled=false;
      Casino.updateAllBalances();
    }, 3200);
  }

  return { renderHTML, bindEvents };
})();