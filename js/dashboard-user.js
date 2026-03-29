// ── Sidebar mobile ───────────────────────────────────────────
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
}

/**
 * ============================================================
 *  PARIS-BET — JS DASHBOARD UTILISATEUR (dashboard-user.js)
 * ============================================================
 */

// ── Données de démo ───────────────────────────────────────────
const MOCK_USER = {
  firstName:     'Thomas',
  lastName:      'Dupont',
  email:         'thomas.dupont@email.com',
  balance:       42.50,
  pending:       18.00,
  totalSpent:    156.00,
  totalRefunded: 63.00,
};

const MOCK_ACHATS = [
  { id:1, tipster:'Alexis Martin', game:'Real Madrid vs Barça',   sport:'⚽ Liga',       date:'16 mars 2025', price:8.00, status:CONFIG.betStatus.WON,       content:'Real Madrid victoire. Avantage domicile, Barça avec plusieurs absents.' },
  { id:2, tipster:'Alexis Martin', game:'Djokovic vs Alcaraz',     sport:'🎾 Roland Garros',date:'16 mars 2025', price:6.00, status:CONFIG.betStatus.LOST,      content:'Djokovic en 3 sets. Meilleure forme sur terre battue.' },
  { id:3, tipster:'Alexis Martin', game:'PSG vs Marseille',        sport:'⚽ Ligue 1',    date:'15 mars 2025', price:5.00, status:CONFIG.betStatus.PENDING,    content:'PSG gagne avec +1.5 buts. Très bonne forme à domicile.' },
  { id:4, tipster:'MaxiPronos',    game:'Lakers vs Warriors',      sport:'🏀 NBA',        date:'14 mars 2025', price:4.00, status:CONFIG.betStatus.PENDING,    content:'Lakers favoris à domicile. James en grande forme.' },
  { id:5, tipster:'BetKing',       game:'Lens vs Lyon',            sport:'⚽ Ligue 1',    date:'13 mars 2025', price:5.00, status:CONFIG.betStatus.CANCELLED,  content:'Match reporté — remboursement effectué automatiquement.' },
  { id:6, tipster:'MaxiPronos',    game:'Liverpool vs Man City',   sport:'⚽ Premier League',date:'10 mars 2025', price:7.00, status:CONFIG.betStatus.WON,    content:'Liverpool à domicile, forte motivation après défaite.' },
];

const MOCK_TRANSACTIONS = [
  { id:1, type:'depot',          label:'Dépôt Stripe',                amount:+50.00, date:'15 mars 2025' },
  { id:2, type:'achat',          label:'Achat — PSG vs Marseille',    amount: -5.00, date:'15 mars 2025' },
  { id:3, type:'remboursement',  label:'Remboursement — Lens vs Lyon',amount: +5.00, date:'14 mars 2025' },
  { id:4, type:'achat',          label:'Achat — Lakers vs Warriors',  amount: -4.00, date:'14 mars 2025' },
  { id:5, type:'depot',          label:'Dépôt Stripe',                amount:+30.00, date:'10 mars 2025' },
  { id:6, type:'achat',          label:'Achat — Liverpool vs Man City',amount:-7.00, date:'10 mars 2025' },
];

// ── État ──────────────────────────────────────────────────────
const userState = { activePage:'achats', achatsFilter:'all', realAchats:[], availablePronos:[] };

// ── Init ──────────────────────────────────────────────────────
// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuth(['user', 'admin']);
  if (!user) return;

  // Remplacer les données de démo par le vrai profil
  MOCK_USER.firstName = user.profile.first_name;
  MOCK_USER.lastName  = user.profile.last_name;
  MOCK_USER.email     = user.email;
  MOCK_USER.balance   = parseFloat(user.profile.balance) || 0;
  MOCK_USER.pending   = parseFloat(user.profile.pending) || 0;

  // Mettre à jour la sidebar avec le vrai nom
  const fullName = MOCK_USER.firstName + ' ' + MOCK_USER.lastName;
  const initials = (MOCK_USER.firstName[0] + MOCK_USER.lastName[0]).toUpperCase();
  const sidebarName   = document.getElementById('sidebar-name');
  const sidebarAvatar = document.getElementById('sidebar-avatar');
  const topbarName    = document.getElementById('topbar-user-name');
  if (sidebarName)   sidebarName.textContent   = fullName;
  if (sidebarAvatar) sidebarAvatar.textContent  = initials;
  if (topbarName)    topbarName.textContent     = fullName;

  // Mettre à jour le solde dans la topbar
  const topbarBalance = document.getElementById('topbar-balance');
  if (topbarBalance) topbarBalance.textContent = '🔥 ' + formatEuros(MOCK_USER.balance);

  // Charger les vrais achats depuis Supabase
  const { data: achats } = await sb
    .from('purchases')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (achats && achats.length > 0) {
    // Charger les pronos via fetch direct
    const pronoIds = new Set(achats.map(a => a.prono_id));
    const pronosMap = {};
    try {
      const url = new URL('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/pronos');
      url.searchParams.set('select', 'id,game,sport,match_date,content,tipster_id,cote');
      url.searchParams.set('apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI');
      const resp = await fetch(url.toString());
      const tousLesPronos = await resp.json();
      if (Array.isArray(tousLesPronos)) {
        tousLesPronos.filter(p => pronoIds.has(p.id)).forEach(p => pronosMap[p.id] = p);

        // Charger les noms des tipsters (depuis les pronos achetés uniquement)
        const tipsterIds = [...new Set(Object.values(pronosMap).map(p => p.tipster_id).filter(Boolean))];
        if (tipsterIds.length > 0) {
          const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
          const rp = await fetch('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/profiles?select=id,first_name,last_name&apikey=' + ANON);
          const profiles = await rp.json();
          if (Array.isArray(profiles)) {
            const profilesMap = {};
            profiles.forEach(p => profilesMap[p.id] = p.first_name + ' ' + p.last_name);
            Object.values(pronosMap).forEach(p => p.tipsterName = profilesMap[p.tipster_id] || '—');
          }
        }
      }
    } catch(e) { console.error('Erreur fetch pronos:', e); }

    userState.realAchats = achats.map(a => {
      const p = pronosMap[a.prono_id] || {};
      return {
        id:       a.id,
        game:     p.game || "—",
        sport:    p.sport || '—',
        date:     p.match_date || '—',
        tipster:  (pronosMap[a.prono_id] || {}).tipsterName || '—',
        price:    parseFloat(a.amount) || 0,
        status:   a.status || 'pending',
        content:  p.content || '',
        cote:     p.cote || null,
        pronoId:  a.prono_id,
      };
    });
  } else {
    userState.realAchats = [];
  }

  // Charger les pronos disponibles via fetch direct
  try {
    const url2 = new URL('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/pronos');
    url2.searchParams.set('select', 'id,game,sport,match_date,content,price,status,tipster_id,cote');
    url2.searchParams.set('status', 'eq.pending');
    url2.searchParams.set('order', 'created_at.desc');
    url2.searchParams.set('apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI');
    const resp2 = await fetch(url2.toString(),
      { headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI'
      }}
    );
    const pronos = await resp2.json();
    // Charger les profils tipsters
    const tipsterIds = [...new Set((pronos||[]).map(p => p.tipster_id).filter(Boolean))];
    let profilesMap = {};
    let profilesMapFull = {};
    if (tipsterIds.length > 0) {
      const resp3 = await fetch(
        'https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/profiles?select=id,first_name,last_name,pseudo,avatar_url&apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI',
        {}
      );
      const profiles = await resp3.json();
      (profiles||[]).forEach(p => {
        profilesMapFull[p.id] = {
          name: (p.pseudo || (p.first_name + ' ' + p.last_name)),
          avatarUrl: p.avatar_url || '',
          pseudo: p.pseudo || ''
        };
      });
      (profiles||[]).forEach(p => profilesMap[p.id] = p.pseudo || (p.first_name + ' ' + p.last_name));
    }
    userState.availablePronos = (pronos||[]).map(p => ({
      ...p,
      tipsterName: profilesMapFull[p.tipster_id]?.name || '—',
      tipsterAvatar: profilesMapFull[p.tipster_id]?.avatarUrl || '',
      tipsterPseudo: profilesMapFull[p.tipster_id]?.pseudo || ''
    }));
  } catch(e) {
    console.error('Erreur fetch pronos dispo:', e);
    userState.availablePronos = [];
  }

  renderSidebar();
  renderTopbar();

  // Vérifier si retour de Stripe
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('payment') === 'success') {
    const amount = urlParams.get('amount');
    window.history.replaceState({}, '', '/pages/dashboard-user.html');
    navigateTo('solde');
    setTimeout(() => showToast('Paiement reussi ! ' + amount + 'eur ajoutes a votre solde.', 'success'), 300);
  } else if (urlParams.get('payment') === 'cancelled') {
    window.history.replaceState({}, '', '/pages/dashboard-user.html');
    navigateTo('solde');
    setTimeout(() => showToast('Paiement annule.', 'info'), 300);
  } else {
    navigateTo('achats');
  }
});

// ── Navigation ────────────────────────────────────────────────
function navigateTo(page) {
  // Fermer la sidebar sur mobile
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('show');
  userState.activePage = page;
  document.querySelectorAll('.sidebar__link').forEach(l =>
    l.classList.toggle('active', l.dataset.page === page)
  );
  const titles = { achats:'Mes achats', solde:'Mon solde & historique', parametres:'Paramètres', explorer:'Explorer les pronos', 'explorer-tipsters':'Explorer les tipsters' };
  document.getElementById('topbar-title').textContent = titles[page] || '';
  const el = document.getElementById('page-content');
  el.innerHTML = '';
  if (page === 'achats')            renderPageAchats(el);
  if (page === 'solde')             renderPageSolde(el);
  if (page === 'parametres')        renderPageParametres(el);
  if (page === 'explorer')          renderPageExplorer(el);
  if (page === 'explorer-tipsters') renderPageExplorerTipsters(el);
}

// ══════════════════════════════════════════════════════════════
//  PAGE — MES ACHATS
// ══════════════════════════════════════════════════════════════
function renderPageAchats(container) {
  const u   = MOCK_USER;
  const achats = userState.realAchats;
  const won = achats.filter(a => a.status === 'won').length;
  const lost= achats.filter(a => a.status === 'lost').length;
  const pend= achats.filter(a => a.status === 'pending').length;
  const canc= achats.filter(a => a.status === 'cancelled').length;
  const winRate = won + lost > 0 ? Math.round(won / (won + lost) * 100) : 0;
  const totalSpent = achats.reduce((s,a) => s + a.price, 0);

  container.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card stat-card--blue">
        <div class="stat-card__label">🛒 Total acheté</div>
        <div class="stat-card__value">${formatEuros(totalSpent)}</div>
        <div class="stat-card__sub">${achats.length} pronostic(s)</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">↩ Remboursé</div>
        <div class="stat-card__value">${formatEuros(achats.filter(a=>a.status==='lost'||a.status==='cancelled').reduce((s,a)=>s+a.price,0))}</div>
        <div class="stat-card__sub">Perdus + annulés</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">⏳ En attente</div>
        <div class="stat-card__value">${formatEuros(u.pending)}</div>
        <div class="stat-card__sub">${pend} prono(s)</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">🏆 Taux réussite</div>
        <div class="stat-card__value">${winRate}%</div>
        <div class="stat-card__sub">${won}W · ${lost}L · ${canc} annulé(s)</div>
      </div>
    </div>

    <div class="section-header" style="margin-top:var(--space-xl)">
      <div><h2>Mes pronostics achetés</h2></div>
    </div>

    <div class="achats-filters">
      ${[['all','Tous'],['pending','⏳ En attente'],['won','✓ Gagnés'],['lost','✕ Perdus'],['cancelled','⊘ Annulés']].map(([f,l]) =>
        `<button class="filter-btn ${f===userState.achatsFilter?'active':''}" data-filter="${f}" onclick="setAchatsFilter('${f}')">${l}</button>`
      ).join('')}
    </div>

    <div id="achats-list">${renderAchatsList()}</div>
  `;
}

function setAchatsFilter(f) {
  userState.achatsFilter = f;
  document.querySelectorAll('.achats-filters .filter-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.filter === f)
  );
  document.getElementById('achats-list').innerHTML = renderAchatsList();
}

function renderAchatsList() {
  let list = userState.realAchats;
  if (userState.achatsFilter !== 'all') list = list.filter(a => a.status === userState.achatsFilter);
  if (!list.length) return `<div class="empty-state"><div class="empty-state__icon">🔍</div><h3>Aucun achat ici</h3><p>Essayez un autre filtre.</p></div>`;

  const borderColor = { [CONFIG.betStatus.PENDING]:'var(--blue)', [CONFIG.betStatus.WON]:'var(--success)', [CONFIG.betStatus.LOST]:'var(--error)', [CONFIG.betStatus.CANCELLED]:'var(--warning)' };
  const statusBadge = {
    [CONFIG.betStatus.PENDING]:   `<span class="badge badge-pending">⏳ En attente</span>`,
    [CONFIG.betStatus.WON]:       `<span class="badge badge-won">✓ Gagné</span>`,
    [CONFIG.betStatus.LOST]:      `<span class="badge badge-lost">✕ Perdu</span>`,
    [CONFIG.betStatus.CANCELLED]: `<span class="badge badge-cancelled">⊘ Annulé</span>`,
  };

  return list.map(a => {
    const isRefunded = a.status === CONFIG.betStatus.LOST || a.status === CONFIG.betStatus.CANCELLED;
    return `
      <div class="achat-card" style="border-left-color:${borderColor[a.status]}">
        <div class="achat-card__header">
          <div>
            <div class="achat-card__match">${a.game}</div>
            <div class="achat-card__meta">${a.sport} · ${formatDate(a.date)} · par <strong>${a.tipster}</strong></div>
          </div>
          <div class="achat-card__right">
            <div class="achat-card__price">${formatEuros(a.price)}</div>
            ${a.cote ? `<div style="font-size:0.75rem;color:var(--text-muted);text-align:right">📊 Cote : <strong style="color:var(--primary)">${parseFloat(a.cote).toFixed(2).replace('.', ',')}</strong></div>` : ''}
            ${statusBadge[a.status]||''}
            ${isRefunded ? `<span class="achat-card__refund">↩ ${formatEuros(a.price)} remboursé</span>` : ''}
          </div>
        </div>
        <div class="achat-card__content">
          <div class="achat-card__content-label">📋 Pronostic</div>
          <div class="achat-card__content-text">${a.content}</div>
        </div>
      </div>`;
  }).join('');
}

// ══════════════════════════════════════════════════════════════
//  PAGE — SOLDE & HISTORIQUE
// ══════════════════════════════════════════════════════════════
function renderPageSolde(container) {
  const u = MOCK_USER;
  const min = CONFIG.finance.minDeposit || 5;

  // Construire les transactions depuis les vrais achats
  const transactions = (userState.realAchats || []).map(a => ({
    label: a.game || 'Pronostic',
    date:  a.date || '—',
    amount: -a.price,
    type:  a.status === 'cancelled' || a.status === 'lost' ? 'remboursement' : 'achat',
    status: a.status,
  }));

  // Ajouter les remboursements
  const remboursements = (userState.realAchats || [])
    .filter(a => a.status === 'cancelled' || a.status === 'lost')
    .map(a => ({
      label: 'Remboursement — ' + (a.game || 'Pronostic'),
      date:  a.date || '—',
      amount: a.price,
      type: 'remboursement',
    }));

  const allTransactions = [...transactions, ...remboursements]
    .sort((a, b) => (b.date > a.date ? 1 : -1));

  container.innerHTML = `
    <div class="solde-layout">
      <!-- Historique -->
      <div>
        <div class="section-header"><div><h2>Historique des transactions</h2></div></div>
        <div class="pronos-table">
          ${allTransactions.length === 0
            ? `<div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted);font-size:0.88rem">Aucune transaction pour l'instant.</div>`
            : allTransactions.map(t => {
                const icons = { depot:'⬇️', achat:'🛒', remboursement:'↩️' };
                const pos = t.amount > 0;
                return `
                  <div class="virement-row">
                    <div class="virement-info">
                      <div class="virement-icon ${pos?'sent':'pending'}">${icons[t.type]||'·'}</div>
                      <div>
                        <div class="virement-label">${t.label}</div>
                        <div class="virement-date">${t.date}</div>
                      </div>
                    </div>
                    <div class="virement-amount" style="color:${pos?'var(--success)':'var(--text-dark)'}">
                      ${pos?'+':''}${formatEuros(Math.abs(t.amount))}
                    </div>
                  </div>`;
              }).join('')
          }
        </div>
      </div>

      <!-- Recharge -->
      <div style="display:flex;flex-direction:column;gap:var(--space-md)">
        <div class="balance-card">
          <div class="balance-card__label">Solde disponible</div>
          <div class="balance-card__amount">${formatEuros(u.balance)}</div>
          <div class="balance-card__pending">⏳ ${formatEuros(u.pending)} en attente de résultat</div>
        </div>

        <div class="rib-card">
          <div class="rib-card__header">
            <div style="font-size:1.4rem">💳</div>
            <div><h3>Recharger mon solde</h3><p>Min. ${min} € · Stripe sécurisé</p></div>
          </div>
          <div class="quick-amounts">
            ${[10,20,50,100].map(v=>`<button class="quick-amount-btn" data-val="${v}" onclick="selectAmount(${v})">${v} €</button>`).join('')}
          </div>
          <div class="form-group" style="margin-top:var(--space-md)">
            <label>💶 Ou saisir un montant</label>
            <div class="input-wrap">
              <input class="input" type="number" id="deposit-amount" placeholder="Ex: 25" min="${min}" step="1" style="padding-left:var(--space-md)"/>
            </div>
          </div>
          <button class="btn btn-primary" style="width:100%;margin-top:var(--space-sm)" onclick="handleDeposit()">
            Recharger via Stripe →
          </button>
          <p style="text-align:center;font-size:0.73rem;color:var(--text-muted);margin-top:var(--space-sm)">
            🔒 Paiement sécurisé · Remboursement si prono perdu
          </p>
        </div>
      </div>
    </div>
  `;
}

function selectAmount(v) {
  document.getElementById('deposit-amount').value = v;
  document.querySelectorAll('.quick-amount-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.val == v)
  );
}

async function handleDeposit() {
  const val = parseFloat(document.getElementById('deposit-amount').value);
  const min = CONFIG.finance.minDeposit || 5;
  if (!val || val < min) { showToast('Montant minimum : ' + min + ' €', 'error'); return; }

  const btn = document.querySelector('[onclick="handleDeposit()"]');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Redirection…'; }

  try {
    const user = await getCurrentUser();
    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: val, userId: user.id })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    // Rediriger vers la page de paiement Stripe
    window.location.href = data.url;

  } catch (err) {
    showToast('Erreur : ' + err.message, 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Recharger via Stripe →'; }
  }
}

// ══════════════════════════════════════════════════════════════
//  PAGE — PARAMÈTRES
// ══════════════════════════════════════════════════════════════
function renderPageParametres(container) {
  const u = MOCK_USER;
  container.innerHTML = `
    <div style="max-width:520px;display:flex;flex-direction:column;gap:var(--space-lg)">
      <div class="rib-card">
        <div class="rib-card__header">
          <div style="font-size:1.4rem">👤</div>
          <div><h3>Informations personnelles</h3><p>Nom et adresse email</p></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Prénom</label><input class="input" type="text" id="p-fn" value="${u.firstName}"/></div>
          <div class="form-group"><label>Nom</label><input class="input" type="text" id="p-ln" value="${u.lastName}"/></div>
        </div>
        <div class="form-group"><label>Email</label>
          <div class="input-wrap"><span class="input-icon">✉️</span><input class="input" type="email" id="p-email" value="${u.email}"/></div>
        </div>
        <button class="btn btn-primary" onclick="showToast('Profil mis à jour ✓','success')">Enregistrer</button>
      </div>

      <div class="rib-card">
        <div class="rib-card__header">
          <div style="font-size:1.4rem">🔒</div>
          <div><h3>Changer de mot de passe</h3><p>Minimum 8 caractères</p></div>
        </div>
        <div class="form-group"><label>Mot de passe actuel</label>
          <div class="input-wrap"><span class="input-icon">🔒</span><input class="input" type="password" id="p-pw-old" placeholder="••••••••"/>
          <button class="pw-toggle" onclick="togglePw('p-pw-old',this)">👁</button></div>
        </div>
        <div class="form-group"><label>Nouveau mot de passe</label>
          <div class="input-wrap"><span class="input-icon">🔒</span><input class="input" type="password" id="p-pw-new" placeholder="••••••••"/>
          <button class="pw-toggle" onclick="togglePw('p-pw-new',this)">👁</button></div>
        </div>
        <button class="btn btn-primary" onclick="savePassword()">Mettre à jour</button>
      </div>

      <div class="rib-card" style="border-color:var(--error)">
        <div class="rib-card__header">
          <div style="font-size:1.4rem">⚠️</div>
          <div><h3 style="color:var(--error)">Zone de danger</h3><p>Actions irréversibles</p></div>
        </div>
        <button class="btn" style="background:var(--error-pale);color:var(--error);border:1px solid var(--error);width:100%"
          onclick="if(confirm('Supprimer votre compte ? Cette action est irréversible.')) showToast('Fonctionnalité disponible bientôt.','info')">
          Supprimer mon compte
        </button>
      </div>
    </div>
  `;
}

function togglePw(id, btn) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
  btn.textContent = input.type === 'password' ? '👁' : '🙈';
}

function savePassword() {
  const o = document.getElementById('p-pw-old')?.value;
  const n = document.getElementById('p-pw-new')?.value;
  if (!o || !n) { showToast('Remplissez les deux champs.', 'error'); return; }
  if (n.length < 8) { showToast('Minimum 8 caractères.', 'error'); return; }
  showToast('Mot de passe mis à jour ✓', 'success');
}

// ══════════════════════════════════════════════════════════════
//  PAGE — EXPLORER LES TIPSTERS / ACHETER UN PRONO
// ══════════════════════════════════════════════════════════════
function renderPageExplorer(container) {
  const pronos = userState.availablePronos;
  const alreadyBought = new Set(userState.realAchats.map(a => a.pronoId));

  if (!pronos.length) {
    container.innerHTML = `
      <div class="section-header"><div><h2>Explorer les pronos</h2><p>Pronos disponibles à l'achat</p></div></div>
      <div class="empty-state"><div class="empty-state__icon">🔍</div><h3>Aucun prono disponible</h3><p>Revenez plus tard !</p></div>`;
    return;
  }

  container.innerHTML = `
    <div class="section-header">
      <div><h2>Explorer les pronos</h2><p>${pronos.length} prono(s) disponible(s)</p></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:var(--space-md)">
      ${pronos.map(p => {
        const tipsterName = p.tipsterName || '—';
        const tipsterAvatar = p.tipsterAvatar || '';
        const avatarHtml = tipsterAvatar
          ? `<img src="${tipsterAvatar}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0" />`
          : `<div style="width:32px;height:32px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;flex-shrink:0">${tipsterName[0]?.toUpperCase()}</div>`;
        const bought = alreadyBought.has(p.id);
        const expired = isMatchExpired(p.match_date);
        return `
        <div class="achat-card" style="border-left-color:var(--blue)">
          <div class="achat-card__header">
            <div>
              <div class="achat-card__match">${p.game}</div>
              <div class="achat-card__meta" style="display:flex;align-items:center;gap:6px">
                ${avatarHtml}
                ${p.sport} · ${formatDate(p.match_date)} · par <a href="${p.tipsterPseudo ? 'https://payperwin.co/' + p.tipsterPseudo : '../pages/tipster-public.html?id=' + p.tipster_id}" target="_blank" style="color:var(--blue);font-weight:600">${tipsterName}</a>
              </div>
            </div>
            <div class="achat-card__right">
              <div class="achat-card__price">${p.price} €</div>
              ${p.cote ? `<div style="font-size:0.75rem;color:var(--text-muted);text-align:right">📊 Cote : <strong style="color:var(--primary)">${parseFloat(p.cote).toFixed(2).replace('.', ',')}</strong></div>` : ''}
              ${bought
                ? `<span class="badge badge-won">✓ Acheté</span>`
                : expired
                ? `<span style="font-size:0.78rem;color:var(--text-muted);font-weight:600">⏱ Match commencé</span>`
                : `<button class="btn btn-primary" style="font-size:0.85rem;padding:8px 16px" onclick="buyProno('${p.id}', ${p.price}, '${p.game.replace(/'/g,"\\'")}')">Acheter</button>`
              }
            </div>
          </div>
          ${bought ? `<div style="margin-top:8px;padding:10px;background:var(--blue-pale);border-radius:var(--radius-sm);font-size:0.9rem">
            <strong>Pronostic :</strong> ${p.content || '—'}
          </div>` : `<div style="margin-top:8px;font-size:0.85rem;color:var(--text-muted)">🔒 Achetez pour voir le pronostic</div>`}
        </div>`;
      }).join('')}
    </div>
  `;
}

async function buyProno(pronoId, price, matchName) {
  if (MOCK_USER.balance < price) {
    showToast('Solde insuffisant. Rechargez votre compte !', 'error');
    return;
  }
  if (!confirm('Acheter le prono "' + matchName + '" pour ' + price + ' € ?')) return;

  try {
    const user = await getCurrentUser();

    // Vérifier qu'il n'a pas déjà acheté
    const { data: existing } = await sb
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('prono_id', pronoId)
      .maybeSingle();

    if (existing) { showToast('Vous avez déjà acheté ce prono.', 'info'); return; }

    // Débiter le solde et incrémenter pending
    const newBalance = MOCK_USER.balance - price;
    const newPending = (MOCK_USER.pending || 0) + price;
    const { error: balErr } = await sb
      .from('profiles')
      .update({ balance: newBalance, pending: newPending })
      .eq('id', user.id);

    if (balErr) throw balErr;

    // Créer l'achat
    const { error: purchErr } = await sb
      .from('purchases')
      .insert({ user_id: user.id, prono_id: pronoId, amount: price, status: 'pending' });

    if (purchErr) throw purchErr;

    // Incrémenter le nb d'acheteurs sur le prono
    try {
      const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
      const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';
      // Lire le buyers actuel puis incrémenter
      const rB = await fetch(SUPA + '/rest/v1/pronos?select=buyers&id=eq.' + pronoId + '&apikey=' + ANON);
      const bData = await rB.json();
      const currentBuyers = (Array.isArray(bData) && bData.length > 0) ? (parseInt(bData[0].buyers) || 0) : 0;
      await fetch(SUPA + '/rest/v1/pronos?id=eq.' + pronoId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + ANON },
        body: JSON.stringify({ buyers: currentBuyers + 1 })
      });
    } catch(e) { console.error('Erreur increment buyers:', e); }

    // Mettre à jour l'état local
    MOCK_USER.balance = newBalance;
    MOCK_USER.pending = newPending;
    const topbarBalance = document.getElementById('topbar-balance');
    if (topbarBalance) topbarBalance.textContent = '🔥 ' + formatEuros(newBalance);

    // Recharger les achats
    const { data: achats } = await sb
      .from('purchases')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (achats && achats.length > 0) {
      const pronoIds = achats.map(a => a.prono_id);
      const { data: pronosData } = await sb.from('pronos').select('id, game, sport, match_date, content').in('id', pronoIds);
      const pronosMap = {};
      (pronosData || []).forEach(p => pronosMap[p.id] = p);
      userState.realAchats = achats.map(a => {
        const p = pronosMap[a.prono_id] || {};
        return { id: a.id, game: p.game||"—", sport: p.sport||'—', date: p.match_date||'—', tipster:'—', price: parseFloat(a.amount)||0, status: a.status||'pending', prediction: p.content||'', content_odds: ''||'', pronoId: a.prono_id };
      });
    } else { userState.realAchats = []; }

    showToast('Prono acheté ! Bonne chance 🎯', 'success');
    navigateTo('explorer');

  } catch (err) {
    showToast('Erreur : ' + err.message, 'error');
  }
}


// ── Sidebar & Topbar ──────────────────────────────────────────
function renderSidebar() {
  document.querySelectorAll('.sidebar__link').forEach(l =>
    l.classList.toggle('active', l.dataset.page === userState.activePage)
  );
}

function renderTopbar() {
  // déjà géré dans navigateTo
}

// ── Utilitaires ───────────────────────────────────────────────
function isMatchExpired(match_date) {
  if (!match_date) return false;
  try {
    // Formats possibles :
    // "2025-03-15"          → date seule, pas d'heure → on ne bloque pas (pas d'heure = pas de limite)
    // "2025-03-15 · 20:30"  → date + heure → on bloque après cette heure
    if (!match_date.includes(' · ')) return false; // pas d'heure renseignée → pas de blocage
    const parts = match_date.split(' · ');
    const datePart = parts[0].trim(); // "2025-03-15"
    const timePart = parts[1].trim(); // "20:30"
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    const matchTime = new Date(year, month - 1, day, hours, minutes, 0);
    return matchTime < new Date();
  } catch(e) {
    return false;
  }
}

function formatDate(str) {
  if (!str) return '—';
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1].slice(2)}`;
  return str;
}

function formatEuros(n) {
  return n % 1 === 0 ? Math.round(n).toLocaleString('fr-FR') + ' €' : n.toFixed(2).replace('.', ',') + ' €';
}

function showToast(msg, type='info') {
  document.querySelector('.toast')?.remove();
  const c = {error:['var(--error-pale)','var(--error)','✕'],success:['var(--success-pale)','var(--success)','✓'],info:['var(--blue-pale)','var(--blue)','ℹ']}[type]||['var(--blue-pale)','var(--blue)','ℹ'];
  const t = document.createElement('div'); t.className='toast';
  t.innerHTML = `<span>${c[2]}</span> ${msg}`;
  Object.assign(t.style,{position:'fixed',bottom:'24px',left:'16px',right:'16px',textAlign:'center',background:c[0],border:`1px solid ${c[1]}`,borderRadius:'var(--radius-md)',padding:'12px 20px',fontSize:'0.87rem',fontFamily:'var(--font-body)',color:'var(--text-dark)',zIndex:'9999',animation:'fadeUp 0.3s ease both',boxShadow:'var(--shadow-md)'});
  document.body.appendChild(t);
  setTimeout(()=>t?.remove(), 3500);
}

// ══════════════════════════════════════════════════════════════
//  PAGE — EXPLORER LES TIPSTERS
// ══════════════════════════════════════════════════════════════
async function renderExplorerTipsters(container, publicUrlBase) {
  container.innerHTML = `
    <div class="section-header">
      <div><h2>Explorer les tipsters</h2><p>Chargement...</p></div>
    </div>
    <div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">Chargement...</div>`;

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
      const my    = pronos.filter(p => p.tipster_id === t.id);
      const won   = my.filter(p => p.status === 'won').length;
      const lost  = my.filter(p => p.status === 'lost').length;
      const total = my.length;
      const totalAcheteurs = my.reduce((s,p) => s + (parseInt(p.buyers)||0), 0);
      const finished = won + lost;
      const winRate  = finished > 0 ? Math.round(won / finished * 100) : null;

      const withCote = my.filter(p => (p.status==='won'||p.status==='lost') && p.cote && parseFloat(p.cote) > 1);
      const avgCote  = withCote.length > 0
        ? Math.round(withCote.reduce((s,p) => s + parseFloat(p.cote), 0) / withCote.length * 100) / 100
        : null;

      const score = winRate !== null ? winRate * (avgCote !== null ? avgCote : 1) * Math.log10(finished + 1) : null;
      stats[t.id] = { won, lost, total, totalAcheteurs, winRate, avgCote, score };
    }

    let sortCol  = 'score';
    let sortDir  = -1;
    let filterVal = '';

    function sortedFiltered() {
      return tipsters
        .filter(t => (t.pseudo||'').toLowerCase().includes(filterVal.toLowerCase()))
        .sort((a, b) => {
          const sa = stats[a.id][sortCol];
          const sb = stats[b.id][sortCol];
          if (sa === null && sb === null) return 0;
          if (sa === null) return 1;
          if (sb === null) return -1;
          return (sb - sa) * sortDir * -1;
        });
    }

    function setSortCol(col) {
      if (sortCol === col) { sortDir *= -1; } else { sortCol = col; sortDir = -1; }
      renderList();
    }

    function arrowHtml(col) {
      if (sortCol !== col) return `<span style="color:var(--text-muted);font-size:0.7rem;margin-left:3px">⇅</span>`;
      return sortDir === -1
        ? `<span style="font-size:0.7rem;margin-left:3px">↓</span>`
        : `<span style="font-size:0.7rem;margin-left:3px">↑</span>`;
    }

    function renderList() {
      ['total','totalAcheteurs','winRate','avgCote','score'].forEach(col => {
        const el = document.getElementById('sort-btn-' + col);
        if (el) {
          el.style.borderColor = sortCol === col ? 'var(--blue)' : '';
          el.style.color = sortCol === col ? 'var(--blue)' : '';
        }
        const arr = document.getElementById('sort-arr-' + col);
        if (arr) arr.innerHTML = arrowHtml(col);
      });

      const listEl = document.getElementById('tipsters-list');
      const list = sortedFiltered();
      if (!list.length) {
        listEl.innerHTML = `<div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">Aucun tipster trouvé.</div>`;
        return;
      }

      listEl.innerHTML = list.map((t, i) => {
        const s = stats[t.id];
        const pseudo = t.pseudo || (t.first_name + ' ' + t.last_name);
        const avatarHtml = t.avatar_url
          ? `<img src="${t.avatar_url}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;flex-shrink:0" />`
          : `<div style="width:44px;height:44px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;flex-shrink:0">${pseudo[0]?.toUpperCase()}</div>`;
        const winRateHtml = s.winRate !== null
          ? `<span style="font-weight:800;font-size:1rem;color:${s.winRate>=60?'var(--success)':'var(--warning)'};">${s.winRate}%</span>`
          : `<span style="color:var(--text-muted);font-size:0.85rem">—</span>`;
        const coteHtml = s.avgCote !== null
          ? `<span style="font-weight:800;font-size:1rem;color:var(--blue)">${s.avgCote.toFixed(2).replace('.',',')}</span>`
          : `<span style="color:var(--text-muted);font-size:0.85rem">—</span>`;
        const rankColor = i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--text-muted)';
        const href = t.pseudo
          ? publicUrlBase + t.pseudo
          : publicUrlBase.replace(/\/[^\/]*$/, '/tipster-public.html?id=' + t.id);

        return `
        <a href="${href}" target="_blank" style="text-decoration:none">
          <div class="tipster-explorer-card">
            <div style="display:flex;align-items:center;gap:12px;min-width:0">
              <div style="font-size:0.85rem;font-weight:700;color:${rankColor};min-width:20px;text-align:center">${i+1}</div>
              ${avatarHtml}
              <div style="font-weight:700;font-size:0.95rem;color:var(--text-dark);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">@${pseudo}</div>
            </div>
            <div class="tipster-explorer-stats">
              <div class="tipster-explorer-stat">
                <div class="tipster-explorer-stat__label">Pronos</div>
                <div class="tipster-explorer-stat__value">${s.total}</div>
              </div>
              <div class="tipster-explorer-stat">
                <div class="tipster-explorer-stat__label">Acheteurs</div>
                <div class="tipster-explorer-stat__value">${s.totalAcheteurs}</div>
              </div>
              <div class="tipster-explorer-stat">
                <div class="tipster-explorer-stat__label">Win Rate</div>
                <div class="tipster-explorer-stat__value">${winRateHtml}</div>
              </div>
              <div class="tipster-explorer-stat">
                <div class="tipster-explorer-stat__label">Cote moy.</div>
                <div class="tipster-explorer-stat__value">${coteHtml}</div>
              </div>
            </div>
          </div>
        </a>`;
      }).join('');
    }

    const sortBtns = ['total','totalAcheteurs','winRate','avgCote','score'].map(col => {
      const labels = {total:'Pronos',totalAcheteurs:'Acheteurs',winRate:'Win Rate',avgCote:'Cote moy.',score:'🏆 Score'};
      return `<button id="sort-btn-${col}" class="btn btn-outline" style="font-size:0.78rem;padding:6px 12px" onclick="document.setSortCol('${col}')">
        ${labels[col]} <span id="sort-arr-${col}"></span>
      </button>`;
    }).join('');

    const scoreInfoBtn = `
      <div style="position:relative;display:inline-block">
        <button onclick="document.toggleScoreInfo()" style="width:20px;height:20px;border-radius:50%;border:1.5px solid var(--blue);background:none;color:var(--blue);font-size:0.72rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0">i</button>
        <div id="score-info-popover" style="display:none;position:absolute;bottom:28px;left:50%;transform:translateX(-50%);width:260px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-md);font-size:0.8rem;color:var(--text-body);line-height:1.6;box-shadow:var(--shadow-md);z-index:100">
          <strong style="color:var(--text-dark);display:block;margin-bottom:6px">🏆 Comment fonctionne le Score ?</strong>
          Le Score récompense les tipsters qui gagnent souvent, sur des cotes élevées, et sur la durée.<br><br>
          <strong>Formule :</strong> Win Rate × Cote moyenne × log(pronos)<br><br>
          Un tipster avec 1 seul prono gagné n'aura jamais un bon score, même s'il est à 100%.
          <div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:10px;height:10px;background:var(--white);border-right:1px solid var(--border);border-bottom:1px solid var(--border);transform:translateX(-50%) rotate(45deg)"></div>
        </div>
      </div>`;

    container.innerHTML = `
      <div class="section-header">
        <div><h2>Explorer les tipsters</h2><p>${tipsters.length} tipsters inscrits</p></div>
      </div>
      <div class="tipster-search-wrap">
        <span class="input-icon">🔍</span>
        <input class="input" id="tipster-search" type="text" placeholder="Rechercher par pseudo..." oninput="document.tipsterFilter(this.value)" />
      </div>
      <div style="display:flex;gap:var(--space-sm);margin-bottom:var(--space-md);flex-wrap:wrap;align-items:center;">
        ${sortBtns}
        ${scoreInfoBtn}
      </div>
      <div id="tipsters-list"></div>`;

    document.toggleScoreInfo = () => {
      const p = document.getElementById('score-info-popover');
      if (p) p.style.display = p.style.display === 'none' ? 'block' : 'none';
    };
    // Fermer en cliquant ailleurs
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#score-info-popover') && !e.target.closest('[onclick*="toggleScoreInfo"]')) {
        const p = document.getElementById('score-info-popover');
        if (p) p.style.display = 'none';
      }
    }, { once: false });

    document.tipsterFilter = (val) => { filterVal = val; renderList(); };
    document.setSortCol = setSortCol;
    renderList();

  } catch(e) {
    container.innerHTML = `<div style="text-align:center;padding:var(--space-2xl);color:var(--error)">Erreur : ${e.message}</div>`;
    console.error('renderExplorerTipsters:', e);
  }
}

async function renderPageExplorerTipsters(container) {
  await renderExplorerTipsters(container, 'https://payperwin.co/');
}
/ ── Sidebar mobile ───────────────────────────────────────────
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
}

/**
 * ============================================================
 *  PARIS-BET — JS DASHBOARD UTILISATEUR (dashboard-user.js)
 * ============================================================
 */

// ── Données de démo ───────────────────────────────────────────
const MOCK_USER = {
  firstName:     'Thomas',
  lastName:      'Dupont',
  email:         'thomas.dupont@email.com',
  balance:       42.50,
  pending:       18.00,
  totalSpent:    156.00,
  totalRefunded: 63.00,
};

const MOCK_ACHATS = [
  { id:1, tipster:'Alexis Martin', game:'Real Madrid vs Barça',   sport:'⚽ Liga',       date:'16 mars 2025', price:8.00, status:CONFIG.betStatus.WON,       content:'Real Madrid victoire. Avantage domicile, Barça avec plusieurs absents.' },
  { id:2, tipster:'Alexis Martin', game:'Djokovic vs Alcaraz',     sport:'🎾 Roland Garros',date:'16 mars 2025', price:6.00, status:CONFIG.betStatus.LOST,      content:'Djokovic en 3 sets. Meilleure forme sur terre battue.' },
  { id:3, tipster:'Alexis Martin', game:'PSG vs Marseille',        sport:'⚽ Ligue 1',    date:'15 mars 2025', price:5.00, status:CONFIG.betStatus.PENDING,    content:'PSG gagne avec +1.5 buts. Très bonne forme à domicile.' },
  { id:4, tipster:'MaxiPronos',    game:'Lakers vs Warriors',      sport:'🏀 NBA',        date:'14 mars 2025', price:4.00, status:CONFIG.betStatus.PENDING,    content:'Lakers favoris à domicile. James en grande forme.' },
  { id:5, tipster:'BetKing',       game:'Lens vs Lyon',            sport:'⚽ Ligue 1',    date:'13 mars 2025', price:5.00, status:CONFIG.betStatus.CANCELLED,  content:'Match reporté — remboursement effectué automatiquement.' },
  { id:6, tipster:'MaxiPronos',    game:'Liverpool vs Man City',   sport:'⚽ Premier League',date:'10 mars 2025', price:7.00, status:CONFIG.betStatus.WON,    content:'Liverpool à domicile, forte motivation après défaite.' },
];

const MOCK_TRANSACTIONS = [
  { id:1, type:'depot',          label:'Dépôt Stripe',                amount:+50.00, date:'15 mars 2025' },
  { id:2, type:'achat',          label:'Achat — PSG vs Marseille',    amount: -5.00, date:'15 mars 2025' },
  { id:3, type:'remboursement',  label:'Remboursement — Lens vs Lyon',amount: +5.00, date:'14 mars 2025' },
  { id:4, type:'achat',          label:'Achat — Lakers vs Warriors',  amount: -4.00, date:'14 mars 2025' },
  { id:5, type:'depot',          label:'Dépôt Stripe',                amount:+30.00, date:'10 mars 2025' },
  { id:6, type:'achat',          label:'Achat — Liverpool vs Man City',amount:-7.00, date:'10 mars 2025' },
];

// ── État ──────────────────────────────────────────────────────
const userState = { activePage:'achats', achatsFilter:'all', realAchats:[], availablePronos:[] };

// ── Init ──────────────────────────────────────────────────────
// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuth(['user', 'admin']);
  if (!user) return;

  // Remplacer les données de démo par le vrai profil
  MOCK_USER.firstName = user.profile.first_name;
  MOCK_USER.lastName  = user.profile.last_name;
  MOCK_USER.email     = user.email;
  MOCK_USER.balance   = parseFloat(user.profile.balance) || 0;
  MOCK_USER.pending   = parseFloat(user.profile.pending) || 0;

  // Mettre à jour la sidebar avec le vrai nom
  const fullName = MOCK_USER.firstName + ' ' + MOCK_USER.lastName;
  const initials = (MOCK_USER.firstName[0] + MOCK_USER.lastName[0]).toUpperCase();
  const sidebarName   = document.getElementById('sidebar-name');
  const sidebarAvatar = document.getElementById('sidebar-avatar');
  const topbarName    = document.getElementById('topbar-user-name');
  if (sidebarName)   sidebarName.textContent   = fullName;
  if (sidebarAvatar) sidebarAvatar.textContent  = initials;
  if (topbarName)    topbarName.textContent     = fullName;

  // Mettre à jour le solde dans la topbar
  const topbarBalance = document.getElementById('topbar-balance');
  if (topbarBalance) topbarBalance.textContent = '🔥 ' + formatEuros(MOCK_USER.balance);

  // Charger les vrais achats depuis Supabase
  const { data: achats } = await sb
    .from('purchases')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (achats && achats.length > 0) {
    // Charger les pronos via fetch direct
    const pronoIds = new Set(achats.map(a => a.prono_id));
    const pronosMap = {};
    try {
      const url = new URL('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/pronos');
      url.searchParams.set('select', 'id,game,sport,match_date,content,tipster_id,cote');
      url.searchParams.set('apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI');
      const resp = await fetch(url.toString());
      const tousLesPronos = await resp.json();
      if (Array.isArray(tousLesPronos)) {
        tousLesPronos.filter(p => pronoIds.has(p.id)).forEach(p => pronosMap[p.id] = p);

        // Charger les noms des tipsters (depuis les pronos achetés uniquement)
        const tipsterIds = [...new Set(Object.values(pronosMap).map(p => p.tipster_id).filter(Boolean))];
        if (tipsterIds.length > 0) {
          const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
          const rp = await fetch('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/profiles?select=id,first_name,last_name&apikey=' + ANON);
          const profiles = await rp.json();
          if (Array.isArray(profiles)) {
            const profilesMap = {};
            profiles.forEach(p => profilesMap[p.id] = p.first_name + ' ' + p.last_name);
            Object.values(pronosMap).forEach(p => p.tipsterName = profilesMap[p.tipster_id] || '—');
          }
        }
      }
    } catch(e) { console.error('Erreur fetch pronos:', e); }

    userState.realAchats = achats.map(a => {
      const p = pronosMap[a.prono_id] || {};
      return {
        id:       a.id,
        game:     p.game || "—",
        sport:    p.sport || '—',
        date:     p.match_date || '—',
        tipster:  (pronosMap[a.prono_id] || {}).tipsterName || '—',
        price:    parseFloat(a.amount) || 0,
        status:   a.status || 'pending',
        content:  p.content || '',
        cote:     p.cote || null,
        pronoId:  a.prono_id,
      };
    });
  } else {
    userState.realAchats = [];
  }

  // Charger les pronos disponibles via fetch direct
  try {
    const url2 = new URL('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/pronos');
    url2.searchParams.set('select', 'id,game,sport,match_date,content,price,status,tipster_id,cote');
    url2.searchParams.set('status', 'eq.pending');
    url2.searchParams.set('order', 'created_at.desc');
    url2.searchParams.set('apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI');
    const resp2 = await fetch(url2.toString(),
      { headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI'
      }}
    );
    const pronos = await resp2.json();
    // Charger les profils tipsters
    const tipsterIds = [...new Set((pronos||[]).map(p => p.tipster_id).filter(Boolean))];
    let profilesMap = {};
    let profilesMapFull = {};
    if (tipsterIds.length > 0) {
      const resp3 = await fetch(
        'https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/profiles?select=id,first_name,last_name,pseudo,avatar_url&apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI',
        {}
      );
      const profiles = await resp3.json();
      (profiles||[]).forEach(p => {
        profilesMapFull[p.id] = {
          name: (p.pseudo || (p.first_name + ' ' + p.last_name)),
          avatarUrl: p.avatar_url || '',
          pseudo: p.pseudo || ''
        };
      });
      (profiles||[]).forEach(p => profilesMap[p.id] = p.pseudo || (p.first_name + ' ' + p.last_name));
    }
    userState.availablePronos = (pronos||[]).map(p => ({
      ...p,
      tipsterName: profilesMapFull[p.tipster_id]?.name || '—',
      tipsterAvatar: profilesMapFull[p.tipster_id]?.avatarUrl || '',
      tipsterPseudo: profilesMapFull[p.tipster_id]?.pseudo || ''
    }));
  } catch(e) {
    console.error('Erreur fetch pronos dispo:', e);
    userState.availablePronos = [];
  }

  renderSidebar();
  renderTopbar();

  // Vérifier si retour de Stripe
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('payment') === 'success') {
    const amount = urlParams.get('amount');
    window.history.replaceState({}, '', '/pages/dashboard-user.html');
    navigateTo('solde');
    setTimeout(() => showToast('Paiement reussi ! ' + amount + 'eur ajoutes a votre solde.', 'success'), 300);
  } else if (urlParams.get('payment') === 'cancelled') {
    window.history.replaceState({}, '', '/pages/dashboard-user.html');
    navigateTo('solde');
    setTimeout(() => showToast('Paiement annule.', 'info'), 300);
  } else {
    navigateTo('achats');
  }
});

// ── Navigation ────────────────────────────────────────────────
function navigateTo(page) {
  // Fermer la sidebar sur mobile
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('show');
  userState.activePage = page;
  document.querySelectorAll('.sidebar__link').forEach(l =>
    l.classList.toggle('active', l.dataset.page === page)
  );
  const titles = { achats:'Mes achats', solde:'Mon solde & historique', parametres:'Paramètres', explorer:'Explorer les pronos', 'explorer-tipsters':'Explorer les tipsters' };
  document.getElementById('topbar-title').textContent = titles[page] || '';
  const el = document.getElementById('page-content');
  el.innerHTML = '';
  if (page === 'achats')            renderPageAchats(el);
  if (page === 'solde')             renderPageSolde(el);
  if (page === 'parametres')        renderPageParametres(el);
  if (page === 'explorer')          renderPageExplorer(el);
  if (page === 'explorer-tipsters') renderPageExplorerTipsters(el);
}

// ══════════════════════════════════════════════════════════════
//  PAGE — MES ACHATS
// ══════════════════════════════════════════════════════════════
function renderPageAchats(container) {
  const u   = MOCK_USER;
  const achats = userState.realAchats;
  const won = achats.filter(a => a.status === 'won').length;
  const lost= achats.filter(a => a.status === 'lost').length;
  const pend= achats.filter(a => a.status === 'pending').length;
  const canc= achats.filter(a => a.status === 'cancelled').length;
  const winRate = won + lost > 0 ? Math.round(won / (won + lost) * 100) : 0;
  const totalSpent = achats.reduce((s,a) => s + a.price, 0);

  container.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card stat-card--blue">
        <div class="stat-card__label">🛒 Total acheté</div>
        <div class="stat-card__value">${formatEuros(totalSpent)}</div>
        <div class="stat-card__sub">${achats.length} pronostic(s)</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">↩ Remboursé</div>
        <div class="stat-card__value">${formatEuros(achats.filter(a=>a.status==='lost'||a.status==='cancelled').reduce((s,a)=>s+a.price,0))}</div>
        <div class="stat-card__sub">Perdus + annulés</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">⏳ En attente</div>
        <div class="stat-card__value">${formatEuros(u.pending)}</div>
        <div class="stat-card__sub">${pend} prono(s)</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">🏆 Taux réussite</div>
        <div class="stat-card__value">${winRate}%</div>
        <div class="stat-card__sub">${won}W · ${lost}L · ${canc} annulé(s)</div>
      </div>
    </div>

    <div class="section-header" style="margin-top:var(--space-xl)">
      <div><h2>Mes pronostics achetés</h2></div>
    </div>

    <div class="achats-filters">
      ${[['all','Tous'],['pending','⏳ En attente'],['won','✓ Gagnés'],['lost','✕ Perdus'],['cancelled','⊘ Annulés']].map(([f,l]) =>
        `<button class="filter-btn ${f===userState.achatsFilter?'active':''}" data-filter="${f}" onclick="setAchatsFilter('${f}')">${l}</button>`
      ).join('')}
    </div>

    <div id="achats-list">${renderAchatsList()}</div>
  `;
}

function setAchatsFilter(f) {
  userState.achatsFilter = f;
  document.querySelectorAll('.achats-filters .filter-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.filter === f)
  );
  document.getElementById('achats-list').innerHTML = renderAchatsList();
}

function renderAchatsList() {
  let list = userState.realAchats;
  if (userState.achatsFilter !== 'all') list = list.filter(a => a.status === userState.achatsFilter);
  if (!list.length) return `<div class="empty-state"><div class="empty-state__icon">🔍</div><h3>Aucun achat ici</h3><p>Essayez un autre filtre.</p></div>`;

  const borderColor = { [CONFIG.betStatus.PENDING]:'var(--blue)', [CONFIG.betStatus.WON]:'var(--success)', [CONFIG.betStatus.LOST]:'var(--error)', [CONFIG.betStatus.CANCELLED]:'var(--warning)' };
  const statusBadge = {
    [CONFIG.betStatus.PENDING]:   `<span class="badge badge-pending">⏳ En attente</span>`,
    [CONFIG.betStatus.WON]:       `<span class="badge badge-won">✓ Gagné</span>`,
    [CONFIG.betStatus.LOST]:      `<span class="badge badge-lost">✕ Perdu</span>`,
    [CONFIG.betStatus.CANCELLED]: `<span class="badge badge-cancelled">⊘ Annulé</span>`,
  };

  return list.map(a => {
    const isRefunded = a.status === CONFIG.betStatus.LOST || a.status === CONFIG.betStatus.CANCELLED;
    return `
      <div class="achat-card" style="border-left-color:${borderColor[a.status]}">
        <div class="achat-card__header">
          <div>
            <div class="achat-card__match">${a.game}</div>
            <div class="achat-card__meta">${a.sport} · ${formatDate(a.date)} · par <strong>${a.tipster}</strong></div>
          </div>
          <div class="achat-card__right">
            <div class="achat-card__price">${formatEuros(a.price)}</div>
            ${a.cote ? `<div style="font-size:0.75rem;color:var(--text-muted);text-align:right">📊 Cote : <strong style="color:var(--primary)">${parseFloat(a.cote).toFixed(2).replace('.', ',')}</strong></div>` : ''}
            ${statusBadge[a.status]||''}
            ${isRefunded ? `<span class="achat-card__refund">↩ ${formatEuros(a.price)} remboursé</span>` : ''}
          </div>
        </div>
        <div class="achat-card__content">
          <div class="achat-card__content-label">📋 Pronostic</div>
          <div class="achat-card__content-text">${a.content}</div>
        </div>
      </div>`;
  }).join('');
}

// ══════════════════════════════════════════════════════════════
//  PAGE — SOLDE & HISTORIQUE
// ══════════════════════════════════════════════════════════════
function renderPageSolde(container) {
  const u = MOCK_USER;
  const min = CONFIG.finance.minDeposit || 5;

  // Construire les transactions depuis les vrais achats
  const transactions = (userState.realAchats || []).map(a => ({
    label: a.game || 'Pronostic',
    date:  a.date || '—',
    amount: -a.price,
    type:  a.status === 'cancelled' || a.status === 'lost' ? 'remboursement' : 'achat',
    status: a.status,
  }));

  // Ajouter les remboursements
  const remboursements = (userState.realAchats || [])
    .filter(a => a.status === 'cancelled' || a.status === 'lost')
    .map(a => ({
      label: 'Remboursement — ' + (a.game || 'Pronostic'),
      date:  a.date || '—',
      amount: a.price,
      type: 'remboursement',
    }));

  const allTransactions = [...transactions, ...remboursements]
    .sort((a, b) => (b.date > a.date ? 1 : -1));

  container.innerHTML = `
    <div class="solde-layout">
      <!-- Historique -->
      <div>
        <div class="section-header"><div><h2>Historique des transactions</h2></div></div>
        <div class="pronos-table">
          ${allTransactions.length === 0
            ? `<div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted);font-size:0.88rem">Aucune transaction pour l'instant.</div>`
            : allTransactions.map(t => {
                const icons = { depot:'⬇️', achat:'🛒', remboursement:'↩️' };
                const pos = t.amount > 0;
                return `
                  <div class="virement-row">
                    <div class="virement-info">
                      <div class="virement-icon ${pos?'sent':'pending'}">${icons[t.type]||'·'}</div>
                      <div>
                        <div class="virement-label">${t.label}</div>
                        <div class="virement-date">${t.date}</div>
                      </div>
                    </div>
                    <div class="virement-amount" style="color:${pos?'var(--success)':'var(--text-dark)'}">
                      ${pos?'+':''}${formatEuros(Math.abs(t.amount))}
                    </div>
                  </div>`;
              }).join('')
          }
        </div>
      </div>

      <!-- Recharge -->
      <div style="display:flex;flex-direction:column;gap:var(--space-md)">
        <div class="balance-card">
          <div class="balance-card__label">Solde disponible</div>
          <div class="balance-card__amount">${formatEuros(u.balance)}</div>
          <div class="balance-card__pending">⏳ ${formatEuros(u.pending)} en attente de résultat</div>
        </div>

        <div class="rib-card">
          <div class="rib-card__header">
            <div style="font-size:1.4rem">💳</div>
            <div><h3>Recharger mon solde</h3><p>Min. ${min} € · Stripe sécurisé</p></div>
          </div>
          <div class="quick-amounts">
            ${[10,20,50,100].map(v=>`<button class="quick-amount-btn" data-val="${v}" onclick="selectAmount(${v})">${v} €</button>`).join('')}
          </div>
          <div class="form-group" style="margin-top:var(--space-md)">
            <label>💶 Ou saisir un montant</label>
            <div class="input-wrap">
              <input class="input" type="number" id="deposit-amount" placeholder="Ex: 25" min="${min}" step="1" style="padding-left:var(--space-md)"/>
            </div>
          </div>
          <button class="btn btn-primary" style="width:100%;margin-top:var(--space-sm)" onclick="handleDeposit()">
            Recharger via Stripe →
          </button>
          <p style="text-align:center;font-size:0.73rem;color:var(--text-muted);margin-top:var(--space-sm)">
            🔒 Paiement sécurisé · Remboursement si prono perdu
          </p>
        </div>
      </div>
    </div>
  `;
}

function selectAmount(v) {
  document.getElementById('deposit-amount').value = v;
  document.querySelectorAll('.quick-amount-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.val == v)
  );
}

async function handleDeposit() {
  const val = parseFloat(document.getElementById('deposit-amount').value);
  const min = CONFIG.finance.minDeposit || 5;
  if (!val || val < min) { showToast('Montant minimum : ' + min + ' €', 'error'); return; }

  const btn = document.querySelector('[onclick="handleDeposit()"]');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Redirection…'; }

  try {
    const user = await getCurrentUser();
    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: val, userId: user.id })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    // Rediriger vers la page de paiement Stripe
    window.location.href = data.url;

  } catch (err) {
    showToast('Erreur : ' + err.message, 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Recharger via Stripe →'; }
  }
}

// ══════════════════════════════════════════════════════════════
//  PAGE — PARAMÈTRES
// ══════════════════════════════════════════════════════════════
function renderPageParametres(container) {
  const u = MOCK_USER;
  container.innerHTML = `
    <div style="max-width:520px;display:flex;flex-direction:column;gap:var(--space-lg)">
      <div class="rib-card">
        <div class="rib-card__header">
          <div style="font-size:1.4rem">👤</div>
          <div><h3>Informations personnelles</h3><p>Nom et adresse email</p></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Prénom</label><input class="input" type="text" id="p-fn" value="${u.firstName}"/></div>
          <div class="form-group"><label>Nom</label><input class="input" type="text" id="p-ln" value="${u.lastName}"/></div>
        </div>
        <div class="form-group"><label>Email</label>
          <div class="input-wrap"><span class="input-icon">✉️</span><input class="input" type="email" id="p-email" value="${u.email}"/></div>
        </div>
        <button class="btn btn-primary" onclick="showToast('Profil mis à jour ✓','success')">Enregistrer</button>
      </div>

      <div class="rib-card">
        <div class="rib-card__header">
          <div style="font-size:1.4rem">🔒</div>
          <div><h3>Changer de mot de passe</h3><p>Minimum 8 caractères</p></div>
        </div>
        <div class="form-group"><label>Mot de passe actuel</label>
          <div class="input-wrap"><span class="input-icon">🔒</span><input class="input" type="password" id="p-pw-old" placeholder="••••••••"/>
          <button class="pw-toggle" onclick="togglePw('p-pw-old',this)">👁</button></div>
        </div>
        <div class="form-group"><label>Nouveau mot de passe</label>
          <div class="input-wrap"><span class="input-icon">🔒</span><input class="input" type="password" id="p-pw-new" placeholder="••••••••"/>
          <button class="pw-toggle" onclick="togglePw('p-pw-new',this)">👁</button></div>
        </div>
        <button class="btn btn-primary" onclick="savePassword()">Mettre à jour</button>
      </div>

      <div class="rib-card" style="border-color:var(--error)">
        <div class="rib-card__header">
          <div style="font-size:1.4rem">⚠️</div>
          <div><h3 style="color:var(--error)">Zone de danger</h3><p>Actions irréversibles</p></div>
        </div>
        <button class="btn" style="background:var(--error-pale);color:var(--error);border:1px solid var(--error);width:100%"
          onclick="if(confirm('Supprimer votre compte ? Cette action est irréversible.')) showToast('Fonctionnalité disponible bientôt.','info')">
          Supprimer mon compte
        </button>
      </div>
    </div>
  `;
}

function togglePw(id, btn) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
  btn.textContent = input.type === 'password' ? '👁' : '🙈';
}

function savePassword() {
  const o = document.getElementById('p-pw-old')?.value;
  const n = document.getElementById('p-pw-new')?.value;
  if (!o || !n) { showToast('Remplissez les deux champs.', 'error'); return; }
  if (n.length < 8) { showToast('Minimum 8 caractères.', 'error'); return; }
  showToast('Mot de passe mis à jour ✓', 'success');
}

// ══════════════════════════════════════════════════════════════
//  PAGE — EXPLORER LES TIPSTERS / ACHETER UN PRONO
// ══════════════════════════════════════════════════════════════
function renderPageExplorer(container) {
  const pronos = userState.availablePronos;
  const alreadyBought = new Set(userState.realAchats.map(a => a.pronoId));

  if (!pronos.length) {
    container.innerHTML = `
      <div class="section-header"><div><h2>Explorer les pronos</h2><p>Pronos disponibles à l'achat</p></div></div>
      <div class="empty-state"><div class="empty-state__icon">🔍</div><h3>Aucun prono disponible</h3><p>Revenez plus tard !</p></div>`;
    return;
  }

  container.innerHTML = `
    <div class="section-header">
      <div><h2>Explorer les pronos</h2><p>${pronos.length} prono(s) disponible(s)</p></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:var(--space-md)">
      ${pronos.map(p => {
        const tipsterName = p.tipsterName || '—';
        const tipsterAvatar = p.tipsterAvatar || '';
        const avatarHtml = tipsterAvatar
          ? `<img src="${tipsterAvatar}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0" />`
          : `<div style="width:32px;height:32px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;flex-shrink:0">${tipsterName[0]?.toUpperCase()}</div>`;
        const bought = alreadyBought.has(p.id);
        const expired = isMatchExpired(p.match_date);
        return `
        <div class="achat-card" style="border-left-color:var(--blue)">
          <div class="achat-card__header">
            <div>
              <div class="achat-card__match">${p.game}</div>
              <div class="achat-card__meta" style="display:flex;align-items:center;gap:6px">
                ${avatarHtml}
                ${p.sport} · ${formatDate(p.match_date)} · par <a href="${p.tipsterPseudo ? 'https://payperwin.co/' + p.tipsterPseudo : '../pages/tipster-public.html?id=' + p.tipster_id}" target="_blank" style="color:var(--blue);font-weight:600">${tipsterName}</a>
              </div>
            </div>
            <div class="achat-card__right">
              <div class="achat-card__price">${p.price} €</div>
              ${p.cote ? `<div style="font-size:0.75rem;color:var(--text-muted);text-align:right">📊 Cote : <strong style="color:var(--primary)">${parseFloat(p.cote).toFixed(2).replace('.', ',')}</strong></div>` : ''}
              ${bought
                ? `<span class="badge badge-won">✓ Acheté</span>`
                : expired
                ? `<span style="font-size:0.78rem;color:var(--text-muted);font-weight:600">⏱ Match commencé</span>`
                : `<button class="btn btn-primary" style="font-size:0.85rem;padding:8px 16px" onclick="buyProno('${p.id}', ${p.price}, '${p.game.replace(/'/g,"\\'")}')">Acheter</button>`
              }
            </div>
          </div>
          ${bought ? `<div style="margin-top:8px;padding:10px;background:var(--blue-pale);border-radius:var(--radius-sm);font-size:0.9rem">
            <strong>Pronostic :</strong> ${p.content || '—'}
          </div>` : `<div style="margin-top:8px;font-size:0.85rem;color:var(--text-muted)">🔒 Achetez pour voir le pronostic</div>`}
        </div>`;
      }).join('')}
    </div>
  `;
}

async function buyProno(pronoId, price, matchName) {
  if (MOCK_USER.balance < price) {
    showToast('Solde insuffisant. Rechargez votre compte !', 'error');
    return;
  }
  if (!confirm('Acheter le prono "' + matchName + '" pour ' + price + ' € ?')) return;

  try {
    const user = await getCurrentUser();

    // Vérifier qu'il n'a pas déjà acheté
    const { data: existing } = await sb
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('prono_id', pronoId)
      .maybeSingle();

    if (existing) { showToast('Vous avez déjà acheté ce prono.', 'info'); return; }

    // Débiter le solde et incrémenter pending
    const newBalance = MOCK_USER.balance - price;
    const newPending = (MOCK_USER.pending || 0) + price;
    const { error: balErr } = await sb
      .from('profiles')
      .update({ balance: newBalance, pending: newPending })
      .eq('id', user.id);

    if (balErr) throw balErr;

    // Créer l'achat
    const { error: purchErr } = await sb
      .from('purchases')
      .insert({ user_id: user.id, prono_id: pronoId, amount: price, status: 'pending' });

    if (purchErr) throw purchErr;

    // Incrémenter le nb d'acheteurs sur le prono
    try {
      const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
      const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';
      // Lire le buyers actuel puis incrémenter
      const rB = await fetch(SUPA + '/rest/v1/pronos?select=buyers&id=eq.' + pronoId + '&apikey=' + ANON);
      const bData = await rB.json();
      const currentBuyers = (Array.isArray(bData) && bData.length > 0) ? (parseInt(bData[0].buyers) || 0) : 0;
      await fetch(SUPA + '/rest/v1/pronos?id=eq.' + pronoId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + ANON },
        body: JSON.stringify({ buyers: currentBuyers + 1 })
      });
    } catch(e) { console.error('Erreur increment buyers:', e); }

    // Mettre à jour l'état local
    MOCK_USER.balance = newBalance;
    MOCK_USER.pending = newPending;
    const topbarBalance = document.getElementById('topbar-balance');
    if (topbarBalance) topbarBalance.textContent = '🔥 ' + formatEuros(newBalance);

    // Recharger les achats
    const { data: achats } = await sb
      .from('purchases')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (achats && achats.length > 0) {
      const pronoIds = achats.map(a => a.prono_id);
      const { data: pronosData } = await sb.from('pronos').select('id, game, sport, match_date, content').in('id', pronoIds);
      const pronosMap = {};
      (pronosData || []).forEach(p => pronosMap[p.id] = p);
      userState.realAchats = achats.map(a => {
        const p = pronosMap[a.prono_id] || {};
        return { id: a.id, game: p.game||"—", sport: p.sport||'—', date: p.match_date||'—', tipster:'—', price: parseFloat(a.amount)||0, status: a.status||'pending', prediction: p.content||'', content_odds: ''||'', pronoId: a.prono_id };
      });
    } else { userState.realAchats = []; }

    showToast('Prono acheté ! Bonne chance 🎯', 'success');
    navigateTo('explorer');

  } catch (err) {
    showToast('Erreur : ' + err.message, 'error');
  }
}


// ── Sidebar & Topbar ──────────────────────────────────────────
function renderSidebar() {
  document.querySelectorAll('.sidebar__link').forEach(l =>
    l.classList.toggle('active', l.dataset.page === userState.activePage)
  );
}

function renderTopbar() {
  // déjà géré dans navigateTo
}

// ── Utilitaires ───────────────────────────────────────────────
function isMatchExpired(match_date) {
  if (!match_date) return false;
  try {
    // Formats possibles :
    // "2025-03-15"          → date seule, pas d'heure → on ne bloque pas (pas d'heure = pas de limite)
    // "2025-03-15 · 20:30"  → date + heure → on bloque après cette heure
    if (!match_date.includes(' · ')) return false; // pas d'heure renseignée → pas de blocage
    const parts = match_date.split(' · ');
    const datePart = parts[0].trim(); // "2025-03-15"
    const timePart = parts[1].trim(); // "20:30"
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    const matchTime = new Date(year, month - 1, day, hours, minutes, 0);
    return matchTime < new Date();
  } catch(e) {
    return false;
  }
}

function formatDate(str) {
  if (!str) return '—';
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1].slice(2)}`;
  return str;
}

function formatEuros(n) {
  return n % 1 === 0 ? Math.round(n).toLocaleString('fr-FR') + ' €' : n.toFixed(2).replace('.', ',') + ' €';
}

function showToast(msg, type='info') {
  document.querySelector('.toast')?.remove();
  const c = {error:['var(--error-pale)','var(--error)','✕'],success:['var(--success-pale)','var(--success)','✓'],info:['var(--blue-pale)','var(--blue)','ℹ']}[type]||['var(--blue-pale)','var(--blue)','ℹ'];
  const t = document.createElement('div'); t.className='toast';
  t.innerHTML = `<span>${c[2]}</span> ${msg}`;
  Object.assign(t.style,{position:'fixed',bottom:'24px',left:'16px',right:'16px',textAlign:'center',background:c[0],border:`1px solid ${c[1]}`,borderRadius:'var(--radius-md)',padding:'12px 20px',fontSize:'0.87rem',fontFamily:'var(--font-body)',color:'var(--text-dark)',zIndex:'9999',animation:'fadeUp 0.3s ease both',boxShadow:'var(--shadow-md)'});
  document.body.appendChild(t);
  setTimeout(()=>t?.remove(), 3500);
}

// ══════════════════════════════════════════════════════════════
//  PAGE — EXPLORER LES TIPSTERS
// ══════════════════════════════════════════════════════════════

