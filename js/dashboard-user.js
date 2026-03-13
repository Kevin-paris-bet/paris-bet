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
      url.searchParams.set('select', 'id,game,sport,match_date,content,tipster_id');
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
        id:         a.id,
        game:      p.game || "—",
        sport:      p.sport || '—',
        date:       p.match_date || '—',
        tipster:    (pronosMap[a.prono_id] || {}).tipsterName || '—',
        price:      parseFloat(a.amount) || 0,
        status:     a.status || 'pending',
        content: p.content || '',
        content_odds:       '' || '',
        pronoId:    a.prono_id,
      };
    });
  } else {
    userState.realAchats = [];
  }

  // Charger les pronos disponibles via fetch direct
  try {
    const url2 = new URL('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/pronos');
    url2.searchParams.set('select', 'id,game,sport,match_date,content,price,status,tipster_id');
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
    if (tipsterIds.length > 0) {
      const resp3 = await fetch(
        'https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/profiles_with_email?select=id,first_name,last_name&apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI',
        {}
      );
      const profiles = await resp3.json();
      (profiles||[]).forEach(p => profilesMap[p.id] = p.first_name + ' ' + p.last_name);
    }
    userState.availablePronos = (pronos||[]).map(p => ({...p, tipsterName: profilesMap[p.tipster_id] || '—'}));
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
  userState.activePage = page;
  document.querySelectorAll('.sidebar__link').forEach(l =>
    l.classList.toggle('active', l.dataset.page === page)
  );
  const titles = { achats:'Mes achats', solde:'Mon solde & historique', parametres:'Paramètres', explorer:'Explorer les tipsters' };
  document.getElementById('topbar-title').textContent = titles[page] || '';
  const el = document.getElementById('page-content');
  el.innerHTML = '';
  if (page === 'achats')     renderPageAchats(el);
  if (page === 'solde')      renderPageSolde(el);
  if (page === 'parametres') renderPageParametres(el);
  if (page === 'explorer')   renderPageExplorer(el);
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
    <div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="stat-card stat-card--blue">
        <div class="stat-card__label">🛒 Total acheté</div>
        <div class="stat-card__value">${formatEuros(totalSpent)}</div>
        <div class="stat-card__sub">${achats.length} pronostic(s)</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">↩ Remboursé</div>
        <div class="stat-card__value">${formatEuros(u.totalRefunded)}</div>
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
            <div class="achat-card__meta">${a.sport} · ${a.date} · par <strong>${a.tipster}</strong></div>
          </div>
          <div class="achat-card__right">
            <div class="achat-card__price">${formatEuros(a.price)}</div>
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

  container.innerHTML = `
    <div class="solde-layout">
      <!-- Historique -->
      <div>
        <div class="section-header"><div><h2>Historique des transactions</h2></div></div>
        <div class="pronos-table" style="padding:0 var(--space-lg)">
          ${MOCK_TRANSACTIONS.map(t => {
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
          }).join('')}
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
            ${[5,10,20,50].map(v=>`<button class="quick-amount-btn" data-val="${v}" onclick="selectAmount(${v})">${v} €</button>`).join('')}
          </div>
          <div class="form-group" style="margin-top:var(--space-md)">
            <label>Ou saisir un montant</label>
            <div class="input-wrap">
              <span class="input-icon">💶</span>
              <input class="input" type="number" id="deposit-amount" placeholder="Ex: 25" min="${min}" step="1"/>
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
        const bought = alreadyBought.has(p.id);
        return `
        <div class="achat-card" style="border-left-color:var(--blue)">
          <div class="achat-card__header">
            <div>
              <div class="achat-card__match">${p.game}</div>
              <div class="achat-card__meta">${p.sport} · ${p.match_date || '—'} · par <strong>${tipsterName}</strong></div>
            </div>
            <div class="achat-card__right">
              <div class="achat-card__price">${p.price} €</div>
              ${bought
                ? `<span class="badge badge-won">✓ Acheté</span>`
                : `<button class="btn btn-primary" style="font-size:0.85rem;padding:8px 16px" onclick="buyProno('${p.id}', ${p.price}, '${p.game.replace(/'/g,"\'")}')">Acheter</button>`
              }
            </div>
          </div>
          ${bought ? `<div style="margin-top:8px;padding:10px;background:var(--blue-pale);border-radius:var(--radius-sm);font-size:0.9rem">
            <strong>Pronostic :</strong> ${p.content || '—'} · <strong>Cote :</strong> ${'' || '—'}
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

    // Débiter le solde
    const newBalance = MOCK_USER.balance - price;
    const { error: balErr } = await sb
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', user.id);

    if (balErr) throw balErr;

    // Créer l'achat
    const { error: purchErr } = await sb
      .from('purchases')
      .insert({ user_id: user.id, prono_id: pronoId, amount: price, status: 'pending' });

    if (purchErr) throw purchErr;

    // Incrémenter le nb d'acheteurs sur le prono
    try { await sb.rpc('increment_buyers', { prono_id: pronoId }); } catch(e) {}

    // Mettre à jour l'état local
    MOCK_USER.balance = newBalance;
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
function formatEuros(n) {
  return n % 1 === 0 ? Math.round(n).toLocaleString('fr-FR') + ' €' : n.toFixed(2).replace('.', ',') + ' €';
}

function showToast(msg, type='info') {
  document.querySelector('.toast')?.remove();
  const c = {error:['var(--error-pale)','var(--error)','✕'],success:['var(--success-pale)','var(--success)','✓'],info:['var(--blue-pale)','var(--blue)','ℹ']}[type]||['var(--blue-pale)','var(--blue)','ℹ'];
  const t = document.createElement('div'); t.className='toast';
  t.innerHTML = `<span>${c[2]}</span> ${msg}`;
  Object.assign(t.style,{position:'fixed',bottom:'24px',left:'50%',transform:'translateX(-50%)',background:c[0],border:`1px solid ${c[1]}`,borderRadius:'var(--radius-md)',padding:'12px 24px',fontSize:'0.87rem',fontFamily:'var(--font-body)',color:'var(--text-dark)',zIndex:'9999',animation:'fadeUp 0.3s ease both',boxShadow:'var(--shadow-md)',whiteSpace:'nowrap',maxWidth:'90vw'});
  document.body.appendChild(t);
  setTimeout(()=>t?.remove(), 3500);
}
