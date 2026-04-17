// ── Sidebar mobile ───────────────────────────────────────────
function isMobile() { return window.innerWidth < 900; }
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
const userState = { activePage:'achats', achatsFilter:'all', realAchats:[], availablePronos:[], userId: null };

// ── Init ──────────────────────────────────────────────────────
// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuth(['user', 'admin']);
  if (!user) return;
  userState.userId = user.id;

  // Remplacer les données de démo par le vrai profil
  MOCK_USER.firstName = user.profile.first_name;
  MOCK_USER.lastName  = user.profile.last_name;
  MOCK_USER.email     = user.email;
  MOCK_USER.balance  = parseFloat(user.profile.balance) || 0;
  MOCK_USER.pending  = parseFloat(user.profile.pending) || 0;
  MOCK_USER.freebet             = parseFloat(user.profile.freebet_balance) || 0;
  MOCK_USER.whatsapp            = user.profile.whatsapp || '';
  MOCK_USER.whatsappSent        = !!(user.profile.whatsapp && user.profile.whatsapp.trim() !== '');
  MOCK_USER.referralCode        = user.profile.referral_code || '';

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
      const ANON_ACH = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
      const url = new URL('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/pronos');
      url.searchParams.set('select', 'id,game,sport,match_date,content,analysis,show_cote,tipster_id,cote,image_url,image_status');
      url.searchParams.set('apikey', ANON_ACH);
      const resp = await fetch(url.toString(), { headers: { apikey: ANON_ACH, 'Authorization': 'Bearer ' + ANON_ACH } });
      const tousLesPronos = await resp.json();
      if (Array.isArray(tousLesPronos)) {
        tousLesPronos.filter(p => pronoIds.has(p.id)).forEach(p => pronosMap[p.id] = p);

        // Charger les noms des tipsters (depuis les pronos achetés uniquement)
        const tipsterIds = [...new Set(Object.values(pronosMap).map(p => p.tipster_id).filter(Boolean))];
        if (tipsterIds.length > 0) {
          const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
          const rp = await fetch('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/profiles?select=id,first_name,last_name,pseudo,avatar_url,description&apikey=' + ANON);
          const profiles = await rp.json();
          if (Array.isArray(profiles)) {
            const profilesMap = {};
            profiles.forEach(p => { profilesMap[p.id] = { name: p.pseudo || (p.first_name + ' ' + p.last_name), avatar: p.avatar_url || '', pseudo: p.pseudo || '', description: p.description || '' }; });
            Object.values(pronosMap).forEach(p => {
              const prof = profilesMap[p.tipster_id] || {};
              p.tipsterName   = prof.name   || '—';
              p.tipsterAvatar = prof.avatar || '';
              p.tipsterPseudo = prof.pseudo || '';
              p.tipsterDesc   = prof.description || '';
            });
          }
        }
      }
    } catch(e) { console.error('Erreur fetch pronos:', e); }

    userState.realAchats = achats.map(a => {
      const p = pronosMap[a.prono_id] || {};
      return {
        id:             a.id,
        game:           p.game || "—",
        sport:          p.sport || '—',
        date:           p.match_date || '—',
        tipster:        p.tipsterName   || '—',
        tipsterId:      p.tipster_id    || '',
        tipsterAvatar:  p.tipsterAvatar || '',
        tipsterPseudo:  p.tipsterPseudo || '',
        tipsterDesc:    p.tipsterDesc   || '',
        price:          parseFloat(a.amount) || 0,
        status:         a.status || 'pending',
        content:        p.content || '',
        cote:           p.cote || null,
        image_url:      p.image_url || null,
        image_status:   p.image_status || 'none',
        pronoId:        a.prono_id,
        isFreebet:      a.is_freebet || false,
      };
    });
  } else {
    userState.realAchats = [];
  }

  // Charger les pronos disponibles via fetch direct
  try {
    const url2 = new URL('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/pronos');
    url2.searchParams.set('select', 'id,game,sport,match_date,content,analysis,show_cote,price,status,tipster_id,cote,image_url,image_status');
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
    // Meta Pixel — dépôt réussi
    if (typeof fbq === 'function') fbq('track', 'AddPaymentInfo', { value: parseFloat(amount) || 0, currency: 'EUR' });
    setTimeout(() => showToast('Paiement reussi ! ' + amount + 'eur ajoutes a votre solde.', 'success'), 300);
  } else if (urlParams.get('payment') === 'cancelled') {
    window.history.replaceState({}, '', '/pages/dashboard-user.html');
    navigateTo('solde');
    setTimeout(() => showToast('Paiement annule.', 'info'), 300);
  } else {
    navigateTo('dashboard');
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
  const titles = { dashboard:'Tableau de bord', achats:'Mes achats', solde:'Mon solde & historique', parametres:'Paramètres', explorer:'Explorer les pronos', 'explorer-tipsters':'Explorer les tipsters', feedback:'Feedback & Nouveautés' };
  document.getElementById('topbar-title').textContent = titles[page] || '';
  const el = document.getElementById('page-content');
  el.innerHTML = '';
  if (page === 'dashboard')         renderPageDashboard(el);
  if (page === 'achats')            renderPageAchats(el);
  if (page === 'solde')             renderPageSolde(el);
  if (page === 'parametres')        renderPageParametres(el);
  if (page === 'explorer')          renderPageExplorer(el);
  if (page === 'explorer-tipsters') renderPageExplorerTipsters(el);
  if (page === 'feedback')          renderPageFeedback(el, false);
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
        <div class="stat-card__sub">${won}V · ${lost}D · ${canc} annulé(s)</div>
      </div>
    </div>

    <div class="section-header" style="margin-top:var(--space-md)">
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
            <div class="achat-card__meta">${a.sport} · ${formatDate(a.date)} · par <strong>${a.tipster}</strong>${a.isFreebet ? ' · <span style="color:#854F0B;font-weight:600">Freebet</span>' : ''}</div>
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
        ${a.image_url && a.image_status === 'approved' ? `
        <div style="margin-top:8px;margin-bottom:8px;text-align:center">
          <button onclick="openImagePopup('${a.image_url}')" style="display:inline-flex;align-items:center;gap:6px;background:var(--blue-pale);border:1px solid var(--blue);border-radius:var(--radius-md);padding:8px 16px;font-size:0.82rem;font-weight:600;color:var(--blue);cursor:pointer">
            🖼️ Le prono en image
          </button>
        </div>` : ''}
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

        <!-- Dépôt Crypto -->
        <div class="rib-card" style="border:1px solid #6366f1">
          <div class="rib-card__header">
            <div style="font-size:1.4rem">🔷</div>
            <div><h3 style="color:#4338ca">Recharger en crypto</h3><p>USDC sur Arbitrum One</p></div>
          </div>
          <div class="form-group">
            <label>💶 Montant souhaité (en euros)</label>
            <div class="input-wrap">
              <input class="input" type="number" id="crypto-amount" placeholder="Ex: 20" min="5" step="1" oninput="updateCryptoAmount()"/>
            </div>
          </div>
          <div id="crypto-usdc-preview" style="display:none;background:#eef2ff;border-radius:var(--radius-sm);padding:10px 12px;font-size:0.85rem;color:#3730a3;margin-bottom:var(--space-md);line-height:1.6"></div>
          <div style="margin-bottom:var(--space-md)">
            <label style="font-size:0.78rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">Adresse wallet (Arbitrum One)</label>
            <div style="display:flex;gap:8px;margin-top:6px">
              <div style="flex:1;background:var(--bg-soft);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 10px;font-size:0.75rem;font-family:monospace;color:var(--text-dark);word-break:break-all">0xb2b6ff0c9c29c745129489f4a24cdfbc837cf730</div>
              <button onclick="navigator.clipboard.writeText('0xb2b6ff0c9c29c745129489f4a24cdfbc837cf730').then(()=>showToast('Adresse copiée ✓','success'))" style="background:var(--blue);color:white;border:none;border-radius:var(--radius-sm);padding:8px 12px;font-size:0.8rem;cursor:pointer;white-space:nowrap">📋 Copier</button>
            </div>
            <div style="margin-top:8px;padding:8px 10px;background:#fef3c7;border-radius:var(--radius-sm);font-size:0.75rem;color:#92400e">
              ⚠️ <strong>Réseau : Arbitrum One uniquement</strong> — Ne pas envoyer sur un autre réseau, les fonds seraient perdus.
            </div>
          </div>
          <button class="btn" style="width:100%;background:#6366f1;color:white;border:none" onclick="confirmCryptoDeposit()">
            ✅ J'ai effectué le virement
          </button>
          <p style="text-align:center;font-size:0.73rem;color:var(--text-muted);margin-top:var(--space-sm)">
            Votre solde sera crédité après vérification manuelle (sous 24h)
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

async function updateCryptoAmount() {
  const val = parseFloat(document.getElementById('crypto-amount')?.value);
  const preview = document.getElementById('crypto-usdc-preview');
  if (!preview) return;
  if (!val || val < 5) { preview.style.display = 'none'; return; }
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=eur');
    const data = await r.json();
    const eurPerUsdc = data['usd-coin']?.eur || 1;
    const usdc = (val / eurPerUsdc).toFixed(2);
    preview.style.display = 'block';
    preview.innerHTML = `Vous devez envoyer environ <strong>${usdc} USDC</strong> (1 USDC ≈ ${eurPerUsdc.toFixed(4)} €)`;
  } catch(e) {
    preview.style.display = 'block';
    preview.innerHTML = `Environ <strong>${val} USDC</strong> (taux indisponible)`;
  }
}

async function confirmCryptoDeposit() {
  const val = parseFloat(document.getElementById('crypto-amount')?.value);
  if (!val || val < 5) { showToast('Montant minimum : 5 €', 'error'); return; }
  const btn = document.querySelector('[onclick="confirmCryptoDeposit()"]');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Envoi en cours…'; }
  try {
    const user = await getCurrentUser();
    const r = await fetch('/api/crypto-deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, amountEur: val })
    });
    const data = await r.json();
    if (!data.success) throw new Error(data.error || 'Erreur');
    showToast('✓ Demande envoyée ! Votre solde sera crédité sous 24h.', 'success');
    if (btn) { btn.disabled = false; btn.textContent = '✅ J\'ai effectué le virement'; }
  } catch(e) {
    showToast('Erreur : ' + e.message, 'error');
    if (btn) { btn.disabled = false; btn.textContent = '✅ J\'ai effectué le virement'; }
  }
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
  const cardStyle = 'background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin-bottom:10px';
  const headStyle = 'display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--border)';
  const iconStyle = 'width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0';
  const titleStyle = 'font-size:13px;font-weight:600;color:var(--text-dark)';
  const bodyStyle = 'padding:14px;display:flex;flex-direction:column;gap:10px';
  const labelStyle = 'font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:3px';
  const btnPrimary = 'background:var(--blue);color:white;border:none;border-radius:var(--radius-sm);padding:7px 16px;font-size:12px;font-weight:600;cursor:pointer;align-self:flex-start';
  const btnGreen = 'background:#25D366;color:white;border:none;border-radius:var(--radius-sm);padding:7px 16px;font-size:12px;font-weight:600;cursor:pointer;width:100%';

  container.innerHTML = `
    <div style="max-width:480px;display:flex;flex-direction:column">

      <!-- BLOC 0 : Code parrain -->
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--border)">
          <div style="width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:var(--blue-pale)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <span style="font-size:13px;font-weight:600;color:var(--text-dark)">Mon code parrain</span>
        </div>
        <div style="padding:14px">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;line-height:1.5">Partagez ce code à vos amis. Ils reçoivent <strong>2€</strong> à leur premier dépôt, et vous aussi !</div>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="flex:1;background:var(--bg-soft);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 14px;font-size:16px;font-weight:800;font-family:monospace;color:var(--blue);letter-spacing:2px;text-align:center">
              ${u.referralCode || '—'}
            </div>
            <button onclick="copyReferralCode('${u.referralCode}')" style="background:var(--blue);color:white;border:none;border-radius:var(--radius-sm);padding:10px 16px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap">
              📋 Copier
            </button>
          </div>
        </div>
      </div>

      <!-- BLOC 1 : Infos perso -->
      <div style="${cardStyle}">
        <div style="${headStyle}">
          <div style="${iconStyle};background:var(--blue-pale)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          </div>
          <span style="${titleStyle}">Informations personnelles</span>
        </div>
        <div style="${bodyStyle}">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div>
              <div style="${labelStyle}">Prénom</div>
              <input class="input" type="text" id="p-fn" value="${u.firstName}" style="font-size:13px"/>
            </div>
            <div>
              <div style="${labelStyle}">Nom</div>
              <input class="input" type="text" id="p-ln" value="${u.lastName}" style="font-size:13px"/>
            </div>
          </div>
          <div>
            <div style="${labelStyle}">Email</div>
            <input class="input" type="email" id="p-email" value="${u.email}" style="font-size:13px"/>
          </div>
          <button style="${btnPrimary}" onclick="showToast('Profil mis à jour ✓','success')">Enregistrer</button>
        </div>
      </div>

      <!-- BLOC 2 : WhatsApp freebet -->
      ${!u.whatsappSent ? `
      <div style="${cardStyle};border-color:#25D366">
        <div style="${headStyle};border-bottom-color:#25D366">
          <div style="${iconStyle};background:#E1F5EE">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#085041"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.554 4.1 1.523 5.824L.057 23.885a.5.5 0 00.606.609l6.202-1.426A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.655-.523-5.166-1.432l-.369-.22-3.826.879.918-3.701-.243-.381A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
          </div>
          <span style="${titleStyle};color:#085041">2€ offerts sur votre freebet</span>
          <button onclick="const t=document.getElementById('wa-tip');t.style.display=t.style.display==='none'?'block':'none'"
            style="margin-left:auto;width:18px;height:18px;border-radius:50%;border:1px solid var(--border);background:transparent;cursor:pointer;font-size:10px;font-weight:700;color:var(--text-muted);flex-shrink:0;display:flex;align-items:center;justify-content:center">i</button>
        </div>
        <div id="wa-tip" style="display:none;padding:10px 14px;background:var(--bg-soft);border-bottom:1px solid var(--border);font-size:12px;color:var(--text-muted);line-height:1.5">
          Le fondateur de PayPerWin vous contactera sur WhatsApp pour vérifier votre numéro. Le freebet sera crédité manuellement. Offre valable une seule fois.
        </div>
        <div style="${bodyStyle}">
          <div>
            <div style="${labelStyle}">Votre numéro WhatsApp</div>
            <div style="display:flex;gap:6px">
              <input id="p-wa-indicatif" class="input" type="text" value="+33" placeholder="+33" style="width:70px;flex-shrink:0;font-size:13px;text-align:center"/>
              <input class="input" type="tel" id="p-wa-num" placeholder="6 12 34 56 78" value="${u.whatsapp}" style="flex:1;font-size:13px"/>
            </div>
          </div>
          <div style="padding:8px 10px;background:#E1F5EE;border-radius:var(--radius-sm);font-size:12px;color:#085041;line-height:1.5">
            🎁 Après vérification, <strong>2€ freebet</strong> seront crédités par le fondateur.
          </div>
          <button style="${btnGreen}" onclick="saveWhatsapp()">💬 Envoyer mon numéro</button>
        </div>
      </div>` : `
      <div style="${cardStyle};border-color:#25D366">
        <div style="${headStyle}">
          <div style="${iconStyle};background:#E1F5EE">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#085041" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <span style="${titleStyle};color:#085041">Numéro envoyé — en attente</span>
        </div>
        <div style="padding:12px 14px;font-size:12px;color:var(--text-muted);line-height:1.5">
          ${u.whatsapp} · Le fondateur vous contactera pour confirmer et créditer vos 2€.
        </div>
      </div>`}

      <!-- BLOC 3 : Mot de passe -->
      <div style="${cardStyle}">
        <div style="${headStyle}">
          <div style="${iconStyle};background:var(--bg-soft)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <span style="${titleStyle}">Mot de passe</span>
        </div>
        <div style="${bodyStyle}">
          <div>
            <div style="${labelStyle}">Mot de passe actuel</div>
            <div style="position:relative">
              <input class="input" type="password" id="p-pw-old" placeholder="••••••••" style="font-size:13px;padding-right:36px"/>
              <button onclick="togglePw('p-pw-old',this)" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:14px;color:var(--text-muted)">👁</button>
            </div>
          </div>
          <div>
            <div style="${labelStyle}">Nouveau mot de passe</div>
            <div style="position:relative">
              <input class="input" type="password" id="p-pw-new" placeholder="••••••••" style="font-size:13px;padding-right:36px"/>
              <button onclick="togglePw('p-pw-new',this)" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:14px;color:var(--text-muted)">👁</button>
            </div>
          </div>
          <button style="${btnPrimary}" onclick="savePassword()">Mettre à jour</button>
        </div>
      </div>

      <!-- BLOC 4 : Zone de danger (discrète) -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border:1px solid var(--border);border-radius:var(--radius-md);margin-top:4px">
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--text-dark)">Supprimer mon compte</div>
          <div style="font-size:11px;color:var(--text-muted)">Action irréversible</div>
        </div>
        <button style="background:transparent;color:var(--error);border:1px solid var(--error);border-radius:var(--radius-sm);padding:5px 12px;font-size:11px;cursor:pointer"
          onclick="if(confirm('Supprimer votre compte ? Cette action est irréversible.')) showToast('Fonctionnalité disponible bientôt.','info')">
          Supprimer
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

function copyReferralCode(code) {
  if (!code) return;
  navigator.clipboard.writeText(code).then(() => {
    showToast('Code copié : ' + code, 'success');
  }).catch(() => {
    showToast('Code : ' + code, 'info');
  });
}

async function saveWhatsapp() {
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';
  const indicatif = document.getElementById('p-wa-indicatif')?.value || '+33';
  const num = document.getElementById('p-wa-num')?.value.trim().replace(/\s/g, '');
  if (!num || num.length < 6) { showToast('Numéro invalide.', 'error'); return; }
  const fullNum = indicatif + num;
  const userId = userState.userId;
  if (!userId) { showToast('Erreur utilisateur.', 'error'); return; }
  try {
    const r = await fetch(`${SUPA}/rest/v1/profiles?id=eq.${userId}&apikey=${ANON}`, {
      method: 'PATCH',
      headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ whatsapp: fullNum })
    });
    if (!r.ok) throw new Error('Erreur');
    MOCK_USER.whatsapp = fullNum;
    MOCK_USER.whatsappSent = true;
    // Sync WhatsApp dans Brevo
    fetch('/api/sync-brevo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: MOCK_USER.email, prenom: MOCK_USER.firstName, listId: 3, sms: fullNum })
    }).catch(() => {});
    showToast('Numéro envoyé ! Vous serez contacté sous peu. 💬', 'success');
    setTimeout(() => renderPageParametres(document.getElementById('page-content')), 800);
  } catch(e) {
    showToast('Une erreur est survenue.', 'error');
  }
}

// ══════════════════════════════════════════════════════════════
//  PAGE — EXPLORER LES TIPSTERS / ACHETER UN PRONO
// ══════════════════════════════════════════════════════════════
// Filtre sport actif pour l'explorer pronos
let explorerSportFilter = 'tous';

function renderPageExplorer(container) {
  const pronos = userState.availablePronos;
  const alreadyBought = new Set(userState.realAchats.map(a => a.pronoId));

  if (!pronos.length) {
    container.innerHTML = `
      <div class="section-header"><div><h2>Explorer les pronos</h2><p>Pronos disponibles à l'achat</p></div></div>
      <div class="empty-state"><div class="empty-state__icon">🔍</div><h3>Aucun prono disponible</h3><p>Revenez plus tard !</p></div>`;
    return;
  }

  // Filtrage par sport
  const sportKeywords = {
    foot:    ['foot', 'ligue', 'liga', 'premier', 'serie a', 'bundesliga', 'mls', 'uefa', 'champions', 'europa', 'soccer'],
    tennis:  ['tennis', 'atp', 'wta', 'roland', 'wimbledon', 'open'],
    basket:  ['basket', 'nba', 'nfl', 'bball'],
    rugby:   ['rugby', 'top 14', 'top14', 'pro d2', 'six nations'],
  };

  function getSportCategory(sport) {
    const s = (sport || '').toLowerCase();
    for (const [cat, keys] of Object.entries(sportKeywords)) {
      if (keys.some(k => s.includes(k))) return cat;
    }
    return 'autres';
  }

  const filtered = explorerSportFilter === 'tous'
    ? pronos
    : pronos.filter(p => getSportCategory(p.sport) === explorerSportFilter);

  const sportBtns = [
    { key: 'tous',   label: '🌐 Tous' },
    { key: 'foot',   label: '⚽ Foot' },
    { key: 'tennis', label: '🎾 Tennis' },
    { key: 'basket', label: '🏀 Basket' },
    { key: 'rugby',  label: '🏉 Rugby' },
    { key: 'autres', label: '➕ Autres' },
  ].map(s => `<button class="filter-btn ${explorerSportFilter === s.key ? 'active' : ''}"
    onclick="explorerSportFilter='${s.key}';renderPageExplorer(document.getElementById('page-content'))"
    style="font-size:0.82rem">${s.label}</button>`).join('');

  container.innerHTML = `
    <div class="section-header">
      <div><h2>Explorer les pronos</h2><p>${filtered.length} / ${pronos.length} prono(s)</p></div>
    </div>
    <div class="achats-filters" style="margin-bottom:var(--space-sm)">${sportBtns}</div>
    ${filtered.length === 0 ? `<div class="empty-state"><div class="empty-state__icon">🔍</div><h3>Aucun prono dans cette catégorie</h3><p>Essayez une autre.</p></div>` : `
    <div style="display:flex;flex-direction:column;gap:var(--space-md)">
      ${filtered.map(p => {
        const tipsterName = p.tipsterName || '—';
        const tipsterAvatar = p.tipsterAvatar || '';
        const avatarHtml = tipsterAvatar
          ? `<img src="${tipsterAvatar}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;flex-shrink:0" />`
          : `<div style="width:24px;height:24px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.7rem;flex-shrink:0">${tipsterName[0]?.toUpperCase()}</div>`;
        const bought = alreadyBought.has(p.id);
        const expired = isMatchExpired(p.match_date);
        const tipsterHref = p.tipsterPseudo ? 'https://payperwin.co/' + p.tipsterPseudo : '../pages/tipster-public.html?id=' + p.tipster_id;
        return `
        <div class="achat-card" style="border-left-color:var(--blue);padding:0;overflow:hidden">
          <div style="padding:12px 14px 10px">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:8px">
              ${avatarHtml}
              <div style="font-size:0.8rem;color:var(--text-muted);flex:1;min-width:0">
                <a href="${tipsterHref}" target="_blank" style="color:var(--blue);font-weight:600;text-decoration:none">${tipsterName}</a>
                <span style="white-space:nowrap">· ${p.sport} · ${formatDate(p.match_date)}</span>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px">
              <div class="achat-card__match" style="flex:1;min-width:0;margin:0">${p.game}</div>
              ${bought
                ? `<span class="badge badge-won" style="flex-shrink:0">✓ Acheté</span>`
                : `<button class="btn btn-primary" style="font-size:0.82rem;padding:6px 14px;border-radius:20px;flex-shrink:0;white-space:nowrap" onclick="buyProno('${p.id}', ${p.price}, '${p.game.replace(/'/g,"\'")}')">
                    ${p.price} € · Acheter
                  </button>`
              }
            </div>
            ${p.cote && p.show_cote !== false ? `<span style="font-size:0.75rem;color:var(--text-muted);background:var(--bg-soft);padding:2px 8px;border-radius:10px">📊 Cote ${parseFloat(p.cote).toFixed(2).replace('.', ',')}</span>` : ''}
          </div>
          ${p.image_url && p.image_status === 'approved' && bought ? `<div style="padding:0 14px 10px;text-align:center"><button onclick="openImagePopup('${p.image_url}')" style="display:inline-flex;align-items:center;gap:6px;background:var(--blue-pale);border:1px solid var(--blue);border-radius:var(--radius-md);padding:8px 16px;font-size:0.82rem;font-weight:600;color:var(--blue);cursor:pointer">🖼️ Le prono en image</button></div>` : ''}
          ${bought ? `<div style="margin:0 14px 10px;padding:10px;background:var(--blue-pale);border-radius:var(--radius-sm);font-size:0.88rem;display:flex;flex-direction:column;gap:8px">
            <div><strong>🎯 Pronostic :</strong> ${p.content || '—'}</div>
            ${p.analysis ? `<div style="padding-top:8px;border-top:1px solid rgba(0,0,0,.08)"><strong>📝 Analyse :</strong> ${p.analysis}</div>` : ''}
          </div>` : `<div style="padding:7px 14px;border-top:0.5px solid var(--border);background:var(--bg-soft);font-size:0.8rem;color:var(--text-muted);display:flex;align-items:center;gap:5px">🔒 Achetez pour voir le pronostic</div>`}
        </div>`;
      }).join('')}
    </div>`}
  `;
}

async function buyProno(pronoId, price, matchName) {
  const hasFreebet = MOCK_USER.freebet > 0;
  const hasBalance = MOCK_USER.balance >= price;
  const hasFreebetEnough = MOCK_USER.freebet >= price;

  if (!hasBalance && !hasFreebetEnough) {
    showToast('Solde insuffisant. Rechargez votre compte !', 'error');
    return;
  }

  // Si l'user a du freebet suffisant, on lui propose le choix via une modal
  if (hasFreebet && hasFreebetEnough) {
    showBuyModal(pronoId, price, matchName, hasBalance);
    return;
  }

  // Sinon achat direct avec le solde normal
  await executeBuyProno(pronoId, price, matchName, false);
}

function showBuyModal(pronoId, price, matchName, hasBalance) {
  const existing = document.getElementById('buy-modal-overlay');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'buy-modal-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px';

  overlay.innerHTML = `
    <div style="background:#ffffff;border-radius:12px;width:100%;max-width:380px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="padding:16px 16px 12px;border-bottom:0.5px solid #e2e8f0">
        <div style="font-size:1rem;font-weight:700;color:#1a202c">Acheter ce pronostic</div>
        <div style="font-size:0.82rem;color:#718096;margin-top:4px">${matchName} — ${formatEuros(price)}</div>
      </div>
      <div style="padding:14px 16px;display:flex;flex-direction:column;gap:10px">
        <div style="font-size:0.82rem;color:#718096">Choisissez votre mode de paiement :</div>
        ${hasBalance ? `
        <label id="opt-solde" onclick="selectPayMode('solde')" style="display:flex;align-items:center;gap:10px;padding:11px 12px;border:1.5px solid #2563eb;border-radius:8px;cursor:pointer;background:#eff6ff">
          <div id="radio-solde" style="width:16px;height:16px;border-radius:50%;border:2px solid #2563eb;background:#2563eb;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <div style="width:6px;height:6px;border-radius:50%;background:white"></div>
          </div>
          <div>
            <div style="font-size:0.82rem;font-weight:700;color:#1d4ed8">Solde (${formatEuros(MOCK_USER.balance)})</div>
            <div style="font-size:0.72rem;color:#718096;margin-top:1px">Si perdu : remboursé automatiquement</div>
          </div>
        </label>` : ''}
        <label id="opt-freebet" onclick="selectPayMode('freebet')" style="display:flex;align-items:center;gap:10px;padding:11px 12px;border:1.5px solid ${hasBalance ? '#e2e8f0' : '#EF9F27'};border-radius:8px;cursor:pointer;background:${hasBalance ? '#ffffff' : '#FFF8EE'}">
          <div id="radio-freebet" style="width:16px;height:16px;border-radius:50%;border:2px solid #EF9F27;background:${hasBalance ? 'white' : '#EF9F27'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
            ${!hasBalance ? '<div style="width:6px;height:6px;border-radius:50%;background:white"></div>' : ''}
          </div>
          <div>
            <div style="font-size:0.82rem;font-weight:700;color:#633806">Freebet (${formatEuros(MOCK_USER.freebet)})</div>
            <div style="font-size:0.72rem;color:#854F0B;margin-top:1px">Si perdu : non remboursé</div>
          </div>
        </label>
        <button id="btn-confirmer-achat" style="width:100%;background:#2563eb;color:white;border:none;border-radius:8px;padding:11px;font-size:0.88rem;font-weight:700;cursor:pointer;margin-top:2px">Acheter — ${formatEuros(price)}</button>
        <button onclick="document.getElementById('buy-modal-overlay').remove()" style="width:100%;background:none;border:none;color:#718096;font-size:0.82rem;cursor:pointer;padding:4px">Annuler</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  // Sélection initiale après insertion dans le DOM
  window._buyPayMode = hasBalance ? 'solde' : 'freebet';
  window._buyPronoId = pronoId;
  window._buyPrice = price;
  window._buyMatchName = matchName;
  document.getElementById('btn-confirmer-achat').addEventListener('click', async () => {
    const useFreebet = window._buyPayMode === 'freebet';
    document.getElementById('buy-modal-overlay')?.remove();
    await executeBuyProno(window._buyPronoId, window._buyPrice, window._buyMatchName, useFreebet);
  });
}

window.selectPayMode = function(mode) {
  window._buyPayMode = mode;
  const soldeOpt = document.getElementById('opt-solde');
  const fbOpt    = document.getElementById('opt-freebet');
  const radioS   = document.getElementById('radio-solde');
  const radioFB  = document.getElementById('radio-freebet');
  if (soldeOpt) {
    soldeOpt.style.border = mode === 'solde' ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0';
    soldeOpt.style.background = mode === 'solde' ? '#eff6ff' : '#ffffff';
    radioS.style.background = mode === 'solde' ? '#2563eb' : 'white';
    radioS.innerHTML = mode === 'solde' ? '<div style="width:6px;height:6px;border-radius:50%;background:white"></div>' : '';
  }
  fbOpt.style.border = mode === 'freebet' ? '1.5px solid #EF9F27' : '1.5px solid #e2e8f0';
  fbOpt.style.background = mode === 'freebet' ? '#FFF8EE' : '#ffffff';
  radioFB.style.background = mode === 'freebet' ? '#EF9F27' : 'white';
  radioFB.innerHTML = mode === 'freebet' ? '<div style="width:6px;height:6px;border-radius:50%;background:white"></div>' : '';
};

window.confirmBuyModal = async function(pronoId, price, matchName) {
  const useFreebet = window._buyPayMode === 'freebet';
  document.getElementById('buy-modal-overlay')?.remove();
  await executeBuyProno(pronoId, price, matchName, useFreebet);
};

async function executeBuyProno(pronoId, price, matchName, useFreebet) {
  try {
    const user = await getCurrentUser();
    const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
    const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';

    // Vérifier qu'il n'a pas déjà acheté
    const { data: existing } = await sb.from('purchases').select('id').eq('user_id', user.id).eq('prono_id', pronoId).maybeSingle();
    if (existing) { showToast('Vous avez déjà acheté ce prono.', 'info'); return; }

    // Préparer la mise à jour du profil
    let profileUpdate = {};
    if (useFreebet) {
      const newFreebet = Math.round((MOCK_USER.freebet - price) * 100) / 100;
      profileUpdate = { freebet_balance: newFreebet };
    } else {
      const newBalance = MOCK_USER.balance - price;
      const newPending = (MOCK_USER.pending || 0) + price;
      profileUpdate = { balance: newBalance, pending: newPending };
    }

    // Mettre à jour le profil
    const { error: balErr } = await sb.from('profiles').update(profileUpdate).eq('id', user.id);
    if (balErr) throw balErr;

    // Créer l'achat avec le flag is_freebet
    const { error: purchErr } = await sb.from('purchases').insert({
      user_id: user.id,
      prono_id: pronoId,
      amount: price,
      status: 'pending',
      is_freebet: useFreebet
    });
    if (purchErr) throw purchErr;

    // Incrémenter buyers sur le prono
    try {
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
    if (useFreebet) {
      MOCK_USER.freebet = Math.round((MOCK_USER.freebet - price) * 100) / 100;
    } else {
      MOCK_USER.balance = MOCK_USER.balance - price;
      MOCK_USER.pending = (MOCK_USER.pending || 0) + price;
      const topbarBalance = document.getElementById('topbar-balance');
      if (topbarBalance) topbarBalance.textContent = '🔥 ' + formatEuros(MOCK_USER.balance);
    }

    // Recharger les achats
    const { data: achats } = await sb.from('purchases').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (achats && achats.length > 0) {
      const pronoIds = achats.map(a => a.prono_id);
      const { data: pronosData } = await sb.from('pronos').select('id, game, sport, match_date, content').in('id', pronoIds);
      const pronosMap = {};
      (pronosData || []).forEach(p => pronosMap[p.id] = p);
      userState.realAchats = achats.map(a => {
        const p = pronosMap[a.prono_id] || {};
        return { id: a.id, game: p.game||'—', sport: p.sport||'—', date: p.match_date||'—', tipster:'—', price: parseFloat(a.amount)||0, status: a.status||'pending', prediction: p.content||'', content_odds: '', image_url: p.image_url||null, image_status: p.image_status||'none', pronoId: a.prono_id, isFreebet: a.is_freebet||false };
      });
    } else { userState.realAchats = []; }

    showToast(useFreebet ? 'Prono acheté avec votre freebet ! 🎯' : 'Prono acheté ! Bonne chance 🎯', 'success');
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
  if (!match_date || !match_date.includes(' · ')) return false;
  try {
    const parts = match_date.split(' · ');
    const [year, month, day] = parts[0].trim().split('-').map(Number);
    const [hours, minutes] = parts[1].trim().split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, 0) < new Date();
  } catch(e) { return false; }
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
async function renderPageExplorerTipsters(container) {
  container.innerHTML = `
    <div class="section-header">
      <div><h2>Explorer les tipsters</h2><p>Classés par win rate</p></div>
    </div>
    <div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">Chargement...</div>`;

  try {
    const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';
    const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';

    // Récupérer tous les tipsters
    const resp = await fetch(
      `${SUPA}/rest/v1/profiles?select=id,first_name,last_name,pseudo,avatar_url&role=eq.tipster&apikey=${ANON}`
    );
    const tipsters = await resp.json();

    // Récupérer tous les pronos
    const resp2 = await fetch(
      `${SUPA}/rest/v1/pronos?select=tipster_id,status,buyers&apikey=${ANON}`
    );
    const pronos = await resp2.json();

    // Calculer les stats par tipster
    const stats = {};
    for (const t of tipsters) {
      const myPronos = pronos.filter(p => p.tipster_id === t.id);
      const won  = myPronos.filter(p => p.status === 'won').length;
      const lost = myPronos.filter(p => p.status === 'lost').length;
      const total = myPronos.length;
      const totalAcheteurs = myPronos.reduce((s,p) => s + (parseInt(p.buyers)||0), 0);
      const winRate = (won + lost) > 0 ? Math.round(won / (won + lost) * 100) : null;
      stats[t.id] = { won, lost, total, totalAcheteurs, winRate };
    }

    // Trier par win rate décroissant (null en dernier)
    tipsters.sort((a, b) => {
      const wa = stats[a.id].winRate;
      const wb = stats[b.id].winRate;
      if (wa === null && wb === null) return 0;
      if (wa === null) return 1;
      if (wb === null) return -1;
      return wb - wa;
    });

    // État pour le filtre
    let filterVal = '';

    function renderList() {
      const filtered = tipsters.filter(t => {
        const pseudo = (t.pseudo || '').toLowerCase();
        return pseudo.includes(filterVal.toLowerCase());
      });

      const listEl = document.getElementById('tipsters-list');
      if (!filtered.length) {
        listEl.innerHTML = `<div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">Aucun tipster trouvé.</div>`;
        return;
      }

      listEl.innerHTML = filtered.map((t, i) => {
        const s = stats[t.id];
        const pseudo = t.pseudo || (t.first_name + ' ' + t.last_name);
        const avatarHtml = t.avatar_url
          ? `<img src="${t.avatar_url}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;flex-shrink:0" />`
          : `<div style="width:44px;height:44px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;flex-shrink:0">${pseudo[0]?.toUpperCase()}</div>`;
        const winRateHtml = s.winRate !== null
          ? `<span style="font-weight:800;font-size:1rem;color:${s.winRate>=60?'var(--success)':'var(--warning)'}">${s.winRate}%</span>`
          : `<span style="color:var(--text-muted);font-size:0.85rem">—</span>`;
        const rankColor = i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--text-muted)';

        return `
        <a href="${t.pseudo ? 'https://payperwin.co/' + t.pseudo : '#'}" target="_blank" style="text-decoration:none">
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
            </div>
          </div>
        </a>`;
      }).join('');
    }

    container.innerHTML = `
      <div class="section-header">
        <div><h2>Explorer les tipsters</h2><p>${tipsters.length} tipsters inscrits</p></div>
      </div>
      <div class="tipster-search-wrap">
        <span class="input-icon">🔍</span>
        <input class="input" id="tipster-search" type="text" placeholder="Rechercher par pseudo..." oninput="document.tipsterFilter(this.value)" />
      </div>
      <div id="tipsters-list"></div>`;

    document.tipsterFilter = (val) => { filterVal = val; renderList(); };
    renderList();

  } catch(e) {
    container.innerHTML = `<div style="text-align:center;padding:var(--space-2xl);color:var(--error)">Erreur : ${e.message}</div>`;
    console.error('renderPageExplorerTipsters:', e);
  }
}

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
        <div id="score-info-popover" style="display:none;position:absolute;top:28px;left:50%;transform:translateX(-50%);width:260px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-md);font-size:0.8rem;color:var(--text-body);line-height:1.6;box-shadow:var(--shadow-md);z-index:100">
          <strong style="color:var(--text-dark);display:block;margin-bottom:6px">🏆 Comment fonctionne le Score ?</strong>
          Le Score récompense les tipsters qui gagnent souvent, sur des cotes élevées, et sur la durée.<br><br>
          Un tipster avec 1 seul prono gagné n'aura jamais un bon score, même s'il est à 100%.
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

// ══════════════════════════════════════════════════════════════
//  PAGE — FEEDBACK & NOUVEAUTÉS
// ══════════════════════════════════════════════════════════════
async function renderPageFeedback(container, isAdmin) {
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';

  // Charger le changelog
  const rCL = await fetch(`${SUPA}/rest/v1/changelog?select=*&order=created_at.desc&apikey=${ANON}`, {
    headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON }
  });
  const changelog = await rCL.json().catch(() => []);

  const badgeColors = {
    'Nouveau':        { bg: 'var(--blue-pale)',    color: 'var(--blue)',    },
    'Amélioration':   { bg: 'var(--success-pale)', color: 'var(--success)' },
    'Correction bug': { bg: 'var(--error-pale)',   color: 'var(--error)'   },
  };

  const changelogHtml = Array.isArray(changelog) && changelog.length > 0
    ? changelog.map(e => {
        const bc = badgeColors[e.type] || badgeColors['Nouveau'];
        const date = new Date(e.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });
        return `
        <div style="padding:var(--space-md) var(--space-lg);border-bottom:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:6px;flex-wrap:wrap">
            <span style="font-size:0.72rem;font-weight:700;padding:3px 10px;border-radius:var(--radius-full);background:${bc.bg};color:${bc.color}">${e.type}</span>
            <span style="font-size:0.78rem;color:var(--text-muted)">${date}</span>
          </div>
          <div style="font-weight:700;color:var(--text-dark);margin-bottom:4px">${e.titre}</div>
          <div style="font-size:0.88rem;color:var(--text-muted);line-height:1.6">${e.description}</div>
        </div>`;
      }).join('')
    : `<div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">Aucune nouveauté pour l'instant.</div>`;

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:var(--space-lg)">

      <!-- Changelog -->
      <div>
        <div class="section-header"><div><h2>📣 Nouveautés</h2><p>Les dernières mises à jour de PayPerWin</p></div></div>
        <div class="pronos-table" style="padding:0">
          ${changelogHtml}
        </div>
      </div>

      <!-- Formulaire feedback -->
      <div>
        <div class="section-header"><div><h2>💬 Votre avis</h2><p>Suggestions, bugs, idées — on lit tout</p></div></div>
        <div class="pronos-table" style="padding:var(--space-lg);display:flex;flex-direction:column;gap:var(--space-md)">
          <div class="form-group">
            <label>Catégorie</label>
            <select class="input" id="fb-categorie" style="cursor:pointer">
              <option value="suggestion">💡 Suggestion</option>
              <option value="bug">🐛 Bug</option>
              <option value="autre">💬 Autre</option>
            </select>
          </div>
          <div class="form-group">
            <label>Titre <span style="color:var(--text-muted);font-weight:400">(résumé court)</span></label>
            <input class="input" type="text" id="fb-titre" placeholder="Ex: Ajouter un filtre par sport" maxlength="100" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea class="input input-textarea" id="fb-description" placeholder="Décrivez votre idée ou le bug rencontré en détail..." style="min-height:120px"></textarea>
          </div>
          <button class="btn btn-primary" onclick="submitFeedback()" style="width:100%">
            Envoyer mon feedback →
          </button>
          <div id="fb-success" style="display:none;background:var(--success-pale);border:1px solid var(--success);border-radius:var(--radius-md);padding:var(--space-md);font-size:0.88rem;color:var(--success);text-align:center">
            ✓ Merci ! Votre feedback a bien été envoyé.
          </div>
        </div>
      </div>

    </div>
  `;
}

async function submitFeedback() {
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';

  const categorie   = document.getElementById('fb-categorie')?.value;
  const titre       = document.getElementById('fb-titre')?.value.trim();
  const description = document.getElementById('fb-description')?.value.trim();

  if (!titre || !description) { showToast('Veuillez remplir le titre et la description.', 'error'); return; }

  const btn = document.querySelector('[onclick="submitFeedback()"]');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Envoi...'; }

  try {
    const { data: { user } } = await sb.auth.getUser();

    // Récupérer profil
    let pseudo = '', email = '', role = '';
    if (user) {
      email = user.email;
      const rP = await fetch(`${SUPA}/rest/v1/profiles?select=pseudo,first_name,last_name,role&id=eq.${user.id}&apikey=${ANON}`, {
        headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON }
      });
      const profiles = await rP.json();
      if (Array.isArray(profiles) && profiles[0]) {
        const p = profiles[0];
        pseudo = p.pseudo || (p.first_name + ' ' + p.last_name);
        role = p.role;
      }
    }

    const r = await fetch(`${SUPA}/rest/v1/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + ANON, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ user_id: user?.id, role, pseudo, email, categorie, titre, description, statut: 'nouveau' })
    });

    if (r.ok || r.status === 201) {
      document.getElementById('fb-success').style.display = 'block';
      document.getElementById('fb-titre').value = '';
      document.getElementById('fb-description').value = '';
    } else {
      throw new Error('Erreur serveur');
    }
  } catch(e) {
    showToast('Erreur lors de l\'envoi : ' + e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Envoyer mon feedback →'; }
  }
}

function openImagePopup(url) {
  const existing = document.getElementById('image-popup-overlay');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'image-popup-overlay';
  overlay.onclick = () => overlay.remove();
  Object.assign(overlay.style, {
    position:'fixed', inset:'0', background:'rgba(0,0,0,0.85)',
    zIndex:'9999', display:'flex', alignItems:'center', justifyContent:'center',
    padding:'20px', cursor:'zoom-out'
  });
  overlay.innerHTML = `
    <div style="position:relative;max-width:90vw;max-height:85vh">
      <img src="${url}" style="max-width:100%;max-height:85vh;object-fit:contain;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.5)" />
      <button onclick="event.stopPropagation();document.getElementById('image-popup-overlay').remove()" style="position:absolute;top:-12px;right:-12px;width:32px;height:32px;border-radius:50%;background:white;border:none;font-size:1rem;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3)">✕</button>
    </div>`;
  document.body.appendChild(overlay);
}

// ══════════════════════════════════════════════════════════════
//  PAGE — TABLEAU DE BORD
// ══════════════════════════════════════════════════════════════
async function renderPageDashboard(container) {
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';

  container.innerHTML = '<div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">⏳ Chargement...</div>';

  // Calcul stats perso
  const achats = userState.realAchats;
  const won  = achats.filter(a => a.status === 'won').length;
  const lost = achats.filter(a => a.status === 'lost').length;
  const canc = achats.filter(a => a.status === 'cancelled').length;
  const pend = achats.filter(a => a.status === 'pending').length;
  const finished = won + lost;
  const winRate  = finished > 0 ? Math.round(won / finished * 100) : 0;
  const remboursed = achats.filter(a => a.status === 'lost' || a.status === 'cancelled')
                           .reduce((s,a) => s + a.price, 0);

  // Alerte pronos nouveaux depuis dernière visite
  const lastVisit = localStorage.getItem('ppw-last-visit') || new Date(0).toISOString();
  const newPronos = userState.availablePronos.filter(p => p.created_at && p.created_at > lastVisit);
  localStorage.setItem('ppw-last-visit', new Date().toISOString());

  // Objectif semaine
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekSpent = achats.filter(a => a.date && new Date(a.date) >= weekStart).reduce((s,a) => s + a.price, 0);
  const weekGoal  = 20;
  const weekPct   = Math.min(100, Math.round(weekSpent / weekGoal * 100));

  // Calcul du meilleur tipster (celui avec le plus de victoires)
  let meilleurTipster = null;
  {
    const achatsTermines = achats.filter(a => a.status === 'won' || a.status === 'lost');
    if (achatsTermines.length > 0) {
      const byTipster = {};
      achatsTermines.forEach(a => {
        if (!a.tipsterId) return;
        if (!byTipster[a.tipsterId]) byTipster[a.tipsterId] = { id: a.tipsterId, name: a.tipster, avatar: a.tipsterAvatar, pseudo: a.tipsterPseudo, desc: a.tipsterDesc, wins: 0, total: 0, cotes: [] };
        if (a.status === 'won') byTipster[a.tipsterId].wins++;
        byTipster[a.tipsterId].total++;
        if (a.cote) byTipster[a.tipsterId].cotes.push(parseFloat(a.cote));
      });
      // Tous les achats (pas seulement terminés) pour le total pronos achetés
      achats.forEach(a => {
        if (byTipster[a.tipsterId]) byTipster[a.tipsterId].totalAchats = (byTipster[a.tipsterId].totalAchats || 0) + 1;
      });
      const sorted = Object.values(byTipster).sort((a, b) => b.wins - a.wins || b.total - a.total);
      if (sorted.length > 0 && sorted[0].wins > 0) meilleurTipster = sorted[0];
    }
  }

  // Charger en parallèle : sponsors, changelog, sondage actif, stats plateforme
  let sponsors = [], changelog = [], poll = null, pollOptions = [], userVote = null;
  let nbTipsters = 0, nbPronos = 0, globalWinRate = 0, nbParieurs = 0;
  let settings = {};
  try {
    const safeJson = async (r) => { try { return await r.json(); } catch(e) { return []; } };
    const [rSp, rCl, rPoll, rTip, rPr, rSettings, rUsers] = await Promise.allSettled([
      fetch(`${SUPA}/rest/v1/sponsors?actif=eq.true&select=id,slot,image_url,description,clicks,tipster_id&apikey=${ANON}`, { headers: { apikey: ANON } }),
      fetch(`${SUPA}/rest/v1/changelog?select=id,titre,description,created_at&order=created_at.desc&apikey=${ANON}`, { headers: { apikey: ANON } }),
      fetch(`${SUPA}/rest/v1/polls?actif=eq.true&select=id,question&apikey=${ANON}`, { headers: { apikey: ANON } }),
      fetch(`${SUPA}/rest/v1/profiles?role=eq.tipster&select=id&apikey=${ANON}`, { headers: { apikey: ANON } }),
      fetch(`${SUPA}/rest/v1/pronos?select=status&apikey=${ANON}`, { headers: { apikey: ANON } }),
      fetch(`${SUPA}/rest/v1/dashboard_settings?select=key,actif&apikey=${ANON}`, { headers: { apikey: ANON } }),
      fetch(`${SUPA}/rest/v1/profiles?role=eq.user&select=id&apikey=${ANON}`, { headers: { apikey: ANON } }),
    ]);
    sponsors    = rSp.status === 'fulfilled' ? await safeJson(rSp.value) : [];
    changelog   = rCl.status === 'fulfilled' ? await safeJson(rCl.value) : [];
    const polls = rPoll.status === 'fulfilled' ? await safeJson(rPoll.value) : [];
    nbTipsters  = rTip.status === 'fulfilled' ? ((await safeJson(rTip.value))?.length || 0) : 0;
    const allPr = rPr.status === 'fulfilled' ? await safeJson(rPr.value) : [];
    const settingsArr = rSettings.status === 'fulfilled' ? await safeJson(rSettings.value) : [];
    nbParieurs = rUsers.status === 'fulfilled' ? ((await safeJson(rUsers.value))?.length || 0) : 0;
    console.log('dashboard_settings reçus:', settingsArr);
    settings = {};
    (settingsArr||[]).forEach(s => { settings[s.key] = (s.actif === true); });
    console.log('settings parsés:', settings);
    if (Array.isArray(allPr)) {
      nbPronos = allPr.length;
      const fin = allPr.filter(p => p.status === 'won' || p.status === 'lost').length;
      const w   = allPr.filter(p => p.status === 'won').length;
      globalWinRate = fin > 0 ? Math.round(w / fin * 100) : 0;
    }
    if (Array.isArray(polls) && polls.length > 0) {
      poll = polls[0];
      const [rOpts, rVote] = await Promise.all([
        fetch(`${SUPA}/rest/v1/poll_options?poll_id=eq.${poll.id}&select=id,label,votes&order=votes.desc&apikey=${ANON}`, { headers: { apikey: ANON } }),
        fetch(`${SUPA}/rest/v1/poll_votes?poll_id=eq.${poll.id}&user_id=eq.${userState.userId}&select=option_id&apikey=${ANON}`, { headers: { apikey: ANON } }),
      ]);
      pollOptions = await rOpts.json();
      const votes = await rVote.json();
      userVote = Array.isArray(votes) && votes.length > 0 ? votes[0].option_id : null;
    }
    // Charger pseudo/avatar des tipsters sponsors
    const tipsterIds = (sponsors||[]).map(s => s.tipster_id).filter(Boolean);
    if (tipsterIds.length > 0) {
      const rTP = await fetch(`${SUPA}/rest/v1/profiles?id=in.(${tipsterIds.join(',')})&select=id,pseudo,first_name,avatar_url,balance&apikey=${ANON}`, { headers: { apikey: ANON } });
      const tProfiles = await rTP.json();
      const tMap = {};
      // Charger stats pronos pour chaque tipster sponsor
      const tipsterStatsMap = {};
      for (const t of (tProfiles||[])) {
        try {
          const rPr = await fetch(`${SUPA}/rest/v1/pronos?tipster_id=eq.${t.id}&select=status,cote&apikey=${ANON}`, { headers: { apikey: ANON } });
          const pr = await rPr.json();
          if (Array.isArray(pr)) {
            const fin = pr.filter(p => p.status==='won'||p.status==='lost');
            const won = pr.filter(p => p.status==='won');
            const cotes = pr.filter(p => p.cote).map(p => parseFloat(p.cote));
            tipsterStatsMap[t.id] = {
              winRate: fin.length > 0 ? Math.round(won.length/fin.length*100) : null,
              nbPronos: pr.length,
              avgCote: cotes.length > 0 ? (cotes.reduce((a,b)=>a+b,0)/cotes.length) : null
            };
          }
        } catch(e) {}
        tMap[t.id] = t;
      }
      sponsors = (sponsors||[]).map(s => ({ ...s, tipsterProfile: { ...(tMap[s.tipster_id]||{}), ...(tipsterStatsMap[s.tipster_id]||{}) } }));
    }
  } catch(e) { console.error('Dashboard load error:', e); }

  const featured = (sponsors||[]).find(s => s.slot === 'featured');
  const rising   = (sponsors||[]).find(s => s.slot === 'rising');
  // Settings blocs — false si explicitement désactivé, true si non défini (défaut)
  const showFeatured   = settings['bloc_featured']       !== undefined ? settings['bloc_featured']       : true;
  const showObjectif   = settings['bloc_objectif']      !== undefined ? settings['bloc_objectif']      : true;
  const showAlerte     = settings['bloc_alerte']         !== undefined ? settings['bloc_alerte']         : true;
  const showStats      = settings['bloc_stats_plate']    !== undefined ? settings['bloc_stats_plate']    : true;
  const showSondage    = settings['bloc_sondage']        !== undefined ? settings['bloc_sondage']        : true;
  const showTwitter    = settings['bloc_twitter']        !== undefined ? settings['bloc_twitter']        : true;
  const showParrain    = settings['bloc_parrain']        !== undefined ? settings['bloc_parrain']        : true;
  const showRising          = settings['bloc_sponsor_rising']    !== undefined ? settings['bloc_sponsor_rising']    : true;
  const showMeilleurTipster = settings['bloc_meilleur_tipster'] !== undefined ? settings['bloc_meilleur_tipster'] : true;
  console.log('show vars:', {showObjectif, showAlerte, showStats, showSondage, showTwitter, showRising});
  const derniers = achats.slice(0, 3);
  const mob = isMobile();

  // HTML bloc meilleur tipster — construit ici car nécessite mob
  let meilleurTipsterHtml = '';
  if (meilleurTipster) {
    const t = meilleurTipster;
    const mtWinRate = t.total > 0 ? Math.round(t.wins / t.total * 100) : 0;
    const mtAvgCote = t.cotes.length > 0 ? (t.cotes.reduce((s,c)=>s+c,0)/t.cotes.length).toFixed(2).replace('.',',') : '—';
    const mtAvatar = t.avatar
      ? '<img src="' + t.avatar + '" style="width:46px;height:46px;border-radius:50%;object-fit:cover;flex-shrink:0" />'
      : '<div style="width:46px;height:46px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-size:1.1rem;font-weight:700;flex-shrink:0">' + (t.name||'?')[0].toUpperCase() + '</div>';
    const mtHref = t.pseudo ? 'https://payperwin.co/' + t.pseudo : '../pages/tipster-public.html?id=' + t.id;
    const mtDesc = t.desc ? '<div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + t.desc + '</div>' : '';
    const mtFontSize = mob ? '1rem' : '1.05rem';
    meilleurTipsterHtml = '<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-md)">'
      + '<div style="display:flex;align-items:center;gap:12px;padding:14px 14px 12px">'
      + mtAvatar
      + '<div style="flex:1;min-width:0"><div style="font-size:0.95rem;font-weight:700;color:var(--text-dark);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + t.name + '</div>' + mtDesc + '</div>'
      + '<a href="' + mtHref + '" target="_blank" style="background:#EAF3DE;color:#27500A;font-size:0.75rem;font-weight:600;padding:4px 10px;border-radius:20px;flex-shrink:0;text-decoration:none;white-space:nowrap">Voir \u2192</a>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;border-top:0.5px solid var(--border)">'
      + '<div onclick="showMeilleurTipsterPopup(\'tip-victoires\')" style="padding:10px 6px;text-align:center;cursor:pointer;position:relative;border-right:0.5px solid var(--border)"><div style="position:absolute;top:4px;right:4px;font-size:8px;color:var(--text-muted);opacity:.45">?</div><div style="font-size:' + mtFontSize + ';font-weight:700;color:#27500A">' + t.wins + '</div><div style="font-size:0.65rem;color:var(--text-muted);margin-top:2px;line-height:1.2">Victoires</div></div>'
      + '<div onclick="showMeilleurTipsterPopup(\'tip-pronos\')" style="padding:10px 6px;text-align:center;cursor:pointer;position:relative;border-right:0.5px solid var(--border)"><div style="position:absolute;top:4px;right:4px;font-size:8px;color:var(--text-muted);opacity:.45">?</div><div style="font-size:' + mtFontSize + ';font-weight:700;color:var(--text-dark)">' + (t.totalAchats || t.total) + '</div><div style="font-size:0.65rem;color:var(--text-muted);margin-top:2px;line-height:1.2">Pronos achetés</div></div>'
      + '<div onclick="showMeilleurTipsterPopup(\'tip-winrate\')" style="padding:10px 6px;text-align:center;cursor:pointer;position:relative;border-right:0.5px solid var(--border)"><div style="position:absolute;top:4px;right:4px;font-size:8px;color:var(--text-muted);opacity:.45">?</div><div style="font-size:' + mtFontSize + ';font-weight:700;color:var(--text-dark)">' + mtWinRate + '%</div><div style="font-size:0.65rem;color:var(--text-muted);margin-top:2px;line-height:1.2">Win rate</div></div>'
      + '<div onclick="showMeilleurTipsterPopup(\'tip-cote\')" style="padding:10px 6px;text-align:center;cursor:pointer;position:relative"><div style="position:absolute;top:4px;right:4px;font-size:8px;color:var(--text-muted);opacity:.45">?</div><div style="font-size:' + mtFontSize + ';font-weight:700;color:var(--text-dark)">' + mtAvgCote + '</div><div style="font-size:0.65rem;color:var(--text-muted);margin-top:2px;line-height:1.2">Cote moy.</div></div>'
      + '</div>'
      + '<div id="popup-meilleur-tipster" style="padding:0"></div>'
      + '</div>';
  }

  // Helpers
  const statusBadgeD = { pending:'<span style="background:#E6F1FB;color:#0C447C;font-size:0.75rem;padding:2px 8px;border-radius:10px">⏳ En attente</span>', won:'<span style="background:#EAF3DE;color:#27500A;font-size:0.75rem;padding:2px 8px;border-radius:10px">✓ Gagné</span>', lost:'<span style="background:#FCEBEB;color:#791F1F;font-size:0.75rem;padding:2px 8px;border-radius:10px">✕ Perdu</span>', cancelled:'<span style="background:#FFF3E0;color:#E65100;font-size:0.75rem;padding:2px 8px;border-radius:10px">⊘ Annulé</span>' };

  function sponsorFeaturedHtml(s) {
    if (!s) return '';
    const t = s.tipsterProfile || {};
    const pseudo = t.pseudo || t.first_name || '—';
    const avatar = t.avatar_url || '';
    const href = t.pseudo ? `https://payperwin.co/${t.pseudo}` : '#';
    const winRate = t.winRate != null ? t.winRate + '%' : '—';
    const nbPronos = t.nbPronos != null ? t.nbPronos : '—';
    const avgCote = t.avgCote != null ? parseFloat(t.avgCote).toFixed(2).replace('.',',') : '—';
    const rank = `<div style="background:#FAEEDA;color:#633806;font-size:0.75rem;font-weight:700;padding:3px 10px;border-radius:10px">⭐ Top Tipster</div>`;
    return `<div style="padding:0">
      <div style="display:flex;gap:12px;padding:12px 12px 10px">
        <a href="${href}" target="_blank" onclick="trackSponsorClick('${s.id}')" style="text-decoration:none;flex-shrink:0">
          <div style="width:${mob?'58px':'68px'};height:${mob?'58px':'68px'};border-radius:50%;background:var(--blue-pale);overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:1.4rem;border:2px solid #E6F1FB">
            ${avatar ? `<img src="${avatar}" style="width:100%;height:100%;object-fit:cover" />` : '⭐'}
          </div>
        </a>
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;margin-bottom:4px">
            <span style="background:#FAEEDA;color:#633806;font-size:0.62rem;font-weight:700;padding:2px 7px;border-radius:10px">Sponsorisé</span>
            ${rank}
          </div>
          <a href="${href}" target="_blank" onclick="trackSponsorClick('${s.id}')" style="text-decoration:none">
            <div style="font-size:0.95rem;font-weight:800;color:var(--text-dark)">${pseudo}</div>
          </a>
          ${s.description ? `<div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;line-height:1.3">${s.description}</div>` : ''}
          <div style="display:flex;align-items:center;gap:6px;margin-top:6px">
            <span style="font-size:0.95rem;font-weight:800;color:#0F6E56">🏆 ${winRate}</span>
            <span style="font-size:0.72rem;color:var(--text-muted)">· 📊 ${nbPronos} pronos · cote ${avgCote}</span>
          </div>
        </div>
      </div>
      <div style="border-top:1px solid var(--border)">
        <a href="${href}" target="_blank" onclick="trackSponsorClick('${s.id}')"
          style="display:block;text-align:center;padding:10px;font-size:0.85rem;font-weight:700;color:var(--primary);text-decoration:none">
          Voir ses pronos →
        </a>
      </div>
    </div>`;
  }

  function sponsorRisingHtml(s) {
    if (!s) return '';
    const t = s.tipsterProfile || {};
    const pseudo = t.pseudo || t.first_name || '—';
    const avatar = s.image_url || t.avatar_url || '';
    const href = t.pseudo ? `https://payperwin.co/${t.pseudo}` : '#';
    return `<div style="display:flex;align-items:center;gap:12px;padding:12px">
      <div style="width:46px;height:46px;border-radius:50%;background:#C0DD97;display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;border:2px solid #639922;overflow:hidden">
        ${avatar ? `<img src="${avatar}" style="width:100%;height:100%;object-fit:cover" />` : '🚀'}
      </div>
      <div style="flex:1;min-width:0">
        <span style="background:#E1F5EE;color:#085041;font-size:0.72rem;font-weight:600;padding:2px 8px;border-radius:10px">Tipster en progression</span>
        <div style="font-size:0.9rem;font-weight:700;color:var(--text-dark);margin-top:3px">${pseudo}</div>
        ${s.description ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px">${s.description}</div>` : ''}
      </div>
      <a href="${href}" target="_blank" onclick="trackSponsorClick('${s.id}')"
        style="background:none;border:1.5px solid #639922;color:#3B6D11;border-radius:16px;padding:5px 12px;font-size:0.78rem;font-weight:600;text-decoration:none;white-space:nowrap;flex-shrink:0">
        Voir →
      </a>
    </div>`;
  }

  function pollHtml() {
    if (!poll || !pollOptions.length) return '';
    const totalVotes = pollOptions.reduce((s,o) => s + (o.votes||0), 0);
    const options = pollOptions.map(o => {
      const pct = totalVotes > 0 ? Math.round((o.votes||0) / totalVotes * 100) : 0;
      const isSelected = o.id === userVote;
      return `<div onclick="votePoll('${poll.id}','${o.id}',${isSelected})"
        style="margin:0 12px 8px;border:0.5px solid ${isSelected?'var(--primary)':'var(--border)'};border-radius:var(--radius-md);padding:9px 12px;font-size:0.85rem;cursor:pointer;position:relative;overflow:hidden;${isSelected?'background:var(--blue-xpale,#eef3ff)':''}">
        <div style="position:absolute;top:0;left:0;height:100%;width:${pct}%;background:var(--blue-pale);z-index:0;border-radius:var(--radius-md)"></div>
        <div style="position:relative;z-index:1;display:flex;justify-content:space-between;align-items:center">
          <span style="color:var(--text-dark)">${o.label}</span>
          <span style="font-size:0.78rem;font-weight:600;color:var(--primary)">${pct}%</span>
        </div>
      </div>`;
    }).join('');
    return `<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-md)">
      <div style="padding:12px 12px 8px;font-size:0.88rem;font-weight:700;color:var(--text-dark)">${poll.question}</div>
      <div id="poll-block">
        ${options}
        <div style="padding:6px 12px 10px;font-size:0.75rem;color:var(--text-muted)">${totalVotes} réponse(s) · ${userVote ? 'Cliquez pour changer votre vote' : 'Votez !'}</div>
      </div>
    </div>`;
  }

  function changelogHtml() {
    if (!Array.isArray(changelog) || !changelog.length) return '<p style="color:var(--text-muted);font-size:0.85rem;padding:12px">Aucune nouveauté.</p>';
    return changelog.slice(0, 3).map(c => `
      <div class="dash-news-item" onclick="this.classList.toggle('open')" style="padding:10px 12px;border-bottom:0.5px solid var(--border);cursor:pointer">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <div style="font-size:0.85rem;font-weight:600;color:var(--text-dark)">${c.titre}</div>
          <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
            <span style="font-size:0.7rem;color:var(--text-muted)">${formatDate(c.created_at)}</span>
            <span class="dash-news-arrow" style="font-size:0.85rem;color:var(--text-muted);transition:transform .2s">›</span>
          </div>
        </div>
        <div class="dash-news-desc" style="display:none;font-size:0.8rem;color:var(--text-muted);margin-top:6px;line-height:1.5">${c.description || ''}</div>
      </div>`).join('');
  }

  // Bloc stat card
  const hasFreebet = MOCK_USER.freebet > 0;

  const statsHtml = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 12px">
        <div style="font-size:0.68rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px">Solde disponible</div>
        <div style="font-size:${mob?'1.3rem':'1.4rem'};font-weight:800;color:var(--primary)">${formatEuros(MOCK_USER.balance)}</div>
        <div style="font-size:0.68rem;color:var(--text-muted);margin-top:2px">Rechargeable</div>
      </div>
      <div id="freebet-card" onclick="${hasFreebet ? 'toggleFreebetPopup()' : ''}" style="background:${hasFreebet?'#FFF8EE':'var(--bg)'};border:1px solid ${hasFreebet?'#EF9F27':'var(--border)'};border-radius:var(--radius-md);padding:10px 12px;${hasFreebet?'cursor:pointer;':''}position:relative">
        <div onclick="event.stopPropagation();toggleFreebetPopup()" style="position:absolute;top:5px;right:7px;width:16px;height:16px;border-radius:50%;border:1.5px solid ${hasFreebet?'#EF9F27':'var(--border)'};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:600;color:${hasFreebet?'#854F0B':'var(--text-muted)'};cursor:pointer">i</div>
        <div style="font-size:0.68rem;color:${hasFreebet?'#633806':'var(--text-muted)'};text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px">Freebet</div>
        <div style="font-size:${mob?'1.3rem':'1.4rem'};font-weight:800;color:${hasFreebet?'#633806':'var(--text-muted)'}">${formatEuros(MOCK_USER.freebet)}</div>
        <div style="font-size:0.68rem;color:${hasFreebet?'#854F0B':'var(--text-muted)'};margin-top:2px">${hasFreebet?'Offert par PayPerWin':'Aucun freebet disponible'}</div>
      </div>
    </div>
    <div id="freebet-popup" style="display:none;background:#FFF8EE;border:1px solid #EF9F27;border-radius:var(--radius-md);padding:10px 12px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
        <div style="font-size:0.78rem;color:#633806;line-height:1.5">${hasFreebet ? 'Le freebet est un crédit offert par PayPerWin. Il fonctionne de la même manière que votre solde, sauf si le prono est perdu : vous n\'êtes pas remboursé.' : 'PayPerWin offre régulièrement des freebets à ses membres. Suivez-nous sur X et restez à l\'affût des prochaines offres !'}</div>
        <button onclick="toggleFreebetPopup()" style="font-size:1rem;color:#854F0B;background:none;border:none;cursor:pointer;flex-shrink:0;padding:0">×</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:var(--space-md)">
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);padding:8px 10px">
        <div style="font-size:0.65rem;color:var(--text-muted);text-transform:uppercase;margin-bottom:3px">Pronos</div>
        <div style="font-size:1.1rem;font-weight:800;color:var(--text-dark)">${achats.length}</div>
        <div style="font-size:0.65rem;color:var(--text-muted);margin-top:2px">achetés</div>
      </div>
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);padding:8px 10px">
        <div style="font-size:0.65rem;color:var(--text-muted);text-transform:uppercase;margin-bottom:3px">Taux</div>
        <div style="font-size:1.1rem;font-weight:800;color:var(--text-dark)">${finished>0?winRate+'%':'—'}</div>
        <div style="font-size:0.65rem;color:var(--text-muted);margin-top:2px">win rate</div>
      </div>
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);padding:8px 10px">
        <div style="font-size:0.65rem;color:var(--text-muted);text-transform:uppercase;margin-bottom:3px">Remboursé</div>
        <div style="font-size:1.1rem;font-weight:800;color:var(--text-dark)">${formatEuros(remboursed)}</div>
        <div style="font-size:0.65rem;color:var(--text-muted);margin-top:2px">perdus + annulés</div>
      </div>
    </div>`;

  const alerteHtml = newPronos.length > 0 ? `
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:var(--space-md)">
      <div>
        <div style="font-size:0.88rem;font-weight:700;color:var(--text-dark)">${newPronos.length} nouveau${newPronos.length>1?'x':''} prono${newPronos.length>1?'s':''} disponible${newPronos.length>1?'s':''}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">depuis votre dernière visite</div>
      </div>
      <button onclick="navigateTo('explorer')" style="background:var(--primary);color:white;border:none;border-radius:20px;padding:6px 16px;font-size:0.8rem;font-weight:600;cursor:pointer;white-space:nowrap">Explorer →</button>
    </div>` : '';

  const objectifHtml = `
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);padding:12px 14px;margin-bottom:var(--space-md)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:0.88rem;font-weight:700;color:var(--text-dark)">Objectif de la semaine</div>
        <div style="font-size:0.78rem;color:var(--text-muted)">${formatEuros(weekSpent)} / ${formatEuros(weekGoal)}</div>
      </div>
      <div style="background:var(--bg-soft);border-radius:10px;height:8px;overflow:hidden">
        <div style="width:${weekPct}%;height:100%;background:var(--primary);border-radius:10px;transition:width .5s"></div>
      </div>
      <div style="font-size:0.75rem;color:var(--text-muted);margin-top:6px">${weekPct >= 100 ? '🎉 Objectif atteint !' : formatEuros(weekGoal - weekSpent) + ' restants pour atteindre votre objectif'}</div>
    </div>`;

  const derniersHtml = derniers.length > 0
    ? derniers.map(a => `
      <div style="padding:10px 12px;border-bottom:0.5px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:8px">
        <div style="min-width:0;flex:1">
          <div style="font-size:0.85rem;font-weight:600;color:var(--text-dark);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.game}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.tipster} · ${a.sport} · ${formatDate(a.date)}</div>
        </div>
        <div style="flex-shrink:0">${statusBadgeD[a.status] || ''}</div>
      </div>`).join('')
    : '<div style="padding:12px;font-size:0.85rem;color:var(--text-muted)">Aucun achat pour le moment.</div>';

  const xHtml = `
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-md)">
      <div style="padding:12px 14px;display:flex;align-items:center;gap:10px">
        <div style="width:38px;height:38px;border-radius:50%;background:#000;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.737-8.835L1.254 2.25H8.08l4.259 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:0.88rem;font-weight:700;color:var(--text-dark)">Suivez-nous sur X</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">Actus, alertes pronos et offres exclusives</div>
        </div>
        <a href="https://x.com/payperwin_co" target="_blank" style="background:#2563EB;color:#ffffff;border-radius:20px;padding:6px 14px;font-size:0.78rem;font-weight:600;text-decoration:none;white-space:nowrap;flex-shrink:0">Suivre</a>
      </div>
      <div style="padding:8px 14px 12px;border-top:0.5px solid var(--border);display:flex;align-items:flex-start;gap:8px">
        <span style="font-size:14px;flex-shrink:0">🎁</span>
        <div style="font-size:0.75rem;color:var(--text-muted);line-height:1.5">Suivez-nous sur X et envoyez-nous une capture d'écran par DM — nous vous offrons <strong style="color:#633806">2 € de freebet</strong> !</div>
      </div>
    </div>`;

  const statsPlatePopups = {
    tipsters:   { title: 'Tipsters', text: 'Nombre de tipsters actifs inscrits sur PayPerWin qui publient des pronostics.' },
    pronos:     { title: 'Pronos joués', text: 'Nombre total de pronostics publiés sur la plateforme depuis le lancement.' },
    winrate:    { title: 'Taux global', text: 'Pourcentage de pronostics terminés qui ont été gagnants, sur l\'ensemble des tipsters.' },
    parieurs:   { title: 'Parieurs', text: 'Nombre total de membres inscrits sur PayPerWin qui achètent des pronostics.' },
  };
  const statsPlateHtml = `
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-md)">
      <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:12px">
        ${[
          { key:'parieurs', label:'Parieurs',    val: nbParieurs },
          { key:'tipsters', label:'Tipsters',    val: nbTipsters },
          { key:'pronos',   label:'Pronos joués',val: nbPronos },
          { key:'winrate',  label:'Taux global', val: globalWinRate+'%' },
        ].map(s => `
          <div onclick="showStatsPlatePopup('${s.key}')" style="background:var(--bg-soft);border-radius:var(--radius-md);padding:8px 6px;text-align:center;cursor:pointer;position:relative">
            <div style="position:absolute;top:4px;right:5px;font-size:9px;color:var(--text-muted);opacity:.5">?</div>
            <div style="font-size:${mob?'0.95rem':'1rem'};font-weight:700;color:var(--text-dark)">${s.val}</div>
            <div style="font-size:0.65rem;color:var(--text-muted);margin-top:2px;line-height:1.2">${s.label}</div>
          </div>`).join('')}
      </div>
      <div id="stats-plate-popup" style="padding:0"></div>
    </div>`;

  // Fonction popup stats plateforme (globale pour onclick inline)
  window.toggleFreebetPopup = function() {
    const p = document.getElementById('freebet-popup');
    if (p) p.style.display = p.style.display === 'none' ? 'block' : 'none';
  };

  window.showMeilleurTipsterPopup = function(key) {
    const area = document.getElementById('popup-meilleur-tipster');
    if (!area) return;
    const defs = window._meilleurTipsterPopupDefs || {};
    if (area.dataset.open === key) { area.style.padding='0'; area.innerHTML=''; area.dataset.open=''; return; }
    area.dataset.open = key;
    const p = defs[key];
    if (!p) return;
    area.style.padding = '0 12px 10px';
    area.innerHTML = `<div style="background:var(--bg-soft);border-radius:var(--radius-md);padding:10px 12px;border:1px solid var(--border);display:flex;justify-content:space-between;gap:8px">
      <div>
        <div style="font-size:0.85rem;font-weight:700;color:var(--text-dark);margin-bottom:3px">${p.title}</div>
        <div style="font-size:0.78rem;color:var(--text-muted);line-height:1.5">${p.text}</div>
      </div>
      <button onclick="const a=document.getElementById('popup-meilleur-tipster');a.innerHTML='';a.style.padding='0';a.dataset.open='';" style="font-size:1rem;color:var(--text-muted);background:none;border:none;cursor:pointer;flex-shrink:0">×</button>
    </div>`;
  };

  window.showStatsPlatePopup = function(key) {
    const area = document.getElementById('stats-plate-popup');
    if (!area) return;
    if (area.dataset.open === key) { area.style.padding='0'; area.innerHTML = ''; area.dataset.open = ''; return; }
    area.dataset.open = key;
    const p = statsPlatePopups[key];
    area.style.padding = '0 12px 10px';
    area.innerHTML = `<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 12px;display:flex;justify-content:space-between;gap:8px">
      <div>
        <div style="font-size:0.85rem;font-weight:700;color:var(--text-dark);margin-bottom:3px">${p.title}</div>
        <div style="font-size:0.78rem;color:var(--text-muted);line-height:1.5">${p.text}</div>
      </div>
      <button onclick="const a=document.getElementById('stats-plate-popup');a.innerHTML='';a.style.padding='0';a.dataset.open='';" style="font-size:1rem;color:var(--text-muted);background:none;border:none;cursor:pointer;flex-shrink:0">×</button>
    </div>`;
  };

  // Vérifier que le container est toujours dans le DOM avant de rendre
  if (!document.getElementById('page-content')) return;
  if (mob) {
    container.innerHTML = `
      <style>
        .dash-news-item.open .dash-news-desc { display:block !important }
        .dash-news-item.open .dash-news-arrow { display:inline-block;transform:rotate(90deg) }
        .dash-news-item:last-child { border-bottom:none !important }
      </style>
      <div class="section-header"><div><h2>Tableau de bord</h2></div></div>
      ${statsHtml}
      ${showFeatured && featured ? `<div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Tipster à la une</div><div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-md)">${sponsorFeaturedHtml(featured)}</div>` : ''}
      ${showParrain && MOCK_USER.referralCode ? `<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-md)"><div style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--border)"><div style="width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:var(--blue-pale)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div><span style="font-size:13px;font-weight:600;color:var(--text-dark)">Mon code parrain</span></div><div style="padding:12px 14px"><div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;line-height:1.5">Partagez ce code. Vos amis reçoivent <strong>2€</strong> à leur premier dépôt, et vous aussi !</div><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;background:var(--bg-soft);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 14px;font-size:15px;font-weight:800;font-family:monospace;color:var(--blue);letter-spacing:2px;text-align:center">${MOCK_USER.referralCode}</div><button onclick="copyReferralCode('${MOCK_USER.referralCode}')" style="background:var(--blue);color:white;border:none;border-radius:var(--radius-sm);padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap">📋 Copier</button></div></div></div>` : ''}
      ${showTwitter ? xHtml : ''}
      <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Mes derniers achats</div>
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-md)">
        ${derniersHtml}
        <button onclick="navigateTo('achats')" style="width:100%;padding:9px;font-size:0.8rem;color:var(--primary);background:none;border:none;border-top:0.5px solid var(--border);cursor:pointer">Voir tous mes achats →</button>
      </div>
      ${showMeilleurTipster && meilleurTipster ? '<div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Votre meilleur tipster</div>' + meilleurTipsterHtml : ''}
      ${showAlerte ? alerteHtml : ''}
      ${showObjectif ? objectifHtml : ''}
      <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Nouveautés</div>
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-md)">
        ${changelogHtml()}
        <button onclick="navigateTo('feedback')" style="width:100%;padding:9px;font-size:0.8rem;color:var(--primary);background:none;border:none;border-top:0.5px solid var(--border);cursor:pointer">Voir toutes les nouveautés →</button>
      </div>
      ${showStats ? statsPlateHtml : ''}
      ${showRising && rising ? `<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-md)">${sponsorRisingHtml(rising)}</div>` : ''}
      ${showSondage ? pollHtml() : ''}
    `;
  } else {
    container.innerHTML = `
      <style>
        .dash-news-item.open .dash-news-desc { display:block !important }
        .dash-news-item.open .dash-news-arrow { display:inline-block;transform:rotate(90deg) }
        .dash-news-item:last-child { border-bottom:none !important }
      </style>
      <div class="section-header"><div><h2>Tableau de bord</h2></div></div>
      ${statsHtml}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-lg)">
        <div>
          ${showFeatured && featured ? `<div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Tipster à la une</div><div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-md)">${sponsorFeaturedHtml(featured)}</div>` : ''}
          ${showParrain && MOCK_USER.referralCode ? `<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-md)"><div style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--border)"><div style="width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:var(--blue-pale)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div><span style="font-size:13px;font-weight:600;color:var(--text-dark)">Mon code parrain</span></div><div style="padding:12px 14px"><div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;line-height:1.5">Partagez ce code. Vos amis reçoivent <strong>2€</strong> à leur premier dépôt, et vous aussi !</div><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;background:var(--bg-soft);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 14px;font-size:15px;font-weight:800;font-family:monospace;color:var(--blue);letter-spacing:2px;text-align:center">${MOCK_USER.referralCode}</div><button onclick="copyReferralCode('${MOCK_USER.referralCode}')" style="background:var(--blue);color:white;border:none;border-radius:var(--radius-sm);padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap">📋 Copier</button></div></div></div>` : ''}
          ${showTwitter ? xHtml : ''}
          <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Mes derniers achats</div>
          <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-md)">
            ${derniersHtml}
            <button onclick="navigateTo('achats')" style="width:100%;padding:9px;font-size:0.8rem;color:var(--primary);background:none;border:none;border-top:0.5px solid var(--border);cursor:pointer">Voir tous mes achats →</button>
          </div>
          ${showMeilleurTipster && meilleurTipster ? '<div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Votre meilleur tipster</div>' + meilleurTipsterHtml : ''}
          ${showSondage ? pollHtml() : ''}
        </div>
        <div>
          ${showAlerte ? alerteHtml : ''}
          ${showObjectif ? objectifHtml : ''}
          <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Nouveautés</div>
          <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-md)">
            ${changelogHtml()}
            <button onclick="navigateTo('feedback')" style="width:100%;padding:9px;font-size:0.8rem;color:var(--primary);background:none;border:none;border-top:0.5px solid var(--border);cursor:pointer">Voir toutes les nouveautés →</button>
          </div>
          ${showStats ? statsPlateHtml : ''}
          ${showRising && rising ? `<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-md)">${sponsorRisingHtml(rising)}</div>` : ''}
        </div>
      </div>
    `;
  }
}

async function trackSponsorClick(sponsorId) {
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';
  try {
    const r = await fetch(`${SUPA}/rest/v1/sponsors?id=eq.${sponsorId}`, { headers: { apikey: ANON } });
    const data = await r.json();
    const current = Array.isArray(data) && data.length > 0 ? (data[0].clicks || 0) : 0;
    await fetch(`${SUPA}/rest/v1/sponsors?id=eq.${sponsorId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', apikey: ANON, 'Authorization': 'Bearer ' + ANON },
      body: JSON.stringify({ clicks: current + 1 })
    });
  } catch(e) { console.error('track sponsor:', e); }
}

async function votePoll(pollId, optionId, isCurrentVote) {
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';
  try {
    const uid = userState.userId;
    if (!uid) return;
    if (isCurrentVote) {
      // Annuler le vote
      await fetch(`${SUPA}/rest/v1/poll_votes?poll_id=eq.${pollId}&user_id=eq.${uid}`, {
        method: 'DELETE', headers: { apikey: ANON, 'Authorization': 'Bearer ' + ANON }
      });
      // Décrémenter
      const ro = await fetch(`${SUPA}/rest/v1/poll_options?id=eq.${optionId}&select=votes&apikey=${ANON}`, { headers: { apikey: ANON } });
      const od = await ro.json();
      const v = Math.max(0, (od[0]?.votes || 1) - 1);
      await fetch(`${SUPA}/rest/v1/poll_options?id=eq.${optionId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', apikey: ANON, 'Authorization': 'Bearer ' + ANON },
        body: JSON.stringify({ votes: v })
      });
    } else {
      // Supprimer ancien vote si existant
      const rv = await fetch(`${SUPA}/rest/v1/poll_votes?poll_id=eq.${pollId}&user_id=eq.${uid}&select=option_id&apikey=${ANON}`, { headers: { apikey: ANON } });
      const oldVotes = await rv.json();
      if (Array.isArray(oldVotes) && oldVotes.length > 0) {
        const oldOpt = oldVotes[0].option_id;
        await fetch(`${SUPA}/rest/v1/poll_votes?poll_id=eq.${pollId}&user_id=eq.${uid}`, {
          method: 'DELETE', headers: { apikey: ANON, 'Authorization': 'Bearer ' + ANON }
        });
        const ro2 = await fetch(`${SUPA}/rest/v1/poll_options?id=eq.${oldOpt}&select=votes&apikey=${ANON}`, { headers: { apikey: ANON } });
        const od2 = await ro2.json();
        await fetch(`${SUPA}/rest/v1/poll_options?id=eq.${oldOpt}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json', apikey: ANON, 'Authorization': 'Bearer ' + ANON },
          body: JSON.stringify({ votes: Math.max(0, (od2[0]?.votes || 1) - 1) })
        });
      }
      // Nouveau vote
      await fetch(`${SUPA}/rest/v1/poll_votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: ANON, 'Authorization': 'Bearer ' + ANON, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ poll_id: pollId, user_id: uid, option_id: optionId })
      });
      const ro3 = await fetch(`${SUPA}/rest/v1/poll_options?id=eq.${optionId}&select=votes&apikey=${ANON}`, { headers: { apikey: ANON } });
      const od3 = await ro3.json();
      await fetch(`${SUPA}/rest/v1/poll_options?id=eq.${optionId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', apikey: ANON, 'Authorization': 'Bearer ' + ANON },
        body: JSON.stringify({ votes: (od3[0]?.votes || 0) + 1 })
      });
    }
    // Recharger uniquement le bloc sondage
    await refreshPollBlock(pollId);
  } catch(e) { showToast('Erreur lors du vote', 'error'); console.error(e); }
}

async function refreshPollBlock(pollId) {
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';
  try {
    const [rOpts, rVote] = await Promise.all([
      fetch(`${SUPA}/rest/v1/poll_options?poll_id=eq.${pollId}&select=id,label,votes&order=votes.desc&apikey=${ANON}`, { headers: { apikey: ANON } }),
      fetch(`${SUPA}/rest/v1/poll_votes?poll_id=eq.${pollId}&user_id=eq.${userState.userId}&select=option_id&apikey=${ANON}`, { headers: { apikey: ANON } }),
    ]);
    const opts = await rOpts.json();
    const votes = await rVote.json();
    const uVote = Array.isArray(votes) && votes.length > 0 ? votes[0].option_id : null;
    const total = (opts||[]).reduce((s,o) => s + (o.votes||0), 0);
    const pollBlock = document.getElementById('poll-block');
    if (!pollBlock) return;
    pollBlock.innerHTML = (opts||[]).map(o => {
      const pct = total > 0 ? Math.round((o.votes||0) / total * 100) : 0;
      const isSel = o.id === uVote;
      return `<div onclick="votePoll('${pollId}','${o.id}',${isSel})"
        style="margin:0 12px 8px;border:0.5px solid ${isSel?'var(--primary)':'var(--border)'};border-radius:var(--radius-md);padding:9px 12px;font-size:0.85rem;cursor:pointer;position:relative;overflow:hidden;${isSel?'background:var(--blue-xpale,#eef3ff)':''}">
        <div style="position:absolute;top:0;left:0;height:100%;width:${pct}%;background:var(--blue-pale);z-index:0;border-radius:var(--radius-md)"></div>
        <div style="position:relative;z-index:1;display:flex;justify-content:space-between;align-items:center">
          <span style="color:var(--text-dark)">${o.label}</span>
          <span style="font-size:0.78rem;font-weight:600;color:var(--primary)">${pct}%</span>
        </div>
      </div>`;
    }).join('') + `<div style="padding:6px 12px 10px;font-size:0.75rem;color:var(--text-muted)">${total} réponse(s) · ${uVote ? 'Cliquez pour changer votre vote' : 'Votez !'}</div>`;
  } catch(e) { console.error('refreshPollBlock:', e); }
}

