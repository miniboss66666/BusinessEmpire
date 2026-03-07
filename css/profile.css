/* ============================================
   PROFILE.CSS
   ============================================ */

.profile-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  max-width: 600px;
  margin: 0 auto;
}

/* ── TABS ── */
.profile-tabs {
  display: flex;
  gap: 8px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 5px;
}

.profile-tab {
  flex: 1;
  padding: 9px 0;
  background: transparent;
  border: none;
  border-radius: 9px;
  color: var(--text-dim);
  font-family: 'Orbitron', monospace;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s;
}
.profile-tab.active { background: var(--gold); color: #000; }

/* ── PROFILE CARD ── */
.profile-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── HEADER ── */
.profile-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px 16px 16px;
  position: relative;
}

.profile-back-btn {
  position: absolute;
  top: 10px; left: 10px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-dim);
  font-size: 0.65rem;
  padding: 4px 10px;
  cursor: pointer;
  transition: all 0.15s;
}
.profile-back-btn:hover { color: var(--gold); border-color: var(--gold); }

/* ── AVATAR ── */
.profile-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.profile-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Orbitron', monospace;
  font-size: 1.6rem;
  font-weight: 900;
  color: #fff;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  border: 2.5px solid rgba(255,255,255,0.12);
  transition: all 0.2s;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Nút chỉnh ảnh (icon máy ảnh nhỏ) */
.profile-avatar-edit {
  position: absolute;
  bottom: 0; right: 0;
  width: 26px; height: 26px;
  background: var(--gold);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.5);
  transition: transform 0.15s;
  border: 2px solid var(--bg2);
}
.profile-avatar-edit:hover { transform: scale(1.15); }

/* ── UPLOAD PROGRESS BAR ── */
.profile-upload-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 14px;
}

.profile-upload-progress {
  height: 4px;
  background: var(--gold);
  border-radius: 2px;
  transition: width 0.3s ease;
  width: 0%;
}

#profile-upload-label {
  font-size: 0.65rem;
  color: var(--text-dim);
}

/* ── NAME ROW ── */
.profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.profile-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile-username {
  font-family: 'Orbitron', monospace;
  font-size: 0.9rem;
  font-weight: 900;
  color: var(--text);
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-edit-name-btn {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-dim);
  font-size: 0.7rem;
  padding: 2px 7px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}
.profile-edit-name-btn:hover { color: var(--gold); border-color: var(--gold); }

/* ── FORM ĐỔI TÊN ── */
.profile-name-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.profile-name-input {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  font-size: 0.78rem;
  padding: 7px 10px;
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
}
.profile-name-input:focus { border-color: var(--gold); }

.profile-name-actions {
  display: flex;
  gap: 6px;
}

.profile-name-save {
  background: var(--gold);
  color: #000;
  border: none;
  border-radius: 7px;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 5px 12px;
  cursor: pointer;
  transition: opacity 0.15s;
}
.profile-name-save:hover { opacity: 0.85; }
.profile-name-save:disabled { opacity: 0.5; cursor: not-allowed; }

.profile-name-cancel {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 7px;
  color: var(--text-dim);
  font-size: 0.7rem;
  padding: 5px 10px;
  cursor: pointer;
}

.profile-name-error {
  font-size: 0.62rem;
  color: #ff4455;
  min-height: 14px;
}

.profile-joined {
  font-size: 0.65rem;
  color: var(--text-dim);
}

.profile-badge {
  display: inline-block;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  letter-spacing: 1px;
  width: fit-content;
}
.profile-badge.admin {
  background: linear-gradient(90deg, #f5c518, #ff8c00);
  color: #000;
}

/* ── STATS GRID ── */
.profile-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.profile-stat-box {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.profile-stat-label {
  font-size: 0.6rem;
  color: var(--text-dim);
  font-weight: 600;
}

.profile-stat-value {
  font-family: 'Orbitron', monospace;
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--text);
}
.profile-stat-value.gold  { color: var(--gold); }
.profile-stat-value.green { color: #00ff88; }

/* ── SECTION ── */
.profile-section {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px;
}

.profile-section-title {
  font-family: 'Orbitron', monospace;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--text-dim);
  margin-bottom: 12px;
}

/* ── SPENDING ── */
.profile-spend-list { display: flex; flex-direction: column; gap: 10px; }

.profile-spend-item { display: flex; flex-direction: column; gap: 4px; }

.profile-spend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-spend-label { font-size: 0.7rem; color: var(--text); font-weight: 600; }

.profile-spend-amount {
  font-family: 'Orbitron', monospace;
  font-size: 0.68rem;
  font-weight: 700;
}

.profile-spend-bar-bg {
  height: 5px;
  background: rgba(255,255,255,0.07);
  border-radius: 3px;
  overflow: hidden;
}
.profile-spend-bar { height: 100%; border-radius: 3px; transition: width 0.6s ease; }

.profile-spend-pct { font-size: 0.58rem; color: var(--text-dim); text-align: right; }

/* ── CASINO STATS ── */
.profile-casino-stats { display: flex; flex-direction: column; gap: 8px; }

.profile-casino-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.72rem;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.profile-casino-item:last-child { border-bottom: none; }
.profile-casino-item .green { color: #00ff88; }
.profile-casino-item .gold  { color: var(--gold); }

/* ════════════════════════════════════════════
   LEADERBOARD
   ════════════════════════════════════════════ */
.leaderboard-wrap {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
}

.leaderboard-header {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background: var(--bg3);
  border-bottom: 1px solid var(--border);
  font-family: 'Orbitron', monospace;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: var(--text-dim);
}

.lb-col.rank   { width: 52px; flex-shrink: 0; text-align: center; }
.lb-col.name   { flex: 1; display: flex; align-items: center; }
.lb-col.earned { width: 90px; flex-shrink: 0; text-align: right; }

.lb-row {
  display: flex;
  align-items: center;
  padding: 9px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  cursor: pointer;
  transition: background 0.15s;
}
.lb-row:last-child { border-bottom: none; }
.lb-row:hover { background: rgba(255,255,255,0.04); }
.lb-row.is-me {
  background: rgba(245,197,24,0.06);
  border-left: 3px solid var(--gold);
}

.lb-rank { font-family: 'Orbitron', monospace; font-size: 0.68rem; color: var(--text-dim); }
.lb-rank.top3 { font-size: 1rem; }

.lb-avatar {
  width: 30px; height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Orbitron', monospace;
  font-size: 0.65rem;
  font-weight: 900;
  color: #fff;
  flex-shrink: 0;
  margin-right: 8px;
  overflow: hidden;
  border: 1.5px solid rgba(255,255,255,0.1);
}
.lb-avatar img { width: 100%; height: 100%; object-fit: cover; }

.lb-name { font-size: 0.74rem; font-weight: 700; color: var(--text); }

.lb-me-tag {
  font-size: 0.55rem;
  background: var(--gold);
  color: #000;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 5px;
  margin-left: 6px;
  font-family: 'Orbitron', monospace;
}

.lb-earned {
  font-family: 'Orbitron', monospace;
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--gold);
}

.lb-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 32px;
  color: var(--text-dim);
  font-size: 0.75rem;
}

.lb-spinner {
  width: 24px; height: 24px;
  border: 2px solid var(--border);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.lb-empty {
  padding: 32px;
  text-align: center;
  color: var(--text-dim);
  font-size: 0.75rem;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ════════════════════════════════════════════
   TAX
   ════════════════════════════════════════════ */
.tax-summary-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.tax-summary-item {
  flex: 1;
  background: var(--bg3);
  border-radius: 9px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.tax-sum-lbl { font-size: 0.62rem; color: var(--text-dim); font-weight: 600; text-transform: uppercase; }
.tax-sum-val { font-family: 'Orbitron', monospace; font-size: 0.78rem; font-weight: 700; }

.tax-manage-btn {
  width: 100%;
  padding: 11px;
  background: rgba(244,160,48,0.12);
  border: 1px solid #f4a030;
  border-radius: 10px;
  color: #f4a030;
  font-family: 'Orbitron', monospace;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 0.5px;
}
.tax-manage-btn:hover { background: #f4a030; color: #000; }

/* Modal */
.tax-modal {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 70vh;
}
.tax-modal-title {
  font-family: 'Orbitron', monospace;
  font-size: 0.9rem;
  font-weight: 700;
  color: #f4a030;
  text-align: center;
  letter-spacing: 1px;
}
.tax-modal-sub {
  font-size: 0.65rem;
  color: var(--text-dim);
  text-align: center;
}
.tax-empty {
  text-align: center;
  color: var(--green);
  font-size: 0.78rem;
  font-weight: 600;
  padding: 20px;
}
.tax-item-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  max-height: 40vh;
  padding-right: 2px;
}
.tax-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg3);
  border: 1px solid var(--border2);
  border-radius: 10px;
  padding: 10px 12px;
  gap: 10px;
}
.tax-item.suspended {
  border-color: var(--red);
  background: rgba(255,68,85,0.06);
}
.tax-item-left { flex: 1; }
.tax-item-name {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-bright);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.tax-suspended-tag {
  font-size: 0.58rem;
  background: rgba(255,68,85,0.15);
  border: 1px solid var(--red);
  color: var(--red);
  border-radius: 4px;
  padding: 1px 5px;
}
.tax-item-meta { font-size: 0.62rem; margin-top: 3px; }
.tax-item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}
.tax-item-amount {
  font-family: 'Orbitron', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--red);
}
.tax-pay-one-btn {
  padding: 5px 12px;
  background: rgba(0,200,100,0.1);
  border: 1px solid var(--green);
  border-radius: 7px;
  color: var(--green);
  font-size: 0.66rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.tax-pay-one-btn:hover:not(:disabled) { background: var(--green); color: #000; }
.tax-pay-one-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* Sticky footer */
.tax-modal-footer {
  border-top: 1px solid var(--border);
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}
.tax-footer-total {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-dim);
}
.tax-pay-all-btn {
  width: 100%;
  padding: 12px;
  background: rgba(255,68,85,0.12);
  border: 1px solid var(--red);
  border-radius: 10px;
  color: var(--red);
  font-family: 'Orbitron', monospace;
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.tax-pay-all-btn:hover:not(:disabled) { background: var(--red); color: #fff; }
.tax-pay-all-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.tax-cant-afford {
  text-align: center;
  font-size: 0.65rem;
  color: var(--red);
  font-weight: 600;
}

/* Leaderboard topbar */
.leaderboard-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px 6px;
  flex-shrink: 0;
}
.lb-title {
  font-family: 'Orbitron', monospace;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--gold);
  letter-spacing: 1px;
}
.lb-refresh-btn {
  background: transparent;
  border: 1px solid var(--border2);
  border-radius: 7px;
  color: var(--text-dim);
  font-size: 0.8rem;
  padding: 4px 9px;
  cursor: pointer;
  transition: all 0.2s;
}
.lb-refresh-btn:hover { border-color: var(--gold); color: var(--gold); }