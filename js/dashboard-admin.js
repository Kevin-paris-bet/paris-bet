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
// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuth(['admin']);
  if (!user) return;

  // Charger les vrais pronos via fetch direct
  try {
    const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
    const urlP = new URL('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/pronos');
    urlP.searchParams.set('select', 'id,game,sport,match_date,content,price,status,buyers,tipster_id,created_at');
    urlP.searchParams.set('order', 'created_at.desc');
    urlP.searchParams.set('apikey', ANON);
    const rp = await fetch(urlP.toString());
    const pronos = await rp.json();

    // Charger les profils pour les noms tipsters
    const urlPr = new URL('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/profiles');
    urlPr.searchParams.set('select', 'id,first_name,last_name');
    urlPr.searchParams.set('apikey', ANON);
    const rpr = await fetch(urlPr.toString());
    const profilesList = await rpr.json();
    const profilesMap = {};
    if (Array.isArray(profilesList)) profilesList.forEach(p => profilesMap[p.id] = p.first_name + ' ' + p.last_name);

    if (Array.isArray(pronos) && pronos.length > 0) {
      adminState.pronos = pronos.map(p => ({
        ...p,
        tipsterName: profilesMap[p.tipster_id] || 'Inconnu',
        revenue:     (p.buyers || 0) * (p.price || 0),
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
    adminState.tipsters = tipsters.map(t => ({
      ...t,
      name:     t.first_name + ' ' + t.last_name,
      email:    t.email || '—',
      pronos:   0,
      winRate:  0,
      balance:  parseFloat(t.balance) || 0,
      ribSaved: !!(t.rib_iban),
      suspended: false,
    }));
  } else {
    adminState.tipsters = [];
  }

  // Charger les vrais utilisateurs
  const { data: users } = await sb
    .from('profiles_with_email')
    .select('*')
    .eq('role', 'user')
    .order('created_at', { ascending: false });

  if (users && users.length > 0) {
    adminState.users = users.map(u => ({
      ...u,
      name:    u.first_name + ' ' + u.last_name,
      email:   u.email || '—',
      balance: parseFloat(u.balance) || 0,
      spent:   0,
    }));
  } else {
    adminState.users = [];
  }

  renderSidebar();
  renderTopbar();
  navigateTo('pronos');
});

// ── Navigation ────────────────────────────────────────────────
function navigateTo(page) {
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
  };
  document.getElementById('topbar-title').textContent = titles[page] || 'Admin';
  const content = document.getElementById('page-content');
  content.innerHTML = '';
  if (page === 'overview')  renderOverview(content);
  if (page === 'pronos')    renderPronos(content);
  if (page === 'tipsters')  renderTipsters(content);
  if (page === 'users')     renderUsers(content);
  if (page === 'virements') renderVirements(content);
}

// ══════════════════════════════════════════════════════════════
//  PAGE — VUE D'ENSEMBLE
// ══════════════════════════════════════════════════════════════
function renderOverview(c) {
  const pendingPronos  = adminState.pronos.filter(p => p.status === 'pending').length;
  const pendingVir     = adminState.virements.filter(v => v.status === 'pending').length;
  const pendingRevenue = adminState.pronos
    .filter(p => p.status === 'pending')
    .reduce((s, p) => s + p.revenue, 0);
  const commission     = adminState.pronos
    .filter(p => p.status === 'won')
    .reduce((s, p) => s + p.revenue * CONFIG.finance.commissionRate, 0);

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

    <!-- Actions rapides -->
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
              ${adminState.virements.filter(v=>v.status==='pending').map(v=>`${v.tipster} — ${formatEuros(v.amount)}`).join(' · ')}
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

    <!-- Derniers pronos -->
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
  document.querySelectorAll('.achats-filters .filter-btn').forEach(b =>
    b.classList.toggle('active', b.dataset && b.textContent.includes(f) || b.onclick?.toString().includes(`'${f}'`))
  );
  // Re-render propre
  navigateTo('pronos');
}

function getFilteredPronos() {
  if (adminState.pronosFilter === 'all') return adminState.pronos;
  return adminState.pronos.filter(p => p.status === adminState.pronosFilter);
}

function renderPronosTable(pronos, compact) {
  if (!pronos.length) return `<div class="empty-state"><div class="empty-state__icon">✅</div><h3>Aucun pronostic ici</h3><p>Essayez un autre filtre.</p></div>`;

  const statusBadge = {
    pending:   `<span class="badge badge-pending">⏳ En attente</span>`,
    won:       `<span class="badge badge-won">✓ Gagné</span>`,
    lost:      `<span class="badge badge-lost">✕ Perdu</span>`,
    cancelled: `<span class="badge badge-cancelled">⊘ Annulé</span>`,
  };

  return `
    <div class="pronos-table">
      <div class="table-header" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr ${compact?'0':'140px'}">
        <span>Match</span><span>Tipster</span><span>Acheteurs</span><span>Montant</span><span>Statut</span>
        ${compact ? '' : '<span>Action</span>'}
      </div>
      ${pronos.map(p => `
        <div class="table-row" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr ${compact?'0':'140px'}">
          <div>
            <div class="prono-title">${p.game}</div>
            <div class="prono-meta">${p.sport} · ${p.match_date || p.date || "—"}</div>
          </div>
          <div style="font-size:0.85rem;color:var(--text-muted)">${p.tipsterName || "—"}</div>
          <div class="buyers-count"><span>👥</span>${p.buyers}</div>
          <div class="prono-price">${formatEuros(p.revenue)}</div>
          <div>${statusBadge[p.status]||''}</div>
          ${compact ? '' : `
            <div>
              ${p.status === 'pending' ? `
                <div style="display:flex;gap:4px;flex-wrap:wrap">
                  <button class="btn-validate btn-validate--won"   onclick="validateProno(${p.id},'won')">✓ Gagné</button>
                  <button class="btn-validate btn-validate--lost"  onclick="validateProno(${p.id},'lost')">✕ Perdu</button>
                  <button class="btn-validate btn-validate--cancel" onclick="validateProno(${p.id},'cancelled')">⊘</button>
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
    // Mettre à jour le statut du prono dans Supabase
    const { error } = await sb
      .from('pronos')
      .update({ status })
      .eq('id', id);

    if (error) throw error;

    // Récupérer tous les achats de ce prono
    const { data: purchases } = await sb
      .from('purchases')
      .select('*')
      .eq('prono_id', p.id)
      .eq('status', 'pending');

    if (purchases && purchases.length > 0) {
      if (status === 'won') {
        // Créditer le tipster à 90% du total
        const totalRevenue = purchases.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0);
        const tipsterShare = totalRevenue * 0.9;
        await sb.from('profiles').update({ balance: sb.rpc('increment_balance', { user_id: p.tipster_id, amount: tipsterShare }) });
        // Mettre à jour les achats en "won"
        await sb.from('purchases').update({ status: 'won' }).eq('prono_id', p.id);
        // Créditer directement le solde du tipster
        const { data: tipsterProfile } = await sb.from('profiles').select('balance').eq('id', p.tipster_id).single();
        if (tipsterProfile) {
          await sb.from('profiles').update({ balance: parseFloat(tipsterProfile.balance || 0) + tipsterShare }).eq('id', p.tipster_id);
        }
      } else {
        // Rembourser chaque acheteur
        for (const achat of purchases) {
          const { data: userProfile } = await sb.from('profiles').select('balance').eq('id', achat.user_id).single();
          if (userProfile) {
            await sb.from('profiles').update({ balance: parseFloat(userProfile.balance || 0) + parseFloat(achat.amount || 0) }).eq('id', achat.user_id);
          }
        }
        // Mettre à jour les achats
        await sb.from('purchases').update({ status }).eq('prono_id', p.id);
      }
    }

    // Mettre à jour localement
    p.status = status;
    navigateTo('pronos');
    const toastType = status === 'won' ? 'success' : 'info';
    showToast(`Pronostic "${p.game}" validé comme ${labels[status]}`, toastType);
  } catch (err) {
    showToast('Erreur : ' + err.message, 'error');
  }
}

// ══════════════════════════════════════════════════════════════
//  PAGE — GESTION DES TIPSTERS
// ══════════════════════════════════════════════════════════════
function renderTipsters(c) {
  c.innerHTML = `
    <div class="section-header">
      <div><h2>Tipsters</h2><p>${adminState.tipsters.length} tipster(s) inscrits</p></div>
    </div>

    <div class="pronos-table">
      <div class="table-header" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr 120px">
        <span>Tipster</span><span>Pronos</span><span>Win Rate</span><span>Solde</span><span>RIB</span><span>Actions</span>
      </div>
      ${adminState.tipsters.map(t => `
        <div class="table-row" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr 120px;${t.suspended?'opacity:0.55':''}">
          <div>
            <div class="prono-title">${t.name}</div>
            <div class="prono-meta">${t.email}</div>
            ${t.suspended ? `<div style="font-size:0.7rem;color:var(--error);font-weight:600">⛔ Suspendu</div>` : ''}
          </div>
          <div style="font-weight:600">${t.pronos}</div>
          <div style="font-weight:700;color:${t.winRate>=60?'var(--success)':'var(--warning)'}">${t.winRate}%</div>
          <div class="prono-price">${formatEuros(t.balance)}</div>
          <div>
            ${t.ribSaved
              ? `<span class="badge badge-won" style="font-size:0.7rem">✓ Enregistré</span>`
              : `<span class="badge badge-lost" style="font-size:0.7rem">✕ Manquant</span>`}
          </div>
          <div class="table-actions">
            <button class="btn-icon ${t.suspended?'':'danger'}" title="${t.suspended?'Réactiver':'Suspendre'}"
              onclick="toggleSuspend(${t.id})">
              ${t.suspended ? '✓' : '⛔'}
            </button>
          </div>
        </div>`).join('')}
    </div>
  `;
}

function toggleSuspend(id) {
  const t = adminState.tipsters.find(t => t.id === id);
  if (!t) return;
  const action = t.suspended ? 'réactiver' : 'suspendre';
  if (!confirm(`Voulez-vous ${action} le compte de ${t.name} ?`)) return;
  // TODO (Supabase) : mettre à jour le statut du tipster
  t.suspended = !t.suspended;
  navigateTo('tipsters');
  showToast(`${t.name} : compte ${t.suspended ? 'suspendu' : 'réactivé'}`, t.suspended ? 'error' : 'success');
}

// ══════════════════════════════════════════════════════════════
//  PAGE — GESTION DES UTILISATEURS
// ══════════════════════════════════════════════════════════════
function renderUsers(c) {
  const totalBalance = adminState.users.reduce((s,u) => s + u.balance + u.pending, 0);

  c.innerHTML = `
    <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:var(--space-xl)">
      <div class="stat-card">
        <div class="stat-card__label">👤 Utilisateurs</div>
        <div class="stat-card__value">${adminState.users.length}</div>
        <div class="stat-card__sub">inscrits</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">💰 Soldes cumulés</div>
        <div class="stat-card__value">${formatEuros(totalBalance)}</div>
        <div class="stat-card__sub">dépôts + attentes</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">⏳ En attente</div>
        <div class="stat-card__value">${formatEuros(adminState.users.reduce((s,u)=>s+(parseFloat(u.pending)||0),0))}</div>
        <div class="stat-card__sub">pronos non validés</div>
      </div>
    </div>

    <div class="pronos-table">
      <div class="table-header" style="grid-template-columns:2fr 1fr 1fr 1fr">
        <span>Utilisateur</span><span>Solde dispo</span><span>En attente</span><span>Inscrit</span>
      </div>
      ${adminState.users.map(u => `
        <div class="table-row" style="grid-template-columns:2fr 1fr 1fr 1fr">
          <div>
            <div class="prono-title">${u.name}</div>
            <div class="prono-meta">${u.email}</div>
          </div>
          <div style="font-weight:700;color:var(--blue)">${formatEuros(u.balance)}</div>
          <div style="font-weight:600;color:var(--warning)">${u.pending > 0 ? formatEuros(u.pending) : '—'}</div>
          <div style="font-size:0.8rem;color:var(--text-muted)">${u.joined}</div>
        </div>`).join('')}
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════
//  PAGE — VIREMENTS
// ══════════════════════════════════════════════════════════════
function renderVirements(c) {
  const pending = adminState.virements.filter(v => v.status === 'pending');
  const done    = adminState.virements.filter(v => v.status === 'done');
  const totalPending = pending.reduce((s,v) => s + v.amount, 0);

  c.innerHTML = `
    <!-- Alerte virements à faire -->
    ${pending.length > 0 ? `
      <div style="background:var(--warning-pale);border:1px solid var(--warning);border-radius:var(--radius-lg);padding:var(--space-lg);margin-bottom:var(--space-xl);display:flex;gap:var(--space-md);align-items:center">
        <div style="font-size:1.8rem">💸</div>
        <div>
          <div style="font-weight:700;color:var(--text-dark)">${pending.length} virement(s) à effectuer ce lundi</div>
          <div style="font-size:0.85rem;color:var(--text-muted);margin-top:3px">Total : <strong>${formatEuros(totalPending)}</strong> à virer sur les RIB des tipsters</div>
        </div>
      </div>` : ''}

    <!-- Virements en attente -->
    ${pending.length > 0 ? `
      <div class="section-header">
        <div><h2>À effectuer</h2><p>Lundi prochain · ${formatEuros(totalPending)} au total</p></div>
      </div>
      <div class="pronos-table" style="margin-bottom:var(--space-xl)">
        <div class="table-header" style="grid-template-columns:2fr 1fr 1fr 120px">
          <span>Tipster</span><span>Montant</span><span>Date prévue</span><span>Action</span>
        </div>
        ${pending.map(v => `
          <div class="table-row" style="grid-template-columns:2fr 1fr 1fr 120px">
            <div>
              <div class="prono-title">${v.tipster}</div>
              <div class="prono-meta">Virement hebdomadaire</div>
            </div>
            <div style="font-weight:700;font-size:1.05rem;color:var(--blue)">${formatEuros(v.amount)}</div>
            <div style="font-size:0.82rem;color:var(--text-muted)">${v.date}</div>
            <div>
              <button class="btn btn-primary btn--sm" onclick="markVirementDone(${v.id})">
                ✓ Effectué
              </button>
            </div>
          </div>`).join('')}
      </div>` : `
      <div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">
        ✅ Aucun virement en attente.
      </div>`}

    <!-- Historique -->
    <div class="section-header">
      <div><h2>Historique</h2></div>
    </div>
    <div class="pronos-table">
      <div class="table-header" style="grid-template-columns:2fr 1fr 1fr">
        <span>Tipster</span><span>Montant</span><span>Date</span>
      </div>
      ${done.map(v => `
        <div class="table-row" style="grid-template-columns:2fr 1fr 1fr">
          <div>
            <div class="prono-title">${v.tipster}</div>
            <div class="prono-meta">Virement effectué</div>
          </div>
          <div style="font-weight:700;color:var(--success)">+${formatEuros(v.amount)}</div>
          <div style="font-size:0.82rem;color:var(--text-muted)">${v.date}</div>
        </div>`).join('')}
    </div>
  `;
}

function markVirementDone(id) {
  const v = adminState.virements.find(v => v.id === id);
  if (!v) return;
  if (!confirm(`Confirmer le virement de ${formatEuros(v.amount)} à ${v.tipster} ?`)) return;
  // TODO (Supabase) : mettre à jour le statut + décrémenter le solde du tipster
  v.status = 'done';
  navigateTo('virements');
  showToast(`Virement de ${formatEuros(v.amount)} à ${v.tipster} confirmé ✓`, 'success');
}

// ── Utilitaires ───────────────────────────────────────────────
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
