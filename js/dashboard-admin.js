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
  tipsterSearch: '',
  tipsterSortCol: null,
  tipsterSortDir: 1,
  userSearch: '',
  userSortDir:  0,  // tri achats : 0 = aucun, 1 = croissant, -1 = décroissant
  userSoldeDir: 0,  // tri solde  : 0 = aucun, 1 = croissant, -1 = décroissant
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

  // Récupérer les pseudos depuis profiles directement
  const ANON_PS = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const rPS = await fetch('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/profiles?select=id,pseudo&role=eq.tipster&apikey=' + ANON_PS, {
    headers: { 'apikey': ANON_PS, 'Authorization': 'Bearer ' + ANON_PS }
  });
  const pseudos = await rPS.json();
  const pseudoMap = {};
  if (Array.isArray(pseudos)) pseudos.forEach(p => { pseudoMap[p.id] = p.pseudo; });

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
        pseudo:   pseudoMap[t.id] || t.pseudo || null,
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

  // Charger le nombre d'achats par utilisateur
  const ANON_U = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const rPurchCount = await fetch('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/purchases?select=user_id&apikey=' + ANON_U, {
    headers: { 'apikey': ANON_U, 'Authorization': 'Bearer ' + ANON_U }
  });
  const allPurchasesCount = await rPurchCount.json();
  const purchaseCountMap = {};
  if (Array.isArray(allPurchasesCount)) {
    allPurchasesCount.forEach(p => {
      purchaseCountMap[p.user_id] = (purchaseCountMap[p.user_id] || 0) + 1;
    });
  }

  if (users && users.length > 0) {
    adminState.users = users.map(u => ({
      ...u,
      name:    u.first_name + ' ' + u.last_name,
      email:   u.email || '—',
      balance: parseFloat(u.balance) || 0,
      pending: parseFloat(u.pending) || 0,
      freebet: parseFloat(u.freebet_balance) || 0,
      spent:   0,
      joined:  u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—',
      achats:  purchaseCountMap[u.id] || 0,
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
    images:    'Validation des images',
    sondage:   'Sondages',
    dashsettings: 'Paramètres du dashboard',
    sponsors: 'Gestion des sponsors',
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
  if (page === 'images')    renderPageImages(content);
  if (page === 'sondage')   renderPageSondage(content);
  if (page === 'dashsettings') renderPageDashSettings(content);
  if (page === 'sponsors')     renderPageSponsors(content);
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
        // Décrémenter le pending de chaque acheteur
        for (const achat of purchases) {
          const { data: userProfile } = await sb.from('profiles').select('pending').eq('id', achat.user_id).single();
          const currentPending = parseFloat(userProfile?.pending || 0);
          const newPending = Math.max(0, currentPending - parseFloat(achat.amount || 0));
          await sb.from('profiles').update({ pending: newPending }).eq('id', achat.user_id);
        }
        await sb.from('purchases').update({ status: 'won' }).eq('prono_id', p.id);
      } else {
        for (const achat of purchases) {
          const { data: userProfile } = await sb.from('profiles').select('balance, pending').eq('id', achat.user_id).single();
          const currentBalance = parseFloat(userProfile?.balance || 0);
          const currentPending = parseFloat(userProfile?.pending || 0);
          const amount = parseFloat(achat.amount || 0);
          const newPending = Math.max(0, currentPending - amount);
          await sb.from('profiles').update({
            balance: currentBalance + amount,
            pending: newPending
          }).eq('id', achat.user_id);
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

  if (!document.getElementById('tipsters-rows')) {
    c.innerHTML = `
      <div class="section-header">
        <div><h2>Tipsters</h2><p>${adminState.tipsters.length} tipster(s) inscrits</p></div>
      </div>
      <div style="display:flex;gap:var(--space-sm);margin-bottom:var(--space-md);align-items:center;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch">
        <div class="tipster-search-wrap" style="flex:1;margin-bottom:0">
          <span class="input-icon">🔍</span>
          <input class="input" id="tipster-admin-search" type="text" placeholder="Rechercher par pseudo ou prénom..."
            oninput="adminState.tipsterSearch=this.value;renderTipsterRows()" />
        </div>
        <button id="tip-name-btn" onclick="setTipsterSort('name')" class="btn btn-outline" style="white-space:nowrap;flex-shrink:0;font-size:0.82rem;padding:8px 14px">
          Tipster <span id="tip-name-arrow">⇅</span>
        </button>
        <button id="tip-pseudo-btn" onclick="setTipsterSort('pseudo')" class="btn btn-outline" style="white-space:nowrap;flex-shrink:0;font-size:0.82rem;padding:8px 14px">
          Pseudo <span id="tip-pseudo-arrow">⇅</span>
        </button>
        <button id="tip-pronos-btn" onclick="setTipsterSort('pronos')" class="btn btn-outline" style="white-space:nowrap;flex-shrink:0;font-size:0.82rem;padding:8px 14px">
          Pronos <span id="tip-pronos-arrow">⇅</span>
        </button>
        <button id="tip-winrate-btn" onclick="setTipsterSort('winRate')" class="btn btn-outline" style="white-space:nowrap;flex-shrink:0;font-size:0.82rem;padding:8px 14px">
          Win Rate <span id="tip-winrate-arrow">⇅</span>
        </button>
        <button id="tip-solde-btn" onclick="setTipsterSort('balance')" class="btn btn-outline" style="white-space:nowrap;flex-shrink:0;font-size:0.82rem;padding:8px 14px">
          Solde <span id="tip-solde-arrow">⇅</span>
        </button>
      </div>
      <div class="pronos-table" style="${mobile?'padding:0':''}">
        ${!mobile ? `<div class="table-header" style="grid-template-columns:2fr 1.2fr 1fr 1fr 1fr 1fr 120px">
          <span style="cursor:pointer;user-select:none" onclick="setTipsterSort('name')">Tipster <span id="tip-name-arrow-d">⇅</span></span>
          <span style="cursor:pointer;user-select:none" onclick="setTipsterSort('pseudo')">Pseudo <span id="tip-pseudo-arrow-d">⇅</span></span>
          <span style="cursor:pointer;user-select:none" onclick="setTipsterSort('pronos')">Pronos <span id="tip-pronos-arrow-d">⇅</span></span>
          <span style="cursor:pointer;user-select:none" onclick="setTipsterSort('winRate')">Win Rate <span id="tip-winrate-arrow-d">⇅</span></span>
          <span style="cursor:pointer;user-select:none" onclick="setTipsterSort('balance')">Solde <span id="tip-solde-arrow-d">⇅</span></span>
          <span>RIB</span><span>Actions</span>
        </div>` : ''}
        <div id="tipsters-rows"></div>
      </div>
    `;
  }

  renderTipsterRows();
}

function setTipsterSort(col) {
  const cols = {
    name:    ['tip-name-btn',   'tip-name-arrow',   'tip-name-arrow-d'],
    pseudo:  ['tip-pseudo-btn', 'tip-pseudo-arrow',  'tip-pseudo-arrow-d'],
    pronos:  ['tip-pronos-btn', 'tip-pronos-arrow',  'tip-pronos-arrow-d'],
    winRate: ['tip-winrate-btn','tip-winrate-arrow', 'tip-winrate-arrow-d'],
    balance: ['tip-solde-btn',  'tip-solde-arrow',   'tip-solde-arrow-d'],
  };
  if (adminState.tipsterSortCol === col) {
    adminState.tipsterSortDir *= -1;
  } else {
    adminState.tipsterSortCol = col;
    adminState.tipsterSortDir = 1; // A→Z ou croissant par défaut pour texte
  }
  const arrow = adminState.tipsterSortDir === 1 ? '↑' : '↓';
  Object.keys(cols).forEach(c => {
    const [btn, a1, a2] = cols[c];
    const b = document.getElementById(btn); if (b) b.style.borderColor = '';
    const e1 = document.getElementById(a1); if (e1) e1.textContent = '⇅';
    const e2 = document.getElementById(a2); if (e2) e2.textContent = '⇅';
  });
  if (cols[col]) {
    const [btn, a1, a2] = cols[col];
    const b = document.getElementById(btn); if (b) b.style.borderColor = 'var(--blue)';
    const e1 = document.getElementById(a1); if (e1) e1.textContent = arrow;
    const e2 = document.getElementById(a2); if (e2) e2.textContent = arrow;
  }
  renderTipsterRows();
}

function renderTipsterRows() {
  const mobile = isMobile();
  const container = document.getElementById('tipsters-rows');
  if (!container) return;

  const q = adminState.tipsterSearch.toLowerCase();
  let filtered = adminState.tipsters.filter(t =>
    (t.pseudo || '').toLowerCase().includes(q) ||
    (t.first_name || '').toLowerCase().includes(q)
  );
  if (adminState.tipsterSortCol) {
    const col = adminState.tipsterSortCol;
    const dir = adminState.tipsterSortDir;
    const textCols = ['name', 'pseudo'];
    filtered = [...filtered].sort((a, b) => {
      if (textCols.includes(col)) {
        const va = (a[col] || '').toLowerCase();
        const vb = (b[col] || '').toLowerCase();
        return va.localeCompare(vb) * dir;
      }
      const va = a[col] ?? 0;
      const vb = b[col] ?? 0;
      return (va - vb) * dir;
    });
  }

  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">🔍</div><h3>Aucun tipster trouvé</h3><p>Essayez un autre pseudo ou prénom.</p></div>`;
    return;
  }

  container.innerHTML = filtered.map(t => {
    const lienHref = t.pseudo ? `https://payperwin.co/${t.pseudo}` : `https://payperwin.co/pages/tipster-public.html?id=${t.id}`;
    const lienIcon = `<a href="${lienHref}" target="_blank" style="color:var(--blue);text-decoration:none;font-size:0.9rem;margin-left:6px" title="Voir la page publique">🔗</a>`;
    const pseudoDisplay = t.pseudo ? `@${t.pseudo}` : '<span style="font-style:italic">—</span>';
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
              <div class="prono-meta">${pseudoDisplay} · ${t.email}</div>
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
      <div class="table-row" style="grid-template-columns:2fr 1.2fr 1fr 1fr 1fr 1fr 120px;${t.suspended?'opacity:0.55':''}">
        <div>
          <div class="prono-title">${t.name}${lienIcon}</div>
          <div class="prono-meta">${t.email}</div>
          ${t.suspended ? `<div style="font-size:0.7rem;color:var(--error);font-weight:600">⛔ Suspendu</div>` : ''}
        </div>
        <div class="prono-meta">${pseudoDisplay}</div>
        <div style="font-weight:600">${t.pronos}</div>
        <div style="font-weight:700;color:${t.winRate>=60?'var(--success)':'var(--warning)'}">${t.winRate}%</div>
        <div class="prono-price">${formatEuros(t.balance)}</div>
        <div>${rib}</div>
        <div class="table-actions">${voirBtn}${suspBtn}</div>
      </div>`;
  }).join('');
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
async function renderUsers(c) {
  const mobile = isMobile();
  const soldeDisponible = adminState.users.reduce((s,u) => s + (parseFloat(u.balance)||0), 0);
  const soldeAttente    = adminState.users.reduce((s,u) => s + (parseFloat(u.pending)||0), 0);
  const soldeCumule     = soldeDisponible + soldeAttente;

  // Charger le total des dépôts depuis total_deposits (fiable, inclut l'historique complet)
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';
  let totalDepots = 0;
  try {
    const rDep = await fetch(`${SUPA}/rest/v1/profiles?select=total_deposits&role=in.(user,moderator)&apikey=${ANON}`, {
      headers: { apikey: ANON, 'Authorization': 'Bearer ' + ANON }
    });
    const deps = await rDep.json();
    if (Array.isArray(deps)) totalDepots = deps.reduce((s,p) => s + parseFloat(p.total_deposits||0), 0);
  } catch(e) {}

  // Première fois : construire la structure complète
  if (!document.getElementById('users-rows')) {
    const sortArrow = () => adminState.userSortDir === 1 ? ' ↑' : adminState.userSortDir === -1 ? ' ↓' : ' ⇅';
    c.innerHTML = `
      <div class="stats-grid" style="grid-template-columns:repeat(${isMobile()?'2':'4'},1fr);margin-bottom:var(--space-xl)">
        <div class="stat-card"><div class="stat-card__label">👤 Utilisateurs</div><div class="stat-card__value">${adminState.users.length}</div><div class="stat-card__sub">inscrits</div></div>
        <div class="stat-card stat-card--blue"><div class="stat-card__label">💳 Total dépôts</div><div class="stat-card__value">${formatEuros(totalDepots)}</div><div class="stat-card__sub">Encaissé via Stripe</div></div>
        <div class="stat-card"><div class="stat-card__label">💰 Solde disponible</div><div class="stat-card__value">${formatEuros(soldeDisponible)}</div><div class="stat-card__sub">Dispo dans les comptes</div></div>
        <div class="stat-card"><div class="stat-card__label">⏳ Solde en attente</div><div class="stat-card__value">${formatEuros(soldeAttente)}</div><div class="stat-card__sub">Pronos non validés</div></div>
      </div>
      <div style="background:var(--bg-soft);border:1px solid var(--border);border-radius:var(--radius-md);padding:10px var(--space-md);margin-bottom:var(--space-lg);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <span style="font-size:0.82rem;color:var(--text-muted)">Solde cumulé (dispo + attente)</span>
        <span style="font-weight:800;font-size:1.1rem;color:var(--text-dark)">${formatEuros(soldeCumule)}</span>
      </div>
      <div style="display:flex;gap:var(--space-sm);margin-bottom:var(--space-md);align-items:center">
        <div class="tipster-search-wrap" style="flex:1;margin-bottom:0">
          <span class="input-icon">🔍</span>
          <input class="input" id="user-admin-search" type="text" placeholder="Rechercher par prénom..."
            oninput="adminState.userSearch=this.value;renderUserRows()" />
        </div>
        <button id="achats-sort-btn" onclick="toggleUserSort()" class="btn btn-outline" style="white-space:nowrap;flex-shrink:0;font-size:0.82rem;padding:8px 14px">
          Achats <span id="achats-sort-arrow">⇅</span>
        </button>
        <button id="solde-sort-btn" onclick="toggleUserSoldeSort()" class="btn btn-outline" style="white-space:nowrap;flex-shrink:0;font-size:0.82rem;padding:8px 14px">
          Solde <span id="solde-sort-arrow">⇅</span>
        </button>
      </div>
      <div class="pronos-table" style="${mobile?'padding:0':''}">
        ${!mobile ? `<div class="table-header" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr">
          <span>Utilisateur</span>
          <span style="cursor:pointer;user-select:none" onclick="toggleUserSort()">Achats <span id="achats-sort-arrow-desktop">⇅</span></span>
          <span style="cursor:pointer;user-select:none" onclick="toggleUserSoldeSort()">Solde dispo <span id="solde-sort-arrow-desktop">⇅</span></span><span>En attente</span><span>Inscrit</span><span>Actions</span>
        </div>` : ''}
        <div id="users-rows"></div>
      </div>
    `;
  }

  renderUserRows();
}

function toggleUserSort() {
  adminState.userSortDir = (adminState.userSortDir === -1) ? 1 : -1;
  adminState.userSoldeDir = 0; // reset l'autre tri
  const arrowText = adminState.userSortDir === 1 ? '↑' : '↓';
  const a1 = document.getElementById('achats-sort-arrow');
  const a2 = document.getElementById('achats-sort-arrow-desktop');
  if (a1) a1.textContent = arrowText;
  if (a2) a2.textContent = arrowText;
  const btn = document.getElementById('achats-sort-btn');
  if (btn) btn.style.borderColor = 'var(--blue)';
  // Reset bouton solde
  const btn2 = document.getElementById('solde-sort-btn');
  if (btn2) btn2.style.borderColor = '';
  const s1 = document.getElementById('solde-sort-arrow');
  const s2 = document.getElementById('solde-sort-arrow-desktop');
  if (s1) s1.textContent = '⇅';
  if (s2) s2.textContent = '⇅';
  renderUserRows();
}

function toggleUserSoldeSort() {
  adminState.userSoldeDir = (adminState.userSoldeDir === -1) ? 1 : -1;
  adminState.userSortDir = 0; // reset l'autre tri
  const arrowText = adminState.userSoldeDir === 1 ? '↑' : '↓';
  const s1 = document.getElementById('solde-sort-arrow');
  const s2 = document.getElementById('solde-sort-arrow-desktop');
  if (s1) s1.textContent = arrowText;
  if (s2) s2.textContent = arrowText;
  const btn = document.getElementById('solde-sort-btn');
  if (btn) btn.style.borderColor = 'var(--blue)';
  // Reset bouton achats
  const btn2 = document.getElementById('achats-sort-btn');
  if (btn2) btn2.style.borderColor = '';
  const a1 = document.getElementById('achats-sort-arrow');
  const a2 = document.getElementById('achats-sort-arrow-desktop');
  if (a1) a1.textContent = '⇅';
  if (a2) a2.textContent = '⇅';
  renderUserRows();
}

function renderUserRows() {
  const mobile = isMobile();
  const container = document.getElementById('users-rows');
  if (!container) return;

  let filtered = adminState.users.filter(u =>
    (u.first_name || '').toLowerCase().includes(adminState.userSearch.toLowerCase())
  );

  // Tri actif (achats ou solde — un seul à la fois)
  if (adminState.userSortDir !== 0) {
    filtered = [...filtered].sort((a, b) =>
      adminState.userSortDir === -1 ? b.achats - a.achats : a.achats - b.achats
    );
  } else if (adminState.userSoldeDir !== 0) {
    filtered = [...filtered].sort((a, b) =>
      adminState.userSoldeDir === -1 ? b.balance - a.balance : a.balance - b.balance
    );
  }

  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">🔍</div><h3>Aucun utilisateur trouvé</h3><p>Essayez un autre prénom.</p></div>`;
    return;
  }

  const roleBtn = (u) => u.role === 'moderator'
    ? `<span style="font-size:0.72rem;padding:2px 8px;border-radius:var(--radius-full);background:var(--warning-pale,#fff8e1);color:var(--warning);font-weight:600">⚖️ Modo</span>
       <button onclick="setModerator('${u.id}','user')" style="margin-left:4px;font-size:0.7rem;padding:2px 6px;border:1px solid var(--border);border-radius:var(--radius-sm);background:none;color:var(--text-muted);cursor:pointer">Retirer</button>`
    : `<button onclick="setModerator('${u.id}','moderator')" style="font-size:0.72rem;padding:2px 8px;border:1px solid var(--border);border-radius:var(--radius-full);background:none;color:var(--text-muted);cursor:pointer">+ Modo</button>`;

  container.innerHTML = filtered.map(u => {
    const voirBtn = `<button class="btn-icon" onclick="openFicheUser('${u.id}')">👁</button>`;

    if (mobile) return `
      <div style="padding:var(--space-md) var(--space-lg);border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px">
          <div>
            <div class="prono-title">${u.name}</div>
            <div class="prono-meta">${u.email}</div>
          </div>
          <div style="display:flex;gap:6px;align-items:center">
            ${u.freebet > 0 ? `<span style="background:#FAEEDA;color:#633806;font-size:0.7rem;font-weight:600;padding:2px 7px;border-radius:10px;border:0.5px solid #EF9F27">${formatEuros(u.freebet)}</span>` : `<span style="background:var(--bg-soft);color:var(--text-muted);font-size:0.7rem;padding:2px 7px;border-radius:10px;border:0.5px solid var(--border)">0 €</span>`}
            <button class="btn-icon" title="Ajouter freebet" onclick="openFreebetModal('${u.id}','${u.name}',${u.freebet})" style="border-color:#EF9F27;color:#854F0B">+FB</button>
            ${voirBtn}${roleBtn(u)}
          </div>
        </div>
        <div style="display:flex;gap:var(--space-lg);font-size:0.82rem;color:var(--text-muted);flex-wrap:wrap">
          <span>Achats : <strong style="color:var(--text-dark)">${u.achats}</strong></span>
          <span>Solde : <strong style="color:var(--blue)">${formatEuros(u.balance)}</strong></span>
          <span>Attente : <strong style="color:var(--warning)">${u.pending > 0 ? formatEuros(u.pending) : '—'}</strong></span>
          <span>Inscrit : ${u.joined}</span>
        </div>
      </div>`;
    return `
      <div class="table-row" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr">
        <div>
          <div class="prono-title">${u.name}</div>
          <div class="prono-meta">${u.email}</div>
        </div>
        <div style="font-weight:700">${u.achats}</div>
        <div style="font-weight:700;color:var(--blue)">${formatEuros(u.balance)}</div>
        <div style="font-weight:600;color:var(--warning)">${u.pending > 0 ? formatEuros(u.pending) : '—'}</div>
        <div style="font-size:0.8rem;color:var(--text-muted)">${u.joined}</div>
        <div style="display:flex;gap:6px;align-items:center">
          ${u.freebet > 0 ? `<span style="background:#FAEEDA;color:#633806;font-size:0.7rem;font-weight:600;padding:2px 6px;border-radius:10px;border:0.5px solid #EF9F27">${formatEuros(u.freebet)}</span>` : ''}
          <button class="btn-icon" title="Ajouter freebet" onclick="openFreebetModal('${u.id}','${u.name}',${u.freebet})" style="border-color:#EF9F27;color:#854F0B">+FB</button>
          ${voirBtn}${roleBtn(u)}
        </div>
      </div>`;
  }).join('');
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

  // Lire payouts_with_profile pour avoir nom/prénom/pseudo/email directement
  const urlP = new URL(SUPA + '/rest/v1/payouts_with_profile');
  urlP.searchParams.set('select', 'id,tipster_id,amount,created_at,first_name,last_name,pseudo,email');
  urlP.searchParams.set('order', 'created_at.desc');
  urlP.searchParams.set('apikey', ANON);
  const rP = await fetch(urlP.toString(), { headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON } });
  const payoutsRaw = await rP.json();
  const payouts = Array.isArray(payoutsRaw) ? payoutsRaw : [];

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
    : payouts.map(v => {
      const nom    = (v.first_name || '') + ' ' + (v.last_name || '');
      const pseudo = v.pseudo ? `@${v.pseudo}` : '';
      const mail   = v.email || '';
      const date   = new Date(v.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
      return mobile ? `
        <div style="padding:var(--space-md) var(--space-lg);border-bottom:1px solid var(--border)">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px">
            <div>
              <div class="prono-title">${nom.trim() || '—'}</div>
              <div class="prono-meta">${[pseudo, mail].filter(Boolean).join(' · ')}</div>
              <div class="prono-meta">${date}</div>
            </div>
            <div style="font-weight:700;color:var(--success);white-space:nowrap">+${formatEuros(v.amount)}</div>
          </div>
        </div>` : `
        <div class="table-row" style="grid-template-columns:2fr 1fr 1fr 1fr">
          <div>
            <div class="prono-title">${nom.trim() || '—'}</div>
            <div class="prono-meta">${[pseudo, mail].filter(Boolean).join(' · ')}</div>
          </div>
          <div style="font-weight:700;color:var(--success)">+${formatEuros(v.amount)}</div>
          <div style="font-size:0.82rem;color:var(--text-muted)">${date}</div>
          <div style="font-size:0.75rem;color:var(--text-muted)">${v.tipster_id?.slice(0,8) || '—'}…</div>
        </div>`;
    }).join('');

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
      ${!mobile ? `<div class="table-header" style="grid-template-columns:2fr 1fr 1fr 1fr"><span>Tipster</span><span>Montant</span><span>Date</span><span>ID</span></div>` : ''}
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

  // Badge images en attente
  const ANON_IMG = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  fetch('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/pronos?select=id&image_status=eq.pending&apikey=' + ANON_IMG, {
    headers: { apikey: ANON_IMG, 'Authorization': 'Bearer ' + ANON_IMG }
  }).then(r => r.json()).then(data => {
    const count = Array.isArray(data) ? data.length : 0;
    const badge = document.getElementById('badge-images');
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? '' : 'none'; }
  }).catch(() => {});
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

// Tooltip cliquable : affiche/masque une explication sous chaque bloc
function toggleFinTip(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

async function renderFinances(container) {
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';

  container.innerHTML = '<div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">⏳ Chargement...</div>';

  // ── Données globales ─────────────────────────────────────────
  const [rProfiles, rPurchases] = await Promise.all([
    fetch(SUPA + '/rest/v1/profiles?select=role,balance,total_deposits&apikey=' + ANON, { headers: { apikey: ANON, 'Authorization': 'Bearer ' + ANON } }),
    fetch(SUPA + '/rest/v1/purchases?select=prono_id,amount,status&apikey=' + ANON,     { headers: { apikey: ANON, 'Authorization': 'Bearer ' + ANON } }),
  ]);
  const allProfiles  = await rProfiles.json().catch(() => []);
  const allPurchases = await rPurchases.json().catch(() => []);

  // Bloc 1 — Flux Stripe
  const encaisseBrut   = Array.isArray(allProfiles)
    ? allProfiles.filter(p => p.role === 'user' || p.role === 'moderator').reduce((s,p) => s + parseFloat(p.total_deposits||0), 0) : 0;
  const fraisStripe    = parseFloat(localStorage.getItem('ppw-frais-stripe') || '0');
  const netStripe      = encaisseBrut - fraisStripe;

  // Bloc 2 — Obligations en cours
  const soldesUsers    = Array.isArray(allProfiles)
    ? allProfiles.filter(p => p.role === 'user' || p.role === 'moderator').reduce((s,p) => s + parseFloat(p.balance||0), 0) : 0;
  const soldesTipsters = Array.isArray(allProfiles)
    ? allProfiles.filter(p => p.role === 'tipster').reduce((s,p) => s + parseFloat(p.balance||0), 0) : 0;
  const totalOblig     = soldesUsers + soldesTipsters;

  // Bloc 3 — Activité pronos (calculé dans loadFinances)
  const mob = isMobile();
  const cols = mob ? '2' : '3';

  // Helper : carte cliquable avec tooltip
  function finCard(id, label, value, color, tipText) {
    return `<div style="background:var(--bg);border-radius:var(--radius-md);padding:12px 16px;cursor:pointer;border:1px solid var(--border);box-shadow:var(--shadow-sm,0 1px 3px rgba(0,0,0,.06))" onclick="toggleFinTip('tip-${id}')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:6px">${label}</div>
        <span style="font-size:0.75rem;color:var(--blue);flex-shrink:0;margin-left:6px">ⓘ</span>
      </div>
      <div style="font-size:1.3rem;font-weight:800;color:${color||'var(--text-dark)'};">${value}</div>
      <div id="tip-${id}" style="display:none;margin-top:8px;padding:8px 10px;background:var(--blue-xpale,#eef3ff);border-radius:var(--radius-sm);font-size:0.78rem;color:var(--text-muted);line-height:1.5">${tipText}</div>
    </div>`;
  }

  container.innerHTML = `
    <div class="section-header">
      <div><h2>Finances & Commissions</h2><p>Clique sur chaque bloc pour l'explication</p></div>
    </div>

    <!-- ══ BLOC 1 : FLUX STRIPE ══ -->
    <div style="margin-bottom:var(--space-xl)">
      <div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:var(--space-sm)">💳 Flux Stripe</div>
      <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:var(--space-sm)">
        ${finCard('encaisse', 'Encaissé brut', formatEuros(encaisseBrut), 'var(--blue)',
          'Total de tous les dépôts effectués par les users depuis le lancement. Source : champ <code>total_deposits</code> dans les profils, mis à jour par le webhook Stripe à chaque paiement réussi.')}
        <div style="background:var(--bg);border-radius:var(--radius-md);padding:12px 16px;border:1px solid var(--border);box-shadow:var(--shadow-sm,0 1px 3px rgba(0,0,0,.06))">
          <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:6px">Frais Stripe</div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:1.1rem;font-weight:800;color:var(--error)">−</span>
            <input id="frais-stripe-input" type="number" min="0" step="0.01" value="${fraisStripe}"
              style="width:90px;font-size:1.1rem;font-weight:800;border:none;background:transparent;color:var(--error);outline:none;border-bottom:1px dashed var(--border)"
              onchange="localStorage.setItem('ppw-frais-stripe',this.value);renderFinances(document.getElementById('page-content'))" />
            <span style="font-size:0.9rem;color:var(--error)">€</span>
          </div>
          <div style="font-size:0.72rem;color:var(--text-muted);margin-top:4px">Clique pour saisir (visible sur Stripe)</div>
        </div>
        ${finCard('net-stripe', 'Net réel Stripe', formatEuros(netStripe), netStripe >= 0 ? 'var(--success)' : 'var(--error)',
          'Encaissé brut moins les frais Stripe. C\'est l\'argent réellement disponible sur ton compte Stripe après déduction des frais de transaction.')}
      </div>
    </div>

    <!-- ══ BLOC 2 : OBLIGATIONS ══ -->
    <div style="margin-bottom:var(--space-xl)">
      <div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:var(--space-sm)">⚖️ Obligations en cours</div>
      <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:var(--space-sm)">
        ${finCard('soldes-users', 'Soldes users', formatEuros(soldesUsers), 'var(--text-dark)',
          'Argent que les users ont déposé et qui n\'a pas encore été dépensé en pronos. Tu dois pouvoir le rembourser à tout moment si un user demande un retrait.')}
        ${finCard('soldes-tipsters', 'Soldes tipsters', formatEuros(soldesTipsters), 'var(--text-dark)',
          'Gains accumulés par les tipsters sur leurs pronos gagnants, en attente de virement. Ce montant doit être viré chaque lundi aux tipsters dont le solde dépasse 30 €.')}
        ${finCard('total-oblig', 'Total obligations', formatEuros(totalOblig), 'var(--warning)',
          'Soldes users + soldes tipsters. C\'est le montant minimum que tu dois conserver sur ton compte Stripe pour honorer toutes tes obligations actuelles.')}
      </div>
      <div style="margin-top:var(--space-sm);padding:10px 14px;background:var(--bg-soft);border-radius:var(--radius-md);display:flex;justify-content:space-between;align-items:center;border:1px solid var(--border)">
        <span style="font-size:0.85rem;color:var(--text-muted)">🏦 Trésorerie libre (net Stripe − obligations)</span>
        <span style="font-weight:800;font-size:1.1rem;color:${(netStripe - totalOblig) >= 0 ? 'var(--success)' : 'var(--error)'}">${formatEuros(netStripe - totalOblig)}</span>
      </div>
    </div>

    <!-- ══ BLOC 3 : ACTIVITÉ PRONOS ══ -->
    <div style="margin-bottom:var(--space-xl)">
      <div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:var(--space-sm)">🎯 Activité pronos</div>
      <div style="display:grid;grid-template-columns:repeat(${mob?'2':'5'},1fr);gap:var(--space-sm)" id="fin-pronos-blocs">
        <div style="background:var(--bg);border-radius:var(--radius-md);padding:12px 16px;border:1px solid var(--border);box-shadow:var(--shadow-sm,0 1px 3px rgba(0,0,0,.06))">
          <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:6px">Volume total</div>
          <div style="font-size:1.15rem;font-weight:800;color:var(--text-dark)" id="fin-vol-total">—</div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px">Tous achats confondus</div>
        </div>
        <div style="background:var(--bg);border-radius:var(--radius-md);padding:12px 16px;border:1px solid var(--border);box-shadow:var(--shadow-sm,0 1px 3px rgba(0,0,0,.06))">
          <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:6px">Pronos gagnants</div>
          <div style="font-size:1.15rem;font-weight:800;color:var(--blue)" id="fin-vol-won">—</div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px">Base de calcul réelle</div>
        </div>
        <div style="background:var(--bg);border-radius:var(--radius-md);padding:12px 16px;border:1px solid var(--border);box-shadow:var(--shadow-sm,0 1px 3px rgba(0,0,0,.06))">
          <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:6px">Remboursés</div>
          <div style="font-size:1.15rem;font-weight:800;color:var(--text-dark)" id="fin-vol-lost">—</div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px">Perdus + annulés</div>
        </div>
        <div style="background:var(--bg);border-radius:var(--radius-md);padding:12px 16px;border:1px solid var(--border);box-shadow:var(--shadow-sm,0 1px 3px rgba(0,0,0,.06))">
          <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:6px">Ta commission</div>
          <div style="font-size:1.15rem;font-weight:800;color:var(--success)" id="fin-commission">—</div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px">10% des gagnants</div>
        </div>
        <div style="background:var(--bg);border-radius:var(--radius-md);padding:12px 16px;border:1px solid var(--border);box-shadow:var(--shadow-sm,0 1px 3px rgba(0,0,0,.06))">
          <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:6px">Crédité tipsters</div>
          <div style="font-size:1.15rem;font-weight:800;color:var(--text-dark)" id="fin-net-tipsters">—</div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px">90% des gagnants</div>
        </div>
      </div>
    </div>

    <!-- ══ TABLEAU PAR TIPSTER ══ -->
    <div class="section-header" style="margin-bottom:var(--space-md)">
      <div><h2>Détail par tipster</h2><p>Clique sur un tipster pour voir le détail prono par prono</p></div>
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
      ['fin-vol-total','fin-vol-won','fin-vol-lost','fin-commission','fin-net-tipsters'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = '0 €'; });
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

    // Charger les virements déjà effectués par tipster (toutes périodes confondues)
    const rPay = await fetch(SUPA + '/rest/v1/payouts?select=tipster_id,amount&apikey=' + ANON, { headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON } });
    const payouts = await rPay.json();
    const payoutsMap = {};
    if (Array.isArray(payouts)) {
      payouts.forEach(v => { payoutsMap[v.tipster_id] = (payoutsMap[v.tipster_id] || 0) + parseFloat(v.amount || 0); });
    }

    // ── Calculs corrects par statut ───────────────────────────
    const tipsterStats    = {};
    const tipsterPronoDetails = {};
    let volTotal = 0, volWon = 0, volLost = 0;

    pronos.forEach(prono => {
      const tid = prono.tipster_id; if (!tid) return;
      if (!tipsterStats[tid]) tipsterStats[tid] = { name: profilesMap[tid]||'—', pronos:0, won:0, lost:0, cancelled:0, caWon:0, caAll:0, acheteurs:0, dejaVire: payoutsMap[tid]||0 };
      if (!tipsterPronoDetails[tid]) tipsterPronoDetails[tid] = [];
      const s = tipsterStats[tid]; s.pronos++;
      if (prono.status==='won') s.won++;
      else if (prono.status==='lost') s.lost++;
      else if (prono.status==='cancelled') s.cancelled++;

      const pPurchases = (purchases||[]).filter(p => p.prono_id === prono.id);
      const pronoCA    = pPurchases.reduce((sum, p) => sum + parseFloat(p.amount||0), 0);

      // caAll = tous les achats (info), caWon = uniquement gagnants (base commission)
      s.caAll += pronoCA;
      if (prono.status === 'won') { s.caWon += pronoCA; volWon += pronoCA; }
      else { volLost += pronoCA; }
      volTotal += pronoCA;

      s.acheteurs += prono.buyers||0;
      tipsterPronoDetails[tid].push({ ...prono, pronoCA, acheteurs: prono.buyers||0 });
    });

    window._finPronoDetails = tipsterPronoDetails;
    window._finProfilesMap  = profilesMap;

    // ── Mise à jour bloc 3 ────────────────────────────────────
    const setEl = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
    setEl('fin-vol-total',    formatEuros(volTotal));
    setEl('fin-vol-won',      formatEuros(volWon));
    setEl('fin-vol-lost',     formatEuros(volLost));
    setEl('fin-commission',   formatEuros(volWon * 0.1));
    setEl('fin-net-tipsters', formatEuros(volWon * 0.9));

    // ── Tableau par tipster ───────────────────────────────────
    const tipsters = Object.values(tipsterStats).filter(s => s.caAll > 0);
    if (!tipsters.length) { table.innerHTML = `<div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">Aucune vente sur cette période.</div>`; return; }
    const mob = isMobile();
    const rowStyle = `cursor:pointer;transition:background .12s`;
    const hov = `onmouseover="this.style.background='var(--bg-soft)'" onmouseout="this.style.background=''"`;

    table.innerHTML = mob
      ? `<div class="pronos-table" style="padding:0">
          ${tipsters.sort((a,b)=>b.caWon-a.caWon).map(t => {
            const wr  = (t.won+t.lost)>0 ? Math.round(t.won/(t.won+t.lost)*100) : 0;
            const tid = Object.keys(tipsterPronoDetails).find(k => tipsterStats[k] === t) || '';
            return `<div style="padding:var(--space-md) var(--space-lg);border-bottom:1px solid var(--border);${rowStyle}" ${hov} onclick="openFicheFinances('${tid}')">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <span class="prono-title">${t.name} <span style="font-size:0.75rem;color:var(--blue)">📋</span></span>
                <span style="font-weight:700;color:var(--blue)">${formatEuros(t.caWon)}</span>
              </div>
              <div class="prono-meta">${t.won}W · ${t.lost}L · <span style="color:${wr>=60?'var(--success)':'var(--warning)'};font-weight:600">${wr}%</span></div>
              <div style="display:flex;gap:var(--space-md);font-size:0.8rem;margin-top:4px;flex-wrap:wrap">
                <span style="color:var(--success)">Comm : +${formatEuros(t.caWon*0.1)}</span>
                <span style="color:var(--text-muted)">Tipster : ${formatEuros(t.caWon*0.9)}</span>
                ${t.dejaVire > 0 ? `<span style="color:var(--blue)">Viré : ${formatEuros(t.dejaVire)}</span>` : ''}
              </div>
            </div>`;
          }).join('')}
        </div>`
      : `<div class="pronos-table">
          <div class="table-header" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr">
            <span>Tipster</span><span>Pronos</span><span>Win Rate</span><span>Acheteurs</span><span>Ventes gagnants</span><span style="color:var(--success)">Commission (10%)</span><span>Crédité tipster</span><span style="color:var(--blue)">Déjà viré</span>
          </div>
          ${tipsters.sort((a,b)=>b.caWon-a.caWon).map(t => {
            const wr  = (t.won+t.lost)>0 ? Math.round(t.won/(t.won+t.lost)*100) : 0;
            const tid = Object.keys(tipsterPronoDetails).find(k => tipsterStats[k] === t) || '';
            return `<div class="table-row" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;${rowStyle}" ${hov} onclick="openFicheFinances('${tid}')">
              <div>
                <div class="prono-title">${t.name} <span style="font-size:0.75rem;color:var(--blue)">📋</span></div>
                <div class="prono-meta">${t.won}W · ${t.lost}L · ${t.cancelled} annulés</div>
              </div>
              <div style="font-weight:600">${t.pronos}</div>
              <div style="color:${wr>=60?'var(--success)':'var(--text-muted)'};font-weight:600">${wr}%</div>
              <div>👥 ${t.acheteurs}</div>
              <div style="font-weight:700;color:var(--blue)">${formatEuros(t.caWon)}</div>
              <div style="font-weight:700;color:var(--success)">${formatEuros(t.caWon*0.1)}</div>
              <div style="font-weight:600">${formatEuros(t.caWon*0.9)}</div>
              <div style="font-weight:700;color:var(--blue)">${t.dejaVire > 0 ? formatEuros(t.dejaVire) : '<span style=\"color:var(--text-muted)\">—</span>'}</div>
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
      const extra = col==='score' ? ` <span onclick="event.stopPropagation();toggleScoreInfo()" style="font-size:0.8rem;cursor:pointer;color:var(--blue);vertical-align:middle" title="Explication du score">ⓘ</span>` : '';
      return `<button id="sort-btn-${col}" class="btn btn-outline" style="font-size:0.78rem;padding:6px 12px" onclick="document.setSortCol('${col}')">${labels[col]}${extra} <span id="sort-arr-${col}"></span></button>`;
    }).join('');
    container.innerHTML=`
      <div class="section-header"><div><h2>Explorer les tipsters</h2><p>${tipsters.length} tipsters inscrits</p></div></div>
      <div class="tipster-search-wrap"><span class="input-icon">🔍</span><input class="input" id="tipster-search" type="text" placeholder="Rechercher par pseudo..." oninput="document.tipsterFilter(this.value)" /></div>
      <div style="display:flex;gap:var(--space-sm);margin-bottom:var(--space-md);flex-wrap:wrap;align-items:center;">${sortBtns}</div>
      <div id="score-info-box" style="display:none;background:var(--blue-xpale,#eef3ff);border:1px solid var(--blue);border-radius:var(--radius-md);padding:12px 16px;margin-bottom:var(--space-md);font-size:0.82rem;color:var(--text-dark);line-height:1.7">
        <strong>🏆 Comment est calculé le Score ?</strong><br>
        <code style="font-size:0.79rem;background:rgba(0,0,0,.05);padding:2px 6px;border-radius:4px">Score = Win Rate × Cote moyenne × log10(pronos terminés + 1)</code><br><br>
        Ce score récompense les tipsters qui combinent un bon taux de réussite, des cotes élevées, et un volume suffisant de pronos.
        Un tipster avec 60% de win rate, cote moy. 2,0 et 10 pronos terminés aura un score de 60 × 2,0 × log10(11) ≈ 125.
      </div>
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
    const rPr=await fetch(`${SUPA}/rest/v1/pronos?select=id,game,sport,match_date,status,buyers,price,content,analysis,show_cote,cote&tipster_id=eq.${id}&order=created_at.desc&apikey=${ANON}`,{headers:{apikey:ANON}});
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
            <div style="color:var(--text-muted);margin-top:2px">${pr.sport} · ${formatDate(pr.match_date)} ·
              <span onclick="togglePronoAcheteurs('${pr.id}',this)" style="cursor:pointer;color:var(--blue);font-weight:600;border-bottom:1px dashed var(--blue)">👥 ${pr.buyers||0}</span>
              · ${formatEuros(pr.price)}${pr.cote?` · 📊 ${parseFloat(pr.cote).toFixed(2).replace('.',',')}${pr.show_cote===false?' <span style=\"color:var(--warning);font-size:0.75rem\">(masqué)</span>':''}`:''}</div>
            ${pr.content?`<div style="margin-top:4px;font-style:italic;color:var(--text-muted)">🎯 ${pr.content}</div>`:''}
            ${pr.analysis?`<div style="margin-top:3px;font-style:italic;color:var(--text-muted)">📝 ${pr.analysis}</div>`:''}
            <div id="acheteurs-${pr.id}" style="display:none;margin-top:8px"></div>
          </div>`).join('')}
        </div>`}`;
  }catch(e){modal.innerHTML=`<div style="color:var(--error)">Erreur de chargement.</div>`;}
}

// ══════════════════════════════════════════════════════════════
//  FREEBET
// ══════════════════════════════════════════════════════════════
function openFreebetModal(userId, userName, currentFreebet) {
  const existing = document.getElementById('freebet-modal-overlay');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'freebet-modal-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center';
  overlay.innerHTML = `
    <div style="background:var(--bg);border-radius:var(--radius-lg);padding:var(--space-xl);max-width:380px;width:90%;border:1px solid var(--border)">
      <h3 style="margin-bottom:6px">Ajouter un freebet</h3>
      <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:var(--space-lg)">${userName} · Solde freebet actuel : <strong style="color:#633806">${formatEuros(currentFreebet)}</strong></p>
      <div class="form-group">
        <label>Montant à ajouter (€)</label>
        <div class="input-wrap">
          <input class="input" type="number" id="freebet-amount" min="0.5" step="0.5" placeholder="Ex: 5" style="padding-left:var(--space-md)" />
        </div>
      </div>
      <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-lg)">
        <button class="btn btn-outline" onclick="document.getElementById('freebet-modal-overlay').remove()">Annuler</button>
        <button class="btn btn-primary" onclick="saveFreebetModal('${userId}',${currentFreebet})">Créditer le freebet</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  setTimeout(() => document.getElementById('freebet-amount')?.focus(), 100);
}

async function saveFreebetModal(userId, currentFreebet) {
  const amountEl = document.getElementById('freebet-amount');
  const amount = parseFloat(amountEl?.value);
  if (!amount || amount <= 0) { showToast('Veuillez saisir un montant valide.', 'error'); return; }
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';
  const newFreebet = Math.round((currentFreebet + amount) * 100) / 100;
  try {
    const { data: { session } } = await sb.auth.getSession();
    const token = session?.access_token || ANON;
    const r = await fetch(`${SUPA}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', apikey: ANON, 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ freebet_balance: newFreebet })
    });
    if (r.ok || r.status === 204) {
      const u = adminState.users.find(u => u.id === userId);
      if (u) u.freebet = newFreebet;
      document.getElementById('freebet-modal-overlay')?.remove();
      showToast('Freebet crédité : ' + formatEuros(newFreebet) + ' ✓', 'success');
      renderUserRows();
    } else {
      showToast('Erreur lors du crédit freebet.', 'error');
    }
  } catch(e) {
    showToast('Erreur : ' + e.message, 'error');
  }
}

async function openFicheUser(id){
  const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA='https://haezbgglpghjrgdpmcrj.supabase.co';
  const overlay=document.getElementById('fiche-modal-overlay');
  const modal=document.getElementById('fiche-modal-content');
  overlay.style.display='block';
  modal.innerHTML='<div style="text-align:center;padding:40px;color:var(--text-muted)">⏳ Chargement...</div>';
  try{
    // Profil (avec total_deposits)
    const rP=await fetch(`${SUPA}/rest/v1/profiles?select=id,first_name,last_name,balance,pending,total_deposits,created_at&id=eq.${id}&apikey=${ANON}`,{headers:{apikey:ANON,'Authorization':'Bearer '+ANON}});
    const profiles=await rP.json(); const p=profiles[0]||{};

    // Achats
    const rA=await fetch(`${SUPA}/rest/v1/purchases?select=id,prono_id,amount,status,created_at&user_id=eq.${id}&order=created_at.desc&apikey=${ANON}`,{headers:{apikey:ANON,'Authorization':'Bearer '+ANON}});
    const purchases=await rA.json();

    // Historique des dépôts
    const rD=await fetch(`${SUPA}/rest/v1/deposits?select=id,amount,method,created_at&user_id=eq.${id}&order=created_at.desc&apikey=${ANON}`,{headers:{apikey:ANON,'Authorization':'Bearer '+ANON}});
    const deposits=await rD.json();

    let pronosMap={};
    if((purchases||[]).length>0){
      const pronoIds=[...new Set(purchases.map(a=>a.prono_id))];
      const rPr=await fetch(`${SUPA}/rest/v1/pronos?select=id,game,sport,match_date,tipster_id&id=in.(${pronoIds.join(',')})&apikey=${ANON}`,{headers:{apikey:ANON,'Authorization':'Bearer '+ANON}});
      const pronos=await rPr.json(); (pronos||[]).forEach(pr=>pronosMap[pr.id]=pr);
      const tipsterIds=[...new Set(Object.values(pronosMap).map(pr=>pr.tipster_id).filter(Boolean))];
      if(tipsterIds.length>0){
        const rT=await fetch(`${SUPA}/rest/v1/profiles?select=id,first_name,last_name&id=in.(${tipsterIds.join(',')})&apikey=${ANON}`,{headers:{apikey:ANON,'Authorization':'Bearer '+ANON}});
        const tipsters=await rT.json(); const tMap={};
        (tipsters||[]).forEach(t=>tMap[t.id]=t.first_name+' '+t.last_name);
        Object.values(pronosMap).forEach(pr=>pr.tipsterName=tMap[pr.tipster_id]||'—');
      }
    }
    const totalDeposits=parseFloat(p.total_deposits||0);
    const totalRembourse=(purchases||[]).filter(a=>a.status==='lost'||a.status==='cancelled').reduce((s,a)=>s+parseFloat(a.amount||0),0);
    const totalWon=(purchases||[]).filter(a=>a.status==='won').length;
    const badge={won:'<span class="badge badge-won">✓ Gagné</span>',lost:'<span class="badge badge-lost">✕ Perdu</span>',cancelled:'<span class="badge badge-cancelled">⊘ Annulé</span>',pending:'<span class="badge badge-pending">⏳ En attente</span>'};

    // Méthode de paiement — label et icône
    const methodLabel={card:'💳 CB',paypal:'🅿 PayPal',crypto:'₿ Crypto'};
    const depositsHtml=Array.isArray(deposits)&&deposits.length>0
      ?`<div style="display:flex;flex-direction:column;gap:6px;max-height:220px;overflow-y:auto;margin-top:var(--space-sm)">
          <div style="display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:8px;font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);padding:0 4px;margin-bottom:2px">
            <span>Date</span><span>Moyen</span><span>Montant</span>
          </div>
          ${deposits.map(d=>`<div style="display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:8px;background:var(--bg-soft);border-radius:var(--radius-sm);padding:8px 10px;font-size:0.83rem;align-items:center">
            <span style="color:var(--text-muted)">${new Date(d.created_at).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'2-digit'})}</span>
            <span>${methodLabel[d.method]||d.method||'—'}</span>
            <span style="font-weight:700;color:var(--blue)">${formatEuros(parseFloat(d.amount||0))}</span>
          </div>`).join('')}
        </div>`
      :'<div style="font-size:0.85rem;color:var(--text-muted);margin-top:var(--space-sm)">Aucun dépôt enregistré.</div>';

    modal.innerHTML=`
      <h2 style="margin-bottom:4px">${p.first_name} ${p.last_name}</h2>
      <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:var(--space-lg)">Membre depuis ${formatDate(p.created_at?.split('T')[0])}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-sm);margin-bottom:var(--space-lg)">

        <!-- Bloc 1 : Achats -->
        <div style="background:var(--bg-soft);border-radius:var(--radius-md);padding:10px 14px">
          <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:4px">Achats</div>
          <div style="font-size:1.3rem;font-weight:800;color:var(--text-dark)">${(purchases||[]).length}</div>
        </div>

        <!-- Bloc 2 : Total dépôts (cliquable) -->
        <div id="deposits-bloc" onclick="toggleDepositsPanel()" style="background:var(--bg-soft);border-radius:var(--radius-md);padding:10px 14px;cursor:pointer;border:1px solid transparent;transition:border-color .15s" onmouseover="this.style.borderColor='var(--blue)'" onmouseout="this.style.borderColor='transparent'">
          <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:4px">Total dépôts 📋</div>
          <div style="font-size:1.3rem;font-weight:800;color:var(--blue)">${formatEuros(totalDeposits)}</div>
        </div>

        <!-- Bloc 3 : Solde actuel -->
        <div style="background:var(--bg-soft);border-radius:var(--radius-md);padding:10px 14px">
          <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:4px">Solde actuel</div>
          <div style="font-size:1.3rem;font-weight:800;color:var(--text-dark)">${formatEuros(p.balance||0)}</div>
        </div>

        <!-- Bloc 4 : Remboursés -->
        <div style="background:var(--bg-soft);border-radius:var(--radius-md);padding:10px 14px">
          <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:4px">Remboursés</div>
          <div style="font-size:1.3rem;font-weight:800;color:var(--text-dark)">${formatEuros(totalRembourse)}</div>
        </div>
      </div>

      <!-- Panneau dépôts (masqué par défaut) -->
      <div id="deposits-panel" style="display:none;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-md);margin-top:calc(-1 * var(--space-sm));margin-bottom:var(--space-lg)">
        <div style="font-size:0.82rem;font-weight:700;color:var(--text-dark);margin-bottom:4px">📋 Historique des dépôts</div>
        ${depositsHtml}
      </div>

      <div style="background:var(--bg-soft);border-radius:var(--radius-md);padding:var(--space-md);margin-bottom:var(--space-lg);font-size:0.85rem">
        ⏳ En attente : <strong>${formatEuros(p.pending||0)}</strong> · 🏆 Pronos gagnés : <strong style="color:var(--blue)">${totalWon}</strong>
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

function toggleDepositsPanel() {
  const panel = document.getElementById('deposits-panel');
  const bloc  = document.getElementById('deposits-bloc');
  if (!panel) return;
  const open = panel.style.display === 'none' || panel.style.display === '';
  panel.style.display = open ? 'block' : 'none';
  if (bloc) bloc.style.borderColor = open ? 'var(--blue)' : 'transparent';
}

// ══════════════════════════════════════════════════════════════
//  MODALE — DÉTAIL FINANCES PAR TIPSTER
// ══════════════════════════════════════════════════════════════
function openFicheFinances(tipsterId) {
  const overlay = document.getElementById('fiche-modal-overlay');
  const modal   = document.getElementById('fiche-modal-content');
  if (!overlay || !modal) return;

  const details = (window._finPronoDetails || {})[tipsterId] || [];
  const name    = (window._finProfilesMap  || {})[tipsterId] || 'Tipster';

  if (!details.length) {
    modal.innerHTML = '<p style="color:var(--text-muted)">Aucun prono détaillé disponible.</p>';
    overlay.style.display = 'block';
    return;
  }

  const sorted = [...details].sort((a,b) => new Date(b.match_date||0) - new Date(a.match_date||0));
  const totalCA      = sorted.reduce((s,p) => s + p.pronoCA, 0);
  const totalComm    = totalCA * 0.1;
  const totalTipster = totalCA * 0.9;

  const statusBadge = {
    won:       '<span class=\"badge badge-won\" style=\"font-size:0.72rem\">✓ Gagné</span>',
    lost:      '<span class=\"badge badge-lost\" style=\"font-size:0.72rem\">✕ Perdu</span>',
    cancelled: '<span class=\"badge badge-cancelled\" style=\"font-size:0.72rem\">⊘ Annulé</span>',
  };

  const mob = isMobile();

  const rows = sorted.map(p => {
    const comm = p.status === 'won' ? p.pronoCA * 0.1 : 0;
    const net  = p.status === 'won' ? p.pronoCA * 0.9 : 0;
    const caColor = p.pronoCA > 0 ? 'var(--blue)' : 'var(--text-muted)';
    if (mob) return (
      '<div style="padding:10px 14px;border-bottom:1px solid var(--border)">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:4px">' +
          '<strong style="font-size:0.88rem;color:var(--text-dark)">' + p.game + '</strong>' +
          (statusBadge[p.status] || '') +
        '</div>' +
        '<div class="prono-meta">' + (p.sport||'—') + ' · ' + formatDate(p.match_date) + '</div>' +
        '<div style="display:flex;gap:12px;font-size:0.82rem;margin-top:6px;flex-wrap:wrap">' +
          '<span>👥 <strong>' + p.acheteurs + '</strong></span>' +
          '<span>CA : <strong style="color:' + caColor + '">' + formatEuros(p.pronoCA) + '</strong></span>' +
          (p.status === 'won' ? '<span style="color:var(--success)">Comm : +' + formatEuros(comm) + '</span>' : '') +
          (p.status === 'won' ? '<span style="color:var(--text-muted)">Tipster : ' + formatEuros(net) + '</span>' : '') +
        '</div>' +
      '</div>'
    );
    return (
      '<div style="display:grid;grid-template-columns:2.5fr 0.8fr 0.8fr 1fr 1fr 1fr;gap:8px;align-items:center;padding:10px 14px;border-bottom:1px solid var(--border)">' +
        '<div>' +
          '<div style="font-weight:600;font-size:0.88rem;color:var(--text-dark)">' + p.game + '</div>' +
          '<div class="prono-meta">' + (p.sport||'—') + ' · ' + formatDate(p.match_date) + '</div>' +
        '</div>' +
        '<div>' + (statusBadge[p.status] || '—') + '</div>' +
        '<div style="font-size:0.85rem">👥 ' + p.acheteurs + '</div>' +
        '<div style="font-weight:700;color:' + caColor + '">' + formatEuros(p.pronoCA) + '</div>' +
        '<div style="font-weight:700;color:var(--success)">' + (p.status==='won' ? '+'+formatEuros(comm) : '—') + '</div>' +
        '<div style="color:var(--text-muted)">' + (p.status==='won' ? formatEuros(net) : '—') + '</div>' +
      '</div>'
    );
  }).join('');

  const header = mob ? '' : (
    '<div style="display:grid;grid-template-columns:2.5fr 0.8fr 0.8fr 1fr 1fr 1fr;gap:8px;padding:8px 14px;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);border-bottom:2px solid var(--border)">' +
      '<span>Match</span><span>Statut</span><span>Acheteurs</span><span>CA</span><span style="color:var(--success)">Ma comm (10%)</span><span>Net tipster</span>' +
    '</div>'
  );

  modal.innerHTML =
    '<h2 style="margin-bottom:4px">' + name + '</h2>' +
    '<div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:var(--space-lg)">' + sorted.length + ' prono(s) terminé(s)</div>' +
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-sm);margin-bottom:var(--space-lg)">' +
      '<div style="background:var(--bg-soft);border-radius:var(--radius-md);padding:10px 14px">' +
        '<div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:4px">CA Total</div>' +
        '<div style="font-size:1.2rem;font-weight:800;color:var(--text-dark)">' + formatEuros(totalCA) + '</div>' +
      '</div>' +
      '<div style="background:var(--bg-soft);border-radius:var(--radius-md);padding:10px 14px">' +
        '<div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:4px">Ma comm (10%)</div>' +
        '<div style="font-size:1.2rem;font-weight:800;color:var(--success)">' + formatEuros(totalComm) + '</div>' +
      '</div>' +
      '<div style="background:var(--bg-soft);border-radius:var(--radius-md);padding:10px 14px">' +
        '<div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:4px">Net tipster</div>' +
        '<div style="font-size:1.2rem;font-weight:800;color:var(--text-dark)">' + formatEuros(totalTipster) + '</div>' +
      '</div>' +
    '</div>' +
    '<div style="max-height:420px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius-md)">' +
      header + rows +
    '</div>';

  overlay.style.display = 'block';
}

// ══════════════════════════════════════════════════════════════
//  ACHETEURS D'UN PRONO (dans fiche tipster)
// ══════════════════════════════════════════════════════════════
async function togglePronoAcheteurs(pronoId, triggerEl) {
  const container = document.getElementById('acheteurs-' + pronoId);
  if (!container) return;

  // Toggle : si déjà ouvert, refermer
  if (container.style.display === 'block') {
    container.style.display = 'none';
    return;
  }

  // Afficher un loader
  container.style.display = 'block';
  container.innerHTML = '<div style="color:var(--text-muted);font-size:0.78rem;padding:6px 0">⏳ Chargement...</div>';

  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';

  try {
    // Charger les purchases de ce prono
    const rPurch = await fetch(
      `${SUPA}/rest/v1/purchases?select=user_id,amount,status,created_at&prono_id=eq.${pronoId}&order=created_at.desc&apikey=${ANON}`,
      { headers: { apikey: ANON, 'Authorization': 'Bearer ' + ANON } }
    );
    const purchases = await rPurch.json();

    if (!Array.isArray(purchases) || purchases.length === 0) {
      container.innerHTML = '<div style="color:var(--text-muted);font-size:0.78rem;padding:6px 0">Aucun acheteur.</div>';
      return;
    }

    // Charger les profils des acheteurs
    const userIds = [...new Set(purchases.map(p => p.user_id).filter(Boolean))];
    const rProf = await fetch(
      `${SUPA}/rest/v1/profiles?select=id,first_name,last_name&id=in.(${userIds.join(',')})&apikey=${ANON}`,
      { headers: { apikey: ANON, 'Authorization': 'Bearer ' + ANON } }
    );
    const profiles = await rProf.json();
    const profMap = {};
    (profiles || []).forEach(p => profMap[p.id] = p.first_name + ' ' + p.last_name);

    const statusIcon = { won: '✓', lost: '✕', cancelled: '⊘', pending: '⏳' };
    const statusColor = { won: 'var(--success)', lost: 'var(--error)', cancelled: 'var(--text-muted)', pending: 'var(--warning)' };

    container.innerHTML =
      '<div style="border-top:1px solid var(--border);padding-top:8px;margin-top:4px">' +
        '<div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:6px">Acheteurs</div>' +
        '<div style="display:flex;flex-direction:column;gap:4px">' +
          purchases.map(p => {
            const nom = profMap[p.user_id] || p.user_id?.slice(0,8) + '…';
            const date = new Date(p.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'2-digit' });
            const icon = statusIcon[p.status] || '?';
            const col  = statusColor[p.status] || 'var(--text-muted)';
            return '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:var(--bg);border-radius:var(--radius-sm);font-size:0.8rem">' +
              '<span style="font-weight:600;color:var(--text-dark)">' + nom + '</span>' +
              '<span style="display:flex;gap:10px;align-items:center">' +
                '<span style="color:var(--text-muted)">' + date + '</span>' +
                '<span style="font-weight:700">' + formatEuros(parseFloat(p.amount||0)) + '</span>' +
                '<span style="font-weight:700;color:' + col + '">' + icon + '</span>' +
              '</span>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';
  } catch(e) {
    container.innerHTML = '<div style="color:var(--error);font-size:0.78rem">Erreur de chargement.</div>';
  }
}

function toggleScoreInfo() {
  const box = document.getElementById('score-info-box');
  if (box) box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

// ══════════════════════════════════════════════════════════════
//  PAGE — VALIDATION DES IMAGES
// ══════════════════════════════════════════════════════════════
async function renderPageImages(container) {
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';

  container.innerHTML = '<div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">⏳ Chargement...</div>';

  try {
    // Charger tous les pronos avec une image
    const r = await fetch(`${SUPA}/rest/v1/pronos?select=id,game,sport,match_date,tipster_id,image_url,image_status&image_status=neq.none&image_url=not.is.null&order=created_at.desc&apikey=${ANON}`, {
      headers: { apikey: ANON, 'Authorization': 'Bearer ' + ANON }
    });
    const pronos = await r.json();

    // Charger les noms des tipsters
    const tipsterIds = [...new Set((pronos||[]).map(p => p.tipster_id).filter(Boolean))];
    let profilesMap = {};
    if (tipsterIds.length > 0) {
      const rP = await fetch(`${SUPA}/rest/v1/profiles?select=id,first_name,last_name,pseudo&id=in.(${tipsterIds.join(',')})&apikey=${ANON}`, {
        headers: { apikey: ANON, 'Authorization': 'Bearer ' + ANON }
      });
      const profiles = await rP.json();
      (profiles||[]).forEach(p => profilesMap[p.id] = p.pseudo || (p.first_name + ' ' + p.last_name));
    }

    const pending   = (pronos||[]).filter(p => p.image_status === 'pending');
    const approved  = (pronos||[]).filter(p => p.image_status === 'approved');
    const rejected  = (pronos||[]).filter(p => p.image_status === 'rejected');
    const mob = isMobile();

    function imageCard(p, showActions) {
      const tipster = profilesMap[p.tipster_id] || '—';
      const statusBadge = p.image_status === 'pending'
        ? '<span class="badge badge-pending">⏳ En attente</span>'
        : p.image_status === 'approved'
          ? '<span class="badge badge-won">✓ Approuvée</span>'
          : '<span class="badge badge-lost">🚫 Refusée</span>';
      return `
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);padding:var(--space-md);display:flex;flex-direction:${mob?'column':'row'};gap:var(--space-md);align-items:${mob?'stretch':'flex-start'}">
          <img src="${p.image_url}" style="width:${mob?'100%':'180px'};height:${mob?'160px':'120px'};object-fit:cover;border-radius:var(--radius-md);flex-shrink:0;cursor:pointer" onclick="window.open('${p.image_url}','_blank')" title="Voir en grand" />
          <div style="flex:1;min-width:0">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px">
              <div>
                <div class="prono-title">${p.game}</div>
                <div class="prono-meta">${p.sport||'—'} · ${formatDate(p.match_date)} · par ${tipster}</div>
              </div>
              ${statusBadge}
            </div>
            ${showActions ? `
              <div style="display:flex;gap:8px;margin-top:var(--space-sm)">
                <button class="btn btn-primary btn--sm" onclick="validateImage('${p.id}','approved')">✓ Approuver</button>
                <button class="btn btn-outline btn--sm" style="color:var(--error);border-color:var(--error)" onclick="validateImage('${p.id}','rejected')">🚫 Refuser</button>
              </div>` : ''}
          </div>
        </div>`;
    }

    container.innerHTML = `
      <div class="section-header">
        <div><h2>Validation des images</h2><p>${pending.length} en attente · ${approved.length} approuvées · ${rejected.length} refusées</p></div>
      </div>

      ${pending.length > 0 ? `
        <div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--warning);margin-bottom:var(--space-sm)">⏳ En attente (${pending.length})</div>
        <div style="display:flex;flex-direction:column;gap:var(--space-md);margin-bottom:var(--space-xl)">
          ${pending.map(p => imageCard(p, true)).join('')}
        </div>` : `
        <div style="text-align:center;padding:var(--space-xl);color:var(--text-muted);margin-bottom:var(--space-xl)">✅ Aucune image en attente.</div>`}

      ${approved.length > 0 ? `
        <div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--success);margin-bottom:var(--space-sm)">✓ Approuvées (${approved.length})</div>
        <div style="display:flex;flex-direction:column;gap:var(--space-md);margin-bottom:var(--space-xl)">
          ${approved.map(p => imageCard(p, false)).join('')}
        </div>` : ''}

      ${rejected.length > 0 ? `
        <div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--error);margin-bottom:var(--space-sm)">🚫 Refusées (${rejected.length})</div>
        <div style="display:flex;flex-direction:column;gap:var(--space-md)">
          ${rejected.map(p => imageCard(p, false)).join('')}
        </div>` : ''}
    `;
  } catch(e) {
    container.innerHTML = `<div style="text-align:center;padding:var(--space-2xl);color:var(--error)">Erreur : ${e.message}</div>`;
  }
}

async function validateImage(pronoId, status) {
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  try {
    const r = await fetch(`https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/pronos?id=eq.${pronoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', apikey: ANON, 'Authorization': 'Bearer ' + ANON },
      body: JSON.stringify({ image_status: status })
    });
    if (!r.ok) throw new Error('Erreur serveur');
    showToast(status === 'approved' ? 'Image approuvée ✓' : 'Image refusée', status === 'approved' ? 'success' : 'info');
    renderPageImages(document.getElementById('page-content'));
    renderSidebar();
  } catch(e) {
    showToast('Erreur : ' + e.message, 'error');
  }
}

// ══════════════════════════════════════════════════════════════
//  PAGE — SONDAGES (ADMIN)
// ══════════════════════════════════════════════════════════════
async function renderPageSondage(container) {
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';
  container.innerHTML = '<div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">⏳ Chargement...</div>';

  async function loadAndRender() {
    const rP = await fetch(`${SUPA}/rest/v1/polls?select=id,question,actif,created_at&order=created_at.desc&apikey=${ANON}`, { headers: { apikey: ANON } });
    const polls = await rP.json();

    // Charger options et votes pour chaque sondage
    const pollsWithData = await Promise.all((polls||[]).map(async poll => {
      const [rO, rV] = await Promise.all([
        fetch(`${SUPA}/rest/v1/poll_options?poll_id=eq.${poll.id}&select=id,label,votes&order=votes.desc&apikey=${ANON}`, { headers: { apikey: ANON } }),
        fetch(`${SUPA}/rest/v1/poll_votes?poll_id=eq.${poll.id}&select=id&apikey=${ANON}`, { headers: { apikey: ANON } }),
      ]);
      const options = await rO.json();
      const votes   = await rV.json();
      return { ...poll, options: options||[], totalVotes: (votes||[]).length };
    }));

    const mob = isMobile();

    function pollCard(poll) {
      const total = poll.totalVotes;
      const optionsHtml = (poll.options||[]).map(o => {
        const pct = total > 0 ? Math.round((o.votes||0) / total * 100) : 0;
        return `<div style="margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;font-size:0.82rem;color:var(--text-dark);margin-bottom:4px">
            <span>${o.label}</span>
            <span style="font-weight:600;color:var(--primary)">${pct}% (${o.votes||0} votes)</span>
          </div>
          <div style="background:var(--bg-soft);border-radius:10px;height:6px;overflow:hidden">
            <div style="width:${pct}%;height:100%;background:var(--primary);border-radius:10px"></div>
          </div>
        </div>`;
      }).join('');

      return `<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);padding:var(--space-md);margin-bottom:var(--space-md)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:var(--space-sm)">
          <div>
            <div style="font-size:0.95rem;font-weight:700;color:var(--text-dark)">${poll.question}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">${total} réponse(s) · Créé le ${formatDate(poll.created_at)}</div>
          </div>
          <div style="display:flex;gap:6px;flex-shrink:0;align-items:center">
            <span style="background:${poll.actif?'var(--success-pale)':'var(--bg-soft)'};color:${poll.actif?'var(--success)':'var(--text-muted)'};font-size:0.72rem;font-weight:600;padding:3px 8px;border-radius:10px">${poll.actif?'✓ Actif':'Inactif'}</span>
            <button onclick="togglePoll('${poll.id}',${poll.actif})" class="btn btn-outline btn--sm">${poll.actif?'Désactiver':'Activer'}</button>
            <button onclick="deletePoll('${poll.id}')" class="btn-icon danger" title="Supprimer">🗑</button>
          </div>
        </div>
        ${optionsHtml}
      </div>`;
    }

    container.innerHTML = `
      <div class="section-header">
        <div><h2>Sondages</h2><p>${(polls||[]).length} sondage(s) au total</p></div>
        <button class="btn btn-primary" onclick="openNewPollModal()">+ Nouveau sondage</button>
      </div>

      <div id="poll-modal-container"></div>

      ${(polls||[]).length === 0
        ? '<div class="empty-state"><div class="empty-state__icon">📊</div><h3>Aucun sondage</h3><p>Créez votre premier sondage !</p></div>'
        : (pollsWithData||[]).map(p => pollCard(p)).join('')
      }
    `;
  }

  await loadAndRender();

  window.openNewPollModal = function() {
    const mc = document.getElementById('poll-modal-container');
    if (!mc) return;
    mc.innerHTML = `
      <div style="background:var(--bg-soft);border:1px solid var(--border);border-radius:var(--radius-lg);padding:var(--space-md);margin-bottom:var(--space-md)">
        <h3 style="margin-bottom:var(--space-md)">Nouveau sondage</h3>
        <div class="form-group">
          <label>Question</label>
          <input class="input" id="poll-question" type="text" placeholder="Ex: Quel sport préférez-vous ?" />
        </div>
        <div class="form-group">
          <label>Options (une par ligne, minimum 2)</label>
          <textarea class="input input-textarea" id="poll-options-text" rows="4" placeholder="Foot&#10;Tennis&#10;Basket&#10;Rugby"></textarea>
        </div>
        <div style="display:flex;gap:var(--space-sm);justify-content:flex-end;margin-top:var(--space-md)">
          <button class="btn btn-outline" onclick="document.getElementById('poll-modal-container').innerHTML=''">Annuler</button>
          <button class="btn btn-primary" onclick="submitNewPoll()">Créer le sondage</button>
        </div>
      </div>`;
    document.getElementById('poll-question').focus();
  };

  window.submitNewPoll = async function() {
    const q = document.getElementById('poll-question')?.value.trim();
    const opts = (document.getElementById('poll-options-text')?.value || '').split('\n').map(o => o.trim()).filter(Boolean);
    if (!q) { showToast('Veuillez saisir une question.', 'error'); return; }
    if (opts.length < 2) { showToast('Minimum 2 options.', 'error'); return; }
    try {
      const rPoll = await fetch(`${SUPA}/rest/v1/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: ANON, 'Authorization': 'Bearer ' + ANON, 'Prefer': 'return=representation' },
        body: JSON.stringify({ question: q, actif: false })
      });
      const pollData = await rPoll.json();
      const pollId = Array.isArray(pollData) ? pollData[0]?.id : pollData?.id;
      if (!pollId) throw new Error('Erreur création sondage');
      for (const label of opts) {
        await fetch(`${SUPA}/rest/v1/poll_options`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: ANON, 'Authorization': 'Bearer ' + ANON, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ poll_id: pollId, label, votes: 0 })
        });
      }
      showToast('Sondage créé ! Activez-le pour le rendre visible.', 'success');
      await loadAndRender();
    } catch(e) { showToast('Erreur : ' + e.message, 'error'); }
  };

  window.togglePoll = async function(pollId, currentActif) {
    // Désactiver tous les autres d'abord si on active
    if (!currentActif) {
      await fetch(`${SUPA}/rest/v1/polls?actif=eq.true`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', apikey: ANON, 'Authorization': 'Bearer ' + ANON },
        body: JSON.stringify({ actif: false })
      });
    }
    await fetch(`${SUPA}/rest/v1/polls?id=eq.${pollId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', apikey: ANON, 'Authorization': 'Bearer ' + ANON },
      body: JSON.stringify({ actif: !currentActif })
    });
    showToast(!currentActif ? 'Sondage activé ✓' : 'Sondage désactivé', 'info');
    await loadAndRender();
  };

  window.deletePoll = async function(pollId) {
    if (!confirm('Supprimer ce sondage et tous ses votes ?')) return;
    await fetch(`${SUPA}/rest/v1/polls?id=eq.${pollId}`, {
      method: 'DELETE',
      headers: { apikey: ANON, 'Authorization': 'Bearer ' + ANON }
    });
    showToast('Sondage supprimé.', 'info');
    await loadAndRender();
  };
}

// ══════════════════════════════════════════════════════════════
//  PAGE — PARAMÈTRES DASHBOARD (ADMIN)
// ══════════════════════════════════════════════════════════════
async function renderPageDashSettings(container) {
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';
  container.innerHTML = '<div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">⏳ Chargement...</div>';

  // Ordre fixe correspondant à l'affichage du dashboard user
  const ORDER = ['bloc_featured','bloc_twitter','bloc_meilleur_tipster','bloc_objectif','bloc_alerte','bloc_stats_plate','bloc_sponsor_rising','bloc_sondage'];

  async function loadAndRender() {
    const r = await fetch(`${SUPA}/rest/v1/dashboard_settings?select=id,key,label,actif&apikey=${ANON}`, { headers: { apikey: ANON } });
    const raw = await r.json();
    // Trier selon l'ordre fixe
    const settings = ORDER.map(k => (raw||[]).find(s => s.key === k)).filter(Boolean);
    // Ajouter les clés non listées à la fin
    (raw||[]).forEach(s => { if (!ORDER.includes(s.key)) settings.push(s); });

    container.innerHTML = `
      <div class="section-header">
        <div><h2>Paramètres du dashboard</h2><p>Choisissez les blocs visibles par les utilisateurs</p></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;max-width:560px">
        ${settings.map(s => `
          <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px">
            <div style="min-width:0;flex:1">
              <div style="font-size:0.9rem;font-weight:600;color:var(--text-dark)">${s.label || s.key}</div>
            </div>
            <div onclick="toggleDashSetting('${s.id}', ${s.actif})" style="width:52px;height:28px;border-radius:14px;background:${s.actif?'#22c55e':'#d1d5db'};position:relative;cursor:pointer;transition:background .25s;flex-shrink:0">
              <div style="position:absolute;top:3px;left:${s.actif?'27px':'3px'};width:22px;height:22px;border-radius:50%;background:white;transition:left .25s;box-shadow:0 1px 3px rgba(0,0,0,.2)"></div>
              <span style="position:absolute;top:50%;transform:translateY(-50%);${s.actif?'left:7px':'right:7px'};font-size:0.55rem;font-weight:700;color:white;letter-spacing:.03em">${s.actif?'ON':'OFF'}</span>
            </div>
          </div>`).join('')}
      </div>`;
  }

  await loadAndRender();

  window.toggleDashSetting = async function(settingId, currentActif) {
    try {
      const { data: { session } } = await sb.auth.getSession();
      const token = session?.access_token || ANON;
      const r = await fetch(`${SUPA}/rest/v1/dashboard_settings?id=eq.${settingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', apikey: ANON, 'Authorization': 'Bearer ' + token, 'Prefer': 'return=representation' },
        body: JSON.stringify({ actif: !currentActif })
      });
      const result = await r.json();
      console.log('PATCH result:', r.status, result);
      if (r.ok) {
        showToast(!currentActif ? 'Bloc activé ✓' : 'Bloc masqué', 'info');
        await loadAndRender();
      } else {
        showToast('Erreur : ' + JSON.stringify(result), 'error');
      }
    } catch(e) {
      showToast('Erreur : ' + e.message, 'error');
      console.error(e);
    }
  };
}


// ══════════════════════════════════════════════════════════════
//  PAGE — GESTION DES SPONSORS (ADMIN)
// ══════════════════════════════════════════════════════════════
async function renderPageSponsors(container) {
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';
  container.innerHTML = '<div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">⏳ Chargement...</div>';

  async function loadAndRender() {
    const [rTip, rSp] = await Promise.all([
      fetch(`${SUPA}/rest/v1/profiles?role=eq.tipster&select=id,pseudo,first_name,last_name,avatar_url&order=pseudo.asc&apikey=${ANON}`, { headers: { apikey: ANON } }),
      fetch(`${SUPA}/rest/v1/sponsors?select=id,slot,tipster_id,description,image_url,actif,clicks&apikey=${ANON}`, { headers: { apikey: ANON } }),
    ]);
    const tipsters = await rTip.json();
    const sponsors = await rSp.json();

    const featured = (sponsors||[]).find(s => s.slot === 'featured');
    const rising   = (sponsors||[]).find(s => s.slot === 'rising');

    function tipsterOptions(selectedId) {
      return '<option value="">-- Aucun --</option>' +
        (tipsters||[]).map(t => {
          const name = t.pseudo || (t.first_name + ' ' + t.last_name);
          return `<option value="${t.id}" ${t.id === selectedId ? 'selected' : ''}>${name}</option>`;
        }).join('');
    }

    function sponsorCard(slot, label, sponsor) {
      const tip = (tipsters||[]).find(t => t.id === sponsor?.tipster_id);
      const tipName = tip ? (tip.pseudo || tip.first_name) : '—';
      const isActif = sponsor?.actif || false;
      return `
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);padding:var(--space-md);margin-bottom:var(--space-md)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md)">
            <h3 style="font-size:1rem;font-weight:700;color:var(--text-dark)">${label}</h3>
            ${sponsor
              ? `<span style="background:${isActif?'var(--success-pale)':'var(--bg-soft)'};color:${isActif?'var(--success)':'var(--text-muted)'};font-size:0.75rem;font-weight:600;padding:3px 10px;border-radius:10px">${isActif?'✓ Actif':'Inactif'}</span>`
              : '<span style="font-size:0.78rem;color:var(--text-muted)">Aucun tipster configuré</span>'}
          </div>
          ${sponsor ? `<div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:var(--space-md)">Tipster actuel : <strong style="color:var(--text-dark)">${tipName}</strong> · ${sponsor.clicks||0} clic(s)</div>` : ''}
          <div class="form-group" style="margin-bottom:10px">
            <label style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:4px">Tipster</label>
            <select class="input" id="select-${slot}" style="width:100%">
              ${tipsterOptions(sponsor?.tipster_id)}
            </select>
          </div>
          <div class="form-group" style="margin-bottom:10px">
            <label style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:4px">Description courte</label>
            <textarea class="input" id="desc-${slot}" rows="2" placeholder="Ex: Spécialiste Ligue 1 & Champions League" style="width:100%;resize:vertical">${sponsor?.description||''}</textarea>
          </div>
          <div style="display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap;margin-top:var(--space-sm)">
            ${sponsor
              ? `<button class="btn btn-outline" onclick="activerSponsor('${sponsor.id}',${isActif})" style="font-size:0.78rem;padding:5px 12px">${isActif?'Désactiver':'Activer'}</button>
                 <button class="btn btn-outline" style="color:var(--error);border-color:var(--error);font-size:0.78rem;padding:5px 12px" onclick="terminerSponsor('${sponsor.id}','${slot}')">Terminé</button>`
              : ''}
            <button class="btn btn-primary" onclick="saveSponsor('${slot}','${sponsor?.id||''}')" style="font-size:0.78rem;padding:5px 12px">${sponsor ? 'Mettre à jour' : 'Configurer'}</button>
          </div>
        </div>`;
    }

    // Charger historique
    const rH = await fetch(`${SUPA}/rest/v1/sponsors_history?select=slot,tipster_id,description,clicks,actif_from&order=actif_from.desc&apikey=${ANON}`, { headers: { apikey: ANON } });
    const history = await rH.json();
    // Enrichir avec noms tipsters
    const allTipIds = [...new Set((history||[]).map(h => h.tipster_id).filter(Boolean))];
    const tipMap = {};
    if (allTipIds.length > 0) {
      const rTN = await fetch(`${SUPA}/rest/v1/profiles?id=in.(${allTipIds.join(',')})&select=id,pseudo,first_name&apikey=${ANON}`, { headers: { apikey: ANON } });
      const tns = await rTN.json();
      (tns||[]).forEach(t => tipMap[t.id] = t.pseudo || t.first_name || '—');
    }
    const historyHtml = (history||[]).length === 0 ? '<p style="color:var(--text-muted);font-size:0.85rem">Aucun historique.</p>' :
      (history||[]).map(h => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:0.5px solid var(--border)">
          <div>
            <span style="font-size:0.75rem;background:${h.slot==='featured'?'#FAEEDA':'#E1F5EE'};color:${h.slot==='featured'?'#633806':'#085041'};padding:2px 7px;border-radius:10px;font-weight:600">${h.slot==='featured'?'À la une':'En progression'}</span>
            <div style="font-size:0.88rem;font-weight:600;color:var(--text-dark);margin-top:4px">${tipMap[h.tipster_id]||'—'}</div>
            ${h.description ? `<div style="font-size:0.75rem;color:var(--text-muted)">${h.description}</div>` : ''}
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:0.82rem;font-weight:600;color:var(--primary)">${h.clicks||0} clic(s)</div>
            <div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px">${formatDate(h.actif_from)}</div>
          </div>
        </div>`).join('');

    container.innerHTML = `
      <div class="section-header">
        <div><h2>Gestion des sponsors</h2><p>Configurez les tipsters mis en avant sur le dashboard</p></div>
      </div>
      ${sponsorCard('featured', '⭐ Tipster à la une', featured)}
      ${sponsorCard('rising', '🚀 Tipster en progression', rising)}
      <div style="margin-top:var(--space-lg)">
        <h3 style="font-size:0.95rem;font-weight:700;color:var(--text-dark);margin-bottom:var(--space-md)">Historique</h3>
        ${historyHtml}
      </div>
    `;
  }

  await loadAndRender();

  window.saveSponsor = async function(slot, existingId) {
    const tipsterId = document.getElementById('select-' + slot)?.value;
    const description = document.getElementById('desc-' + slot)?.value || '';
    if (!tipsterId) { showToast('Veuillez sélectionner un tipster.', 'error'); return; }
    const sess = await sb.auth.getSession();
    const token = sess.data?.session?.access_token || ANON;
    if (existingId) {
      // Récupérer l'ancien tipster + clics pour historique
      const rOld = await fetch(`${SUPA}/rest/v1/sponsors?id=eq.${existingId}&select=tipster_id,clicks,description&apikey=${ANON}`, { headers: { apikey: ANON } });
      const oldData = await rOld.json();
      const old = Array.isArray(oldData) && oldData.length > 0 ? oldData[0] : null;
      // Sauvegarder dans l'historique si changement de tipster
      if (old && old.tipster_id && old.tipster_id !== tipsterId) {
        await fetch(`${SUPA}/rest/v1/sponsors_history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: ANON, 'Authorization': 'Bearer ' + token, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ slot, tipster_id: old.tipster_id, description: old.description, clicks: old.clicks || 0 })
        });
      }
      // Mettre à jour avec reset clics si nouveau tipster
      const resetClicks = old && old.tipster_id !== tipsterId;
      await fetch(`${SUPA}/rest/v1/sponsors?id=eq.${existingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', apikey: ANON, 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ tipster_id: tipsterId, description, slot, ...(resetClicks ? { clicks: 0 } : {}) })
      });
    } else {
      await fetch(`${SUPA}/rest/v1/sponsors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: ANON, 'Authorization': 'Bearer ' + token, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ tipster_id: tipsterId, description, slot, actif: true, clicks: 0 })
      });
    }
    showToast('Sponsor enregistré ✓', 'success');
    await loadAndRender();
  };

  window.activerSponsor = async function(sponsorId, currentActif) {
    const sess = await sb.auth.getSession();
    const token = sess.data?.session?.access_token || ANON;
    await fetch(`${SUPA}/rest/v1/sponsors?id=eq.${sponsorId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', apikey: ANON, 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ actif: !currentActif })
    });
    showToast(!currentActif ? 'Sponsor activé ✓' : 'Sponsor désactivé', 'info');
    await loadAndRender();
  };

  window.terminerSponsor = async function(sponsorId, slot) {
    if (!confirm("Archiver ce sponsor dans l'historique et vider le slot ?")) return;
    const sess = await sb.auth.getSession();
    const token = sess.data?.session?.access_token || ANON;
    // Récupérer les infos actuelles
    const rOld = await fetch(`${SUPA}/rest/v1/sponsors?id=eq.${sponsorId}&select=tipster_id,clicks,description&apikey=${ANON}`, { headers: { apikey: ANON } });
    const oldData = await rOld.json();
    const old = Array.isArray(oldData) && oldData.length > 0 ? oldData[0] : null;
    // Sauvegarder dans l'historique
    if (old) {
      await fetch(`${SUPA}/rest/v1/sponsors_history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: ANON, 'Authorization': 'Bearer ' + token, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ slot, tipster_id: old.tipster_id, description: old.description, clicks: old.clicks || 0 })
      });
    }
    // Supprimer le sponsor actuel
    await fetch(`${SUPA}/rest/v1/sponsors?id=eq.${sponsorId}`, {
      method: 'DELETE',
      headers: { apikey: ANON, 'Authorization': 'Bearer ' + token }
    });
    showToast("Tipster archivé dans l'historique ✓", 'success');
    await loadAndRender();
  };

  window.deleteSponsor = async function(sponsorId) {
    if (!confirm('Supprimer ce sponsor ?')) return;
    const sess = await sb.auth.getSession();
    const token = sess.data?.session?.access_token || ANON;
    await fetch(`${SUPA}/rest/v1/sponsors?id=eq.${sponsorId}`, {
      method: 'DELETE',
      headers: { apikey: ANON, 'Authorization': 'Bearer ' + token }
    });
    showToast('Sponsor supprimé.', 'info');
    await loadAndRender();
  };
}
