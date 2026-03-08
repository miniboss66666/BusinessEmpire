// @ts-nocheck
/* UNDERGROUND/PLANT.JS — Trồng Cây */

const UGPlant = (() => {

  const STRAINS = [
    { id:'basic',   emoji:'🌱', name:'Cơ Bản',   growTime:60,  yield:500,    suspOnSell:0.5,  price:0,      seedPrice:100 },
    { id:'purple',  emoji:'🌿', name:'Tím',       growTime:120, yield:2000,   suspOnSell:0.8,  price:5000,   seedPrice:400 },
    { id:'gold',    emoji:'🌾', name:'Vàng',      growTime:300, yield:8000,   suspOnSell:1.2,  price:30000,  seedPrice:1500 },
    { id:'crystal', emoji:'💎', name:'Crystal',   growTime:600, yield:30000,  suspOnSell:2.0,  price:200000, seedPrice:5000 },
    { id:'alien',   emoji:'👾', name:'Alien',     growTime:1800,yield:150000, suspOnSell:3.5,  price:1500000,seedPrice:20000 },
  ];

  function _s() {
    const u = _ug();
    if (!u.plant) u.plant = { unlockedStrain:0, plots:[], maxPlots:3 };
    return u.plant;
  }

  function renderHTML() {
    const s = _s();
    const now = Date.now();

    return `
      <div class="ug-section">
        <div class="ug-section-title">🌿 Trồng Cây <span style="color:var(--text-dim);font-size:0.62rem">${s.plots.length}/${s.maxPlots} ô</span></div>

        <!-- Plots -->
        <div class="plant-plots">
          ${Array.from({length: s.maxPlots}, (_, i) => {
            const plot = s.plots[i];
            if (!plot) return `
              <div class="plant-plot empty" data-plot="${i}">
                <div style="font-size:1.5rem">🟫</div>
                <div style="font-size:0.6rem;color:var(--text-dim)">Ô trống</div>
              </div>`;
            const strain = STRAINS.find(x => x.id === plot.strainId);
            const ready = now >= plot.readyAt;
            const pct = Math.min(100, (now - plot.plantedAt) / (plot.readyAt - plot.plantedAt) * 100);
            return `
              <div class="plant-plot ${ready?'ready':'growing'}">
                <div style="font-size:1.5rem">${strain?.emoji}</div>
                <div style="font-size:0.65rem;font-weight:700">${strain?.name}</div>
                ${ready ? `
                <button class="plant-harvest-btn" data-plot="${i}">🌾 Thu Hoạch</button>` : `
                <div class="plant-progress"><div class="plant-progress-fill" style="width:${pct.toFixed(0)}%"></div></div>
                <div style="font-size:0.58rem;color:var(--text-dim)">${Math.ceil((plot.readyAt-now)/1000)}s còn lại</div>`}
              </div>`;
          }).join('')}
        </div>

        <!-- Strain selector -->
        <div class="ug-section-title" style="margin-top:8px">🌱 Chọn Giống</div>
        <div class="plant-strains">
          ${STRAINS.slice(0, s.unlockedStrain + 1).map(st => `
            <div class="plant-strain-row">
              <span>${st.emoji} ${st.name}</span>
              <span style="font-size:0.6rem;color:var(--text-dim)">${st.growTime}s · +${Format.money(st.yield)} · 🚨${st.suspOnSell}%</span>
              <button class="plant-seed-btn" data-strain="${st.id}"
                      ${STATE.balance < st.seedPrice || s.plots.length >= s.maxPlots ? 'disabled' : ''}>
                🌱 ${Format.money(st.seedPrice)}
              </button>
            </div>`).join('')}
        </div>

        <!-- Unlock next strain -->
        ${s.unlockedStrain < STRAINS.length - 1 ? (() => {
          const next = STRAINS[s.unlockedStrain + 1];
          return `<button class="ug-upgrade-btn" id="btn-plant-unlock"
                    ${STATE.balance < next.price ? 'disabled' : ''}>
            🔓 Mở ${next.emoji} ${next.name} — ${Format.money(next.price)}
          </button>`;
        })() : ''}

        <!-- Expand plots -->
        ${s.maxPlots < 12 ? `
        <button class="ug-upgrade-btn" id="btn-plant-expand"
                ${STATE.balance < s.maxPlots * 5000 ? 'disabled' : ''}>
          ➕ Thêm ô (${s.maxPlots}→${s.maxPlots+1}) — ${Format.money(s.maxPlots * 5000)}
        </button>` : ''}
      </div>`;
  }

  function bindEvents() {
    document.querySelectorAll('.plant-seed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = _s();
        const strain = STRAINS.find(x => x.id === btn.dataset.strain);
        if (!strain || STATE.balance < strain.seedPrice || s.plots.length >= s.maxPlots) return;
        STATE.balance -= strain.seedPrice;
        const now = Date.now();
        s.plots.push({ strainId: strain.id, plantedAt: now, readyAt: now + strain.growTime * 1000 });
        _refresh();
      });
    });
    document.querySelectorAll('.plant-harvest-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = _s();
        const idx = parseInt(btn.dataset.plot);
        const plot = s.plots[idx];
        if (!plot || Date.now() < plot.readyAt) return;
        const strain = STRAINS.find(x => x.id === plot.strainId);
        _ug().dirtyMoney = (_ug().dirtyMoney || 0) + strain.yield;
        UGSuspicion.add(strain.suspOnSell);
        s.plots.splice(idx, 1);
        UI.toast(`🌾 Thu hoạch ${strain.name}: +${Format.money(strain.yield)} tiền bẩn · +${strain.suspOnSell}% nghi vấn`, 'success');
        _refresh();
      });
    });
    document.getElementById('btn-plant-unlock')?.addEventListener('click', () => {
      const s = _s();
      const next = STRAINS[s.unlockedStrain + 1];
      if (!next || STATE.balance < next.price) return;
      STATE.balance -= next.price;
      s.unlockedStrain++;
      UI.toast(`🌿 Mở khóa ${next.name}!`, 'success');
      _refresh();
    });
    document.getElementById('btn-plant-expand')?.addEventListener('click', () => {
      const s = _s();
      const cost = s.maxPlots * 5000;
      if (STATE.balance < cost) return;
      STATE.balance -= cost;
      s.maxPlots++;
      _refresh();
    });
    // Auto-refresh khi có cây đang trồng
    const growing = _s().plots.some(p => Date.now() < p.readyAt);
    if (growing) setTimeout(() => _refresh(), 1000);
  }

  function _refresh() {
    const el = document.getElementById('ug-plant-section');
    if (el) { el.innerHTML = renderHTML(); bindEvents(); }
  }

  return { renderHTML, bindEvents };
})();