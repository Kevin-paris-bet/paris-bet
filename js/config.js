/**
 * ============================================================
 *  PARIS-BET — JS PAGE AUTH (auth.js)
 *  Gestion des formulaires connexion / inscription
 * ============================================================
 */

// ── État global du formulaire ─────────────────────────────────
const authState = {
  activeTab:    'login',   // 'login' | 'register'
  selectedRole: 'user',   // 'user'  | 'tipster'
};

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Lire le hash de l'URL pour ouvrir le bon onglet
  // Ex: auth.html#register ou auth.html#login
  const hash = window.location.hash.replace('#', '').split('?')[0];
  if (hash === 'register') switchTab('register');
  else switchTab('login');

  // Lire le rôle dans l'URL si fourni
  // Ex: auth.html#register?role=tipster
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  if (params.get('role') === 'tipster') selectRole('tipster');

});

// ── Changement d'onglet ───────────────────────────────────────
function switchTab(tab) {
  authState.activeTab = tab;

  document.querySelectorAll('.auth-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.auth-form').forEach(form => {
    form.classList.toggle('active', form.id === `form-${tab}`);
  });

  // Mettre à jour le hash sans recharger
  history.replaceState(null, '', `#${tab}`);
}

// ── Sélection du rôle (inscription) ──────────────────────────
function selectRole(role) {
  authState.selectedRole = role;
  document.querySelectorAll('.role-option').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.role === role);
  });
}

// ── Toggle affichage mot de passe ─────────────────────────────
function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.textContent = isHidden ? '🙈' : '👁';
}

// ── Validations en temps réel ─────────────────────────────────
function validateEmail(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  const val   = input.value.trim();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  input.classList.toggle('error', val.length > 2 && !valid);
  input.classList.toggle('valid', valid);
  if (error) error.classList.toggle('show', val.length > 2 && !valid);
  return valid;
}

function validateNotEmpty(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  const valid = input.value.trim().length > 0;

  input.classList.toggle('valid', valid);
  if (error) error.classList.toggle('show', !valid && input.value.length > 0);
  return valid;
}

// ── Force du mot de passe ─────────────────────────────────────
function checkPasswordStrength(inputId) {
  const input    = document.getElementById(inputId);
  const strength = document.getElementById('pw-strength');
  const label    = document.getElementById('pw-label');
  const bars     = document.querySelectorAll('.pw-bar');
  const val      = input.value;

  if (!val) { strength.classList.remove('show'); return false; }
  strength.classList.add('show');

  let score = 0;
  if (val.length >= 8)            score++;
  if (/[A-Z]/.test(val))          score++;
  if (/[0-9]/.test(val))          score++;
  if (/[^A-Za-z0-9]/.test(val))   score++;

  const cls    = ['', 'weak', 'weak', 'medium', 'strong'];
  const labels = ['', 'Trop faible', 'Faible', 'Moyen', 'Fort 💪'];
  const colors = ['', 'var(--error)', 'var(--error)', 'var(--warning)', 'var(--success)'];

  bars.forEach((bar, i) => {
    bar.className = 'pw-bar' + (i < score ? ' ' + cls[score] : '');
  });
  label.textContent  = labels[score] || 'Trop court';
  label.style.color  = colors[score] || 'var(--text-muted)';

  return score >= 3; // Valide si "moyen" ou plus
}

// ── CONNEXION ─────────────────────────────────────────────────
async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pw    = document.getElementById('login-pw').value;
  const btn   = document.getElementById('btn-login');

  // Validation basique
  if (!email || !pw) { showToast('Veuillez remplir tous les champs.', 'error'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Adresse email invalide.', 'error'); return; }

  // État loading
  setLoading(btn, true);

  try {
    // ─────────────────────────────────────────────────────────────
    // TODO (étape Supabase) : remplacer par l'appel réel
    // const { data, error } = await sb.auth.signInWithPassword({ email, password: pw })
    // if (error) throw new Error(error.message)
    // ─────────────────────────────────────────────────────────────

    // Simulation réponse API (2s)
    await sleep(1800);

    // Succès → afficher l'état de succès
    document.getElementById('form-login').style.display = 'none';
    document.getElementById('login-success').classList.add('show');

  } catch (err) {
    showToast(err.message || 'Email ou mot de passe incorrect.', 'error');
  } finally {
    setLoading(btn, false);
  }
}

// ── INSCRIPTION ───────────────────────────────────────────────
async function handleRegister() {
  const firstName = document.getElementById('reg-firstname').value.trim();
  const lastName  = document.getElementById('reg-lastname').value.trim();
  const email     = document.getElementById('reg-email').value.trim();
  const pw        = document.getElementById('reg-pw').value;
  const terms     = document.getElementById('reg-terms').checked;
  const btn       = document.getElementById('btn-register');

  // Validations
  if (!firstName || !lastName) { showToast('Veuillez renseigner votre prénom et nom.', 'error'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Adresse email invalide.', 'error'); return; }
  if (pw.length < 8) { showToast('Le mot de passe doit faire au moins 8 caractères.', 'error'); return; }
  if (!terms) { showToast('Veuillez accepter les conditions d\'utilisation.', 'error'); return; }

  setLoading(btn, true);

  try {
    // ─────────────────────────────────────────────────────────────
    // TODO (étape Supabase) : remplacer par l'appel réel
    // const { data, error } = await sb.auth.signUp({
    //   email, password: pw,
    //   options: { data: { first_name: firstName, last_name: lastName, role: authState.selectedRole } }
    // })
    // if (error) throw new Error(error.message)
    // ─────────────────────────────────────────────────────────────

    await sleep(1800);

    // Succès
    document.getElementById('form-register').style.display = 'none';
    document.getElementById('register-success').classList.add('show');

  } catch (err) {
    showToast(err.message || 'Une erreur est survenue.', 'error');
  } finally {
    setLoading(btn, false);
  }
}

// ── Google Auth ───────────────────────────────────────────────
function handleGoogleAuth() {
  // TODO (étape Supabase) : sb.auth.signInWithOAuth({ provider: 'google' })
  showToast('Connexion Google disponible bientôt 🚀', 'info');
}

// ── Helpers ───────────────────────────────────────────────────
function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.classList.toggle('loading', loading);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Toast de notification ─────────────────────────────────────
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
    position:     'fixed',
    bottom:       '24px',
    left:         '50%',
    transform:    'translateX(-50%)',
    background:   c.bg,
    border:       `1px solid ${c.border}`,
    borderRadius: 'var(--radius-md)',
    padding:      '12px 24px',
    fontSize:     '0.87rem',
    fontFamily:   'var(--font-body)',
    color:        'var(--text-dark)',
    zIndex:       '9999',
    animation:    'fadeUp 0.3s ease both',
    boxShadow:    'var(--shadow-md)',
    whiteSpace:   'nowrap',
  });
  document.body.appendChild(toast);
  setTimeout(() => toast?.remove(), 3500);
}

/**
 * ============================================================
 *  PARIS-BET — FICHIER DE CONFIGURATION CENTRAL
 *  Modifiez ce fichier pour changer le comportement global
 *  du site sans toucher au reste du code.
 * ============================================================
 */

const CONFIG = {

  // ── Informations du site ──────────────────────────────────
  site: {
    name:        "Paris-Bet",
    tagline:     "La plateforme des tipsters sérieux",
    domain:      "paris-bet.fr",
    email:       "contact@paris-bet.fr",
    year:        new Date().getFullYear(),
  },

  // ── Règles financières ────────────────────────────────────
  finance: {
    commissionRate:      0.10,   // 10% prélevés sur chaque pari gagné
    minDeposit:          5,      // Dépôt minimum utilisateur (€)
    minTipsterPayout:    30,     // Solde minimum pour virement tipster (€)
    payoutDay:           "lundi",// Jour des virements hebdomadaires
  },

  // ── Règles des pronos ─────────────────────────────────────
  pronos: {
    canEditAfterPublish:  false, // Tipster ne peut PAS modifier après publication
    canDeleteIfBought:    false, // Tipster ne peut PAS supprimer si quelqu'un a acheté
    revealOnPurchase:     true,  // Contenu visible dès le paiement
  },

  // ── Statuts possibles d'un pari (admin seulement) ─────────
  betStatus: {
    PENDING:   "pending",    // En attente de validation admin
    WON:       "won",        // Gagné → tipster crédité, platform prend 10%
    LOST:      "lost",       // Perdu → utilisateurs remboursés
    CANCELLED: "cancelled",  // Annulé → utilisateurs remboursés
  },

  // ── Couleurs (modifiables ici, appliquées partout) ─────────
  // Ces valeurs sont dupliquées dans css/variables.css
  // Modifiez les deux fichiers ensemble si vous changez les couleurs
  colors: {
    primary:    "#1a56ff",   // Bleu principal
    primaryDark:"#1040d4",   // Bleu foncé (hover)
    accent:     "#e8f0ff",   // Bleu très clair
    white:      "#ffffff",
    textDark:   "#0d1b3e",   // Texte principal
    textMuted:  "#6b7fa3",   // Texte secondaire
    success:    "#00c853",
    error:      "#ff3d3d",
    warning:    "#ffab00",
  },

  // ── Navigation (ordre des liens dans le menu) ─────────────
  navLinks: [
    { label: "Comment ça marche", href: "#how" },
    { label: "Fonctionnalités",   href: "#features" },
    { label: "Simulateur",        href: "#simulator" },
    { label: "FAQ",               href: "#faq" },
  ],

  // ── Pages du projet ───────────────────────────────────────
  pages: {
    home:      "index.html",
    auth:      "pages/auth.html",
    tipster:   "pages/dashboard-tipster.html",
    user:      "pages/dashboard-user.html",
    admin:     "pages/dashboard-admin.html",
    profile:   "pages/tipster-public.html",  // page publique d'un tipster
  },

  // ── Stats landing page (à mettre à jour manuellement) ─────
  stats: {
    tipsters:    "1 200+",
    users:       "8 400+",
    paidOut:     "94 000€+",
    satisfaction:"97%",
  },

  // ── FAQ ───────────────────────────────────────────────────
  faq: [
    {
      q: "Comment fonctionne le Pay-Per-Win ?",
      a: "Vous achetez un pronostic avec votre solde. La somme est mise « en attente ». Si le pari est gagné, le tipster est crédité et vous gardez votre accès. Si le pari est perdu ou annulé, vous êtes intégralement remboursé sur votre solde."
    },
    {
      q: "Comment recharger mon solde ?",
      a: "Depuis votre tableau de bord, cliquez sur « Recharger » et déposez minimum 5€ via carte bancaire (Stripe). Le solde est disponible immédiatement."
    },
    {
      q: "Comment devenir tipster ?",
      a: "Inscrivez-vous, choisissez le rôle « Tipster » et renseignez votre RIB dans vos paramètres. Vous pouvez publier vos premiers pronostics immédiatement."
    },
    {
      q: "Quand les tipsters sont-ils payés ?",
      a: "Les virements sont effectués chaque lundi, à condition que le solde du tipster dépasse 30€. Les fonds proviennent uniquement des paris validés comme gagnants."
    },
    {
      q: "Qui valide les résultats des paris ?",
      a: "L'administrateur Paris-Bet valide manuellement chaque résultat (gagné, perdu ou annulé). Cela garantit la fiabilité et protège les utilisateurs contre toute fraude."
    },
    {
      q: "Un tipster peut-il modifier un pronostic après publication ?",
      a: "Non, c'est impossible. Une fois publié, un pronostic est figé. Cela protège les acheteurs et garantit l'intégrité de la plateforme."
    },
  ],

};

// Gel de l'objet pour éviter les modifications accidentelles
Object.freeze(CONFIG);
Object.freeze(CONFIG.finance);
Object.freeze(CONFIG.pronos);
Object.freeze(CONFIG.betStatus);
Object.freeze(CONFIG.colors);
Object.freeze(CONFIG.pages);

/**
 * ============================================================
 *  PARIS-BET — JS PANEL ADMIN (dashboard-admin.js)
 * ============================================================
 */

// ── Données de démo ───────────────────────────────────────────
const MOCK_ADMIN = { firstName: 'Admin', lastName: 'Paris-Bet' };

const MOCK_PRONOS_ADMIN = [
  { id:1, tipster:'Alexis Martin', match:'PSG vs Marseille',    sport:'⚽ Ligue 1', date:'15/03/2026', price:5.00,  buyers:47, status:'pending',   revenue:235.00 },
  { id:2, tipster:'Alexis Martin', match:'Real Madrid vs Barça',sport:'⚽ Liga',    date:'16/03/2026', price:8.00,  buyers:83, status:'pending',   revenue:664.00 },
  { id:3, tipster:'Karim B.',      match:'Djokovic vs Alcaraz', sport:'🎾 Tennis',  date:'16/03/2026', price:6.00,  buyers:31, status:'pending',   revenue:186.00 },
  { id:4, tipster:'Alexis Martin', match:'Lakers vs Warriors',  sport:'🏀 NBA',     date:'17/03/2026', price:4.00,  buyers:12, status:'pending',   revenue:48.00  },
  { id:5, tipster:'Sofia R.',      match:'Lens vs Lyon',        sport:'⚽ Ligue 1', date:'18/03/2026', price:5.00,  buyers:28, status:'won',       revenue:140.00 },
  { id:6, tipster:'Karim B.',      match:'Federer vs Nadal',    sport:'🎾 Tennis',  date:'10/03/2026', price:7.00,  buyers:54, status:'lost',      revenue:378.00 },
  { id:7, tipster:'Sofia R.',      match:'OM vs Nice',          sport:'⚽ Ligue 1', date:'09/03/2026', price:4.00,  buyers:19, status:'cancelled', revenue:76.00  },
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
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('sidebar-avatar').textContent = 'AD';
  navigateTo('overview');
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
            <div class="prono-title">${p.match}</div>
            <div class="prono-meta">${p.sport} · ${p.date}</div>
          </div>
          <div style="font-size:0.85rem;color:var(--text-muted)">${p.tipster}</div>
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

function validateProno(id, status) {
  const p = adminState.pronos.find(p => p.id === id);
  if (!p) return;

  const labels = { won:'GAGNÉ', lost:'PERDU', cancelled:'ANNULÉ' };
  const msgs   = {
    won:       `✓ Valider comme GAGNÉ ?\n→ Le tipster sera crédité de ${formatEuros(p.revenue * (1 - CONFIG.finance.commissionRate))}\n→ Vous encaissez ${formatEuros(p.revenue * CONFIG.finance.commissionRate)} de commission`,
    lost:      `✕ Valider comme PERDU ?\n→ Les ${p.buyers} acheteur(s) seront intégralement remboursés`,
    cancelled: `⊘ Valider comme ANNULÉ ?\n→ Les ${p.buyers} acheteur(s) seront intégralement remboursés`,
  };

  if (!confirm(msgs[status])) return;

  // TODO (Supabase) : mettre à jour le statut + déclencher les crédits/remboursements
  p.status = status;

  navigateTo('pronos');
  const toastType = status === 'won' ? 'success' : 'info';
  showToast(`Pronostic "${p.match}" validé comme ${labels[status]}`, toastType);
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
            ${t.ribOk
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
        <div class="stat-card__value">${formatEuros(adminState.users.reduce((s,u)=>s+u.pending,0))}</div>
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
document.addEventListener('DOMContentLoaded', () => {
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
        <div class="prono-meta">${p.sport} · ${p.date}</div>
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
      <div style="font-size:0.8rem;color:var(--text-muted)">${p.date.split('·')[0].trim()}</div>
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

function submitProno() {
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

  // Créer le prono
  const newProno = {
    id:      Date.now(),
    match,
    sport,
    date:    `${date}${time ? ' · ' + time : ''}`,
    price,
    buyers:  0,
    status:  CONFIG.betStatus.PENDING,
    content,
    locked:  true, // Immédiatement verrouillé à la publication
  };

  // TODO (Supabase) : await sb.from('pronos').insert([newProno])
  state.pronos.unshift(newProno);

  closeModal();
  navigateTo('pronos');
  showToast('Pronostic publié ! Il est maintenant verrouillé. 🔒', 'success');
}

// ── Voir le contenu d'un prono ────────────────────────────────
function viewProno(id) {
  const p = state.pronos.find(p => p.id === id);
  if (!p) return;
  alert(`📋 Contenu du pronostic\n\n${p.match}\n\n"${p.content || '(brouillon — contenu vide)'}"`);
}

// ── Supprimer un prono (seulement si 0 acheteur) ───────────────
function deleteProno(id) {
  const p = state.pronos.find(p => p.id === id);
  if (!p || p.locked || p.buyers > 0) {
    showToast('Impossible de supprimer ce pronostic.', 'error'); return;
  }
  if (!confirm(`Supprimer "${p.match}" ?`)) return;

  // TODO (Supabase) : await sb.from('pronos').delete().eq('id', id)
  state.pronos = state.pronos.filter(p => p.id !== id);
  navigateTo('pronos');
  showToast('Pronostic supprimé.', 'success');
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
  { id:1, tipster:'Alexis Martin', match:'Real Madrid vs Barça',   sport:'⚽ Liga',       date:'16 mars 2025', price:8.00, status:CONFIG.betStatus.WON,       content:'Real Madrid victoire. Avantage domicile, Barça avec plusieurs absents.' },
  { id:2, tipster:'Alexis Martin', match:'Djokovic vs Alcaraz',     sport:'🎾 Roland Garros',date:'16 mars 2025', price:6.00, status:CONFIG.betStatus.LOST,      content:'Djokovic en 3 sets. Meilleure forme sur terre battue.' },
  { id:3, tipster:'Alexis Martin', match:'PSG vs Marseille',        sport:'⚽ Ligue 1',    date:'15 mars 2025', price:5.00, status:CONFIG.betStatus.PENDING,    content:'PSG gagne avec +1.5 buts. Très bonne forme à domicile.' },
  { id:4, tipster:'MaxiPronos',    match:'Lakers vs Warriors',      sport:'🏀 NBA',        date:'14 mars 2025', price:4.00, status:CONFIG.betStatus.PENDING,    content:'Lakers favoris à domicile. James en grande forme.' },
  { id:5, tipster:'BetKing',       match:'Lens vs Lyon',            sport:'⚽ Ligue 1',    date:'13 mars 2025', price:5.00, status:CONFIG.betStatus.CANCELLED,  content:'Match reporté — remboursement effectué automatiquement.' },
  { id:6, tipster:'MaxiPronos',    match:'Liverpool vs Man City',   sport:'⚽ Premier League',date:'10 mars 2025', price:7.00, status:CONFIG.betStatus.WON,    content:'Liverpool à domicile, forte motivation après défaite.' },
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
const userState = { activePage:'achats', achatsFilter:'all' };

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const u = MOCK_USER;
  document.getElementById('sidebar-avatar').textContent = u.firstName[0] + u.lastName[0];
  document.getElementById('sidebar-name').textContent   = u.firstName + ' ' + u.lastName;
  document.getElementById('topbar-balance').textContent = '💰 ' + formatEuros(u.balance);
  navigateTo('achats');
});

// ── Navigation ────────────────────────────────────────────────
function navigateTo(page) {
  userState.activePage = page;
  document.querySelectorAll('.sidebar__link').forEach(l =>
    l.classList.toggle('active', l.dataset.page === page)
  );
  const titles = { achats:'Mes achats', solde:'Mon solde & historique', parametres:'Paramètres' };
  document.getElementById('topbar-title').textContent = titles[page] || '';
  const el = document.getElementById('page-content');
  el.innerHTML = '';
  if (page === 'achats')     renderPageAchats(el);
  if (page === 'solde')      renderPageSolde(el);
  if (page === 'parametres') renderPageParametres(el);
}

// ══════════════════════════════════════════════════════════════
//  PAGE — MES ACHATS
// ══════════════════════════════════════════════════════════════
function renderPageAchats(container) {
  const u   = MOCK_USER;
  const won = MOCK_ACHATS.filter(a => a.status === CONFIG.betStatus.WON).length;
  const lost= MOCK_ACHATS.filter(a => a.status === CONFIG.betStatus.LOST).length;
  const pend= MOCK_ACHATS.filter(a => a.status === CONFIG.betStatus.PENDING).length;
  const canc= MOCK_ACHATS.filter(a => a.status === CONFIG.betStatus.CANCELLED).length;
  const winRate = won + lost > 0 ? Math.round(won / (won + lost) * 100) : 0;

  container.innerHTML = `
    <div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="stat-card stat-card--blue">
        <div class="stat-card__label">🛒 Total acheté</div>
        <div class="stat-card__value">${formatEuros(u.totalSpent)}</div>
        <div class="stat-card__sub">${MOCK_ACHATS.length} pronostic(s)</div>
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
  let list = MOCK_ACHATS;
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
            <div class="achat-card__match">${a.match}</div>
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

function handleDeposit() {
  const val = parseFloat(document.getElementById('deposit-amount').value);
  const min = CONFIG.finance.minDeposit || 5;
  if (!val || val < min) { showToast('Montant minimum : ' + min + ' €', 'error'); return; }
  // TODO (Stripe) : window.location.href = stripeCheckoutUrl
  showToast('Redirection vers Stripe pour ' + formatEuros(val) + '… 🚀', 'info');
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

/**
 * ============================================================
 *  PARIS-BET — COMPOSANTS RÉUTILISABLES (navbar + footer)
 *  Ces fonctions injectent la navbar et le footer dans
 *  chaque page automatiquement. Modifier ici = modifier
 *  sur toutes les pages d'un coup.
 * ============================================================
 */

// ── Injecter la Navbar ────────────────────────────────────────
function renderNavbar({ transparent = false, activePage = '' } = {}) {
  const el = document.getElementById('navbar');
  if (!el) return;

  el.innerHTML = `
    <nav class="navbar ${transparent ? 'navbar--transparent' : ''}">
      <div class="container navbar__inner">

        <a href="${CONFIG.pages.home}" class="navbar__logo">
          Paris<span>-Bet</span>
        </a>

        <ul class="navbar__links">
          ${CONFIG.navLinks.map(l => `
            <li><a href="${l.href}" class="navbar__link">${l.label}</a></li>
          `).join('')}
        </ul>

        <div class="navbar__actions">
          <a href="${CONFIG.pages.auth}#login"    class="btn btn-outline btn--sm">Connexion</a>
          <a href="${CONFIG.pages.auth}#register" class="btn btn-primary btn--sm">Démarrer</a>
        </div>

        <button class="navbar__burger" onclick="toggleMobileMenu()" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>

      <!-- Menu mobile -->
      <div class="navbar__mobile" id="mobileMenu">
        ${CONFIG.navLinks.map(l => `
          <a href="${l.href}" class="navbar__mobile-link" onclick="toggleMobileMenu()">${l.label}</a>
        `).join('')}
        <div class="navbar__mobile-actions">
          <a href="${CONFIG.pages.auth}#login"    class="btn btn-outline">Connexion</a>
          <a href="${CONFIG.pages.auth}#register" class="btn btn-primary">Démarrer gratuitement</a>
        </div>
      </div>
    </nav>
  `;

  // Scroll effect
  window.addEventListener('scroll', () => {
    el.querySelector('.navbar').classList.toggle('navbar--scrolled', window.scrollY > 40);
  });
}

// ── Injecter le Footer ────────────────────────────────────────
function renderFooter() {
  const el = document.getElementById('footer');
  if (!el) return;

  el.innerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer__top">

          <div class="footer__brand">
            <a href="${CONFIG.pages.home}" class="navbar__logo">Paris<span>-Bet</span></a>
            <p>La plateforme de référence pour les tipsters qui veulent monétiser leur expertise en toute transparence.</p>
            <div class="footer__stripe">
              🔒 Paiements sécurisés par <strong>Stripe</strong>
            </div>
          </div>

          <div class="footer__col">
            <h4>Navigation</h4>
            <ul>
              ${CONFIG.navLinks.map(l => `<li><a href="${l.href}">${l.label}</a></li>`).join('')}
            </ul>
          </div>

          <div class="footer__col">
            <h4>Espace</h4>
            <ul>
              <li><a href="${CONFIG.pages.auth}#register">Devenir tipster</a></li>
              <li><a href="${CONFIG.pages.auth}#register">Créer un compte</a></li>
              <li><a href="${CONFIG.pages.auth}#login">Se connecter</a></li>
            </ul>
          </div>

          <div class="footer__col">
            <h4>Légal</h4>
            <ul>
              <li><a href="#">Conditions d'utilisation</a></li>
              <li><a href="#">Politique de confidentialité</a></li>
              <li><a href="#">Mentions légales</a></li>
              <li><a href="mailto:${CONFIG.site.email}">${CONFIG.site.email}</a></li>
            </ul>
          </div>

        </div>

        <div class="footer__bottom">
          <p>© ${CONFIG.site.year} ${CONFIG.site.name}. Tous droits réservés.</p>
          <p>Commission de ${CONFIG.finance.commissionRate * 100}% sur les paris gagnants uniquement.</p>
        </div>
      </div>
    </footer>
  `;
}

// ── Menu mobile ───────────────────────────────────────────────
function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  menu.classList.toggle('open');
}

/**
 * ============================================================
 *  PARIS-BET — JS LANDING PAGE (index.js)
 *  Simulateur, FAQ dynamique, injection stats depuis CONFIG
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // Initialisation des composants partagés
  renderNavbar({ transparent: false, activePage: 'home' });
  renderFooter();

  // Injection des stats depuis CONFIG
  injectStats();

  // Génération FAQ depuis CONFIG
  renderFAQ();

  // Simulateur
  updateSim();

});

// ── Stats héro ────────────────────────────────────────────────
function injectStats() {
  const el = (id, val) => {
    const node = document.getElementById(id);
    if (node) node.textContent = val;
  };
  el('stat-tipsters', CONFIG.stats.tipsters);
  el('stat-users',    CONFIG.stats.users);
  el('stat-paid',     CONFIG.stats.paidOut);
}

// ── FAQ générée depuis CONFIG.faq ─────────────────────────────
function renderFAQ() {
  const container = document.getElementById('faqList');
  if (!container) return;

  container.innerHTML = CONFIG.faq.map((item, i) => `
    <div class="faq__item" id="faq-${i}">
      <button class="faq__q" onclick="toggleFAQ(${i})">
        ${item.q}
        <div class="faq__icon">+</div>
      </button>
      <div class="faq__a">
        <div class="faq__a-inner">${item.a}</div>
      </div>
    </div>
  `).join('');
}

function toggleFAQ(index) {
  const items = document.querySelectorAll('.faq__item');
  items.forEach((item, i) => {
    if (i === index) {
      item.classList.toggle('open');
    } else {
      item.classList.remove('open');
    }
  });
}

// ── Simulateur ────────────────────────────────────────────────
function updateSim() {
  const nb      = +document.getElementById('sl-pronos').value;
  const price   = +document.getElementById('sl-price').value;
  const clients = +document.getElementById('sl-clients').value;
  const wr      = +document.getElementById('sl-wr').value / 100;

  // Mise à jour des labels
  document.getElementById('val-pronos').textContent  = nb;
  document.getElementById('val-price').textContent   = price + ' €';
  document.getElementById('val-clients').textContent = clients;
  document.getElementById('val-wr').textContent      = Math.round(wr * 100) + '%';

  // Calcul
  const gross = nb * price * clients * wr;
  const comm  = gross * CONFIG.finance.commissionRate;
  const net   = gross - comm;

  // Affichage
  document.getElementById('res-gross').textContent = formatEuros(gross);
  document.getElementById('res-comm').textContent  = formatEuros(comm);
  document.getElementById('res-net').textContent   = formatEuros(net);
}

// ── Utilitaire formatage ──────────────────────────────────────
function formatEuros(n) {
  // Affiche tous les chiffres sans abréviation, sans centimes
  return Math.round(n).toLocaleString('fr-FR') + ' €';
}
