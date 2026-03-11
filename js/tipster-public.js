/**
 * ============================================================
 *  PARIS-BET — JS PAGE PUBLIQUE TIPSTER (tipster-public.js)
 * ============================================================
 */

// ── Données de démo ───────────────────────────────────────────
const MOCK_TIPSTER_PUBLIC = {
  id:         'alexis',
  firstName:  'Alexis',
  lastName:   'Martin',
  url:        'paris-bet.fr/alexis',
  sports:     ['⚽ Ligue 1', '🎾 Tennis', '🏀 NBA'],
  winRate:    71,
  totalPronos: 48,
  totalBuyers: 312,
  memberSince: 'Janvier 2025',  // Format affiché : 01/2025
};

const MOCK_USER = {
  firstName: 'Thomas',
  balance:   42.50,
  pending:   13.00,  // Sommes en attente
};

const MOCK_PUBLIC_PRONOS = [
  {
    id: 1,
    match:    'PSG vs Marseille',
    sport:    '⚽ Ligue 1',
    date:     'Sam. 15 mars · 20h45',
    price:    5.00,
    buyers:   47,
    status:   CONFIG.betStatus.PENDING,
    content:  'PSG gagne avec +1.5 buts. Très bonne forme à domicile cette saison, Marseille en difficulté en déplacement.',
    purchased: false,
  },
  {
    id: 2,
    match:    'Real Madrid vs Barça',
    sport:    '⚽ Liga',
    date:     'Dim. 16 mars · 21h00',
    price:    8.00,
    buyers:   83,
    status:   CONFIG.betStatus.WON,
    content:  'Real Madrid victoire. Avantage domicile, Barça avec plusieurs absents.',
    purchased: true,
  },
  {
    id: 3,
    match:    'Djokovic vs Alcaraz',
    sport:    '🎾 Roland Garros',
    date:     'Dim. 16 mars · 14h00',
    price:    6.00,
    buyers:   31,
    status:   CONFIG.betStatus.LOST,
    content:  'Djokovic en 3 sets. Meilleure forme sur terre battue.',
    purchased: true,
  },
  {
    id: 4,
    match:    'Lakers vs Warriors',
    sport:    '🏀 NBA',
    date:     'Lun. 17 mars · 03h30',
    price:    4.00,
    buyers:   12,
    status:   CONFIG.betStatus.PENDING,
    content:  'Lakers favoris à domicile. James en grande forme.',
    purchased: false,
  },
  {
    id: 5,
    match:    'Lens vs Lyon',
    sport:    '⚽ Ligue 1',
    date:     'Mar. 18 mars · 21h00',
    price:    5.00,
    buyers:   8,
    status:   CONFIG.betStatus.PENDING,
    content:  'Lens solide à Bollaert cette saison.',
    purchased: false,
  },
];

// ── État local ────────────────────────────────────────────────
const pubState = {
  pronos:      [...MOCK_PUBLIC_PRONOS],
  filter:      'all',       // 'all' | 'pending' | 'won' | 'lost'
  buyingProno: null,        // Prono en cours d'achat
  user:        { ...MOCK_USER },
};

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar({ transparent: true });
  renderHero();
  renderUserBalance();
  renderTipsterInfo();
  renderPronos();
});

// ── Hero (injection pure, pas de manipulation DOM complexe) ───
function renderHero() {
  const t = MOCK_TIPSTER_PUBLIC;

  // Date courte : "Janvier 2025" → "01/2025"
  const dateShort = formatMemberDate(t.memberSince);

  // On injecte tout le hero d'un coup
  document.getElementById('tipster-hero-inner').innerHTML = `
    <div class="tipster-hero__avatar-info">
      <div class="tipster-avatar">${t.firstName[0]}${t.lastName[0]}</div>
      <div class="tipster-hero__info">
        <h1 class="tipster-hero__name">${t.firstName} ${t.lastName}</h1>
        <div class="tipster-hero__url">🔗 ${t.url}</div>
        <div class="tipster-hero__tags">
          ${t.sports.map(s => `<span class="tipster-tag">${s}</span>`).join('')}
        </div>
      </div>
    </div>

    <div class="tipster-hero__stats-wrap">
      <div class="tipster-hero__stat">
        <div class="tipster-hero__stat-num">${t.totalPronos}</div>
        <div class="tipster-hero__stat-label">Pronos publiés</div>
      </div>
      <div class="tipster-hero__stat">
        <div class="tipster-hero__stat-num">${t.totalBuyers}</div>
        <div class="tipster-hero__stat-label">Acheteurs</div>
      </div>
      <div class="tipster-hero__stat">
        <div class="tipster-hero__stat-num">${dateShort}</div>
        <div class="tipster-hero__stat-label">Membre depuis</div>
      </div>
      <div class="tipster-hero__stat tipster-hero__stat--winrate">
        <div class="tipster-hero__stat-num">${t.winRate}%</div>
        <div class="tipster-hero__stat-label">Win Rate</div>
      </div>
    </div>
  `;
}

// Reformater "Janvier 2025" → "01/2025"
function formatMemberDate(str) {
  const months = {
    'janvier':1,'février':2,'mars':3,'avril':4,'mai':5,'juin':6,
    'juillet':7,'août':8,'septembre':9,'octobre':10,'novembre':11,'décembre':12
  };
  const parts = str.toLowerCase().split(' ');
  if (parts.length === 2 && months[parts[0]]) {
    const mm = String(months[parts[0]]).padStart(2, '0');
    return `${mm}/${parts[1]}`;
  }
  return str;
}

// ── Solde utilisateur (sidebar) ───────────────────────────────
function renderUserBalance() {
  const u = pubState.user;
  document.getElementById('user-balance').textContent  = formatEuros(u.balance);
  document.getElementById('user-pending').textContent  = formatEuros(u.pending);
}

// ── Infos tipster (sidebar) ───────────────────────────────────
function renderTipsterInfo() {
  const t = MOCK_TIPSTER_PUBLIC;
  const won  = pubState.pronos.filter(p => p.status === CONFIG.betStatus.WON).length;
  const total= pubState.pronos.filter(p =>
    p.status === CONFIG.betStatus.WON || p.status === CONFIG.betStatus.LOST
  ).length;

  document.getElementById('info-winrate').textContent  = `${t.winRate}%`;
  document.getElementById('info-pronos').textContent   = t.totalPronos;
  document.getElementById('info-buyers').textContent   = t.totalBuyers;
  document.getElementById('info-record').textContent   = `${won}W / ${total - won}L`;
}

// ── Filtres ───────────────────────────────────────────────────
function setFilter(filter) {
  pubState.filter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  renderPronos();
}

// ── Liste des pronos ──────────────────────────────────────────
function renderPronos() {
  const container = document.getElementById('pronos-list');
  let filtered = pubState.pronos;

  if (pubState.filter !== 'all') {
    filtered = filtered.filter(p => p.status === pubState.filter);
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">🔍</div>
        <h3>Aucun pronostic dans cette catégorie</h3>
        <p>Essayez un autre filtre.</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(p => renderPronoCard(p)).join('');
}

function renderPronoCard(p) {
  const statusClass = {
    [CONFIG.betStatus.PENDING]:   'pending',
    [CONFIG.betStatus.WON]:       'won',
    [CONFIG.betStatus.LOST]:      'lost',
    [CONFIG.betStatus.CANCELLED]: 'cancelled',
  };

  const statusBadge = {
    [CONFIG.betStatus.PENDING]:   `<span class="badge badge-pending">⏳ En attente</span>`,
    [CONFIG.betStatus.WON]:       `<span class="badge badge-won">✓ Gagné</span>`,
    [CONFIG.betStatus.LOST]:      `<span class="badge badge-lost">✕ Perdu</span>`,
    [CONFIG.betStatus.CANCELLED]: `<span class="badge badge-cancelled">⊘ Annulé</span>`,
  };

  // Contenu : visible si acheté, verrouillé sinon
  const contentBlock = p.purchased
    ? `<div class="prono-card__content">
        <div class="prono-card__content-label">🔓 Pronostic déverrouillé</div>
        <div class="prono-card__content-text">${p.content}</div>
       </div>`
    : `<div class="prono-card__locked">
        <div class="prono-card__locked-icon">🔒</div>
        <span>Achetez ce pronostic pour voir le contenu</span>
       </div>`;

  // Bouton d'action
  const canBuy = !p.purchased && p.status === CONFIG.betStatus.PENDING;
  const actionBtn = p.purchased
    ? `<span style="font-size:0.8rem;color:var(--success);font-weight:600">✓ Acheté</span>`
    : p.status !== CONFIG.betStatus.PENDING
    ? `<span style="font-size:0.8rem;color:var(--text-muted)">Terminé</span>`
    : `<button class="btn-buy" onclick="openBuyModal(${p.id})">
        Acheter — ${formatEuros(p.price)}
       </button>`;

  return `
    <div class="prono-card prono-card--${statusClass[p.status]}">
      <div class="prono-card__header">
        <div>
          <div class="prono-card__match">${p.match}</div>
          <div class="prono-card__meta">
            ${p.sport}
            <span>·</span>
            ${p.date}
            ${statusBadge[p.status]}
          </div>
        </div>
        <div class="prono-card__right">
          <div class="prono-card__price">${formatEuros(p.price)}</div>
          <div class="prono-card__price-label">Pay-Per-Win</div>
        </div>
      </div>

      ${contentBlock}

      <div class="prono-card__footer">
        <div class="prono-card__buyers">
          👥 <strong>${p.buyers}</strong> acheteur${p.buyers > 1 ? 's' : ''}
        </div>
        ${actionBtn}
      </div>
    </div>
  `;
}

// ── Panneau achat inline ─────────────────────────────────────
function openBuyModal(id) {
  const prono = pubState.pronos.find(p => p.id === id);
  if (!prono) return;
  pubState.buyingProno = prono;

  const hasEnough   = pubState.user.balance >= prono.price;
  const afterAmount = pubState.user.balance - prono.price;
  const isMobile    = window.innerWidth <= 900;

  const alertHtml = !hasEnough ? `
    <div class="buy-panel__alert">
      ⚠️ Solde insuffisant.
      <a href="dashboard-user.html">Recharger →</a>
    </div>` : '';

  const html = `
    <div class="buy-panel__title">
      🛒 Confirmer l'achat
      <button class="buy-panel__close" onclick="closeBuyModal()">✕</button>
    </div>
    <div class="buy-panel__match">${prono.match} · ${formatEuros(prono.price)}</div>
    <div class="buy-panel__rows">
      <div class="buy-panel__row">
        <span class="buy-panel__row-label">Prix</span>
        <span class="buy-panel__row-value blue">${formatEuros(prono.price)}</span>
      </div>
      <div class="buy-panel__row">
        <span class="buy-panel__row-label">Solde actuel</span>
        <span class="buy-panel__row-value">${formatEuros(pubState.user.balance)}</span>
      </div>
      <div class="buy-panel__row buy-panel__row--total">
        <span class="buy-panel__row-label">Solde après</span>
        <span class="buy-panel__row-value ${hasEnough ? '' : 'red'}">
          ${hasEnough ? formatEuros(afterAmount) : 'Insuffisant'}
        </span>
      </div>
    </div>
    ${alertHtml}
    <div class="buy-panel__actions">
      <button class="btn btn-outline" onclick="closeBuyModal()">Annuler</button>
      <button class="btn btn-primary" id="btn-confirm-buy"
        onclick="confirmBuy()" ${hasEnough ? '' : 'disabled'}>
        Confirmer
      </button>
    </div>
  `;

  if (isMobile) {
    const panel = document.getElementById('buy-panel-mobile');
    document.getElementById('buy-panel-mobile-inner').innerHTML = html;
    panel.style.display = 'block';
    // Scroll doux vers le panneau
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    const panel = document.getElementById('buy-panel-desktop');
    document.getElementById('buy-panel-desktop-inner').innerHTML = html;
    panel.style.display = 'block';
  }
}

function closeBuyModal() {
  document.getElementById('buy-panel-mobile').style.display  = 'none';
  document.getElementById('buy-panel-desktop').style.display = 'none';
  pubState.buyingProno = null;
}

function confirmBuy() {
  const prono = pubState.buyingProno;
  if (!prono) return;

  const btn = document.getElementById('btn-confirm-buy');
  btn.disabled    = true;
  btn.textContent = '⏳…';

  setTimeout(() => {
    // TODO (Supabase) : débiter le solde + enregistrer l'achat
    pubState.user.balance -= prono.price;
    pubState.user.pending += prono.price;

    const idx = pubState.pronos.findIndex(p => p.id === prono.id);
    if (idx !== -1) {
      pubState.pronos[idx].purchased = true;
      pubState.pronos[idx].buyers   += 1;
    }

    closeBuyModal();
    renderUserBalance();
    renderPronos();
    showToast('✓ Pronostic acheté ! La somme est en attente de résultat.', 'success');
  }, 1000);
}

// ── Utilitaires ───────────────────────────────────────────────
function formatEuros(n) {
  return n % 1 === 0
    ? Math.round(n).toLocaleString('fr-FR') + ' €'
    : n.toFixed(2).replace('.', ',') + ' €';
}

function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const colors = {
    error:   { bg: 'var(--error-pale)',   border: 'var(--error)',   icon: '✕' },
    success: { bg: 'var(--success-pale)', border: 'var(--success)', icon: '✓' },
    info:    { bg: 'var(--blue-pale)',    border: 'var(--blue)',     icon: 'ℹ' },
  };
  const c = colors[type] || colors.info;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${c.icon}</span> ${message}`;
  Object.assign(toast.style, {
    position:'fixed', bottom:'24px', left:'50%', transform:'translateX(-50%)',
    background: c.bg, border: `1px solid ${c.border}`,
    borderRadius:'var(--radius-md)', padding:'12px 24px',
    fontSize:'0.87rem', fontFamily:'var(--font-body)',
    color:'var(--text-dark)', zIndex:'9999',
    animation:'fadeUp 0.3s ease both', boxShadow:'var(--shadow-md)',
    whiteSpace:'nowrap', maxWidth:'90vw',
  });
  document.body.appendChild(toast);
  setTimeout(() => toast?.remove(), 4000);
}
