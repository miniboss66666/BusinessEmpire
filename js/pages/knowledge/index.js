// @ts-nocheck
/* ============================================
   KNOWLEDGE/INDEX.JS
   Load sau tất cả branch + node files
   ============================================ */

// ── Registry (các node file tự register vào đây) ──
const KnowledgeTree = (() => {
  const _branches = {};
  const _nodes = [];

  function registerBranch(meta) {
    _branches[meta.id] = { ...meta, nodes: meta.nodes || [] };
  }
  function registerNode(node) {
    if (!_nodes.find(n => n.id === node.id)) _nodes.push(node);
  }
  function getBranches() { return Object.values(_branches); }
  function getNodes()    { return _nodes; }
  function getNode(id)   { return _nodes.find(n => n.id === id); }

  // Inject script tags — không dùng dynamic import (bị CSP block)
  async function autoLoadNodes() {
    const base = 'js/pages/knowledge/';
    const promises = [];
    for (const branch of Object.values(_branches)) {
      for (const nodeId of (branch.nodes || [])) {
        const src = base + branch.id + '/' + nodeId + '.js';
        if (document.querySelector(`script[src="${src}"]`)) continue;
        promises.push(new Promise((res) => {
          const s = document.createElement('script');
          s.src = src;
          s.onload = res;
          s.onerror = res; // bỏ qua nếu file chưa tồn tại
          document.head.appendChild(s);
        }));
      }
    }
    await Promise.all(promises);
  }

  return { registerBranch, registerNode, getBranches, getNodes, getNode, autoLoadNodes };
})();

// ── Root node (hardcoded, không phải branch) ──
const KN_ROOT = {
  id: 'root', emoji: '📖', label: 'Thư Viện',
  desc: 'Mở khóa hệ thống nghiên cứu',
  cost: 10000, timeSec: 0,
};

// ── Main page ────────────────────────────────────
const KnowledgePage = (() => {

  const CX = 400, CY = 350;
  const BRANCH_R = 160;
  const NODE_R_STEP = 130;
  const ROOT_RADIUS = 38;
  const NODE_RADIUS = 30;

  function _branchAngle(branch) {
    const branches = KnowledgeTree.getBranches();
    const idx = branches.findIndex(b => b.id === branch.id);
    return (360 / branches.length) * idx - 90;
  }

  let panX = 0, panY = 0;
  let dragging = false, dragStartX = 0, dragStartY = 0, panStartX = 0, panStartY = 0;
  let selectedId = null;
  let researchTimer = null;

  function _s() {
    if (!STATE.knowledge) STATE.knowledge = {
      unlocked: [], researching: null, queue: [],
    };
    return STATE.knowledge;
  }

  function isUnlocked(id)    { return _s().unlocked.includes(id); }
  function isResearching(id) { return _s().researching?.id === id; }
  function isQueued(id)      { return _s().queue.includes(id); }

  function canResearch(node) {
    if (node.locked) return false;
    if (isUnlocked(node.id)) return false;
    return node.requires.every(r => isUnlocked(r));
  }

  function getTimeMult() {
    let m = 1;
    if (isUnlocked('KN1')) m *= 0.8;
    if (isUnlocked('KN2')) m *= 0.7;
    if (isUnlocked('KN3')) m *= 0.5;
    return m;
  }
  function getCostMult() {
    let m = 1;
    if (isUnlocked('KN2')) m *= 0.7;
    if (isUnlocked('KN3')) m *= 0.5;
    return m;
  }
  function effTime(node) { return node.id === 'root' ? 0 : Math.round(node.timeSec * getTimeMult()); }
  function effCost(node) { return node.id === 'root' ? node.cost : Math.round(node.cost * getCostMult()); }

  function nodePos(node) {
    const branch = KnowledgeTree.getBranches().find(b => b.id === node.branch);
    if (!branch) return { x: CX, y: CY };
    const rad = _branchAngle(branch) * Math.PI / 180;
    const nodesInBranch = KnowledgeTree.getNodes().filter(n => n.branch === node.branch);
    const depth = nodesInBranch.findIndex(n => n.id === node.id);
    const dist = BRANCH_R + depth * NODE_R_STEP;
    return { x: CX + Math.cos(rad) * dist, y: CY + Math.sin(rad) * dist };
  }

  function renderSVG() {
    const W = 800, H = 700;
    let lines = '', nodes = '';
    const branches = KnowledgeTree.getBranches();
    const allNodes = KnowledgeTree.getNodes();

    branches.forEach(b => {
      if (!isUnlocked('root')) return;
      const rad = _branchAngle(b) * Math.PI / 180;
      const hx = CX + Math.cos(rad) * (BRANCH_R * 0.55);
      const hy = CY + Math.sin(rad) * (BRANCH_R * 0.55);
      lines += `<line x1="${CX}" y1="${CY}" x2="${hx}" y2="${hy}"
        stroke="${b.color}" stroke-width="2" stroke-opacity="0.35" stroke-dasharray="6,4"/>`;
    });

    allNodes.forEach(node => {
      const pos = nodePos(node);
      node.requires.forEach(reqId => {
        const reqPos = reqId === 'root' ? { x: CX, y: CY }
          : nodePos(KnowledgeTree.getNode(reqId));
        if (!reqPos) return;
        const b = branches.find(b => b.id === node.branch);
        const active = isUnlocked(node.id) && isUnlocked(reqId);
        lines += `<line x1="${reqPos.x}" y1="${reqPos.y}" x2="${pos.x}" y2="${pos.y}"
          stroke="${b?.color||'#555'}"
          stroke-width="${active ? 2.5 : 1.5}"
          stroke-opacity="${active ? 0.85 : 0.22}"
          stroke-dasharray="${active ? 'none' : '5,4'}"/>`;
      });
    });

    const ru = isUnlocked('root');
    const rSel = selectedId === 'root';
    nodes += `
      <g class="kn-node" data-id="root" style="cursor:pointer">
        <circle cx="${CX}" cy="${CY}" r="${ROOT_RADIUS}"
          fill="${ru?'#0d1f0d':'#12121f'}"
          stroke="${ru?'#00c853':'#4488ff'}"
          stroke-width="${rSel?3.5:2}"/>
        <text x="${CX}" y="${CY-5}" text-anchor="middle" font-size="17">📖</text>
        <text x="${CX}" y="${CY+11}" text-anchor="middle" font-size="9"
          fill="${ru?'#00c853':'#aaa'}">Thư Viện</text>
        ${ru?`<text x="${CX}" y="${CY+23}" text-anchor="middle" font-size="8" fill="#00c853">✓</text>`:''}
      </g>`;

    allNodes.forEach(node => {
      const pos = nodePos(node);
      const b = branches.find(b => b.id === node.branch);
      const color = b?.color || '#555';
      const unlocked    = isUnlocked(node.id);
      const researching = isResearching(node.id);
      const queued      = isQueued(node.id);
      const available   = canResearch(node);
      const sel = selectedId === node.id;
      const t   = effTime(node);

      const fill   = unlocked ? '#0d1f0d' : researching ? '#1a1a0a' : available||queued ? '#151520' : '#0a0a0a';
      const stroke = unlocked ? '#00c853' : researching ? '#ffaa00' : available||queued ? color : node.locked ? '#222' : '#333';
      const tclr   = unlocked ? '#00c853' : researching ? '#ffaa00' : available ? '#ccc' : node.locked ? '#333' : '#555';

      nodes += `
        <g class="kn-node" data-id="${node.id}" style="cursor:${node.locked?'default':'pointer'}">
          <circle cx="${pos.x}" cy="${pos.y}" r="${NODE_RADIUS}"
            fill="${fill}" stroke="${stroke}" stroke-width="${sel?3.5:unlocked?2:1.5}"/>
          ${researching ? `
          <circle cx="${pos.x}" cy="${pos.y}" r="${NODE_RADIUS}"
            fill="none" stroke="#ffaa00" stroke-width="3"
            stroke-dasharray="47 150" stroke-linecap="round"
            transform="rotate(-90 ${pos.x} ${pos.y})">
            <animateTransform attributeName="transform" type="rotate"
              from="-90 ${pos.x} ${pos.y}" to="270 ${pos.x} ${pos.y}"
              dur="${t}s" begin="0s" fill="freeze"/>
          </circle>` : ''}
          <text x="${pos.x}" y="${pos.y-5}" text-anchor="middle" font-size="14"
            opacity="${node.locked?0.3:1}">${node.emoji}</text>
          <text x="${pos.x}" y="${pos.y+9}" text-anchor="middle" font-size="7.5" fill="${tclr}">
            ${node.label.length>12?node.label.slice(0,11)+'…':node.label}</text>
          ${unlocked?`<text x="${pos.x}" y="${pos.y+21}" text-anchor="middle" font-size="8" fill="#00c853">✓</text>`:''}
          ${queued&&!researching?`<text x="${pos.x}" y="${pos.y+21}" text-anchor="middle" font-size="8" fill="${color}">⏳</text>`:''}
        </g>`;
    });

    return `<svg id="kn-svg" width="100%" height="100%"
      viewBox="${-panX} ${-panY} ${W} ${H}" style="cursor:grab">
      ${lines}${nodes}
    </svg>`;
  }

  function renderDetail() {
    const s = _s();
    if (!selectedId) return `
      <div class="kn-detail-empty">
        <div>🔍</div><div>Chọn node để xem chi tiết</div>
      </div>`;

    const node = selectedId === 'root' ? KN_ROOT : KnowledgeTree.getNode(selectedId);
    if (!node) return '';

    const unlocked    = isUnlocked(selectedId);
    const researching = isResearching(selectedId);
    const queued      = isQueued(selectedId);
    const available   = selectedId === 'root' ? !unlocked && !researching : canResearch(node);
    const cost     = effCost(node);
    const time     = effTime(node);
    const timeLeft = researching ? Math.max(0, Math.ceil((s.researching.endsAt - Date.now())/1000)) : 0;
    const qIdx     = s.queue.indexOf(selectedId);

    return `
      <div class="kn-detail">
        <div class="kn-detail-header">
          <span class="kn-detail-emoji">${node.emoji||'📖'}</span>
          <div>
            <div class="kn-detail-name">${node.label}</div>
            <div class="kn-detail-desc">${node.desc}</div>
          </div>
        </div>
        ${unlocked ? `<div class="kn-status unlocked">✅ Đã nghiên cứu</div>`
        : researching ? `
          <div class="kn-status researching">
            ⚙️ Đang nghiên cứu...
            <span class="kn-countdown" id="kn-countdown">${_fmt(timeLeft)}</span>
          </div>`
        : queued ? `
          <div class="kn-status queued">⏳ Hàng chờ #${qIdx+1}</div>
          <button class="kn-btn-cancel" data-id="${selectedId}">✖ Hủy & hoàn tiền</button>`
        : available ? `
          <div class="kn-cost-row">
            <span>💰 ${Format.money(cost)}</span>
            <span>⏱ ${_fmt(time)}</span>
          </div>
          <div class="kn-action-row">
            <button class="kn-btn-research" data-id="${selectedId}"
              ${STATE.balance < cost ? 'disabled' : ''}>🔬 NGHIÊN CỨU NGAY</button>
            ${s.researching ? `<button class="kn-btn-queue" data-id="${selectedId}"
              ${STATE.balance < cost ? 'disabled' : ''}>+ Thêm vào hàng</button>` : ''}
          </div>
          ${STATE.balance < cost ? `<div class="kn-warn">Thiếu ${Format.money(cost-STATE.balance)}</div>` : ''}`
        : node.locked ? `<div class="kn-status locked">🔒 Coming Soon</div>`
        : `<div class="kn-status locked">🔒 Cần: ${node.requires.filter(r=>!isUnlocked(r)).join(', ')}</div>`}

        ${s.queue.length > 0 ? `
        <div class="kn-queue-info">
          <div class="kn-queue-title">Hàng chờ (${s.queue.length})</div>
          ${s.queue.map((qid,i) => {
            const qn = KnowledgeTree.getNode(qid);
            return `<div class="kn-queue-item">${i+1}. ${qn?.emoji} ${qn?.label}</div>`;
          }).join('')}
        </div>` : ''}
      </div>`;
  }

  function _fmt(s) {
    if (s <= 0) return 'Tức thì';
    if (s < 60) return s + 's';
    if (s < 3600) return Math.floor(s/60) + 'p ' + (s%60) + 's';
    return Math.floor(s/3600) + 'h ' + Math.floor((s%3600)/60) + 'p';
  }

  function renderHTML() {
    const s = _s();
    const total = KnowledgeTree.getNodes().filter(n=>!n.locked).length + 1;
    const cur   = s.unlocked.length;
    const rNode = s.researching ? KnowledgeTree.getNode(s.researching.id) : null;

    return `
      <div class="kn-wrap">
        <div class="kn-topbar">
          <span class="kn-title">🧠 KNOWLEDGE</span>
          <span class="kn-progress">${cur}/${total}</span>
          ${rNode ? `<span class="kn-active-research">⚙️ ${rNode.label} <span id="kn-top-cd"></span></span>` : ''}
        </div>
        <div class="kn-main">
          <div class="kn-map-wrap" id="kn-map-wrap">${renderSVG()}</div>
          <div class="kn-panel" id="kn-panel">${renderDetail()}</div>
        </div>
      </div>`;
  }

  function bindEvents() {
    const wrap = document.getElementById('kn-map-wrap');
    const svg  = document.getElementById('kn-svg');

    wrap?.addEventListener('mousedown', e => {
      if (e.target.closest('.kn-node')) return;
      dragging = true;
      dragStartX = e.clientX; dragStartY = e.clientY;
      panStartX = panX; panStartY = panY;
      svg.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', e => {
      if (!dragging) return;
      panX = panStartX - (e.clientX - dragStartX);
      panY = panStartY - (e.clientY - dragStartY);
      svg?.setAttribute('viewBox', `${-panX} ${-panY} 800 700`);
    });
    window.addEventListener('mouseup', () => { dragging = false; if(svg) svg.style.cursor='grab'; });

    let ts = null;
    wrap?.addEventListener('touchstart', e => {
      if (e.touches.length===1) ts = {x:e.touches[0].clientX, y:e.touches[0].clientY, px:panX, py:panY};
    });
    wrap?.addEventListener('touchmove', e => {
      if (!ts || e.touches.length!==1) return;
      e.preventDefault();
      panX = ts.px - (e.touches[0].clientX - ts.x);
      panY = ts.py - (e.touches[0].clientY - ts.y);
      svg?.setAttribute('viewBox', `${-panX} ${-panY} 800 700`);
    }, { passive:false });

    document.querySelectorAll('.kn-node').forEach(el => {
      el.addEventListener('click', () => {
        selectedId = el.dataset.id;
        document.getElementById('kn-panel').innerHTML = renderDetail();
        _bindPanel();
      });
    });

    _bindPanel();
    if (_s().researching) _startTimer();
  }

  function _bindPanel() {
    document.querySelector('.kn-btn-research')?.addEventListener('click', function() {
      const id   = this.dataset.id;
      const node = id === 'root' ? KN_ROOT : KnowledgeTree.getNode(id);
      const cost = effCost(node), time = effTime(node);
      if (STATE.balance < cost) return;
      STATE.balance -= cost;
      const s = _s();
      if (time === 0) {
        s.unlocked.push(id);
        UI.toast(`✅ ${node.label} xong!`, 'success');
        _rerender();
      } else {
        s.researching = { id, endsAt: Date.now() + time*1000 };
        UI.toast(`🔬 Bắt đầu: ${node.label}`, 'success');
        _rerender();
        _startTimer();
      }
    });

    document.querySelector('.kn-btn-queue')?.addEventListener('click', function() {
      const id   = this.dataset.id;
      const node = KnowledgeTree.getNode(id);
      const cost = effCost(node);
      if (STATE.balance < cost) return;
      STATE.balance -= cost;
      _s().queue.push(id);
      UI.toast(`⏳ Thêm hàng: ${node.label}`, 'success');
      document.getElementById('kn-panel').innerHTML = renderDetail();
      _bindPanel();
    });

    document.querySelector('.kn-btn-cancel')?.addEventListener('click', function() {
      const id  = this.dataset.id;
      const s   = _s();
      const node = KnowledgeTree.getNode(id);
      const idx = s.queue.indexOf(id);
      if (idx >= 0) {
        s.queue.splice(idx, 1);
        STATE.balance += effCost(node);
        UI.toast(`↩ Hoàn ${Format.money(effCost(node))}`, 'success');
      }
      document.getElementById('kn-panel').innerHTML = renderDetail();
      _bindPanel();
    });
  }

  function _startTimer() {
    if (researchTimer) clearInterval(researchTimer);
    researchTimer = setInterval(() => {
      const s = _s();
      if (!s.researching) { clearInterval(researchTimer); return; }
      const left = Math.max(0, s.researching.endsAt - Date.now());

      const cd    = document.getElementById('kn-countdown');
      const topCd = document.getElementById('kn-top-cd');
      if (cd)    cd.textContent    = _fmt(Math.ceil(left/1000));
      if (topCd) topCd.textContent = ' · ' + _fmt(Math.ceil(left/1000));

      if (left <= 0) {
        const id   = s.researching.id;
        const node = id === 'root' ? KN_ROOT : KnowledgeTree.getNode(id);
        s.unlocked.push(id);
        s.researching = null;
        UI.toast(`✅ ${node?.label} hoàn tất!`, 'success');
        if (s.queue.length > 0) {
          const nextId   = s.queue.shift();
          const nextNode = KnowledgeTree.getNode(nextId);
          s.researching  = { id: nextId, endsAt: Date.now() + effTime(nextNode)*1000 };
          UI.toast(`🔬 Tiếp theo: ${nextNode?.label}`, 'success');
        }
        clearInterval(researchTimer);
        _rerender();
        if (s.researching) _startTimer();
      }
    }, 500);
  }

  function _rerender() {
    const page = document.getElementById('page-knowledge');
    if (!page) return;
    page.innerHTML = renderHTML();
    bindEvents();
  }

  async function init() {
    _s();
    await KnowledgeTree.autoLoadNodes();
    _rerender();
  }
  function tick() {}

  function getBuff(key) {
    const m = {
      social_follower:   isUnlocked('IS1') ? 0.10 : 0,
      social_viral:      (isUnlocked('IS2')?0.20:0)+(isUnlocked('IS4')?0.50:0),
      social_salary:     isUnlocked('IS3') ? -0.20 : 0,
      ug_susp_hack:      isUnlocked('UG1') ? -0.15 : 0,
      ug_susp_total:     (isUnlocked('UG2')?-0.30:0)+(isUnlocked('UG5')?-0.60:0),
      ug_plant_yield:    isUnlocked('UG3') ? 0.25 : 0,
      ug_hack_value:     isUnlocked('UG4') ? 0.40 : 0,
      biz_tax:           isUnlocked('BZ1') ? -0.10 : 0,
      biz_offline:       isUnlocked('BZ2') ? 7200 : 0,
      biz_warehouse_spd: isUnlocked('BZ3') ? 0.20 : 0,
      biz_income:        isUnlocked('BZ4') ? 0.25 : 0,
      casino_winrate:    (isUnlocked('CA1')?0.05:0)+(isUnlocked('CA2')?0.10:0)+(isUnlocked('CA3')?0.20:0),
      re_reno_time:      isUnlocked('RE1') ? -0.20 : 0,
      re_sell_value:     isUnlocked('RE2') ? 0.15 : 0,
      re_income:         isUnlocked('RE3') ? 0.10 : 0,
      re_reno_free:      isUnlocked('RE4'),
    };
    return m[key] ?? 0;
  }

  return { init, tick, getBuff };
})();