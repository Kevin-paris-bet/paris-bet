/**
 * ============================================================
 *  PARIS-BET — JS PANEL ADMIN (dashboard-admin.js)
 * ============================================================
 */

// ── Données de démo ───────────────────────────────────────────
const MOCK_ADMIN = { firstName: 'Admin', lastName: 'PayPerWin' };

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

    // Charger les purchases pour avoir le vrai nombre d acheteurs et montant
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
    // Charger les pronos pour calculer win rate et nb pronos par tipster
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
        name:      t.pseudo || (t.first_name + ' ' + t.last_name),
        email:     t.email || '—',
        pronos:    tp.length,
        winRate:   finished > 0 ? Math.round(won / finished * 100) : 0,
        balance:   parseFloat(t.balance) || 0,
        ribSaved:  !!(t.rib_iban),
        ribOk:     !!(t.rib_iban),
        suspended: false,
        avatarUrl: t.avatar_url || '',
      };
    });
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
      name:          u.first_name + ' ' + u.last_name,
      email:         u.email || '—',
      balance:       parseFloat(u.balance) || 0,
      pending:       parseFloat(u.pending) || 0,
      totalDeposits: parseFloat(u.total_deposits) || 0,
      joined:        u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—',
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
    finances:  'Finances & Commissions',
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
            <div class="prono-meta">${p.sport} · ${formatDate(p.match_date || p.date)}</div>
            ${p.content ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-top:3px;font-style:italic">📋 ${p.content}</div>` : ''}
          </div>
          <div style="font-size:0.85rem;color:var(--text-muted)">${p.tipsterName || "—"}</div>
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
    // Mettre à jour le statut du prono dans Supabase
    const { error } = await sb
      .from('pronos')
      .update({ status })
      .eq('id', id);

    if (error) throw error;

    // Récupérer tous les achats de ce prono (sans filtre status)
    const { data: purchases } = await sb
      .from('purchases')
      .select('*')
      .eq('prono_id', p.id);

    if (purchases && purchases.length > 0) {
      if (status === 'won') {
        // Calculer le total réel depuis les achats
        const totalRevenue = purchases.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0);
        const tipsterShare = totalRevenue * 0.9;

        // Lire le solde actuel du tipster
        const { data: tipsterProfile } = await sb.from('profiles').select('balance').eq('id', p.tipster_id).single();
        const currentBalance = parseFloat(tipsterProfile?.balance || 0);

        // Créditer le tipster
        await sb.from('profiles').update({ balance: currentBalance + tipsterShare }).eq('id', p.tipster_id);

        // Remettre pending à 0 pour chaque acheteur
        for (const achat of purchases) {
          const { data: userProfile } = await sb.from('profiles').select('pending').eq('id', achat.user_id).single();
          const currentPending = parseFloat(userProfile?.pending || 0);
          const newPending = Math.max(0, currentPending - parseFloat(achat.amount || 0));
          await sb.from('profiles').update({ pending: newPending }).eq('id', achat.user_id);
        }

        // Mettre à jour les achats en "won"
        await sb.from('purchases').update({ status: 'won' }).eq('prono_id', p.id);

      } else {
        // Rembourser chaque acheteur + remettre pending à 0
        for (const achat of purchases) {
          const { data: userProfile } = await sb.from('profiles').select('balance, pending').eq('id', achat.user_id).single();
          const currentBalance = parseFloat(userProfile?.balance || 0);
          const currentPending = parseFloat(userProfile?.pending || 0);
          const amount = parseFloat(achat.amount || 0);
          await sb.from('profiles').update({
            balance: currentBalance + amount,
            pending: Math.max(0, currentPending - amount)
          }).eq('id', achat.user_id);
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
          <div style="display:flex;align-items:center;gap:10px">
            ${t.avatarUrl
              ? `<img src="${t.avatarUrl}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0" />`
              : `<div style="width:36px;height:36px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.9rem;flex-shrink:0">${t.name[0]?.toUpperCase()}</div>`
            }
            <div>
              <div class="prono-title">
                <a href="../pages/tipster-public.html?id=${t.id}" target="_blank" style="color:var(--primary);text-decoration:none;font-weight:700" title="Voir la page publique">
                  ${t.name} 🔗
                </a>
              </div>
              <div class="prono-meta">${t.email}</div>
              ${t.suspended ? `<div style="font-size:0.7rem;color:var(--error);font-weight:600">⛔ Suspendu</div>` : ''}
            </div>
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
            <button class="btn-icon" title="Voir la fiche" onclick="openFicheTipster('${t.id}')">👁</button>
            <button class="btn-icon ${t.suspended?'':'danger'}" title="${t.suspended?'Réactiver':'Suspendre'}"
              onclick="toggleSuspend('${t.id}')">
              ${t.suspended ? '✓' : '⛔'}
            </button>
          </div>
        </div>`).join('')}
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
  const totalBalance  = adminState.users.reduce((s,u) => s + u.balance + u.pending, 0);
  const totalDeposits = adminState.users.reduce((s,u) => s + u.totalDeposits, 0);

  c.innerHTML = `
    <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:var(--space-xl)">
      <div class="stat-card">
        <div class="stat-card__label">👤 Utilisateurs</div>
        <div class="stat-card__value">${adminState.users.length}</div>
        <div class="stat-card__sub">inscrits</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">💳 Total dépôts</div>
        <div class="stat-card__value" style="color:var(--success)">${formatEuros(totalDeposits)}</div>
        <div class="stat-card__sub">recharges cumulées</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">💰 Soldes cumulés</div>
        <div class="stat-card__value">${formatEuros(totalBalance)}</div>
        <div class="stat-card__sub">disponible + attente</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">⏳ En attente</div>
        <div class="stat-card__value">${formatEuros(adminState.users.reduce((s,u)=>s+(parseFloat(u.pending)||0),0))}</div>
        <div class="stat-card__sub">pronos non validés</div>
      </div>
    </div>

    <div class="pronos-table">
      <div class="table-header" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr 60px">
        <span>Utilisateur</span><span>Solde dispo</span><span>En attente</span><span>Total dépôts</span><span>Inscrit</span><span></span>
      </div>
      ${adminState.users.map(u => `
        <div class="table-row" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr 60px">
          <div>
            <div class="prono-title">${u.name}</div>
            <div class="prono-meta">${u.email}</div>
          </div>
          <div style="font-weight:700;color:var(--blue)">${formatEuros(u.balance)}</div>
          <div style="font-weight:600;color:var(--warning)">${u.pending > 0 ? formatEuros(u.pending) : '—'}</div>
          <div style="font-weight:700;color:var(--success)">${u.totalDeposits > 0 ? formatEuros(u.totalDeposits) : '—'}</div>
          <div style="font-size:0.8rem;color:var(--text-muted)">${u.joined}</div>
          <div><button class="btn-icon" title="Voir la fiche" onclick="openFicheUser('${u.id}')">👁</button></div>
        </div>`).join('')}
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

  // Charger les tipsters avec leur solde
  const rT = await fetch(SUPA + '/rest/v1/profiles?select=id,first_name,last_name,balance,rib_iban,rib_bic,role&apikey=' + ANON, {
    headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON }
  });
  const allProfiles = await rT.json();
  const tipsters = Array.isArray(allProfiles) ? allProfiles.filter(p => p.role === 'tipster') : [];

  // Charger l'historique des virements
  const urlP = new URL(SUPA + '/rest/v1/payouts');
  urlP.searchParams.set('select', 'id,tipster_id,amount,created_at');
  urlP.searchParams.set('order', 'created_at.desc');
  urlP.searchParams.set('apikey', ANON);
  const rP = await fetch(urlP.toString());
  const payoutsRaw = await rP.json();
  const payouts = Array.isArray(payoutsRaw) ? payoutsRaw : [];

  // Enrichir les payouts avec le nom du tipster
  const tipstersMap = {};
  if (Array.isArray(tipsters)) tipsters.forEach(t => { tipstersMap[t.id] = t.first_name + ' ' + t.last_name; });

  const minPayout = 30;
  const pending = Array.isArray(tipsters) ? tipsters.filter(t => parseFloat(t.balance) >= minPayout) : [];
  const totalPending = pending.reduce((s,t) => s + parseFloat(t.balance), 0);

  c.innerHTML = `
    ${pending.length > 0 ? `
      <div style="background:var(--warning-pale);border:1px solid var(--warning);border-radius:var(--radius-lg);padding:var(--space-lg);margin-bottom:var(--space-xl);display:flex;gap:var(--space-md);align-items:center">
        <div style="font-size:1.8rem">💸</div>
        <div>
          <div style="font-weight:700;color:var(--text-dark)">${pending.length} virement(s) à effectuer</div>
          <div style="font-size:0.85rem;color:var(--text-muted);margin-top:3px">Total : <strong>${formatEuros(totalPending)}</strong> à virer</div>
        </div>
      </div>` : ''}

    <div class="section-header">
      <div><h2>À effectuer</h2><p>Tipsters avec solde ≥ ${minPayout}€</p></div>
    </div>
    <div class="pronos-table" style="margin-bottom:var(--space-xl)">
      <div class="table-header" style="grid-template-columns:2fr 1fr 1fr 120px">
        <span>Tipster</span><span>Solde</span><span>RIB</span><span>Action</span>
      </div>
      ${pending.length === 0
        ? `<div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">✅ Aucun virement en attente.</div>`
        : pending.map(t => `
          <div class="table-row" style="grid-template-columns:2fr 1fr 1fr 120px">
            <div>
              <div class="prono-title">${t.first_name} ${t.last_name}</div>
              <div class="prono-meta">Virement hebdomadaire</div>
            </div>
            <div style="font-weight:700;font-size:1.05rem;color:var(--blue)">${formatEuros(parseFloat(t.balance))}</div>
            <div style="font-size:0.82rem;color:var(--text-muted)">${t.rib_iban ? t.rib_iban + (t.rib_bic ? ' / ' + t.rib_bic : '') : '⚠️ Non renseigné'}</div>
            <div>
              <button class="btn btn-primary btn--sm" onclick="markVirementDone('${t.id}','${t.first_name} ${t.last_name}',${parseFloat(t.balance)})">
                ✓ Effectué
              </button>
            </div>
          </div>`).join('')}
    </div>

    <div class="section-header"><div><h2>Historique des virements</h2></div></div>
    <div class="pronos-table">
      <div class="table-header" style="grid-template-columns:2fr 1fr 1fr">
        <span>Tipster</span><span>Montant</span><span>Date</span>
      </div>
      ${!Array.isArray(payouts) || payouts.length === 0
        ? `<div style="text-align:center;padding:var(--space-xl);color:var(--text-muted);font-size:0.88rem">Aucun virement effectué pour l'instant.</div>`
        : payouts.map(v => `
          <div class="table-row" style="grid-template-columns:2fr 1fr 1fr">
            <div>
              <div class="prono-title">${tipstersMap[v.tipster_id] || '—'}</div>
              <div class="prono-meta">Virement effectué</div>
            </div>
            <div style="font-weight:700;color:var(--success)">+${formatEuros(v.amount)}</div>
            <div style="font-size:0.82rem;color:var(--text-muted)">${new Date(v.created_at).toLocaleDateString('fr-FR')}</div>
          </div>`).join('')}
    </div>
  `;
}

async function markVirementDone(tipsterId, tipsterName, amount) {
  if (!confirm(`Confirmer le virement de ${formatEuros(amount)} à ${tipsterName} ?\nCela mettra leur solde à 0.`)) return;

  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA  = 'https://haezbgglpghjrgdpmcrj.supabase.co';

  try {
    // 1. Créer le payout
    await fetch(SUPA + '/rest/v1/payouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + ANON },
      body: JSON.stringify({ tipster_id: tipsterId, amount: amount })
    });

    // 2. Remettre le solde du tipster à 0
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

  // Mettre à jour les badges avec les vraies données
  const pendingPronos = adminState.pronos.filter(p => p.status === 'pending').length;
  const badgePronos = document.getElementById('badge-pronos');
  if (badgePronos) {
    badgePronos.textContent = pendingPronos;
    badgePronos.style.display = pendingPronos > 0 ? '' : 'none';
  }

  // Badge virements = tipsters avec solde >= 30€
  const pendingVir = adminState.tipsters.filter(t => parseFloat(t.balance) >= 30).length;
  const badgeVir = document.getElementById('badge-vir');
  if (badgeVir) {
    badgeVir.textContent = pendingVir;
    badgeVir.style.display = pendingVir > 0 ? '' : 'none';
  }

  // Badge urgent = pronos en attente
  const badgeUrgent = document.getElementById('badge-urgent');
  if (badgeUrgent) {
    badgeUrgent.textContent = pendingPronos;
    badgeUrgent.style.display = pendingPronos > 0 ? '' : 'none';
  }
}

function renderTopbar() {}

// ── Utilitaires ───────────────────────────────────────────────
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

    <!-- Filtres date -->
    <div style="display:flex;gap:var(--space-md);align-items:flex-end;margin-bottom:var(--space-lg);flex-wrap:wrap">
      <div class="form-group" style="margin:0">
        <label style="font-size:0.8rem;color:var(--text-muted)">Date début (match)</label>
        <input class="input" type="date" id="fin-date-from" style="width:160px" />
      </div>
      <div class="form-group" style="margin:0">
        <label style="font-size:0.8rem;color:var(--text-muted)">Date fin (match)</label>
        <input class="input" type="date" id="fin-date-to" style="width:160px" />
      </div>
      <button class="btn btn-primary" onclick="loadFinances()">Filtrer</button>
      <button class="btn btn-outline" onclick="
        document.getElementById('fin-date-from').value='';
        document.getElementById('fin-date-to').value='';
        loadFinances();
      ">Tout afficher</button>
    </div>

    <!-- Totaux globaux -->
    <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:var(--space-lg)" id="fin-totals">
      <div class="stat-card"><div class="stat-card__label">CA Total</div><div class="stat-card__value" id="fin-total-ca">—</div></div>
      <div class="stat-card"><div class="stat-card__label">Mes commissions (10%)</div><div class="stat-card__value" id="fin-total-comm" style="color:var(--success)">—</div></div>
      <div class="stat-card"><div class="stat-card__label">Versé aux tipsters (90%)</div><div class="stat-card__value" id="fin-total-net">—</div></div>
    </div>

    <!-- Tableau par tipster -->
    <div id="fin-table">
      <div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">⏳ Chargement...</div>
    </div>
  `;

  loadFinances();
}

async function loadFinances() {
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';

  const dateFrom = document.getElementById('fin-date-from')?.value || '';
  const dateTo   = document.getElementById('fin-date-to')?.value   || '';
  const table    = document.getElementById('fin-table');
  if (!table) return;

  table.innerHTML = `<div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">⏳ Chargement...</div>`;

  try {
    // 1. Charger les pronos terminés (won/lost/cancelled)
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
      document.getElementById('fin-total-ca').textContent   = '0 €';
      document.getElementById('fin-total-comm').textContent = '0 €';
      document.getElementById('fin-total-net').textContent  = '0 €';
      return;
    }

    // 2. Charger les purchases des pronos terminés (won uniquement = CA réel)
    const pronoIds = pronos.map(p => p.id);
    const urlPurch = new URL(SUPA + '/rest/v1/purchases');
    urlPurch.searchParams.set('select', 'prono_id,amount,status');
    urlPurch.searchParams.set('prono_id', 'in.(' + pronoIds.join(',') + ')');
    urlPurch.searchParams.set('apikey', ANON);
    const rPurch = await fetch(urlPurch.toString(), { headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON } });
    const purchases = await rPurch.json();

    // 3. Charger les profils tipsters
    const tipsterIds = [...new Set(pronos.map(p => p.tipster_id).filter(Boolean))];
    const urlProf = new URL(SUPA + '/rest/v1/profiles');
    urlProf.searchParams.set('select', 'id,first_name,last_name');
    urlProf.searchParams.set('id', 'in.(' + tipsterIds.join(',') + ')');
    urlProf.searchParams.set('apikey', ANON);
    const rProf = await fetch(urlProf.toString(), { headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON } });
    const profiles = await rProf.json();
    const profilesMap = {};
    (profiles || []).forEach(p => profilesMap[p.id] = p.first_name + ' ' + p.last_name);

    // 4. Calculer par tipster
    const tipsterStats = {};
    pronos.forEach(prono => {
      const tid = prono.tipster_id;
      if (!tid) return;
      if (!tipsterStats[tid]) {
        tipsterStats[tid] = {
          name: profilesMap[tid] || '—',
          pronos: 0, won: 0, lost: 0, cancelled: 0,
          ca: 0, commission: 0, net: 0,
          acheteurs: 0,
        };
      }
      const s = tipsterStats[tid];
      s.pronos++;
      if (prono.status === 'won') s.won++;
      else if (prono.status === 'lost') s.lost++;
      else if (prono.status === 'cancelled') s.cancelled++;

      // CA = somme des purchases de ce prono
      const pPurchases = (purchases || []).filter(p => p.prono_id === prono.id);
      const pronoCA = pPurchases.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      s.ca += pronoCA;
      s.acheteurs += prono.buyers || 0;
    });

    // Calculer commissions et net
    Object.values(tipsterStats).forEach(s => {
      s.commission = s.ca * 0.10;
      s.net = s.ca * 0.90;
    });

    // Filtrer tipsters avec CA > 0
    const tipsters = Object.values(tipsterStats).filter(s => s.ca > 0);

    if (tipsters.length === 0) {
      table.innerHTML = `<div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">Aucune vente sur cette période.</div>`;
      document.getElementById('fin-total-ca').textContent   = '0 €';
      document.getElementById('fin-total-comm').textContent = '0 €';
      document.getElementById('fin-total-net').textContent  = '0 €';
      return;
    }

    // Totaux globaux
    const totalCA   = tipsters.reduce((s, t) => s + t.ca, 0);
    const totalComm = totalCA * 0.10;
    const totalNet  = totalCA * 0.90;
    document.getElementById('fin-total-ca').textContent   = formatEuros(totalCA);
    document.getElementById('fin-total-comm').textContent = formatEuros(totalComm);
    document.getElementById('fin-total-net').textContent  = formatEuros(totalNet);

    // Tableau
    table.innerHTML = `
      <div class="pronos-table">
        <div class="table-header" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr 1fr">
          <span>Tipster</span>
          <span>Pronos</span>
          <span>Win Rate</span>
          <span>Acheteurs</span>
          <span>CA Total</span>
          <span style="color:var(--success)">Mes 10%</span>
          <span>Net Tipster</span>
        </div>
        ${tipsters.sort((a,b) => b.ca - a.ca).map(t => {
          const winRate = (t.won + t.lost) > 0 ? Math.round(t.won / (t.won + t.lost) * 100) : 0;
          return `
          <div class="table-row" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr 1fr">
            <div>
              <div class="prono-title">${t.name}</div>
              <div class="prono-meta">${t.won}W · ${t.lost}L · ${t.cancelled} annulés</div>
            </div>
            <div style="font-weight:600">${t.pronos}</div>
            <div style="color:${winRate >= 60 ? 'var(--success)' : 'var(--text-muted)'};font-weight:600">${winRate}%</div>
            <div>👥 ${t.acheteurs}</div>
            <div style="font-weight:700;color:var(--primary)">${formatEuros(t.ca)}</div>
            <div style="font-weight:700;color:var(--success)">${formatEuros(t.commission)}</div>
            <div style="font-weight:600">${formatEuros(t.net)}</div>
          </div>`;
        }).join('')}
      </div>
    `;

  } catch(e) {
    console.error('Erreur finances:', e);
    table.innerHTML = `<div style="text-align:center;padding:var(--space-2xl);color:var(--error)">Erreur de chargement.</div>`;
  }
}

// ══════════════════════════════════════════════════════════════
//  MODALES — FICHES DÉTAILLÉES
// ══════════════════════════════════════════════════════════════
function closeFicheModal(e) {
  if (!e || e.target === document.getElementById('fiche-modal-overlay')) {
    document.getElementById('fiche-modal-overlay').style.display = 'none';
  }
}

async function openFicheTipster(id) {
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';
  const overlay = document.getElementById('fiche-modal-overlay');
  const modal   = document.getElementById('fiche-modal-content');
  overlay.style.display = 'block';
  modal.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">⏳ Chargement...</div>';

  try {
    // Profil
    const rP = await fetch(`${SUPA}/rest/v1/profiles?select=id,first_name,last_name,balance,pending,rib_iban,rib_bic,rib_name,created_at&id=eq.${id}&apikey=${ANON}`, { headers: { apikey: ANON } });
    const profiles = await rP.json();
    const p = profiles[0] || {};

    // Pronos
    const rPr = await fetch(`${SUPA}/rest/v1/pronos?select=id,game,sport,match_date,status,buyers,price,content,cote&tipster_id=eq.${id}&order=created_at.desc&apikey=${ANON}`, { headers: { apikey: ANON } });
    const pronos = await rPr.json();

    // Stats financières
    const pronoIds = (pronos||[]).map(p => p.id);
    let totalCA = 0, totalComm = 0;
    if (pronoIds.length > 0) {
      const rPurch = await fetch(`${SUPA}/rest/v1/purchases?select=amount,status&prono_id=in.(${pronoIds.join(',')})&apikey=${ANON}`, { headers: { apikey: ANON } });
      const purchases = await rPurch.json();
      totalCA = (purchases||[]).reduce((s,p) => s + parseFloat(p.amount||0), 0);
      totalComm = totalCA * 0.10;
    }

    const won  = (pronos||[]).filter(p => p.status === 'won').length;
    const lost = (pronos||[]).filter(p => p.status === 'lost').length;
    const wr   = (won+lost) > 0 ? Math.round(won/(won+lost)*100) : 0;

    modal.innerHTML = `
      <h2 style="margin-bottom:4px">${p.first_name} ${p.last_name}</h2>
      <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:var(--space-lg)">
        Membre depuis ${formatDate(p.created_at?.split('T')[0])}
      </div>

      <!-- Stats rapides -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-md);margin-bottom:var(--space-lg)">
        <div class="stat-card"><div class="stat-card__label">Pronos</div><div class="stat-card__value">${(pronos||[]).length}</div></div>
        <div class="stat-card"><div class="stat-card__label">Win Rate</div><div class="stat-card__value" style="color:var(--success)">${wr}%</div></div>
        <div class="stat-card"><div class="stat-card__label">CA Total</div><div class="stat-card__value">${formatEuros(totalCA)}</div></div>
        <div class="stat-card"><div class="stat-card__label">Mes 10%</div><div class="stat-card__value" style="color:var(--success)">${formatEuros(totalComm)}</div></div>
      </div>

      <!-- Infos bancaires -->
      <div style="background:var(--bg-soft);border-radius:var(--radius-md);padding:var(--space-md);margin-bottom:var(--space-lg);font-size:0.85rem">
        <strong>🏦 RIB</strong><br>
        Titulaire : ${p.rib_name || '—'}<br>
        IBAN : ${p.rib_iban || '—'}<br>
        BIC : ${p.rib_bic || '—'}<br>
        Solde disponible : <strong>${formatEuros(p.balance||0)}</strong> · En attente : <strong>${formatEuros(p.pending||0)}</strong>
      </div>

      <!-- Liste des pronos -->
      <h3 style="margin-bottom:var(--space-md)">Historique des pronos</h3>
      ${(pronos||[]).length === 0 ? '<p style="color:var(--text-muted)">Aucun prono.</p>' : `
        <div style="display:flex;flex-direction:column;gap:8px;max-height:350px;overflow-y:auto">
          ${(pronos||[]).map(pr => {
            const badge = { won:'<span class="badge badge-won">✓ Gagné</span>', lost:'<span class="badge badge-lost">✕ Perdu</span>', cancelled:'<span class="badge badge-cancelled">⊘ Annulé</span>', pending:'<span class="badge badge-pending">⏳ En attente</span>' };
            return `<div style="background:var(--bg-soft);border-radius:var(--radius-sm);padding:10px 14px;font-size:0.85rem">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <strong>${pr.game}</strong>
                ${badge[pr.status]||''}
              </div>
              <div style="color:var(--text-muted);margin-top:2px">${pr.sport} · ${formatDate(pr.match_date)} · 👥 ${pr.buyers||0} · ${formatEuros(pr.price)}${pr.cote ? ` · 📊 ${parseFloat(pr.cote).toFixed(2).replace('.',',')}` : ''}</div>
              ${pr.content ? `<div style="margin-top:4px;font-style:italic;color:var(--text-muted)">📋 ${pr.content}</div>` : ''}
            </div>`;
          }).join('')}
        </div>
      `}
    `;
  } catch(e) {
    modal.innerHTML = `<div style="color:var(--error)">Erreur de chargement.</div>`;
  }
}

async function openFicheUser(id) {
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';
  const overlay = document.getElementById('fiche-modal-overlay');
  const modal   = document.getElementById('fiche-modal-content');
  overlay.style.display = 'block';
  modal.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">⏳ Chargement...</div>';

  try {
    // Profil
    const rP = await fetch(`${SUPA}/rest/v1/profiles?select=id,first_name,last_name,balance,pending,created_at&id=eq.${id}&apikey=${ANON}`, { headers: { apikey: ANON } });
    const profiles = await rP.json();
    const p = profiles[0] || {};

    // Achats
    const rA = await fetch(`${SUPA}/rest/v1/purchases?select=id,prono_id,amount,status,created_at&user_id=eq.${id}&order=created_at.desc&apikey=${ANON}`, { headers: { apikey: ANON } });
    const purchases = await rA.json();

    // Pronos associés
    let pronosMap = {};
    if ((purchases||[]).length > 0) {
      const pronoIds = [...new Set(purchases.map(a => a.prono_id))];
      const rPr = await fetch(`${SUPA}/rest/v1/pronos?select=id,game,sport,match_date,tipster_id&id=in.(${pronoIds.join(',')})&apikey=${ANON}`, { headers: { apikey: ANON } });
      const pronos = await rPr.json();
      (pronos||[]).forEach(pr => pronosMap[pr.id] = pr);

      // Noms tipsters
      const tipsterIds = [...new Set(Object.values(pronosMap).map(pr => pr.tipster_id).filter(Boolean))];
      if (tipsterIds.length > 0) {
        const rT = await fetch(`${SUPA}/rest/v1/profiles?select=id,first_name,last_name&id=in.(${tipsterIds.join(',')})&apikey=${ANON}`, { headers: { apikey: ANON } });
        const tipsters = await rT.json();
        const tMap = {};
        (tipsters||[]).forEach(t => tMap[t.id] = t.first_name + ' ' + t.last_name);
        Object.values(pronosMap).forEach(pr => pr.tipsterName = tMap[pr.tipster_id] || '—');
      }
    }

    const totalDepense   = (purchases||[]).reduce((s,a) => s + parseFloat(a.amount||0), 0);
    const totalRembourse = (purchases||[]).filter(a => a.status === 'lost' || a.status === 'cancelled').reduce((s,a) => s + parseFloat(a.amount||0), 0);
    const totalWon       = (purchases||[]).filter(a => a.status === 'won').length;

    modal.innerHTML = `
      <h2 style="margin-bottom:4px">${p.first_name} ${p.last_name}</h2>
      <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:var(--space-lg)">
        Membre depuis ${formatDate(p.created_at?.split('T')[0])}
      </div>

      <!-- Stats rapides -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-md);margin-bottom:var(--space-lg)">
        <div class="stat-card"><div class="stat-card__label">Achats</div><div class="stat-card__value">${(purchases||[]).length}</div></div>
        <div class="stat-card"><div class="stat-card__label">Total dépensé</div><div class="stat-card__value">${formatEuros(totalDepense)}</div></div>
        <div class="stat-card"><div class="stat-card__label">Remboursés</div><div class="stat-card__value" style="color:var(--success)">${formatEuros(totalRembourse)}</div></div>
        <div class="stat-card"><div class="stat-card__label">Pronos gagnés</div><div class="stat-card__value" style="color:var(--primary)">${totalWon}</div></div>
      </div>

      <!-- Solde -->
      <div style="background:var(--bg-soft);border-radius:var(--radius-md);padding:var(--space-md);margin-bottom:var(--space-lg);font-size:0.85rem">
        💰 Solde disponible : <strong>${formatEuros(p.balance||0)}</strong> · ⏳ En attente : <strong>${formatEuros(p.pending||0)}</strong>
      </div>

      <!-- Historique achats -->
      <h3 style="margin-bottom:var(--space-md)">Historique des achats</h3>
      ${(purchases||[]).length === 0 ? '<p style="color:var(--text-muted)">Aucun achat.</p>' : `
        <div style="display:flex;flex-direction:column;gap:8px;max-height:350px;overflow-y:auto">
          ${(purchases||[]).map(a => {
            const pr = pronosMap[a.prono_id] || {};
            const badge = { won:'<span class="badge badge-won">✓ Gagné</span>', lost:'<span class="badge badge-lost">✕ Perdu</span>', cancelled:'<span class="badge badge-cancelled">⊘ Annulé</span>', pending:'<span class="badge badge-pending">⏳ En attente</span>' };
            return `<div style="background:var(--bg-soft);border-radius:var(--radius-sm);padding:10px 14px;font-size:0.85rem">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <strong>${pr.game || '—'}</strong>
                ${badge[a.status]||''}
              </div>
              <div style="color:var(--text-muted);margin-top:2px">
                ${pr.sport||'—'} · ${formatDate(pr.match_date)} · par ${pr.tipsterName||'—'} · <strong>${formatEuros(a.amount)}</strong>
              </div>
            </div>`;
          }).join('')}
        </div>
      `}
    `;
  } catch(e) {
    modal.innerHTML = `<div style="color:var(--error)">Erreur de chargement.</div>`;
  }
}

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
