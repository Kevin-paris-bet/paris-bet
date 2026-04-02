/**
 * ============================================================
 *  PARIS-BET — JS PANEL ADMIN (dashboard-admin.js)
 * ============================================================
 */

// ── Données de démo ───────────────────────────────────────────
const MOCK_ADMIN = { firstName: 'Admin', lastName: 'Paris-Bet' };

const MOCK_PRONOS_ADMIN = [
  { id:1, tipster:'Alexis Martin', game:'PSG vs Marseille',    sport:'⚽ Ligue 1', date:'15/03/2026', price:5.00,  buyers:47, status:'pending',   revenue:235.00 },
  { id:2, tipster:'Alexis Martin', game:'Real Madrid vs Barça',sport:'⚽ Liga',    date:'16/03/2026', price:8.00,  buyers:83, status:'pending',   revenue:664.00 },
  { id:3, tipster:'Karim B.',      game:'Djokovic vs Alcaraz', sport:'🎾 Tennis',  date:'16/03/2026', price:6.00,  buyers:31, status:'pending',   revenue:186.00 },
  { id:4, tipster:'Alexis Martin', game:'Lakers vs Warriors',  sport:'🏀 NBA',     date:'17/03/2026', price:4.00,  buyers:12, status:'pending',   revenue:48.00  },
  { id:5, tipster:'Sofia R.',      game:'Lens vs Lyon',        sport:'⚽ Ligue 1', date:'18/03/2026', price:5.00,  buyers:28, status:'won',       revenue:140.00 },
  { id:6, tipster:'Karim B.',      game:'Federer vs Nadal',    sport:'🎾 Tennis',  date:'10/03/2026', price:7.00,  buyers:54, status:'lost',      revenue:378.00 },
  { id:7, tipster:'Sofia R.',      game:'OM vs Nice',          sport:'⚽ Ligue 1', date:'09/03/2026', price:4.00,  buyers:19, status:'cancelled', revenue:76.00  },
];

const MOCK_TIPSTERS_ADMIN = [
  { id:1, name:'Alexis Martin', email:'alexis@mail.com',  pronos:48, winRate:71, balance:247.50, ribOk:true,  suspended:false },
  { id:2, name:'Karim B.',      email:'karim@mail.com',   pronos:32, winRate:58, balance:89.00,  ribOk:true,  suspended:false },
  { id:3, name:'Sofia R.',      email:'sofia@mail.com',   pronos:21, winRate:76, balance:12.00,  ribOk:false, suspended:false },
  { id:4, name:'Marc T.',       email:'marc@mail.com',    pronos:7,  winRate:43, balance:0,      ribOk:false, suspended:true  },
];

const MOCK_USERS_ADMIN = [
  { id:1, name:'Thomas L.',  email:'thomas@mail.com', balance:42.50, pending:13.00, joined:'01/2026' },
  { id:2, name:'Julie M.',   email:'julie@mail.com',  balance:5.00,  pending:0,     joined:'02/2026' },
  { id:3, name:'Romain D.',  email:'romain@mail.com', balance:0,     pending:26.00, joined:'01/2026' },
  { id:4, name:'Nadia K.',   email:'nadia@mail.com',  balance:18.00, pending:8.00,  joined:'03/2026' },
];

const MOCK_VIREMENTS = [
  { id:1, tipster:'Alexis Martin', amount:320.00, date:'10/03/2026', status:'done' },
  { id:2, tipster:'Karim B.',      amount:185.00, date:'10/03/2026', status:'done' },
  { id:3, tipster:'Alexis Martin', amount:247.50, date:'17/03/2026', status:'pending' },
  { id:4, tipster:'Karim B.',      amount:89.00,  date:'17/03/2026', status:'pending' },
];

// ── État ─────────────────────────────────────────────────────
const adminState = {
  activePage: 'overview',
  pronos:     [...MOCK_PRONOS_ADMIN],
  tipsters:   [...MOCK_TIPSTERS_ADMIN],
  users:      [...MOCK_USERS_ADMIN],
  virements:  [...MOCK_VIREMENTS],
  pronosFilter: 'pending',
};

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuth(['admin']);
  if (!user) return;

  // Charger les vrais pronos via fetch direct
  try {
    const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
    const urlP = new URL('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/pronos');
    urlP.searchParams.set('select', 'id,game,sport,match_date,content,price,status,buyers,tipster_id,created_at,cote');
    urlP.searchParams.set('order', 'created_at.desc');
    urlP.searchParams.set('apikey', ANON);
    const rp = await fetch(urlP.toString());
    const pronos = await rp.json();

    const urlPr = new URL('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/profiles');
    urlPr.searchParams.set('select', 'id,first_name,last_name');
    urlPr.searchParams.set('apikey', ANON);
    const rpr = await fetch(urlPr.toString());
    const profilesList = await rpr.json();
    const profilesMap = {};
    if (Array.isArray(profilesList)) profilesList.forEach(p => profilesMap[p.id] = p.first_name + ' ' + p.last_name);

    const urlPurch = new URL('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/purchases');
    urlPurch.searchParams.set('select', 'prono_id,amount');
    urlPurch.searchParams.set('apikey', ANON);
    const rpurch = await fetch(urlPurch.toString());
    const allPurchases = await rpurch.json();
    const purchasesMap = {};
    if (Array.isArray(allPurchases)) {
      allPurchases.forEach(a => {
        if (!purchasesMap[a.prono_id]) purchasesMap[a.prono_id] = { count: 0, total: 0 };
        purchasesMap[a.prono_id].count++;
        purchasesMap[a.prono_id].total += parseFloat(a.amount || 0);
      });
    }

    if (Array.isArray(pronos) && pronos.length > 0) {
      adminState.pronos = pronos.map(p => ({
        ...p,
        tipsterName: profilesMap[p.tipster_id] || 'Inconnu',
        buyers:      (purchasesMap[p.id] || {}).count || 0,
        revenue:     (purchasesMap[p.id] || {}).total || 0,
      }));
    } else {
      adminState.pronos = [];
    }
  } catch(e) {
    console.error('Erreur chargement pronos admin:', e);
    adminState.pronos = [];
  }

  // Charger les vrais tipsters
  const { data: tipsters } = await sb
    .from('profiles_with_email')
    .select('*')
    .eq('role', 'tipster')
    .order('created_at', { ascending: false });

  if (tipsters && tipsters.length > 0) {
    const ANON2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
    const rAllPronos = await fetch('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/pronos?select=tipster_id,status&apikey=' + ANON2, { headers: { 'apikey': ANON2, 'Authorization': 'Bearer ' + ANON2 } });
    const allPronos = await rAllPronos.json();
    const pronosMap = {};
    if (Array.isArray(allPronos)) {
      allPronos.forEach(p => {
        if (!pronosMap[p.tipster_id]) pronosMap[p.tipster_id] = [];
        pronosMap[p.tipster_id].push(p.status);
      });
    }
    adminState.tipsters = tipsters.map(t => {
      const tp = pronosMap[t.id] || [];
      const won = tp.filter(s => s === 'won').length;
      const finished = tp.filter(s => s === 'won' || s === 'lost').length;
      return {
        ...t,
        name:     t.first_name + ' ' + t.last_name,
        email:    t.email || '—',
        pronos:   tp.length,
        winRate:  finished > 0 ? Math.round(won / finished * 100) : 0,
        balance:  parseFloat(t.balance) || 0,
        ribSaved: !!(t.rib_iban),
        ribOk:    !!(t.rib_iban),
        suspended: false,
      };
    });
  } else {
    adminState.tipsters = [];
  }

  // Charger les vrais utilisateurs (+ modérateurs)
  const { data: users } = await sb
    .from('profiles_with_email')
    .select('*')
    .in('role', ['user', 'moderator'])
    .order('created_at', { ascending: false });

  if (users && users.length > 0) {
    adminState.users = users.map(u => ({
      ...u,
      name:    u.first_name + ' ' + u.last_name,
      email:   u.email || '—',
      balance: parseFloat(u.balance) || 0,
      pending: parseFloat(u.pending) || 0,
      spent:   0,
      joined:  u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—',
    }));
  } else {
    adminState.users = [];
  }

  renderSidebar();
  renderTopbar();
  navigateTo('overview');
});

// ── Navigation ────────────────────────────────────────────────
function navigateTo(page) {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('show');

  adminState.activePage = page;
  document.querySelectorAll('.sidebar__link').forEach(l =>
    l.classList.toggle('active', l.dataset.page === page)
  );
  const titles = {
    overview:  'Vue d\'ensemble',
    pronos:    'Valider les résultats',
    tipsters:  'Gestion des tipsters',
    users:     'Gestion des utilisateurs',
    virements: 'Virements',
    finances:  'Finances & Commissions',
    explorer:  'Explorer les tipsters',
    feedback:  'Feedback & Changelog',
  };
  document.getElementById('topbar-title').textContent = titles[page] || 'Admin';
  const content = document.getElementById('page-content');
  content.innerHTML = '';
  if (page === 'overview')  renderOverview(content);
  if (page === 'pronos')    renderPronos(content);
  if (page === 'tipsters')  renderTipsters(content);
  if (page === 'users')     renderUsers(content);
  if (page === 'virements') renderVirements(content);
  if (page === 'finances')  renderFinances(content);
  if (page === 'explorer')  renderExplorerTipsters(content, 'https://payperwin.co/');
  if (page === 'feedback')  renderPageFeedbackAdmin(content);
}

// ══════════════════════════════════════════════════════════════
//  PAGE — VUE D'ENSEMBLE
// ══════════════════════════════════════════════════════════════
function renderOverview(c) {
  const pendingPronos  = adminState.pronos.filter(p => p.status === 'pending').length;
  const pendingVirTipsters = adminState.tipsters.filter(t => parseFloat(t.balance) >= 30);
  const pendingVir     = pendingVirTipsters.length;
  const pendingRevenue = adminState.pronos
    .filter(p => p.status === 'pending')
    .reduce((s, p) => s + (parseFloat(p.price) * (p.buyers || 0)), 0);
  const commission     = adminState.pronos
    .filter(p => p.status === 'won')
    .reduce((s, p) => s + (parseFloat(p.price) * (p.buyers || 0) * CONFIG.finance.commissionRate), 0);

  c.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card stat-card--blue">
        <div class="stat-card__label">⏳ Pronos à valider</div>
        <div class="stat-card__value">${pendingPronos}</div>
        <div class="stat-card__sub">${formatEuros(pendingRevenue)} en attente</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">💸 Virements à faire</div>
        <div class="stat-card__value">${pendingVir}</div>
        <div class="stat-card__sub">Ce lundi</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">🏆 Commission gagnée</div>
        <div class="stat-card__value">${formatEuros(commission)}</div>
        <div class="stat-card__sub">${CONFIG.finance.commissionRate * 100}% sur gagnants</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">👥 Tipsters actifs</div>
        <div class="stat-card__value">${adminState.tipsters.filter(t => !t.suspended).length}</div>
        <div class="stat-card__sub">${adminState.tipsters.filter(t => t.suspended).length} suspendu(s)</div>
      </div>
    </div>

    <div class="section-header">
      <div><h2>Actions urgentes</h2><p>Éléments nécessitant votre attention</p></div>
    </div>

    <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
      ${pendingPronos > 0 ? `
        <div class="action-card action-card--urgent" onclick="navigateTo('pronos')">
          <div class="action-card__icon">⏳</div>
          <div class="action-card__body">
            <div class="action-card__title">${pendingPronos} pronostic(s) en attente de validation</div>
            <div class="action-card__sub">${formatEuros(pendingRevenue)} bloqués jusqu'à votre décision</div>
          </div>
          <div class="action-card__arrow">→</div>
        </div>` : ''}
      ${pendingVir > 0 ? `
        <div class="action-card action-card--info" onclick="navigateTo('virements')">
          <div class="action-card__icon">💸</div>
          <div class="action-card__body">
            <div class="action-card__title">${pendingVir} virement(s) à effectuer ce lundi</div>
            <div class="action-card__sub">
              ${pendingVirTipsters.map(t=>`${t.first_name} ${t.last_name} — ${formatEuros(parseFloat(t.balance))}`).join(' · ')}
            </div>
          </div>
          <div class="action-card__arrow">→</div>
        </div>` : ''}
      ${adminState.tipsters.filter(t=>!t.ribOk && !t.suspended).length > 0 ? `
        <div class="action-card action-card--warn">
          <div class="action-card__icon">🏦</div>
          <div class="action-card__body">
            <div class="action-card__title">${adminState.tipsters.filter(t=>!t.ribOk).length} tipster(s) sans RIB enregistré</div>
            <div class="action-card__sub">Impossible d'effectuer leurs virements</div>
          </div>
        </div>` : ''}
      ${pendingPronos === 0 && pendingVir === 0 ? `
        <div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted);font-size:0.88rem">
          ✅ Tout est à jour ! Aucune action urgente.
        </div>` : ''}
    </div>

    <div class="section-header" style="margin-top:var(--space-xl)">
      <div><h2>Derniers pronostics</h2></div>
      <button class="btn btn-outline btn--sm" onclick="navigateTo('pronos')">Voir tout →</button>
    </div>
    ${renderPronosTable(adminState.pronos.slice(0,4), true)}
  `;
}

// ══════════════════════════════════════════════════════════════
//  PAGE — VALIDER LES RÉSULTATS
// ══════════════════════════════════════════════════════════════
function renderPronos(c) {
  const filters = [
    ['all','Tous'], ['pending','⏳ En attente'], ['won','✓ Gagnés'],
    ['lost','✕ Perdus'], ['cancelled','⊘ Annulés'],
  ];
  c.innerHTML = `
    <div class="section-header">
      <div><h2>Validation des résultats</h2>
        <p>Seul vous pouvez valider. Chaque validation déclenche les remboursements ou crédits automatiquement.</p>
      </div>
    </div>

    <div class="achats-filters" style="margin-bottom:var(--space-lg)">
      ${filters.map(([f,l]) => `
        <button class="filter-btn ${adminState.pronosFilter===f?'active':''}"
          onclick="setPronosFilter('${f}')">${l}</button>`).join('')}
    </div>

    <div id="pronos-table-wrap">${renderPronosTable(getFilteredPronos(), false)}</div>
  `;
}

function setPronosFilter(f) {
  adminState.pronosFilter = f;
  navigateTo('pronos');
}

function getFilteredPronos() {
  if (adminState.pronosFilter === 'all') return adminState.pronos;
  return adminState.pronos.filter(p => p.status === adminState.pronosFilter);
}

function renderPronosTable(pronos, compact) {
  if (!pronos.length) return `<div class="empty-state"><div class="empty-state__icon">✅</div><h3>Aucun pronostic ici</h3><p>Essayez un autre filtre.</p></div>`;

  const isMobile = window.innerWidth <= 768;

  const statusBadge = {
    pending:   `<span class="badge badge-pending">⏳ En attente</span>`,
    won:       `<span class="badge badge-won">✓ Gagné</span>`,
    lost:      `<span class="badge badge-lost">✕ Perdu</span>`,
    cancelled: `<span class="badge badge-cancelled">⊘ Annulé</span>`,
  };

  // ── Rendu mobile : cards ──────────────────────────────────
  if (isMobile) {
    return `
      <div class="pronos-table" style="padding:0">
        ${pronos.map(p => `
          <div style="padding:var(--space-md) var(--space-lg);border-bottom:1px solid var(--border)">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px">
              <div>
                <div class="prono-title">${p.game}</div>
                <div class="prono-meta">${p.sport} · ${p.match_date || p.date || '—'}</div>
              </div>
              ${statusBadge[p.status] || ''}
            </div>
            ${p.content ? `<div style="font-size:0.82rem;color:var(--text-muted);line-height:1.5;margin-bottom:8px;padding:8px 10px;background:var(--bg-soft);border-radius:var(--radius-sm)">${p.content}</div>` : ''}
            <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:8px;display:flex;gap:var(--space-md);flex-wrap:wrap">
              <span>Tipster : <strong style="color:var(--text-dark)">${p.tipsterName || '—'}</strong></span>
              <span>Cote : <strong style="color:var(--blue)">${p.cote ? parseFloat(p.cote).toFixed(2) : '—'}</strong></span>
              <span>👥 ${p.buyers} · ${formatEuros(p.revenue)}</span>
            </div>
            ${!compact && p.status === 'pending' ? `
              <div style="display:flex;gap:4px;flex-wrap:wrap">
                <button class="btn-validate btn-validate--won"   onclick="validateProno('${p.id}','won')">✓ Gagné</button>
                <button class="btn-validate btn-validate--lost"  onclick="validateProno('${p.id}','lost')">✕ Perdu</button>
                <button class="btn-validate btn-validate--cancel" onclick="validateProno('${p.id}','cancelled')">⊘</button>
              </div>` : (!compact ? `<span style="font-size:0.75rem;color:var(--text-light)">Validé</span>` : '')}
          </div>`).join('')}
      </div>`;
  }

  // ── Rendu desktop : tableau ───────────────────────────────
  return `
    <div class="pronos-table">
      <div class="table-header" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr ${compact?'0':'140px'}">
        <span>Match</span><span>Tipster</span><span>Cote</span><span>Acheteurs</span><span>Montant</span><span>Statut</span>
        ${compact ? '' : '<span>Action</span>'}
      </div>
      ${pronos.map(p => `
        <div class="table-row" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr ${compact?'0':'140px'}">
          <div>
            <div class="prono-title">${p.game}</div>
            <div class="prono-meta">${p.sport} · ${p.match_date || p.date || "—"}</div>
            ${p.content ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px;line-height:1.4">${p.content}</div>` : ''}
          </div>
          <div style="font-size:0.85rem;color:var(--text-muted)">${p.tipsterName || "—"}</div>
          <div style="font-size:0.85rem;font-weight:600;color:var(--blue)">${p.cote ? parseFloat(p.cote).toFixed(2) : '—'}</div>
          <div class="buyers-count"><span>👥</span>${p.buyers}</div>
          <div class="prono-price">${formatEuros(p.revenue)}</div>
          <div>${statusBadge[p.status]||''}</div>
          ${compact ? '' : `
            <div>
              ${p.status === 'pending' ? `
                <div style="display:flex;gap:4px;flex-wrap:wrap">
                  <button class="btn-validate btn-validate--won"   onclick="validateProno('${p.id}','won')">✓ Gagné</button>
                  <button class="btn-validate btn-validate--lost"  onclick="validateProno('${p.id}','lost')">✕ Perdu</button>
                  <button class="btn-validate btn-validate--cancel" onclick="validateProno('${p.id}','cancelled')">⊘</button>
                </div>` : `<span style="font-size:0.75rem;color:var(--text-light)">Validé</span>`}
            </div>`}
        </div>`).join('')}
    </div>`;
}

async function validateProno(id, status) {
  const p = adminState.pronos.find(p => p.id === id);
  if (!p) return;

  const labels = { won:'GAGNÉ', lost:'PERDU', cancelled:'ANNULÉ' };
  const msgs   = {
    won:       `✓ Valider comme GAGNÉ ?\n→ Le tipster sera crédité de ${formatEuros(p.revenue * (1 - CONFIG.finance.commissionRate))}\n→ Vous encaissez ${formatEuros(p.revenue * CONFIG.finance.commissionRate)} de commission`,
    lost:      `✕ Valider comme PERDU ?\n→ Les ${p.buyers} acheteur(s) seront intégralement remboursés`,
    cancelled: `⊘ Valider comme ANNULÉ ?\n→ Les ${p.buyers} acheteur(s) seront intégralement remboursés`,
  };

  if (!confirm(msgs[status])) return;

  try {
    const { error } = await sb.from('pronos').update({ status }).eq('id', id);
    if (error) throw error;

    const { data: purchases } = await sb.from('purchases').select('*').eq('prono_id', p.id);

    if (purchases && purchases.length > 0) {
      if (status === 'won') {
        const totalRevenue = purchases.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0);
        const tipsterShare = totalRevenue * 0.9;
        const { data: tipsterProfile } = await sb.from('profiles').select('balance').eq('id', p.tipster_id).single();
        const currentBalance = parseFloat(tipsterProfile?.balance || 0);
        await sb.from('profiles').update({ balance: currentBalance + tipsterShare }).eq('id', p.tipster_id);
        await sb.from('purchases').update({ status: 'won' }).eq('prono_id', p.id);
      } else {
        for (const achat of purchases) {
          const { data: userProfile } = await sb.from('profiles').select('balance').eq('id', achat.user_id).single();
          const currentBalance = parseFloat(userProfile?.balance || 0);
          await sb.from('profiles').update({ balance: currentBalance + parseFloat(achat.amount || 0) }).eq('id', achat.user_id);
        }
        await sb.from('purchases').update({ status }).eq('prono_id', p.id);
      }
    }

    p.status = status;
    navigateTo('pronos');
    showToast(`Pronostic "${p.game}" validé comme ${labels[status]}`, status === 'won' ? 'success' : 'info');
  } catch (err) {
    showToast('Erreur : ' + err.message, 'error');
  }
}

// ══════════════════════════════════════════════════════════════
//  PAGE — GESTION DES TIPSTERS
// ══════════════════════════════════════════════════════════════
function renderTipsters(c) {
  const mobile = isMobile();
  const rows = adminState.tipsters.map(t => {
    const lienHref = t.pseudo ? `https://payperwin.co/${t.pseudo}` : `https://payperwin.co/pages/tipster-public.html?id=${t.id}`;
    const lienIcon = `<a href="${lienHref}" target="_blank" style="color:var(--blue);text-decoration:none;font-size:0.9rem;margin-left:6px" title="Voir la page publique">🔗</a>`;
    const rib = t.ribSaved
      ? `<span class="badge badge-won" style="font-size:0.7rem">✓ Enregistré</span>`
      : `<span class="badge badge-lost" style="font-size:0.7rem">✕ Manquant</span>`;
    const suspBtn = `<button class="btn-icon ${t.suspended?'':'danger'}" onclick="toggleSuspend('${t.id}')">${t.suspended?'✓':'⛔'}</button>`;
    const voirBtn = `<button class="btn-icon" onclick="openFicheTipster('${t.id}')">👁</button>`;

    if (mobile) {
      return `
        <div style="padding:var(--space-md) var(--space-lg);border-bottom:1px solid var(--border);${t.suspended?'opacity:0.55':''}">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px">
            <div>
              <div class="prono-title">${t.name}${lienIcon}</div>
              <div class="prono-meta">${t.email}</div>
              ${t.suspended ? `<div style="font-size:0.7rem;color:var(--error);font-weight:600">⛔ Suspendu</div>` : ''}
            </div>
            <div style="display:flex;gap:6px">${voirBtn}${suspBtn}</div>
          </div>
          <div style="display:flex;gap:var(--space-lg);font-size:0.82rem;color:var(--text-muted);flex-wrap:wrap">
            <span>Pronos : <strong>${t.pronos}</strong></span>
            <span>Win Rate : <strong style="color:${t.winRate>=60?'var(--success)':'var(--warning)'}">${t.winRate}%</strong></span>
            <span>Solde : <strong style="color:var(--blue)">${formatEuros(t.balance)}</strong></span>
            <span>RIB : ${t.ribSaved ? '✓' : '✕'}</span>
          </div>
        </div>`;
    }

    return `
      <div class="table-row" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr 120px;${t.suspended?'opacity:0.55':''}">
        <div>
          <div class="prono-title">${t.name}${lienIcon}</div>
          <div class="prono-meta">${t.email}</div>
          ${t.suspended ? `<div style="font-size:0.7rem;color:var(--error);font-weight:600">⛔ Suspendu</div>` : ''}
        </div>
        <div style="font-weight:600">${t.pronos}</div>
        <div style="font-weight:700;color:${t.winRate>=60?'var(--success)':'var(--warning)'}">${t.winRate}%</div>
        <div class="prono-price">${formatEuros(t.balance)}</div>
        <div>${rib}</div>
        <div class="table-actions">${voirBtn}${suspBtn}</div>
      </div>`;
  }).join('');

  c.innerHTML = `
    <div class="section-header">
      <div><h2>Tipsters</h2><p>${adminState.tipsters.length} tipster(s) inscrits</p></div>
    </div>
    <div class="pronos-table" style="${mobile?'padding:0':''}">
      ${!mobile ? `<div class="table-header" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr 120px">
        <span>Tipster</span><span>Pronos</span><span>Win Rate</span><span>Solde</span><span>RIB</span><span>Actions</span>
      </div>` : ''}
      ${rows}
    </div>
  `;
}

async function toggleSuspend(id) {
  const t = adminState.tipsters.find(t => t.id === id);
  if (!t) return;
  const action = t.suspended ? 'réactiver' : 'suspendre';
  if (!confirm(`Voulez-vous ${action} le compte de ${t.name} ?`)) return;
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const newRole = t.suspended ? 'tipster' : 'suspended';
  try {
    await fetch('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/profiles?id=eq.' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + ANON },
      body: JSON.stringify({ role: newRole })
    });
    t.suspended = !t.suspended;
    navigateTo('tipsters');
    showToast(`${t.name} : compte ${t.suspended ? 'suspendu' : 'réactivé'}`, t.suspended ? 'error' : 'success');
  } catch(e) {
    showToast('Erreur lors de la suspension', 'error');
  }
}

// ══════════════════════════════════════════════════════════════
//  PAGE — GESTION DES UTILISATEURS
// ══════════════════════════════════════════════════════════════
function renderUsers(c) {
  const mobile = isMobile();
  const totalBalance = adminState.users.reduce((s,u) => s + u.balance + u.pending, 0);

  const roleBtn = (u) => u.role === 'moderator'
    ? `<span style="font-size:0.72rem;padding:2px 8px;border-radius:var(--radius-full);background:var(--warning-pale,#fff8e1);color:var(--warning);font-weight:600">⚖️ Modo</span>
       <button onclick="setModerator('${u.id}','user')" style="margin-left:4px;font-size:0.7rem;padding:2px 6px;border:1px solid var(--border);border-radius:var(--radius-sm);background:none;color:var(--text-muted);cursor:pointer">Retirer</button>`
    : `<button onclick="setModerator('${u.id}','moderator')" style="font-size:0.72rem;padding:2px 8px;border:1px solid var(--border);border-radius:var(--radius-full);background:none;color:var(--text-muted);cursor:pointer">+ Modo</button>`;

  const rows = adminState.users.map(u => {
    if (mobile) return `
      <div style="padding:var(--space-md) var(--space-lg);border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px">
          <div>
            <div class="prono-title">${u.name}</div>
            <div class="prono-meta">${u.email}</div>
          </div>
          <div>${roleBtn(u)}</div>
        </div>
        <div style="display:flex;gap:var(--space-lg);font-size:0.82rem;color:var(--text-muted);flex-wrap:wrap">
          <span>Solde : <strong style="color:var(--blue)">${formatEuros(u.balance)}</strong></span>
          <span>Attente : <strong style="color:var(--warning)">${u.pending > 0 ? formatEuros(u.pending) : '—'}</strong></span>
          <span>Inscrit : ${u.joined}</span>
        </div>
      </div>`;
    return `
      <div class="table-row" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr">
        <div>
          <div class="prono-title">${u.name}</div>
          <div class="prono-meta">${u.email}</div>
        </div>
        <div style="font-weight:700;color:var(--blue)">${formatEuros(u.balance)}</div>
        <div style="font-weight:600;color:var(--warning)">${u.pending > 0 ? formatEuros(u.pending) : '—'}</div>
        <div style="font-size:0.8rem;color:var(--text-muted)">${u.joined}</div>
        <div>${roleBtn(u)}</div>
      </div>`;
  }).join('');

  c.innerHTML = `
    <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:var(--space-xl)">
      <div class="stat-card"><div class="stat-card__label">👤 Utilisateurs</div><div class="stat-card__value">${adminState.users.length}</div><div class="stat-card__sub">inscrits</div></div>
      <div class="stat-card"><div class="stat-card__label">💰 Soldes cumulés</div><div class="stat-card__value">${formatEuros(totalBalance)}</div><div class="stat-card__sub">dépôts + attentes</div></div>
      <div class="stat-card"><div class="stat-card__label">⏳ En attente</div><div class="stat-card__value">${formatEuros(adminState.users.reduce((s,u)=>s+(parseFloat(u.pending)||0),0))}</div><div class="stat-card__sub">pronos non validés</div></div>
    </div>
    <div class="pronos-table" style="${mobile?'padding:0':''}">
      ${!mobile ? `<div class="table-header" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr">
        <span>Utilisateur</span><span>Solde dispo</span><span>En attente</span><span>Inscrit</span><span>Rôle</span>
      </div>` : ''}
      ${rows}
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════
//  PAGE — VIREMENTS
// ══════════════════════════════════════════════════════════════
async function renderVirements(c) {
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA  = 'https://haezbgglpghjrgdpmcrj.supabase.co';

  c.innerHTML = '<div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">Chargement...</div>';

  const rT = await fetch(SUPA + '/rest/v1/profiles?select=id,first_name,last_name,balance,rib_iban,rib_bic,role&apikey=' + ANON, {
    headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON }
  });
  const allProfiles = await rT.json();
  const tipsters = Array.isArray(allProfiles) ? allProfiles.filter(p => p.role === 'tipster') : [];

  const urlP = new URL(SUPA + '/rest/v1/payouts');
  urlP.searchParams.set('select', 'id,tipster_id,amount,created_at');
  urlP.searchParams.set('order', 'created_at.desc');
  urlP.searchParams.set('apikey', ANON);
  const rP = await fetch(urlP.toString());
  const payoutsRaw = await rP.json();
  const payouts = Array.isArray(payoutsRaw) ? payoutsRaw : [];

  const tipstersMap = {};
  if (Array.isArray(tipsters)) tipsters.forEach(t => { tipstersMap[t.id] = t.first_name + ' ' + t.last_name; });

  const minPayout = 30;
  const pending = Array.isArray(tipsters) ? tipsters.filter(t => parseFloat(t.balance) >= minPayout) : [];
  const totalPending = pending.reduce((s,t) => s + parseFloat(t.balance), 0);

  const mobile = isMobile();

  const pendingRows = pending.length === 0
    ? `<div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">✅ Aucun virement en attente.</div>`
    : pending.map(t => mobile ? `
        <div style="padding:var(--space-md) var(--space-lg);border-bottom:1px solid var(--border)">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
            <div>
              <div class="prono-title">${t.first_name} ${t.last_name}</div>
              <div class="prono-meta" style="word-break:break-all">${t.rib_iban || '⚠️ RIB non renseigné'}</div>
            </div>
            <div style="font-weight:700;color:var(--blue);white-space:nowrap">${formatEuros(parseFloat(t.balance))}</div>
          </div>
          <button class="btn btn-primary btn--sm" onclick="markVirementDone('${t.id}','${t.first_name} ${t.last_name}',${parseFloat(t.balance)})">✓ Effectué</button>
        </div>` : `
        <div class="table-row" style="grid-template-columns:2fr 1fr 1fr 120px">
          <div>
            <div class="prono-title">${t.first_name} ${t.last_name}</div>
            <div class="prono-meta">Virement hebdomadaire</div>
          </div>
          <div style="font-weight:700;font-size:1.05rem;color:var(--blue)">${formatEuros(parseFloat(t.balance))}</div>
          <div style="font-size:0.82rem;color:var(--text-muted)">${t.rib_iban ? t.rib_iban + (t.rib_bic ? ' / ' + t.rib_bic : '') : '⚠️ Non renseigné'}</div>
          <div><button class="btn btn-primary btn--sm" onclick="markVirementDone('${t.id}','${t.first_name} ${t.last_name}',${parseFloat(t.balance)})">✓ Effectué</button></div>
        </div>`).join('');

  const histoRows = !Array.isArray(payouts) || payouts.length === 0
    ? `<div style="text-align:center;padding:var(--space-xl);color:var(--text-muted);font-size:0.88rem">Aucun virement effectué pour l'instant.</div>`
    : payouts.map(v => mobile ? `
        <div style="padding:var(--space-md) var(--space-lg);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:8px">
          <div>
            <div class="prono-title">${tipstersMap[v.tipster_id] || '—'}</div>
            <div class="prono-meta">${new Date(v.created_at).toLocaleDateString('fr-FR')}</div>
          </div>
          <div style="font-weight:700;color:var(--success)">+${formatEuros(v.amount)}</div>
        </div>` : `
        <div class="table-row" style="grid-template-columns:2fr 1fr 1fr">
          <div>
            <div class="prono-title">${tipstersMap[v.tipster_id] || '—'}</div>
            <div class="prono-meta">Virement effectué</div>
          </div>
          <div style="font-weight:700;color:var(--success)">+${formatEuros(v.amount)}</div>
          <div style="font-size:0.82rem;color:var(--text-muted)">${new Date(v.created_at).toLocaleDateString('fr-FR')}</div>
        </div>`).join('');

  c.innerHTML = `
    ${pending.length > 0 ? `
      <div style="background:var(--warning-pale);border:1px solid var(--warning);border-radius:var(--radius-lg);padding:var(--space-lg);margin-bottom:var(--space-xl);display:flex;gap:var(--space-md);align-items:center">
        <div style="font-size:1.8rem">💸</div>
        <div>
          <div style="font-weight:700;color:var(--text-dark)">${pending.length} virement(s) à effectuer</div>
          <div style="font-size:0.85rem;color:var(--text-muted);margin-top:3px">Total : <strong>${formatEuros(totalPending)}</strong> à virer</div>
        </div>
      </div>` : ''}
    <div class="section-header"><div><h2>À effectuer</h2><p>Tipsters avec solde ≥ ${minPayout}€</p></div></div>
    <div class="pronos-table" style="margin-bottom:var(--space-xl);${mobile?'padding:0':''}">
      ${!mobile ? `<div class="table-header" style="grid-template-columns:2fr 1fr 1fr 120px"><span>Tipster</span><span>Solde</span><span>RIB</span><span>Action</span></div>` : ''}
      ${pendingRows}
    </div>
    <div class="section-header"><div><h2>Historique des virements</h2></div></div>
    <div class="pronos-table" style="${mobile?'padding:0':''}">
      ${!mobile ? `<div class="table-header" style="grid-template-columns:2fr 1fr 1fr"><span>Tipster</span><span>Montant</span><span>Date</span></div>` : ''}
      ${histoRows}
    </div>
  `;
}

async function markVirementDone(tipsterId, tipsterName, amount) {
  if (!confirm(`Confirmer le virement de ${formatEuros(amount)} à ${tipsterName} ?\nCela mettra leur solde à 0.`)) return;

  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA  = 'https://haezbgglpghjrgdpmcrj.supabase.co';

  try {
    await fetch(SUPA + '/rest/v1/payouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + ANON },
      body: JSON.stringify({ tipster_id: tipsterId, amount: amount })
    });
    await fetch(SUPA + '/rest/v1/profiles?id=eq.' + tipsterId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + ANON },
      body: JSON.stringify({ balance: 0 })
    });
    showToast(`Virement de ${formatEuros(amount)} à ${tipsterName} confirmé ✓`, 'success');
    navigateTo('virements');
  } catch(e) {
    console.error(e);
    showToast('Erreur lors du virement', 'error');
  }
}

// ── Sidebar / Topbar ──────────────────────────────────────────
function renderSidebar() {
  document.querySelectorAll('.sidebar__link').forEach(l =>
    l.classList.toggle('active', l.dataset.page === adminState.activePage)
  );

  const pendingPronos = adminState.pronos.filter(p => p.status === 'pending').length;
  const badgePronos = document.getElementById('badge-pronos');
  if (badgePronos) {
    badgePronos.textContent = pendingPronos;
    badgePronos.style.display = pendingPronos > 0 ? '' : 'none';
  }

  const pendingVir = adminState.tipsters.filter(t => parseFloat(t.balance) >= 30).length;
  const badgeVir = document.getElementById('badge-vir');
  if (badgeVir) {
    badgeVir.textContent = pendingVir;
    badgeVir.style.display = pendingVir > 0 ? '' : 'none';
  }

  const badgeUrgent = document.getElementById('badge-urgent');
  if (badgeUrgent) {
    badgeUrgent.textContent = pendingPronos;
    badgeUrgent.style.display = pendingPronos > 0 ? '' : 'none';
  }
}

function renderTopbar() {}

// ── Utilitaires ───────────────────────────────────────────────

function isMobile() { return window.innerWidth < 900; }

function formatDate(str) {
  if (!str) return "—";
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1].slice(2)}`;
  return str;
}

function formatEuros(n) {
  return n % 1 === 0
    ? Math.round(n).toLocaleString('fr-FR') + ' €'
    : n.toFixed(2).replace('.', ',') + ' €';
}

function showToast(message, type = 'info') {
  document.querySelector('.toast')?.remove();
  const c = { error:['var(--error-pale)','var(--error)','✕'], success:['var(--success-pale)','var(--success)','✓'], info:['var(--blue-pale)','var(--blue)','ℹ'] }[type] || ['var(--blue-pale)','var(--blue)','ℹ'];
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span>${c[2]}</span> ${message}`;
  Object.assign(t.style, { position:'fixed', bottom:'24px', left:'50%', transform:'translateX(-50%)', background:c[0], border:`1px solid ${c[1]}`, borderRadius:'var(--radius-md)', padding:'12px 24px', fontSize:'0.87rem', fontFamily:'var(--font-body)', color:'var(--text-dark)', zIndex:'9999', animation:'fadeUp 0.3s ease both', boxShadow:'var(--shadow-md)', whiteSpace:'nowrap' });
  document.body.appendChild(t);
  setTimeout(() => t?.remove(), 3500);
}

// ── Modérateur ────────────────────────────────────────────────
async function setModerator(userId, newRole) {
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';
  const label = newRole === 'moderator' ? 'modérateur' : 'utilisateur';
  if (!confirm(`Changer le rôle de cet utilisateur en ${label} ?`)) return;
  try {
    const r = await fetch(`${SUPA}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + ANON },
      body: JSON.stringify({ role: newRole })
    });
    if (!r.ok) throw new Error('Erreur serveur');
    const u = adminState.users.find(u => u.id === userId);
    if (u) u.role = newRole;
    showToast(`Rôle mis à jour : ${label} ✓`, 'success');
    navigateTo('users');
  } catch(e) {
    showToast('Erreur : ' + e.message, 'error');
  }
}

// ── Sidebar mobile ────────────────────────────────────────────
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('show');
}


// ══════════════════════════════════════════════════════════════
//  PAGE — FINANCES & COMMISSIONS
// ══════════════════════════════════════════════════════════════
async function renderFinances(container) {
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';
  container.innerHTML = `
    <div class="section-header">
      <div><h2>Finances & Commissions</h2><p>Revenus par tipster sur les pronos terminés</p></div>
    </div>
    <div style="display:flex;gap:var(--space-md);align-items:flex-end;margin-bottom:var(--space-lg);flex-wrap:wrap">
      <div class="form-group" style="margin:0">
        <label style="font-size:0.8rem;color:var(--text-muted)">Date début</label>
        <input class="input" type="date" id="fin-date-from" style="width:160px" />
      </div>
      <div class="form-group" style="margin:0">
        <label style="font-size:0.8rem;color:var(--text-muted)">Date fin</label>
        <input class="input" type="date" id="fin-date-to" style="width:160px" />
      </div>
      <button class="btn btn-primary" onclick="loadFinances()">Filtrer</button>
      <button class="btn btn-outline" onclick="document.getElementById('fin-date-from').value='';document.getElementById('fin-date-to').value='';loadFinances();">Tout afficher</button>
    </div>
    <div class="stats-grid" id="fin-totals">
      <div class="stat-card"><div class="stat-card__label">CA Total</div><div class="stat-card__value" id="fin-total-ca">—</div></div>
      <div class="stat-card"><div class="stat-card__label">Mes commissions (10%)</div><div class="stat-card__value" id="fin-total-comm" style="color:var(--success)">—</div></div>
      <div class="stat-card"><div class="stat-card__label">Versé aux tipsters (90%)</div><div class="stat-card__value" id="fin-total-net">—</div></div>
    </div>
    <div id="fin-table"><div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">⏳ Chargement...</div></div>`;
  loadFinances();
}

async function loadFinances() {
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';
  const dateFrom = document.getElementById('fin-date-from')?.value || '';
  const dateTo   = document.getElementById('fin-date-to')?.value || '';
  const table = document.getElementById('fin-table');
  if (!table) return;
  table.innerHTML = `<div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">⏳ Chargement...</div>`;
  try {
    const urlP = new URL(SUPA + '/rest/v1/pronos');
    urlP.searchParams.set('select', 'id,game,sport,match_date,status,tipster_id,buyers');
    urlP.searchParams.set('status', 'in.(won,lost,cancelled)');
    if (dateFrom) urlP.searchParams.set('match_date', 'gte.' + dateFrom);
    if (dateTo)   urlP.searchParams.append('match_date', 'lte.' + dateTo);
    urlP.searchParams.set('apikey', ANON);
    const rP = await fetch(urlP.toString(), { headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON } });
    const pronos = await rP.json();
    if (!Array.isArray(pronos) || pronos.length === 0) {
      table.innerHTML = `<div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">Aucun prono terminé sur cette période.</div>`;
      ['fin-total-ca','fin-total-comm','fin-total-net'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = '0 €'; });
      return;
    }
    const pronoIds = pronos.map(p => p.id);
    const urlPurch = new URL(SUPA + '/rest/v1/purchases');
    urlPurch.searchParams.set('select', 'prono_id,amount,status');
    urlPurch.searchParams.set('prono_id', 'in.(' + pronoIds.join(',') + ')');
    urlPurch.searchParams.set('apikey', ANON);
    const rPurch = await fetch(urlPurch.toString(), { headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON } });
    const purchases = await rPurch.json();
    const tipsterIds = [...new Set(pronos.map(p => p.tipster_id).filter(Boolean))];
    const urlProf = new URL(SUPA + '/rest/v1/profiles');
    urlProf.searchParams.set('select', 'id,first_name,last_name');
    urlProf.searchParams.set('id', 'in.(' + tipsterIds.join(',') + ')');
    urlProf.searchParams.set('apikey', ANON);
    const rProf = await fetch(urlProf.toString(), { headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON } });
    const profiles = await rProf.json();
    const profilesMap = {};
    (profiles || []).forEach(p => profilesMap[p.id] = p.first_name + ' ' + p.last_name);
    const tipsterStats = {};
    pronos.forEach(prono => {
      const tid = prono.tipster_id; if (!tid) return;
      if (!tipsterStats[tid]) tipsterStats[tid] = { name: profilesMap[tid]||'—', pronos:0, won:0, lost:0, cancelled:0, ca:0, acheteurs:0 };
      const s = tipsterStats[tid]; s.pronos++;
      if (prono.status==='won') s.won++; else if (prono.status==='lost') s.lost++; else if (prono.status==='cancelled') s.cancelled++;
      const pPurchases = (purchases||[]).filter(p => p.prono_id === prono.id);
      s.ca += pPurchases.reduce((sum, p) => sum + parseFloat(p.amount||0), 0);
      s.acheteurs += prono.buyers||0;
    });
    const tipsters = Object.values(tipsterStats).filter(s => s.ca > 0);
    const totalCA = tipsters.reduce((s,t) => s+t.ca, 0);
    const el1 = document.getElementById('fin-total-ca'); if(el1) el1.textContent = formatEuros(totalCA);
    const el2 = document.getElementById('fin-total-comm'); if(el2) el2.textContent = formatEuros(totalCA*0.1);
    const el3 = document.getElementById('fin-total-net'); if(el3) el3.textContent = formatEuros(totalCA*0.9);
    if (!tipsters.length) { table.innerHTML = `<div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">Aucune vente sur cette période.</div>`; return; }
    const mob = isMobile();
    table.innerHTML = mob
      ? `<div class="pronos-table" style="padding:0">
          ${tipsters.sort((a,b)=>b.ca-a.ca).map(t => {
            const wr = (t.won+t.lost)>0 ? Math.round(t.won/(t.won+t.lost)*100) : 0;
            return `<div style="padding:var(--space-md) var(--space-lg);border-bottom:1px solid var(--border)">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <span class="prono-title">${t.name}</span>
                <span style="font-weight:700;color:var(--primary)">${formatEuros(t.ca)}</span>
              </div>
              <div class="prono-meta">${t.won}W · ${t.lost}L · <span style="color:${wr>=60?'var(--success)':'var(--warning)'};font-weight:600">${wr}%</span></div>
              <div style="display:flex;gap:var(--space-md);font-size:0.8rem;margin-top:4px">
                <span style="color:var(--success)">+${formatEuros(t.ca*0.1)} comm.</span>
                <span style="color:var(--text-muted)">${formatEuros(t.ca*0.9)} tipster</span>
              </div>
            </div>`;
          }).join('')}
        </div>`
      : `<div class="pronos-table">
          <div class="table-header" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr 1fr">
            <span>Tipster</span><span>Pronos</span><span>Win Rate</span><span>Acheteurs</span><span>CA Total</span><span style="color:var(--success)">Mes 10%</span><span>Net Tipster</span>
          </div>
          ${tipsters.sort((a,b)=>b.ca-a.ca).map(t => {
            const wr = (t.won+t.lost)>0 ? Math.round(t.won/(t.won+t.lost)*100) : 0;
            return `<div class="table-row" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr 1fr">
              <div><div class="prono-title">${t.name}</div><div class="prono-meta">${t.won}W · ${t.lost}L · ${t.cancelled} annulés</div></div>
              <div style="font-weight:600">${t.pronos}</div>
              <div style="color:${wr>=60?'var(--success)':'var(--text-muted)'};font-weight:600">${wr}%</div>
              <div>👥 ${t.acheteurs}</div>
              <div style="font-weight:700;color:var(--primary)">${formatEuros(t.ca)}</div>
              <div style="font-weight:700;color:var(--success)">${formatEuros(t.ca*0.1)}</div>
              <div style="font-weight:600">${formatEuros(t.ca*0.9)}</div>
            </div>`;
          }).join('')}
        </div>`;
  } catch(e) {
    table.innerHTML = `<div style="text-align:center;padding:var(--space-2xl);color:var(--error)">Erreur : ${e.message}</div>`;
  }
}

// ══════════════════════════════════════════════════════════════
//  PAGE — EXPLORER TIPSTERS
// ══════════════════════════════════════════════════════════════
async function renderExplorerTipsters(container, publicUrlBase) {
  container.innerHTML = `<div class="section-header"><div><h2>Explorer les tipsters</h2><p>Chargement...</p></div></div><div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">Chargement...</div>`;
  try {
    const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';
    const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
    const [rT, rP] = await Promise.all([
      fetch(`${SUPA}/rest/v1/profiles?select=id,first_name,last_name,pseudo,avatar_url&role=eq.tipster&apikey=${ANON}`),
      fetch(`${SUPA}/rest/v1/pronos?select=tipster_id,status,buyers,cote&apikey=${ANON}`)
    ]);
    const tipsters = await rT.json();
    const pronos   = await rP.json();
    const stats = {};
    for (const t of tipsters) {
      const my = pronos.filter(p => p.tipster_id === t.id);
      const won = my.filter(p => p.status==='won').length;
      const lost = my.filter(p => p.status==='lost').length;
      const finished = won+lost;
      const winRate = finished>0 ? Math.round(won/finished*100) : null;
      const withCote = my.filter(p => (p.status==='won'||p.status==='lost') && p.cote && parseFloat(p.cote)>1);
      const avgCote = withCote.length>0 ? Math.round(withCote.reduce((s,p)=>s+parseFloat(p.cote),0)/withCote.length*100)/100 : null;
      const score = winRate!==null ? winRate*(avgCote!==null?avgCote:1)*Math.log10(finished+1) : null;
      stats[t.id] = { won, lost, total:my.length, totalAcheteurs:my.reduce((s,p)=>s+(parseInt(p.buyers)||0),0), winRate, avgCote, score };
    }
    let sortCol='score', sortDir=-1, filterVal='';
    function sortedFiltered() {
      return tipsters.filter(t=>(t.pseudo||'').toLowerCase().includes(filterVal.toLowerCase()))
        .sort((a,b)=>{ const sa=stats[a.id][sortCol], sb=stats[b.id][sortCol]; if(sa===null&&sb===null)return 0; if(sa===null)return 1; if(sb===null)return -1; return (sb-sa)*sortDir*-1; });
    }
    function setSortCol(col) { if(sortCol===col)sortDir*=-1; else{sortCol=col;sortDir=-1;} renderList(); }
    function arrowHtml(col) { if(sortCol!==col)return `<span style="color:var(--text-muted);font-size:0.7rem;margin-left:3px">⇅</span>`; return sortDir===-1?`<span style="font-size:0.7rem;margin-left:3px">↓</span>`:`<span style="font-size:0.7rem;margin-left:3px">↑</span>`; }
    function renderList() {
      ['total','totalAcheteurs','winRate','avgCote','score'].forEach(col=>{
        const el=document.getElementById('sort-btn-'+col); if(el){el.style.borderColor=sortCol===col?'var(--blue)':'';el.style.color=sortCol===col?'var(--blue)':'';}
        const arr=document.getElementById('sort-arr-'+col); if(arr)arr.innerHTML=arrowHtml(col);
      });
      const listEl=document.getElementById('tipsters-list');
      const list=sortedFiltered();
      if(!list.length){listEl.innerHTML=`<div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">Aucun tipster trouvé.</div>`;return;}
      listEl.innerHTML=list.map((t,i)=>{
        const s=stats[t.id];
        const pseudo=t.pseudo||(t.first_name+' '+t.last_name);
        const avatarHtml=t.avatar_url?`<img src="${t.avatar_url}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;flex-shrink:0" />`:`<div style="width:44px;height:44px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;flex-shrink:0">${pseudo[0]?.toUpperCase()}</div>`;
        const winRateHtml=s.winRate!==null?`<span style="font-weight:800;font-size:1rem;color:${s.winRate>=60?'var(--success)':'var(--warning)'}">${s.winRate}%</span>`:`<span style="color:var(--text-muted);font-size:0.85rem">—</span>`;
        const coteHtml=s.avgCote!==null?`<span style="font-weight:800;font-size:1rem;color:var(--blue)">${s.avgCote.toFixed(2).replace('.',',')}</span>`:`<span style="color:var(--text-muted);font-size:0.85rem">—</span>`;
        const rankColor=i===0?'#FFD700':i===1?'#C0C0C0':i===2?'#CD7F32':'var(--text-muted)';
        const href=t.pseudo?publicUrlBase+t.pseudo:'#';
        return `<a href="${href}" target="_blank" style="text-decoration:none"><div class="tipster-explorer-card">
          <div style="display:flex;align-items:center;gap:12px;min-width:0">
            <div style="font-size:0.85rem;font-weight:700;color:${rankColor};min-width:20px;text-align:center">${i+1}</div>
            ${avatarHtml}
            <div style="font-weight:700;font-size:0.95rem;color:var(--text-dark);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">@${pseudo}</div>
          </div>
          <div class="tipster-explorer-stats">
            <div class="tipster-explorer-stat"><div class="tipster-explorer-stat__label">Pronos</div><div class="tipster-explorer-stat__value">${s.total}</div></div>
            <div class="tipster-explorer-stat"><div class="tipster-explorer-stat__label">Acheteurs</div><div class="tipster-explorer-stat__value">${s.totalAcheteurs}</div></div>
            <div class="tipster-explorer-stat"><div class="tipster-explorer-stat__label">Win Rate</div><div class="tipster-explorer-stat__value">${winRateHtml}</div></div>
            <div class="tipster-explorer-stat"><div class="tipster-explorer-stat__label">Cote moy.</div><div class="tipster-explorer-stat__value">${coteHtml}</div></div>
          </div>
        </div></a>`;
      }).join('');
    }
    const sortBtns=['total','totalAcheteurs','winRate','avgCote','score'].map(col=>{
      const labels={total:'Pronos',totalAcheteurs:'Acheteurs',winRate:'Win Rate',avgCote:'Cote moy.',score:'🏆 Score'};
      return `<button id="sort-btn-${col}" class="btn btn-outline" style="font-size:0.78rem;padding:6px 12px" onclick="document.setSortCol('${col}')">${labels[col]} <span id="sort-arr-${col}"></span></button>`;
    }).join('');
    container.innerHTML=`
      <div class="section-header"><div><h2>Explorer les tipsters</h2><p>${tipsters.length} tipsters inscrits</p></div></div>
      <div class="tipster-search-wrap"><span class="input-icon">🔍</span><input class="input" id="tipster-search" type="text" placeholder="Rechercher par pseudo..." oninput="document.tipsterFilter(this.value)" /></div>
      <div style="display:flex;gap:var(--space-sm);margin-bottom:var(--space-md);flex-wrap:wrap;align-items:center;">${sortBtns}</div>
      <div id="tipsters-list"></div>`;
    document.tipsterFilter=(val)=>{filterVal=val;renderList();};
    document.setSortCol=setSortCol;
    renderList();
  } catch(e) {
    container.innerHTML=`<div style="text-align:center;padding:var(--space-2xl);color:var(--error)">Erreur : ${e.message}</div>`;
  }
}

// ══════════════════════════════════════════════════════════════
//  PAGE — FEEDBACK & CHANGELOG (ADMIN)
// ══════════════════════════════════════════════════════════════
async function renderPageFeedbackAdmin(container) {
  const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA='https://haezbgglpghjrgdpmcrj.supabase.co';
  container.innerHTML='<div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">Chargement...</div>';
  const [rFB,rCL]=await Promise.all([
    fetch(`${SUPA}/rest/v1/feedback?select=*&order=created_at.desc&apikey=${ANON}`,{headers:{apikey:ANON,'Authorization':'Bearer '+ANON}}),
    fetch(`${SUPA}/rest/v1/changelog?select=*&order=created_at.desc&apikey=${ANON}`,{headers:{apikey:ANON,'Authorization':'Bearer '+ANON}})
  ]);
  const feedbacks=await rFB.json().catch(()=>[]);
  const changelog=await rCL.json().catch(()=>[]);
  const statutColors={nouveau:'var(--blue)','en cours':'var(--warning)',résolu:'var(--success)'};
  const catIcons={suggestion:'💡',bug:'🐛',autre:'💬'};
  function fmtD(str){return new Date(str).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'});}
  const feedbackRows=Array.isArray(feedbacks)&&feedbacks.length>0
    ?feedbacks.map(f=>`<div style="padding:var(--space-md) var(--space-lg);border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="font-size:0.72rem;padding:2px 8px;border-radius:var(--radius-full);background:var(--bg-soft);color:var(--text-muted);font-weight:600">${f.role||'—'}</span>
            <span style="font-weight:700;color:var(--text-dark)">${f.pseudo||'—'}</span>
            <span style="font-size:0.78rem;color:var(--text-muted)">${f.email||'—'}</span>
          </div>
          <span style="font-size:0.75rem;color:var(--text-muted)">${fmtD(f.created_at)}</span>
        </div>
        <div style="font-weight:700;color:var(--text-dark);margin-bottom:4px">${catIcons[f.categorie]||'💬'} ${f.titre}</div>
        <div style="font-size:0.85rem;color:var(--text-muted);line-height:1.6;margin-bottom:8px">${f.description}</div>
        <select style="font-size:0.78rem;padding:4px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg-soft);color:${statutColors[f.statut]||'var(--blue)'};cursor:pointer" onchange="updateFeedbackStatut('${f.id}',this.value)">
          <option value="nouveau" ${f.statut==='nouveau'?'selected':''}>🔵 Nouveau</option>
          <option value="en cours" ${f.statut==='en cours'?'selected':''}>🟡 En cours</option>
          <option value="résolu" ${f.statut==='résolu'?'selected':''}>🟢 Résolu</option>
        </select>
      </div>`).join('')
    :'<div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">Aucun feedback reçu.</div>';
  const changelogRows=Array.isArray(changelog)&&changelog.length>0
    ?changelog.map(e=>`<div style="padding:var(--space-md) var(--space-lg);border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:0.72rem;padding:2px 10px;border-radius:var(--radius-full);background:var(--blue-xpale);color:var(--blue);font-weight:600">${e.type}</span>
            <span style="font-size:0.75rem;color:var(--text-muted)">${fmtD(e.created_at)}</span>
          </div>
          <button onclick="deleteChangelog('${e.id}')" style="background:none;border:none;cursor:pointer;color:var(--error);font-size:0.95rem;padding:2px">🗑</button>
        </div>
        <div style="font-weight:700;color:var(--text-dark);margin-bottom:3px">${e.titre}</div>
        <div style="font-size:0.85rem;color:var(--text-muted);line-height:1.6">${e.description}</div>
      </div>`).join('')
    :'<div style="text-align:center;padding:var(--space-xl);color:var(--text-muted)">Aucune entrée changelog.</div>';
  container.innerHTML=`
    <div class="section-header" style="margin-bottom:var(--space-md)">
      <div><h2>💬 Feedbacks reçus</h2><p>${Array.isArray(feedbacks)?feedbacks.length:0} feedback(s)</p></div>
      <button class="btn btn-outline" onclick="exportFeedbackCSV()">⬇ Exporter CSV</button>
    </div>
    <div class="pronos-table" style="padding:0;margin-bottom:var(--space-2xl)">${feedbackRows}</div>
    <div class="section-header" style="margin-bottom:var(--space-md)"><div><h2>📣 Changelog</h2><p>Annonces visibles par tous</p></div></div>
    <div class="pronos-table" style="padding:var(--space-lg);margin-bottom:var(--space-lg)">
      <h3 style="font-size:0.95rem;font-weight:700;color:var(--text-dark);margin-bottom:var(--space-md)">+ Publier une nouveauté</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);margin-bottom:var(--space-md)">
        <div class="form-group"><label>Type</label><select class="input" id="cl-type"><option>Nouveau</option><option>Amélioration</option><option>Correction bug</option></select></div>
        <div class="form-group"><label>Titre</label><input class="input" type="text" id="cl-titre" placeholder="Ex: Nouveau classement des tipsters" /></div>
      </div>
      <div class="form-group"><label>Description</label><textarea class="input" id="cl-description" placeholder="Décrivez la nouveauté..." style="min-height:80px;resize:vertical"></textarea></div>
      <button class="btn btn-primary" onclick="publishChangelog()" style="margin-top:var(--space-sm)">📣 Publier</button>
    </div>
    <div class="pronos-table" style="padding:0">${changelogRows}</div>`;
}

async function updateFeedbackStatut(id,statut){
  const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  await fetch(`https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/feedback?id=eq.${id}`,{method:'PATCH',headers:{'Content-Type':'application/json',apikey:ANON,'Authorization':'Bearer '+ANON},body:JSON.stringify({statut})});
  showToast('Statut mis à jour ✓','success');
}

async function publishChangelog(){
  const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const type=document.getElementById('cl-type')?.value;
  const titre=document.getElementById('cl-titre')?.value.trim();
  const desc=document.getElementById('cl-description')?.value.trim();
  if(!titre||!desc){showToast('Veuillez remplir le titre et la description.','error');return;}
  const r=await fetch('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/changelog',{method:'POST',headers:{'Content-Type':'application/json',apikey:ANON,'Authorization':'Bearer '+ANON,Prefer:'return=minimal'},body:JSON.stringify({type,titre,description:desc})});
  if(r.ok||r.status===201){showToast('Nouveauté publiée ! ✓','success');navigateTo('feedback');}
  else showToast('Erreur lors de la publication','error');
}

async function deleteChangelog(id){
  if(!confirm('Supprimer cette entrée ?'))return;
  const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  await fetch(`https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/changelog?id=eq.${id}`,{method:'DELETE',headers:{apikey:ANON,'Authorization':'Bearer '+ANON}});
  showToast('Entrée supprimée.','success');
  navigateTo('feedback');
}

function exportFeedbackCSV(){
  const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  fetch(`https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/feedback?select=*&order=created_at.desc&apikey=${ANON}`,{headers:{apikey:ANON,'Authorization':'Bearer '+ANON}})
  .then(r=>r.json()).then(data=>{
    if(!Array.isArray(data)||!data.length){showToast('Aucun feedback à exporter.','info');return;}
    const headers=['Date','Rôle','Pseudo','Email','Catégorie','Titre','Description','Statut'];
    const rows=data.map(f=>[new Date(f.created_at).toLocaleString('fr-FR'),f.role||'',f.pseudo||'',f.email||'',f.categorie||'',f.titre||'',(f.description||'').replace(/"/g,'""'),f.statut||''].map(v=>`"${v}"`).join(','));
    const csv=[headers.join(','),...rows].join('\n');
    const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='feedbacks-payperwin.csv';a.click();
  });
}

// ══════════════════════════════════════════════════════════════
//  MODALES — FICHES DÉTAILLÉES
// ══════════════════════════════════════════════════════════════
function closeFicheModal(e){
  if(!e||e.target===document.getElementById('fiche-modal-overlay'))
    document.getElementById('fiche-modal-overlay').style.display='none';
}

async function openFicheTipster(id){
  const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA='https://haezbgglpghjrgdpmcrj.supabase.co';
  const overlay=document.getElementById('fiche-modal-overlay');
  const modal=document.getElementById('fiche-modal-content');
  overlay.style.display='block';
  modal.innerHTML='<div style="text-align:center;padding:40px;color:var(--text-muted)">⏳ Chargement...</div>';
  try{
    const rP=await fetch(`${SUPA}/rest/v1/profiles?select=id,first_name,last_name,balance,pending,rib_iban,rib_bic,rib_name,created_at&id=eq.${id}&apikey=${ANON}`,{headers:{apikey:ANON}});
    const profiles=await rP.json(); const p=profiles[0]||{};
    const rPr=await fetch(`${SUPA}/rest/v1/pronos?select=id,game,sport,match_date,status,buyers,price,content,cote&tipster_id=eq.${id}&order=created_at.desc&apikey=${ANON}`,{headers:{apikey:ANON}});
    const pronos=await rPr.json();
    const pronoIds=(pronos||[]).map(p=>p.id);
    let totalCA=0;
    if(pronoIds.length>0){
      const rPurch=await fetch(`${SUPA}/rest/v1/purchases?select=amount&prono_id=in.(${pronoIds.join(',')})&apikey=${ANON}`,{headers:{apikey:ANON}});
      const purchases=await rPurch.json();
      totalCA=(purchases||[]).reduce((s,p)=>s+parseFloat(p.amount||0),0);
    }
    const won=(pronos||[]).filter(p=>p.status==='won').length;
    const lost=(pronos||[]).filter(p=>p.status==='lost').length;
    const wr=(won+lost)>0?Math.round(won/(won+lost)*100):0;
    const badge={won:'<span class="badge badge-won">✓ Gagné</span>',lost:'<span class="badge badge-lost">✕ Perdu</span>',cancelled:'<span class="badge badge-cancelled">⊘ Annulé</span>',pending:'<span class="badge badge-pending">⏳ En attente</span>'};
    modal.innerHTML=`
      <h2 style="margin-bottom:4px">${p.first_name} ${p.last_name}</h2>
      <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:var(--space-lg)">Membre depuis ${formatDate(p.created_at?.split('T')[0])}</div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-card__label">Pronos</div><div class="stat-card__value">${(pronos||[]).length}</div></div>
        <div class="stat-card"><div class="stat-card__label">Win Rate</div><div class="stat-card__value" style="color:var(--success)">${wr}%</div></div>
        <div class="stat-card"><div class="stat-card__label">CA Total</div><div class="stat-card__value">${formatEuros(totalCA)}</div></div>
        <div class="stat-card"><div class="stat-card__label">Mes 10%</div><div class="stat-card__value" style="color:var(--success)">${formatEuros(totalCA*0.1)}</div></div>
      </div>
      <div style="background:var(--bg-soft);border-radius:var(--radius-md);padding:var(--space-md);margin-bottom:var(--space-lg);font-size:0.85rem">
        <strong>🏦 RIB</strong><br>Titulaire : ${p.rib_name||'—'}<br>IBAN : ${p.rib_iban||'—'}<br>BIC : ${p.rib_bic||'—'}<br>
        Solde : <strong>${formatEuros(p.balance||0)}</strong> · En attente : <strong>${formatEuros(p.pending||0)}</strong>
      </div>
      <h3 style="margin-bottom:var(--space-md)">Historique des pronos</h3>
      ${(pronos||[]).length===0?'<p style="color:var(--text-muted)">Aucun prono.</p>':`
        <div style="display:flex;flex-direction:column;gap:8px;max-height:350px;overflow-y:auto">
          ${(pronos||[]).map(pr=>`<div style="background:var(--bg-soft);border-radius:var(--radius-sm);padding:10px 14px;font-size:0.85rem">
            <div style="display:flex;justify-content:space-between;align-items:center"><strong>${pr.game}</strong>${badge[pr.status]||''}</div>
            <div style="color:var(--text-muted);margin-top:2px">${pr.sport} · ${formatDate(pr.match_date)} · 👥 ${pr.buyers||0} · ${formatEuros(pr.price)}${pr.cote?` · 📊 ${parseFloat(pr.cote).toFixed(2).replace('.',',')}`:''}</div>
            ${pr.content?`<div style="margin-top:4px;font-style:italic;color:var(--text-muted)">📋 ${pr.content}</div>`:''}
          </div>`).join('')}
        </div>`}`;
  }catch(e){modal.innerHTML=`<div style="color:var(--error)">Erreur de chargement.</div>`;}
}

async function openFicheUser(id){
  const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA='https://haezbgglpghjrgdpmcrj.supabase.co';
  const overlay=document.getElementById('fiche-modal-overlay');
  const modal=document.getElementById('fiche-modal-content');
  overlay.style.display='block';
  modal.innerHTML='<div style="text-align:center;padding:40px;color:var(--text-muted)">⏳ Chargement...</div>';
  try{
    const rP=await fetch(`${SUPA}/rest/v1/profiles?select=id,first_name,last_name,balance,pending,created_at&id=eq.${id}&apikey=${ANON}`,{headers:{apikey:ANON}});
    const profiles=await rP.json(); const p=profiles[0]||{};
    const rA=await fetch(`${SUPA}/rest/v1/purchases?select=id,prono_id,amount,status,created_at&user_id=eq.${id}&order=created_at.desc&apikey=${ANON}`,{headers:{apikey:ANON}});
    const purchases=await rA.json();
    let pronosMap={};
    if((purchases||[]).length>0){
      const pronoIds=[...new Set(purchases.map(a=>a.prono_id))];
      const rPr=await fetch(`${SUPA}/rest/v1/pronos?select=id,game,sport,match_date,tipster_id&id=in.(${pronoIds.join(',')})&apikey=${ANON}`,{headers:{apikey:ANON}});
      const pronos=await rPr.json(); (pronos||[]).forEach(pr=>pronosMap[pr.id]=pr);
      const tipsterIds=[...new Set(Object.values(pronosMap).map(pr=>pr.tipster_id).filter(Boolean))];
      if(tipsterIds.length>0){
        const rT=await fetch(`${SUPA}/rest/v1/profiles?select=id,first_name,last_name&id=in.(${tipsterIds.join(',')})&apikey=${ANON}`,{headers:{apikey:ANON}});
        const tipsters=await rT.json(); const tMap={};
        (tipsters||[]).forEach(t=>tMap[t.id]=t.first_name+' '+t.last_name);
        Object.values(pronosMap).forEach(pr=>pr.tipsterName=tMap[pr.tipster_id]||'—');
      }
    }
    const totalDepense=(purchases||[]).reduce((s,a)=>s+parseFloat(a.amount||0),0);
    const totalRembourse=(purchases||[]).filter(a=>a.status==='lost'||a.status==='cancelled').reduce((s,a)=>s+parseFloat(a.amount||0),0);
    const totalWon=(purchases||[]).filter(a=>a.status==='won').length;
    const badge={won:'<span class="badge badge-won">✓ Gagné</span>',lost:'<span class="badge badge-lost">✕ Perdu</span>',cancelled:'<span class="badge badge-cancelled">⊘ Annulé</span>',pending:'<span class="badge badge-pending">⏳ En attente</span>'};
    modal.innerHTML=`
      <h2 style="margin-bottom:4px">${p.first_name} ${p.last_name}</h2>
      <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:var(--space-lg)">Membre depuis ${formatDate(p.created_at?.split('T')[0])}</div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-card__label">Achats</div><div class="stat-card__value">${(purchases||[]).length}</div></div>
        <div class="stat-card"><div class="stat-card__label">Total dépensé</div><div class="stat-card__value">${formatEuros(totalDepense)}</div></div>
        <div class="stat-card"><div class="stat-card__label">Remboursés</div><div class="stat-card__value" style="color:var(--success)">${formatEuros(totalRembourse)}</div></div>
        <div class="stat-card"><div class="stat-card__label">Pronos gagnés</div><div class="stat-card__value" style="color:var(--primary)">${totalWon}</div></div>
      </div>
      <div style="background:var(--bg-soft);border-radius:var(--radius-md);padding:var(--space-md);margin-bottom:var(--space-lg);font-size:0.85rem">
        💰 Solde : <strong>${formatEuros(p.balance||0)}</strong> · ⏳ En attente : <strong>${formatEuros(p.pending||0)}</strong>
      </div>
      <h3 style="margin-bottom:var(--space-md)">Historique des achats</h3>
      ${(purchases||[]).length===0?'<p style="color:var(--text-muted)">Aucun achat.</p>':`
        <div style="display:flex;flex-direction:column;gap:8px;max-height:350px;overflow-y:auto">
          ${(purchases||[]).map(a=>{const pr=pronosMap[a.prono_id]||{};return`<div style="background:var(--bg-soft);border-radius:var(--radius-sm);padding:10px 14px;font-size:0.85rem">
            <div style="display:flex;justify-content:space-between;align-items:center"><strong>${pr.game||'—'}</strong>${badge[a.status]||''}</div>
            <div style="color:var(--text-muted);margin-top:2px">${pr.sport||'—'} · ${formatDate(pr.match_date)} · par ${pr.tipsterName||'—'} · <strong>${formatEuros(a.amount)}</strong></div>
          </div>`;}).join('')}
        </div>`}`;
  }catch(e){modal.innerHTML=`<div style="color:var(--error)">Erreur de chargement.</div>`;}
}


