/**
 * ============================================================
 *  PARIS-BET — JS DASHBOARD TIPSTER (dashboard-tipster.js)
 * ============================================================
 */

// ── Données de démo (remplacées par Supabase plus tard) ───────
const MOCK_TIPSTER = {
  firstName:  'Alexis',
  lastName:   'Martin',
  role:       'tipster',
  balance:    247.50,       // Solde disponible (€)
  pending:    84.00,        // Sommes en attente de validation
  winRate:    71,           // % de pronos gagnants
  totalEarned: 1840.00,     // Total gagné depuis l'inscription
  ribSaved:   true,         // RIB déjà renseigné
};

const MOCK_PRONOS = [
  {
    id: 1,
    match:    'PSG vs Marseille',
    sport:    '⚽ Ligue 1',
    date:     'Sam. 15 mars · 20h45',
    price:    5.00,
    buyers:   47,
    status:   CONFIG.betStatus.PENDING,
    content:  'PSG gagne avec +1.5 buts. Forme excellente à domicile.',
    locked:   true,
  },
  {
    id: 2,
    match:    'Real Madrid vs Barça',
    sport:    '⚽ Liga',
    date:     'Dim. 16 mars · 21h00',
    price:    8.00,
    buyers:   83,
    status:   CONFIG.betStatus.WON,
    content:  'Real Madrid victoire. Avantage à domicile + Barça blessés.',
    locked:   true,
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
    locked:   true,
  },
  {
    id: 4,
    match:    'Lakers vs Warriors',
    sport:    '🏀 NBA',
    date:     'Lun. 17 mars · 03h30',
    price:    4.00,
    buyers:   0,
    status:   CONFIG.betStatus.PENDING,
    content:  '',
    locked:   false, // Pas encore acheté → peut être supprimé
  },
];

const MOCK_VIREMENTS = [
  { id: 1, date: 'Lun. 10 mars 2025',  label: 'Virement hebdomadaire', amount: 320.00,  status: 'sent' },
  { id: 2, date: 'Lun. 03 mars 2025',  label: 'Virement hebdomadaire', amount: 185.50,  status: 'sent' },
  { id: 3, date: 'Lun. 24 févr. 2025', label: 'Virement hebdomadaire', amount: 412.00,  status: 'sent' },
  { id: 4, date: 'Lun. 17 mars 2025',  label: 'Virement à venir',      amount: 247.50,  status: 'pending' },
];

// ── État de la page ───────────────────────────────────────────
const state = {
  activePage: 'pronos',  // 'pronos' | 'solde' | 'rib' | 'stats'
  pronos: [...MOCK_PRONOS],
};

// ── Init ──────────────────────────────────────────────────────
// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Vérifier que l'utilisateur est bien connecté en tant que tipster
  const user = await requireAuth(['tipster', 'admin']);
  if (!user) return;

  // Charger le vrai profil
  MOCK_TIPSTER.firstName = user.profile.first_name;
  MOCK_TIPSTER.lastName  = user.profile.last_name;
  MOCK_TIPSTER.balance   = parseFloat(user.profile.balance) || 0;
  MOCK_TIPSTER.pending   = parseFloat(user.profile.pending) || 0;

  // Mettre à jour la sidebar immédiatement
  const fullName = MOCK_TIPSTER.firstName + ' ' + MOCK_TIPSTER.lastName;
  const initials = (MOCK_TIPSTER.firstName[0] + MOCK_TIPSTER.lastName[0]).toUpperCase();
  const sidebarName   = document.getElementById('sidebar-name');
  const sidebarAvatar = document.getElementById('sidebar-avatar');
  if (sidebarName)   sidebarName.textContent  = fullName;
  if (sidebarAvatar) sidebarAvatar.textContent = initials;

  // Charger les vrais pronos depuis Supabase
  const { data: pronos } = await sb
    .from('pronos')
    .select('*')
    .eq('tipster_id', user.id)
    .order('created_at', { ascending: false });

  if (pronos && pronos.length > 0) {
    state.pronos = pronos;
  } else {
    state.pronos = []; // Pas de données de démo
  }

  renderSidebar();
  renderTopbar();
  navigateTo('pronos');
});

// ── Sidebar ───────────────────────────────────────────────────
function renderSidebar() {
  const t = MOCK_TIPSTER;
  document.getElementById('sidebar-name').textContent   = `${t.firstName} ${t.lastName}`;
  document.getElementById('sidebar-avatar').textContent = t.firstName[0] + t.lastName[0];
}

// ── Topbar ────────────────────────────────────────────────────
function renderTopbar() {
  document.getElementById('topbar-balance').textContent =
    `💰 ${formatEuros(MOCK_TIPSTER.balance)} disponible`;
}

// ── Navigation entre pages ────────────────────────────────────
function navigateTo(page) {
  state.activePage = page;

  // Mettre à jour les liens actifs
  document.querySelectorAll('.sidebar__link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  // Mettre à jour le titre
  const titles = {
    pronos: 'Mes pronostics',
    solde:  'Solde & Virements',
    rib:    'Mes informations bancaires',
    stats:  'Mes statistiques',
  };
  document.getElementById('topbar-title').textContent = titles[page] || 'Dashboard';

  // Rendre la bonne page
  const content = document.getElementById('page-content');
  content.innerHTML = '';

  if (page === 'pronos') renderPagePronos(content);
  if (page === 'solde')  renderPageSolde(content);
  if (page === 'rib')    renderPageRIB(content);
  if (page === 'stats')  renderPageStats(content);
}

// ══════════════════════════════════════════════════════════════
//  PAGE — MES PRONOSTICS
// ══════════════════════════════════════════════════════════════
function renderPagePronos(container) {
  container.innerHTML = `
    <div class="section-header">
      <div>
        <h2>Mes pronostics</h2>
        <p>${state.pronos.length} pronostic(s) au total</p>
      </div>
      <button class="btn btn-primary" onclick="openModal()">
        + Nouveau pronostic
      </button>
    </div>

    <div class="pronos-table">
      <div class="table-header">
        <span>Match / Événement</span>
        <span>Acheteurs</span>
        <span>Prix</span>
        <span>Statut</span>
        <span>Date</span>
        <span></span>
      </div>
      ${state.pronos.map(p => renderPronoRow(p)).join('')}
    </div>

    ${state.pronos.length === 0 ? `
      <div class="empty-state">
        <div class="empty-state__icon">🎯</div>
        <h3>Aucun pronostic pour l'instant</h3>
        <p>Publiez votre premier pronostic et commencez à vendre !</p>
        <button class="btn btn-primary" onclick="openModal()">+ Créer mon premier prono</button>
      </div>
    ` : ''}
  `;
}

function renderPronoRow(p) {
  const statusBadge = {
    [CONFIG.betStatus.PENDING]:   `<span class="badge badge-pending">⏳ En attente</span>`,
    [CONFIG.betStatus.WON]:       `<span class="badge badge-won">✓ Gagné</span>`,
    [CONFIG.betStatus.LOST]:      `<span class="badge badge-lost">✕ Perdu</span>`,
    [CONFIG.betStatus.CANCELLED]: `<span class="badge badge-cancelled">⊘ Annulé</span>`,
  };

  const canDelete = !p.locked && p.buyers === 0;

  return `
    <div class="table-row">
      <div>
        <div class="prono-title">${p.match}</div>
        <div class="prono-meta">${p.sport} · ${p.match_date || p.date || ""}</div>
        ${p.locked
          ? `<div class="prono-lock">🔒 Verrouillé — modification impossible</div>`
          : `<div class="prono-lock" style="color:var(--warning)">✏️ Brouillon — non encore acheté</div>`
        }
      </div>
      <div class="buyers-count">
        <span>👥</span> ${p.buyers}
      </div>
      <div class="prono-price">${formatEuros(p.price)}</div>
      <div>${statusBadge[p.status] || ''}</div>
      <div style="font-size:0.8rem;color:var(--text-muted)">${(p.match_date || p.date || "").split('·')[0].trim()}</div>
      <div class="table-actions">
        <button
          class="btn-icon"
          title="Voir le pronostic"
          onclick="viewProno(${p.id})"
        >👁</button>
        <button
          class="btn-icon danger"
          title="${canDelete ? 'Supprimer' : 'Impossible : déjà acheté'}"
          onclick="deleteProno(${p.id})"
          ${canDelete ? '' : 'disabled'}
        >🗑</button>
      </div>
    </div>
  `;
}

// ── Modal — Créer un prono ─────────────────────────────────────
function openModal() {
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('new-match').focus();
}
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  // Reset form
  ['new-match','new-sport','new-date','new-time','new-price','new-content'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

async function submitProno() {
  const match   = document.getElementById('new-match').value.trim();
  const sport   = document.getElementById('new-sport').value.trim();
  const date    = document.getElementById('new-date').value;
  const time    = document.getElementById('new-time').value;
  const price   = parseFloat(document.getElementById('new-price').value);
  const content = document.getElementById('new-content').value.trim();

  if (!match || !sport || !date || !price || !content) {
    showToast('Veuillez remplir tous les champs.', 'error'); return;
  }
  if (price < 1) {
    showToast('Le prix minimum est 1 €.', 'error'); return;
  }

  const btn = document.getElementById('btn-submit-prono');
  btn.disabled = true;
  btn.textContent = '⏳ Publication…';

  try {
    const user = await getCurrentUser();
    const { data, error } = await sb.from('pronos').insert([{
      tipster_id: user.id,
      match,
      sport,
      match_date: `${date}${time ? ' · ' + time : ''}`,
      price,
      buyers:  0,
      status:  CONFIG.betStatus.PENDING,
      content,
      locked:  true,
    }]).select().single();

    if (error) throw error;

    state.pronos.unshift(data);
    closeModal();
    navigateTo('pronos');
    showToast('Pronostic publié ! Il est maintenant verrouillé. 🔒', 'success');
  } catch (err) {
    showToast('Erreur : ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Publier et verrouiller 🔒';
  }
}

// ── Voir le contenu d'un prono ────────────────────────────────
function viewProno(id) {
  const p = state.pronos.find(p => p.id === id);
  if (!p) return;
  alert(`📋 Contenu du pronostic\n\n${p.match}\n\n"${p.content || '(brouillon — contenu vide)'}"`);
}

// ── Supprimer un prono (seulement si 0 acheteur) ───────────────
async function deleteProno(id) {
  const p = state.pronos.find(p => p.id === id);
  if (!p || p.locked || p.buyers > 0) {
    showToast('Impossible de supprimer ce pronostic.', 'error'); return;
  }
  if (!confirm(`Supprimer "${p.match}" ?`)) return;

  try {
    const { error } = await sb.from('pronos').delete().eq('id', id);
    if (error) throw error;
    state.pronos = state.pronos.filter(p => p.id !== id);
    navigateTo('pronos');
    showToast('Pronostic supprimé.', 'success');
  } catch (err) {
    showToast('Erreur : ' + err.message, 'error');
  }
}

// ══════════════════════════════════════════════════════════════
//  PAGE — SOLDE & VIREMENTS
// ══════════════════════════════════════════════════════════════
function renderPageSolde(container) {
  const t = MOCK_TIPSTER;
  const nextMonday = CONFIG.finance.payoutDay;
  const minPayout  = CONFIG.finance.minTipsterPayout;

  container.innerHTML = `
    <!-- Carte solde principal -->
    <div class="balance-card">
      <div class="balance-card__label">Solde disponible</div>
      <div class="balance-card__amount">${formatEuros(t.balance)}</div>
      <div class="balance-card__sub">
        Prochain virement le <strong>${nextMonday}</strong>
        ${t.balance >= minPayout
          ? `· ✓ Seuil de ${minPayout}€ atteint`
          : `· ⚠️ Minimum ${minPayout}€ requis (manque ${formatEuros(minPayout - t.balance)})`
        }
      </div>
      <div class="balance-card__pending">
        ⏳ ${formatEuros(t.pending)} en attente de validation admin
      </div>
    </div>

    <!-- Historique des virements -->
    <div class="section-header">
      <div>
        <h2>Historique des virements</h2>
        <p>Chaque lundi · Minimum ${minPayout}€</p>
      </div>
    </div>

    <div class="pronos-table" style="padding: 0 var(--space-lg);">
      ${MOCK_VIREMENTS.map(v => `
        <div class="virement-row">
          <div class="virement-info">
            <div class="virement-icon ${v.status}">
              ${v.status === 'sent' ? '✓' : '⏳'}
            </div>
            <div>
              <div class="virement-label">${v.label}</div>
              <div class="virement-date">${v.date}</div>
            </div>
          </div>
          <div class="virement-amount ${v.status === 'sent' ? 'positive' : 'pending'}">
            ${v.status === 'sent' ? '+' : ''}${formatEuros(v.amount)}
          </div>
        </div>
      `).join('')}
    </div>

    <p style="font-size:0.78rem;color:var(--text-muted);margin-top:var(--space-md);text-align:center;">
      Les virements sont effectués chaque lundi matin sur votre RIB enregistré.
      <a href="#" onclick="navigateTo('rib')" style="color:var(--blue)">Modifier mon RIB →</a>
    </p>
  `;
}

// ══════════════════════════════════════════════════════════════
//  PAGE — RIB
// ══════════════════════════════════════════════════════════════
function renderPageRIB(container) {
  container.innerHTML = `
    <div style="max-width: 560px;">
      <div class="rib-card">
        <div class="rib-card__header">
          <div style="font-size:1.6rem;">🏦</div>
          <div>
            <h3>Informations bancaires</h3>
            <p>Vos coordonnées pour recevoir vos virements chaque lundi</p>
          </div>
        </div>

        ${MOCK_TIPSTER.ribSaved ? `
          <div class="rib-saved">
            ✓ RIB enregistré — vos virements seront effectués sur ce compte
          </div>
        ` : ''}

        <div class="form-group">
          <label>Titulaire du compte</label>
          <div class="input-wrap">
            <span class="input-icon">👤</span>
            <input class="input" type="text" id="rib-name"
              placeholder="Prénom NOM"
              value="${MOCK_TIPSTER.ribSaved ? 'Alexis MARTIN' : ''}"
            />
          </div>
        </div>

        <div class="form-group">
          <label>IBAN</label>
          <div class="input-wrap">
            <span class="input-icon">🏦</span>
            <input class="input" type="text" id="rib-iban"
              placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
              value="${MOCK_TIPSTER.ribSaved ? 'FR76 3000 4028 3700 0100 0000 943' : ''}"
              oninput="formatIBAN(this)"
            />
          </div>
        </div>

        <div class="form-group">
          <label>BIC / SWIFT</label>
          <div class="input-wrap">
            <span class="input-icon">🔢</span>
            <input class="input" type="text" id="rib-bic"
              placeholder="BNPAFRPPXXX"
              value="${MOCK_TIPSTER.ribSaved ? 'BNPAFRPP' : ''}"
            />
          </div>
        </div>

        <div style="background:var(--blue-xpale);border:1px solid rgba(26,86,255,0.15);border-radius:var(--radius-md);padding:var(--space-md);font-size:0.8rem;color:var(--text-muted);line-height:1.6;margin-bottom:var(--space-lg);">
          🔒 Vos coordonnées bancaires sont chiffrées et sécurisées. Elles ne sont jamais partagées et uniquement utilisées pour vos virements hebdomadaires.
        </div>

        <button class="btn btn-primary" style="width:100%" onclick="saveRIB()">
          Enregistrer mes coordonnées bancaires
        </button>
      </div>
    </div>
  `;
}

function formatIBAN(input) {
  let val = input.value.replace(/\s/g, '').toUpperCase();
  input.value = val.match(/.{1,4}/g)?.join(' ') || val;
}

function saveRIB() {
  const name = document.getElementById('rib-name').value.trim();
  const iban = document.getElementById('rib-iban').value.trim();
  const bic  = document.getElementById('rib-bic').value.trim();

  if (!name || !iban || !bic) {
    showToast('Veuillez remplir tous les champs.', 'error'); return;
  }
  // TODO (Supabase) : await sb.from('profiles').update({ rib: { name, iban, bic } })
  MOCK_TIPSTER.ribSaved = true;
  showToast('Coordonnées bancaires enregistrées ! ✓', 'success');
  navigateTo('rib');
}

// ══════════════════════════════════════════════════════════════
//  PAGE — STATISTIQUES
// ══════════════════════════════════════════════════════════════
function renderPageStats(container) {
  const won       = state.pronos.filter(p => p.status === CONFIG.betStatus.WON).length;
  const lost      = state.pronos.filter(p => p.status === CONFIG.betStatus.LOST).length;
  const pending   = state.pronos.filter(p => p.status === CONFIG.betStatus.PENDING).length;
  const cancelled = state.pronos.filter(p => p.status === CONFIG.betStatus.CANCELLED).length;
  const total     = state.pronos.length;
  const totalBuyers = state.pronos.reduce((sum, p) => sum + p.buyers, 0);

  container.innerHTML = `
    <div class="stats-grid" style="grid-template-columns: repeat(4,1fr)">
      <div class="stat-card stat-card--blue">
        <div class="stat-card__label">💰 Total gagné</div>
        <div class="stat-card__value">${formatEuros(MOCK_TIPSTER.totalEarned)}</div>
        <div class="stat-card__sub">Depuis l'inscription</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">🏆 Win Rate</div>
        <div class="stat-card__value">${MOCK_TIPSTER.winRate}%</div>
        <div class="stat-card__sub">${won} gagné(s) / ${won + lost} validé(s)</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">📊 Pronos publiés</div>
        <div class="stat-card__value">${total}</div>
        <div class="stat-card__sub">${pending} en attente</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">👥 Acheteurs total</div>
        <div class="stat-card__value">${totalBuyers}</div>
        <div class="stat-card__sub">Sur tous les pronos</div>
      </div>
    </div>

    <div class="section-header"><div><h2>Détail des résultats</h2></div></div>
    <div class="pronos-table" style="padding: var(--space-lg);">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:var(--space-md)">
        ${[
          { label: 'Gagnés',   count: won,       cls: 'badge-won',       icon: '✓' },
          { label: 'Perdus',   count: lost,       cls: 'badge-lost',      icon: '✕' },
          { label: 'Annulés',  count: cancelled,  cls: 'badge-cancelled', icon: '⊘' },
          { label: 'En attente',count: pending,   cls: 'badge-pending',   icon: '⏳' },
        ].map(s => `
          <div style="text-align:center;padding:var(--space-xl);background:var(--bg-soft);border-radius:var(--radius-lg);border:1px solid var(--border)">
            <div style="font-size:2rem;margin-bottom:8px">${s.icon}</div>
            <div style="font-family:var(--font-display);font-size:2rem;font-weight:800;color:var(--text-dark)">${s.count}</div>
            <span class="badge ${s.cls}" style="margin-top:6px">${s.label}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ── Utilitaires ───────────────────────────────────────────────
function formatEuros(n) {
  return Math.round(n * 100) / 100 === Math.round(n)
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
    whiteSpace:'nowrap',
  });
  document.body.appendChild(toast);
  setTimeout(() => toast?.remove(), 3500);
}
