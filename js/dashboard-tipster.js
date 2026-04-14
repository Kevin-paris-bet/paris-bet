// ── Sidebar mobile ───────────────────────────────────────────
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
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
    game:    'PSG vs Marseille',
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
    game:    'Real Madrid vs Barça',
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
    game:    'Djokovic vs Alcaraz',
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
    game:    'Lakers vs Warriors',
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
  MOCK_TIPSTER.email       = user.email;
  MOCK_TIPSTER.pseudo      = user.profile.pseudo || '';
  MOCK_TIPSTER.description = user.profile.description || '';
  MOCK_TIPSTER.avatarUrl   = user.profile.avatar_url || '';
  MOCK_TIPSTER.balance   = parseFloat(user.profile.balance) || 0;
  MOCK_TIPSTER.pending   = parseFloat(user.profile.pending) || 0;
  MOCK_TIPSTER.ribName   = user.profile.rib_name || '';
  MOCK_TIPSTER.ribIban   = user.profile.rib_iban || '';
  MOCK_TIPSTER.ribBic    = user.profile.rib_bic || '';
  MOCK_TIPSTER.ribSaved  = !!(user.profile.rib_iban);
  MOCK_TIPSTER.whatsapp  = user.profile.whatsapp || '';

  // Mettre à jour la sidebar immédiatement
  const fullName = MOCK_TIPSTER.firstName + ' ' + MOCK_TIPSTER.lastName;
  const initials = (MOCK_TIPSTER.firstName[0] + MOCK_TIPSTER.lastName[0]).toUpperCase();
  const sidebarName   = document.getElementById('sidebar-name');
  const sidebarAvatar = document.getElementById('sidebar-avatar');
  if (sidebarName)   sidebarName.textContent  = fullName;
  if (sidebarAvatar) sidebarAvatar.textContent = initials;

  // Lien vers la page publique
  const linkPublic = document.getElementById('link-public-page');
  if (linkPublic) {
    const pseudo = MOCK_TIPSTER.pseudo;
    linkPublic.href = pseudo
      ? 'https://payperwin.co/' + pseudo
      : '/pages/tipster-public.html?id=' + user.id;
  }

  // Charger les vrais pronos via fetch direct
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  try {
    const urlP = new URL('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/pronos');
    urlP.searchParams.set('select', 'id,game,sport,match_date,content,price,status,buyers,tipster_id,created_at,image_url,image_status');
    urlP.searchParams.set('tipster_id', 'eq.' + user.id);
    urlP.searchParams.set('order', 'created_at.desc');
    urlP.searchParams.set('apikey', ANON);
    const rp = await fetch(urlP.toString());
    const pronos = await rp.json();

    // Charger les purchases pour avoir le vrai nombre d acheteurs
    const urlPurch = new URL('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/purchases');
    urlPurch.searchParams.set('select', 'prono_id,amount');
    urlPurch.searchParams.set('apikey', ANON);
    const rpurch = await fetch(urlPurch.toString());
    const allPurchases = await rpurch.json();
    const purchasesMap = {};
    if (Array.isArray(allPurchases)) {
      allPurchases.forEach(a => {
        if (!purchasesMap[a.prono_id]) purchasesMap[a.prono_id] = 0;
        purchasesMap[a.prono_id]++;
      });
    }

    if (Array.isArray(pronos) && pronos.length > 0) {
      state.pronos = pronos.map(p => ({ ...p, buyers: purchasesMap[p.id] || 0 }));
    } else {
      state.pronos = [];
    }
  } catch(e) {
    console.error('Erreur chargement pronos tipster:', e);
    state.pronos = [];
  }

  renderSidebar();
  renderTopbar();
  navigateTo('dashboard');
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
  // Fermer la sidebar sur mobile
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('show');
  state.activePage = page;

  // Mettre à jour les liens actifs
  document.querySelectorAll('.sidebar__link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  // Mettre à jour le titre
  const titles = {
    dashboard: 'Tableau de bord',
    pronos: 'Mes pronostics',
    solde:  'Solde & Virements',
    stats:  'Mes statistiques',
    compte: 'Mon compte',
    explorer: 'Explorer les tipsters',
    feedback: 'Feedback & Nouveautés',
  };
  document.getElementById('topbar-title').textContent = titles[page] || 'Dashboard';

  // Rendre la bonne page
  const content = document.getElementById('page-content');
  content.innerHTML = '';

  if (page === 'dashboard') renderPageDashboardTipster(content);
  if (page === 'dashboard') renderPageDashboardTipster(content);
  if (page === 'pronos')   renderPagePronos(content);
  if (page === 'solde')    renderPageSolde(content);
  if (page === 'stats')    renderPageStats(content);
  if (page === 'compte')   renderPageCompte(content);
  if (page === 'explorer') renderPageExplorer(content);
  if (page === 'feedback')  renderPageFeedback(content, false);
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

  const canDelete = false; // Suppression désactivée pour la transparence

  const imageStatusHtml = p.image_url
    ? p.image_status === 'pending'   ? '<div style="font-size:0.72rem;color:var(--warning);margin-top:3px">🖼️ ⏳ Image en cours de validation</div>'
    : p.image_status === 'approved'  ? '<div style="font-size:0.72rem;color:var(--success);margin-top:3px">🖼️ ✓ Image approuvée</div>'
    : p.image_status === 'rejected'  ? '<div style="font-size:0.72rem;color:var(--error);margin-top:3px">🖼️ 🚫 Image refusée</div>'
    : '' : '';

  return `
    <div class="table-row prono-row" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr 80px">
      <div>
        <div class="prono-title">${p.game}</div>
        <div class="prono-meta">${p.sport} · ${formatDate(p.match_date || p.date)}</div>
        ${imageStatusHtml}
      </div>
      <div class="buyers-count">${p.buyers}</div>
      <div class="prono-price">${formatEuros(p.price)}</div>
      <div>${statusBadge[p.status] || ''}</div>
      <div style="font-size:0.8rem;color:var(--text-muted)">${formatDate(p.match_date || p.date)}</div>
      <div class="table-actions">
        <button class="btn-icon" title="Voir le pronostic" onclick="viewProno('${p.id}')">👁</button>
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
  ['new-match','new-sport-cat','new-competition','new-date','new-time','new-price','new-cote','new-content','new-analysis'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const showCote = document.getElementById('new-show-cote');
  if (showCote) showCote.checked = true;
  const sportInfo = document.getElementById('sport-info-box');
  if (sportInfo) sportInfo.style.display = 'none';
  const coteInfo = document.getElementById('cote-info-box');
  if (coteInfo) coteInfo.style.display = 'none';
  clearPronoImage();
}

async function submitProno() {
  const game        = document.getElementById('new-match').value.trim();
  const sportCat    = document.getElementById('new-sport-cat').value;
  const competition = document.getElementById('new-competition').value.trim();
  const date        = document.getElementById('new-date').value;
  const time        = document.getElementById('new-time')?.value || '';
  const price       = parseFloat(document.getElementById('new-price').value);
  const coteRaw     = document.getElementById('new-cote').value.trim().replace(',', '.');
  const cote        = coteRaw ? parseFloat(coteRaw) : null;
  const showCote    = document.getElementById('new-show-cote')?.checked ?? true;
  const content     = document.getElementById('new-content').value.trim();
  const analysis    = document.getElementById('new-analysis')?.value.trim() || '';

  // Construire le champ sport : catégorie normalisée + compétition
  const sportLabels = { foot:'⚽ Foot', tennis:'🎾 Tennis', basket:'🏀 Basket', rugby:'🏉 Rugby', autres:'➕ Autres' };
  const sport = sportCat ? (sportLabels[sportCat] || sportCat) + (competition ? ' · ' + competition : '') : competition;

  if (!game || !sportCat || !competition || !date || !price || !content) {
    showToast('Veuillez remplir tous les champs obligatoires.', 'error'); return;
  }
  if (price < 1) {
    showToast('Le prix minimum est 1 €.', 'error'); return;
  }
  if (!coteRaw || isNaN(cote) || cote < 1) {
    showToast('La cote est obligatoire et doit être supérieure à 1 (ex: 1,76).', 'error'); return;
  }

  const btn = document.getElementById('btn-submit-prono');
  btn.disabled = true;
  btn.textContent = '⏳ Publication…';

  try {
    const user = await getCurrentUser();
    const { data, error } = await sb.from('pronos').insert([{
      tipster_id: user.id,
      game,
      sport,
      match_date: time ? date + ' · ' + time : date,
      price,
      cote,
      show_cote: showCote,
      buyers:  0,
      status:  CONFIG.betStatus.PENDING,
      content,
      analysis,
      locked:  true,
    }]).select().single();

    if (error) throw error;

    // Upload image si présente
    const imageFile = document.getElementById('new-prono-image')?.files?.[0];
    if (imageFile && data?.id) {
      try {
        const ext = imageFile.name.split('.').pop();
        const path = `pronos/${data.id}.${ext}`;
        const { error: upErr } = await sb.storage.from('prono-images').upload(path, imageFile, { upsert: true });
        if (!upErr) {
          const { data: urlData } = sb.storage.from('prono-images').getPublicUrl(path);
          const ANON2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
          await fetch('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/pronos?id=eq.' + data.id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'apikey': ANON2, 'Authorization': 'Bearer ' + ANON2 },
            body: JSON.stringify({ image_url: urlData.publicUrl, image_status: 'pending' })
          });
          data.image_url = urlData.publicUrl;
          data.image_status = 'pending';
        }
      } catch(imgErr) { console.error('Erreur upload image:', imgErr); }
    }

    state.pronos.unshift(data);
    closeModal();
    navigateTo('dashboard');
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
  alert(`📋 Contenu du pronostic\n\n${p.game}\n\n"${p.content || '(brouillon — contenu vide)'}"`);
}

// ── Supprimer un prono (seulement si 0 acheteur) ───────────────
async function deleteProno(id) {
  showToast('La suppression de pronostics est désactivée.', 'error'); return;
}

async function signalErreurProno(id, game) {
  const msg = prompt(`Décrivez l'erreur sur le prono "${game}" :\n(Ex: mauvaise cote, mauvaise date…)`);
  if (!msg || !msg.trim()) return;

  const user = await getCurrentUser();
  if (!user) return;

  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';

  try {
    const r = await fetch(`${SUPA}/rest/v1/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON,
        'Authorization': 'Bearer ' + ANON,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        role:        'tipster',
        pseudo:      user.profile?.pseudo || user.profile?.first_name || '—',
        email:       user.email || '—',
        categorie:   'bug',
        titre:       `Erreur prono : ${game}`,
        description: msg.trim(),
        statut:      'nouveau'
      })
    });
    if (r.ok || r.status === 201) {
      showToast('Signalement envoyé ✓', 'success');
    } else {
      showToast('Erreur lors du signalement.', 'error');
    }
  } catch(e) {
    showToast('Erreur : ' + e.message, 'error');
  }
  const p = state.pronos.find(p => p.id === id);
  if (!p || p.locked || p.buyers > 0) {
    showToast('Impossible de supprimer ce pronostic.', 'error'); return;
  }
  if (!confirm(`Supprimer "${p.game}" ?`)) return;

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
  const minPayout  = CONFIG.finance.minTipsterPayout;

  // Calcul dynamique du prochain lundi
  const today = new Date();
  const day = today.getDay(); // 0=dim, 1=lun, ..., 6=sam
  const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7 || 7;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  const nextMondayStr = nextMonday.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'2-digit' });

  container.innerHTML = `
    <!-- Carte solde principal -->
    <div class="balance-card">
      <div class="balance-card__label">Solde disponible</div>
      <div class="balance-card__amount">${formatEuros(t.balance)}</div>
      <div class="balance-card__sub">
        Prochain virement le <strong>lundi ${nextMondayStr}</strong>
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

    <div class="pronos-table" style="padding: 0 var(--space-lg);" id="virements-list">
      <div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted);font-size:0.88rem">
        ⏳ Aucun virement effectué pour l'instant.
      </div>
    </div>

    <p style="font-size:0.78rem;color:var(--text-muted);margin-top:var(--space-md);text-align:center;">
      Les virements sont effectués chaque lundi matin sur votre RIB enregistré.
      <a href="#" onclick="navigateTo('compte')" style="color:var(--blue)">Modifier mon RIB →</a>
    </p>
  `;
}

// ══════════════════════════════════════════════════════════════
//  PAGE — RIB
// ══════════════════════════════════════════════════════════════
function renderPageRIB(container) {
  container.innerHTML = `
    <div class="rib-page-container" style="max-width: 560px;">
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
          <label>👤 Titulaire du compte</label>
          <div class="input-wrap rib-input-wrap">
            <input class="input" type="text" id="rib-name"
              placeholder="Prénom NOM"
              value="${MOCK_TIPSTER.ribName || ''}"
            />
          </div>
        </div>

        <div class="form-group">
          <label>🏦 IBAN</label>
          <div class="input-wrap rib-input-wrap">
            <input class="input" type="text" id="rib-iban"
              placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
              value="${MOCK_TIPSTER.ribIban || ''}"
              oninput="formatIBAN(this)"
            />
          </div>
        </div>

        <div class="form-group">
          <label>🔢 BIC / SWIFT</label>
          <div class="input-wrap rib-input-wrap">
            <input class="input" type="text" id="rib-bic"
              placeholder="BNPAFRPPXXX"
              value="${MOCK_TIPSTER.ribBic || ''}"
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

async function saveRIB() {
  const name = document.getElementById('rib-name').value.trim();
  const iban = document.getElementById('rib-iban').value.trim();
  const bic  = document.getElementById('rib-bic').value.trim();

  if (!name || !iban || !bic) {
    showToast('Veuillez remplir tous les champs.', 'error'); return;
  }

  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { showToast('Erreur : non connecté', 'error'); return; }
  const JWT = session.access_token;
  const userId = session.user.id;

  try {
    const r = await fetch('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/profiles?id=eq.' + userId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + JWT },
      body: JSON.stringify({ rib_name: name, rib_iban: iban, rib_bic: bic })
    });
    if (r.ok || r.status === 204) {
      MOCK_TIPSTER.ribSaved = true;
      MOCK_TIPSTER.ribName  = name;
      MOCK_TIPSTER.ribIban  = iban;
      MOCK_TIPSTER.ribBic   = bic;
      showToast('Coordonnées bancaires enregistrées ! ✓', 'success');
      navigateTo('compte');
    } else {
      const err = await r.text();
      showToast('Erreur lors de la sauvegarde', 'error');
      console.error('saveRIB error:', r.status, err);
    }
  } catch(e) {
    showToast('Erreur réseau', 'error');
  }
}

// ══════════════════════════════════════════════════════════════
//  PAGE — STATISTIQUES
// ══════════════════════════════════════════════════════════════
async function renderPageStats(container) {
  const won       = state.pronos.filter(p => p.status === CONFIG.betStatus.WON).length;
  const lost      = state.pronos.filter(p => p.status === CONFIG.betStatus.LOST).length;
  const pending   = state.pronos.filter(p => p.status === CONFIG.betStatus.PENDING).length;
  const cancelled = state.pronos.filter(p => p.status === CONFIG.betStatus.CANCELLED).length;
  const total     = state.pronos.length;
  const totalBuyers = state.pronos.reduce((sum, p) => sum + p.buyers, 0);

  // Calcul du nombre d'acheteurs qui classent ce tipster comme leur meilleur
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';
  let nbMeilleur = 0;
  try {
    const user = await getCurrentUser();
    // Charger tous les purchases avec prono_id et status
    const rP = await fetch(`${SUPA}/rest/v1/purchases?select=user_id,prono_id,status&apikey=${ANON}`, { headers: { apikey: ANON } });
    const allPurchases = await rP.json();
    // Charger tous les pronos pour avoir le tipster_id
    const rPr = await fetch(`${SUPA}/rest/v1/pronos?select=id,tipster_id,status&apikey=${ANON}`, { headers: { apikey: ANON } });
    const allPronos = await rPr.json();
    if (Array.isArray(allPurchases) && Array.isArray(allPronos)) {
      const pronosMap = {};
      allPronos.forEach(p => { pronosMap[p.id] = p; });
      // Grouper les achats terminés par user
      const byUser = {};
      allPurchases.forEach(a => {
        const prono = pronosMap[a.prono_id];
        if (!prono) return;
        const status = prono.status;
        if (status !== 'won' && status !== 'lost') return;
        if (!byUser[a.user_id]) byUser[a.user_id] = {};
        if (!byUser[a.user_id][prono.tipster_id]) byUser[a.user_id][prono.tipster_id] = 0;
        if (status === 'won') byUser[a.user_id][prono.tipster_id]++;
      });
      // Pour chaque user, trouver son meilleur tipster
      Object.values(byUser).forEach(tipsterWins => {
        const sorted = Object.entries(tipsterWins).sort((a,b) => b[1]-a[1]);
        if (sorted.length > 0 && sorted[0][1] > 0 && sorted[0][0] === user.id) nbMeilleur++;
      });
    }
  } catch(e) { console.error('nbMeilleur:', e); }

  container.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card stat-card--blue">
        <div class="stat-card__label">💰 Total gagné</div>
        <div class="stat-card__value">${formatEuros(MOCK_TIPSTER.balance)}</div>
        <div class="stat-card__sub">Depuis l'inscription</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">🏆 Win Rate</div>
        <div class="stat-card__value">${won + lost > 0 ? Math.round(won / (won + lost) * 100) : 0}%</div>
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

    <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-lg)">
      <div onclick="document.getElementById('notoriete-popup').style.display=document.getElementById('notoriete-popup').style.display==='none'?'block':'none'" style="display:flex;align-items:center;gap:14px;padding:16px;cursor:pointer;position:relative">
        <div style="width:48px;height:48px;border-radius:50%;background:#EAF3DE;border:2px solid #639922;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B6D11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:1.7rem;font-weight:800;color:var(--text-dark);line-height:1">${nbMeilleur}</div>
          <div style="font-size:0.85rem;color:var(--text-muted);margin-top:4px">acheteur${nbMeilleur > 1 ? 's' : ''} vous classent comme leur <strong style="color:var(--text-dark)">meilleur tipster</strong></div>
        </div>
        <div style="width:20px;height:20px;border-radius:50%;border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--text-muted);font-size:0.72rem;font-weight:700;align-self:flex-start">i</div>
      </div>
      <div id="notoriete-popup" style="display:none;padding:10px 16px 14px;border-top:0.5px solid var(--border)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
          <div style="font-size:0.8rem;color:var(--text-muted);line-height:1.5">Ce chiffre correspond au nombre d'acheteurs pour lesquels vous êtes le tipster ayant généré le plus de victoires.</div>
          <button onclick="event.stopPropagation();document.getElementById('notoriete-popup').style.display='none'" style="font-size:1rem;color:var(--text-muted);background:none;border:none;cursor:pointer;flex-shrink:0;padding:0">×</button>
        </div>
      </div>
    </div>

    <div class="section-header"><div><h2>Détail des résultats</h2></div></div>
    <div class="pronos-table" style="padding: var(--space-lg);">
      <div class="stats-grid">
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
// ══════════════════════════════════════════════════════════════
//  PAGE — MON COMPTE
// ══════════════════════════════════════════════════════════════
function renderPageCompte(container) {
  const T = MOCK_TIPSTER;
  const card  = 'background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin-bottom:10px';
  const head  = 'display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--border)';
  const icon  = 'width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0';
  const title = 'font-size:13px;font-weight:600;color:var(--text-dark)';
  const body  = 'padding:14px;display:flex;flex-direction:column;gap:10px';
  const lbl   = 'font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:3px';
  const btnP  = 'background:var(--blue);color:white;border:none;border-radius:var(--radius-sm);padding:7px 16px;font-size:12px;font-weight:600;cursor:pointer;align-self:flex-start';
  const initials = (T.pseudo || T.firstName || '?')[0].toUpperCase();

  container.innerHTML = `
    <div style="max-width:500px;display:flex;flex-direction:column">

      <!-- BLOC 1 : Profil public -->
      <div style="${card}">
        <div style="${head}">
          <div style="${icon};background:var(--blue-pale)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          </div>
          <span style="${title}">Profil public</span>
        </div>
        <div style="${body}">
          <div style="display:flex;align-items:center;gap:14px">
            <div id="avatar-preview" style="width:54px;height:54px;border-radius:50%;overflow:hidden;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:700;color:white;flex-shrink:0">
              ${T.avatarUrl ? `<img src="${T.avatarUrl}" style="width:100%;height:100%;object-fit:cover"/>` : initials}
            </div>
            <div style="display:flex;flex-direction:column;gap:5px">
              <div style="font-size:12px;font-weight:600;color:var(--text-dark);font-family:monospace">@${T.pseudo || '—'}</div>
              <label style="cursor:pointer;display:inline-flex;align-items:center;gap:5px;background:var(--bg-soft);border:1px solid var(--border);border-radius:var(--radius-sm);padding:4px 10px;font-size:11px;color:var(--text-muted)">
                📁 Changer la photo
                <input type="file" id="avatar-input" accept="image/*" style="display:none" onchange="previewAvatar(this)" />
              </label>
              <div style="font-size:10px;color:var(--text-muted)">JPG, PNG · max 5MB</div>
            </div>
            <button id="btn-save-avatar" style="background:var(--blue);color:white;border:none;border-radius:var(--radius-sm);padding:5px 12px;font-size:11px;font-weight:600;cursor:pointer" onclick="saveAvatar()">Enregistrer la photo</button>
          </div>
          <div>
            <div style="${lbl}">Pseudo</div>
            <input class="input" type="text" id="new-pseudo" value="${T.pseudo || ''}" placeholder="ex: jerome-bet" oninput="checkPseudoAvailable()" autocomplete="off" style="font-size:13px"/>
            <div id="pseudo-check-tip" style="font-size:11px;margin-top:3px"></div>
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px">3-20 caractères · lettres, chiffres, tirets</div>
          </div>
          <div>
            <div style="${lbl}">Description <span style="font-weight:400">(max 300 car.)</span></div>
            <textarea class="input input-textarea" id="new-description" maxlength="300"
              placeholder="Ex: Spécialiste Ligue 1 depuis 5 ans, 68% de win rate…"
              style="min-height:80px;font-size:13px">${T.description || ''}</textarea>
          </div>
          <button style="${btnP}" onclick="savePseudo();saveDescription()">Enregistrer pseudo & description</button>
        </div>
      </div>

      <!-- BLOC 2 : WhatsApp -->
      <div style="${card}">
        <div style="${head}">
          <div style="${icon};background:#E1F5EE">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#085041"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.554 4.1 1.523 5.824L.057 23.885a.5.5 0 00.606.609l6.202-1.426A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.655-.523-5.166-1.432l-.369-.22-3.826.879.918-3.701-.243-.381A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
          </div>
          <span style="${title}">Numéro WhatsApp</span>
        </div>
        <div style="${body}">
          <div style="font-size:12px;color:var(--text-muted);line-height:1.5">
            Partagez votre numéro pour être contacté rapidement pour vos virements et les nouveautés de la plateforme.
          </div>
          <div>
            <div style="${lbl}">Votre numéro WhatsApp</div>
            <div style="display:flex;gap:6px">
              <input id="t-wa-indicatif" class="input" type="text" value="${T.whatsapp ? T.whatsapp.match(/^(\+\d+)/)?.[1] || '+33' : '+33'}" placeholder="+33" style="width:70px;flex-shrink:0;font-size:13px;text-align:center"/>
              <input class="input" type="tel" id="t-wa-num" placeholder="6 12 34 56 78"
                value="${T.whatsapp.replace(/^\+\d+/, '')}" style="flex:1;font-size:13px"/>
            </div>
          </div>
          <button style="${btnP}" onclick="saveTipsterWhatsapp()">Enregistrer</button>
        </div>
      </div>

      <!-- BLOC 3 : Infos personnelles -->
      <div style="${card}">
        <div style="${head}">
          <div style="${icon};background:var(--bg-soft)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>
          </div>
          <span style="${title}">Informations personnelles</span>
        </div>
        <div style="${body}">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div>
              <div style="${lbl}">Prénom</div>
              <input class="input" type="text" id="new-firstname" value="${T.firstName || ''}" placeholder="Prénom" style="font-size:13px"/>
            </div>
            <div>
              <div style="${lbl}">Nom</div>
              <input class="input" type="text" id="new-lastname" value="${T.lastName || ''}" placeholder="Nom" style="font-size:13px"/>
            </div>
          </div>
          <div>
            <div style="${lbl}">Email actuel</div>
            <div style="font-size:13px;color:var(--text-muted);padding:6px 0">${T.email || '—'}</div>
            <div style="${lbl};margin-top:4px">Nouvel email</div>
            <input class="input" type="email" id="new-email" placeholder="nouveau@email.com" style="font-size:13px"/>
          </div>
          <button style="${btnP}" onclick="saveNomPrenom();saveEmail()">Enregistrer</button>
        </div>
      </div>

      <!-- BLOC 3 : RIB -->
      <div style="${card}">
        <div style="${head}">
          <div style="${icon};background:#EAF3DE">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3B6D11" stroke-width="2.5"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
          </div>
          <span style="${title}">Informations bancaires</span>
        </div>
        <div style="${body}">
          ${T.ribSaved ? `<div style="display:flex;align-items:center;gap:6px;padding:7px 10px;background:var(--success-pale);border-radius:var(--radius-sm);font-size:11px;color:var(--success);font-weight:600">
            ✓ RIB enregistré — virements chaque lundi
          </div>` : ''}
          <div>
            <div style="${lbl}">Titulaire du compte</div>
            <input class="input" type="text" id="rib-name" placeholder="Prénom NOM" value="${T.ribName || ''}" style="font-size:13px"/>
          </div>
          <div>
            <div style="${lbl}">IBAN</div>
            <input class="input" type="text" id="rib-iban" placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX" value="${T.ribIban || ''}" oninput="formatIBAN(this)" style="font-size:12px;font-family:monospace"/>
          </div>
          <div>
            <div style="${lbl}">BIC / SWIFT</div>
            <input class="input" type="text" id="rib-bic" placeholder="BNPAFRPPXXX" value="${T.ribBic || ''}" style="font-size:13px;font-family:monospace"/>
          </div>
          <div style="padding:8px 10px;background:var(--blue-pale,#e8f0fe);border-radius:var(--radius-sm);font-size:11px;color:var(--text-muted);line-height:1.5">
            🔒 Coordonnées chiffrées, uniquement utilisées pour vos virements hebdomadaires.
          </div>
          <button style="${btnP}" onclick="saveRIB()">Enregistrer</button>
        </div>
      </div>

      <!-- BLOC 5 : Mot de passe -->
      <div style="${card}">
        <div style="${head}">
          <div style="${icon};background:var(--bg-soft)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <span style="${title}">Mot de passe</span>
        </div>
        <div style="${body}">
          <div>
            <div style="${lbl}">Nouveau mot de passe</div>
            <div style="position:relative">
              <input class="input" type="password" id="new-password" placeholder="Minimum 8 caractères" style="font-size:13px;padding-right:36px"/>
              <button onclick="togglePwTip('new-password',this)" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:14px;color:var(--text-muted)">👁</button>
            </div>
          </div>
          <div>
            <div style="${lbl}">Confirmer</div>
            <div style="position:relative">
              <input class="input" type="password" id="confirm-password" placeholder="Répétez le mot de passe" style="font-size:13px;padding-right:36px"/>
              <button onclick="togglePwTip('confirm-password',this)" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:14px;color:var(--text-muted)">👁</button>
            </div>
          </div>
          <button style="${btnP}" onclick="savePassword()">Mettre à jour</button>
        </div>
      </div>

      <!-- BLOC 5 : Zone de danger -->
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

async function saveTipsterWhatsapp() {
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';
  const indicatif = document.getElementById('t-wa-indicatif')?.value || '+33';
  const num = document.getElementById('t-wa-num')?.value.trim().replace(/\s/g, '');
  if (!num || num.length < 6) { showToast('Numéro invalide.', 'error'); return; }
  const fullNum = indicatif + num;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) { showToast('Erreur utilisateur.', 'error'); return; }
  try {
    const r = await fetch(`${SUPA}/rest/v1/profiles?id=eq.${user.id}&apikey=${ANON}`, {
      method: 'PATCH',
      headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ whatsapp: fullNum })
    });
    if (!r.ok) throw new Error();
    MOCK_TIPSTER.whatsapp = fullNum;
    showToast('Numéro WhatsApp enregistré ✓', 'success');
  } catch(e) {
    showToast('Une erreur est survenue.', 'error');
  }
}

function togglePwTip(id, btn) {
  const input = document.getElementById(id);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
  btn.textContent = input.type === 'password' ? '👁' : '🙈';
}

function previewAvatar(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('avatar-preview');
    if (preview) preview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover" />`;
  };
  reader.readAsDataURL(file);
}

async function compressImage(file, maxSizeKB = 200, maxDim = 400) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
        else       { w = Math.round(w * maxDim / h); h = maxDim; }
      }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url);
        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.8);
    };
    img.src = url;
  });
}

async function saveAvatar() {
  const input = document.getElementById('avatar-input');
  if (!input?.files?.[0]) { showToast('Veuillez choisir une photo.', 'error'); return; }

  const btn = document.getElementById('btn-save-avatar');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Upload...'; }

  try {
    const { data: { user } } = await sb.auth.getUser();
    const userId = user?.id;
    const { data: { session } } = await sb.auth.getSession();
    const JWT = session?.access_token;
    if (!userId || !JWT) throw new Error('Non connecté');

    const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
    const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';

    // Compression
    const compressed = await compressImage(input.files[0]);
    const fileName = `avatar-${userId}.jpg`;

    // Upload via fetch direct avec JWT utilisateur
    const uploadResp = await fetch(`${SUPA}/storage/v1/object/avatars/${fileName}`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + JWT,
        'apikey': ANON,
        'Content-Type': 'image/jpeg',
        'x-upsert': 'true'
      },
      body: compressed
    });

    if (!uploadResp.ok) {
      const err = await uploadResp.json().catch(() => ({}));
      throw new Error(err.message || 'Erreur upload');
    }

    // URL publique
    const avatarUrl = `${SUPA}/storage/v1/object/public/avatars/${fileName}`;
    const avatarUrlCacheBust = avatarUrl + '?t=' + Date.now();

    // Sauvegarder dans profiles
    await fetch(`${SUPA}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + JWT },
      body: JSON.stringify({ avatar_url: avatarUrl })
    });

    MOCK_TIPSTER.avatarUrl = avatarUrlCacheBust;
    showToast('✓ Photo enregistrée — visible dans 1 à 2 minutes', 'success');
    navigateTo('compte');
  } catch(e) {
    showToast('Erreur upload : ' + e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Enregistrer la photo'; }
  }
}
async function checkPseudoAvailable() {
  const input = document.getElementById('new-pseudo');
  const check = document.getElementById('pseudo-check-tip');
  const val   = input.value.trim().toLowerCase();
  const valid = /^[a-z0-9-]{3,20}$/.test(val);
  input.classList.toggle('error', val.length > 0 && !valid);
  input.classList.toggle('valid', false);
  if (check) check.textContent = '';
  if (!valid) return;
  clearTimeout(pseudoTimerTip);
  if (check) check.innerHTML = '<span style="color:var(--text-muted)">⏳ Vérification...</span>';
  pseudoTimerTip = setTimeout(async () => {
    const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
    const r = await fetch(`https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/profiles?select=id&pseudo=eq.${val}&apikey=${ANON}`);
    const data = await r.json();
    const taken = Array.isArray(data) && data.length > 0 && data[0].id !== (await sb.auth.getUser()).data.user?.id;
    input.classList.toggle('error', taken);
    input.classList.toggle('valid', !taken);
    if (check) check.innerHTML = taken
      ? '<span style="color:var(--error)">✕ Ce pseudo est déjà pris</span>'
      : '<span style="color:var(--success)">✓ Disponible</span>';
  }, 500);
}

async function saveNomPrenom() {
  const firstName = document.getElementById('new-firstname')?.value.trim();
  const lastName  = document.getElementById('new-lastname')?.value.trim();
  if (!firstName || !lastName) { showToast('Veuillez renseigner prénom et nom.', 'error'); return; }
  try {
    const user = await getCurrentUser();
    const { error } = await sb.from('profiles')
      .update({ first_name: firstName, last_name: lastName })
      .eq('id', user.id);
    if (error) throw error;
    MOCK_TIPSTER.firstName = firstName;
    MOCK_TIPSTER.lastName  = lastName;
    showToast('Nom et prénom mis à jour ✓', 'success');
  } catch(e) {
    showToast('Erreur : ' + e.message, 'error');
  }
}

async function savePseudo() {
  const val = document.getElementById('new-pseudo')?.value.trim().toLowerCase();
  if (!val || !/^[a-z0-9-]{3,20}$/.test(val)) {
    showToast('Pseudo invalide (3-20 caractères, lettres/chiffres/tirets).', 'error'); return;
  }
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  // Vérifier unicité
  const r = await fetch(`https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/profiles?select=id&pseudo=eq.${val}&apikey=${ANON}`);
  const existing = await r.json();
  const user = await sb.auth.getUser();
  if (Array.isArray(existing) && existing.length > 0 && existing[0].id !== user.data.user?.id) {
    showToast('Ce pseudo est déjà pris.', 'error'); return;
  }
  try {
    const { error } = await sb.from('profiles').update({ pseudo: val }).eq('id', user.data.user.id);
    if (error) throw error;
    MOCK_TIPSTER.pseudo = val;
    showToast('✓ Pseudo mis à jour !', 'success');
    document.getElementById('new-pseudo').value = '';
    navigateTo('compte');
  } catch(e) {
    showToast('Erreur : ' + e.message, 'error');
  }
}

async function saveDescription() {
  const val = document.getElementById('new-description')?.value.trim();
  if (val.length > 300) { showToast('Maximum 300 caractères.', 'error'); return; }
  try {
    const user = await sb.auth.getUser();
    const { error } = await sb.from('profiles').update({ description: val }).eq('id', user.data.user.id);
    if (error) throw error;
    MOCK_TIPSTER.description = val;
    showToast('✓ Description mise à jour !', 'success');
  } catch(e) {
    showToast('Erreur : ' + e.message, 'error');
  }
}

async function saveEmail() {
  const newEmail = document.getElementById('new-email').value.trim();
  if (!newEmail || !newEmail.includes('@')) {
    showToast('Veuillez saisir un email valide.', 'error'); return;
  }
  try {
    const { error } = await sb.auth.updateUser({ email: newEmail });
    if (error) throw error;
    MOCK_TIPSTER.email = newEmail;
    showToast('✓ Email mis à jour. Vérifiez votre boîte mail pour confirmer.', 'success');
    document.getElementById('new-email').value = '';
    navigateTo('compte');
  } catch(e) {
    showToast('Erreur : ' + e.message, 'error');
  }
}

async function savePassword() {
  const newPassword    = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  if (!newPassword || newPassword.length < 8) {
    showToast('Le mot de passe doit faire au moins 8 caractères.', 'error'); return;
  }
  if (newPassword !== confirmPassword) {
    showToast('Les mots de passe ne correspondent pas.', 'error'); return;
  }
  try {
    const { error } = await sb.auth.updateUser({ password: newPassword });
    if (error) throw error;
    showToast('✓ Mot de passe mis à jour avec succès.', 'success');
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
  } catch(e) {
    showToast('Erreur : ' + e.message, 'error');
  }
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
        <div id="score-info-popover" style="display:none;position:absolute;top:28px;left:50%;transform:translateX(-50%);width:260px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-md);font-size:0.8rem;color:var(--text-body);line-height:1.6;box-shadow:var(--shadow-md);z-index:100">
          <strong style="color:var(--text-dark);display:block;margin-bottom:6px">🏆 Comment fonctionne le Score ?</strong>
          Le Score récompense les tipsters qui gagnent souvent, sur des cotes élevées, et sur la durée.<br><br>
          Un tipster avec 1 seul prono gagné n'aura jamais un bon score, même s'il est à 100%.
          <div style="position:absolute;top:-6px;left:50%;transform:translateX(-50%);width:10px;height:10px;background:var(--white);border-left:1px solid var(--border);border-top:1px solid var(--border);transform:translateX(-50%) rotate(45deg)"></div>
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

async function renderPageExplorer(container) {
  await renderExplorerTipsters(container, 'tipster-public.html?pseudo=');
}


function formatDate(str) {
  if (!str) return "—";
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1].slice(2)}`;
  return str;
}

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
  const mob = window.innerWidth < 900;
  Object.assign(toast.style, {
    position:'fixed', bottom:'24px',
    ...(mob ? { left:'16px', right:'16px', textAlign:'center' } : { left:'50%', transform:'translateX(-50%)', whiteSpace:'nowrap' }),
    background: c.bg, border: `1px solid ${c.border}`,
    borderRadius:'var(--radius-md)', padding:'12px 20px',
    fontSize:'0.87rem', fontFamily:'var(--font-body)',
    color:'var(--text-dark)', zIndex:'9999',
    animation:'fadeUp 0.3s ease both', boxShadow:'var(--shadow-md)',
  });
  document.body.appendChild(toast);
  setTimeout(() => toast?.remove(), 3500);
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

function previewPronoImage(input) {
  const file = input.files?.[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showToast('Image trop lourde (max 5MB).', 'error');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('prono-image-preview-img').src = e.target.result;
    document.getElementById('prono-image-preview').style.display = 'block';
    document.getElementById('image-upload-label').textContent = file.name;
    document.getElementById('image-upload-icon').textContent = '✅';
  };
  reader.readAsDataURL(file);
}

function clearPronoImage() {
  const input = document.getElementById('new-prono-image');
  if (input) input.value = '';
  const preview = document.getElementById('prono-image-preview');
  if (preview) preview.style.display = 'none';
  const label = document.getElementById('image-upload-label');
  if (label) label.textContent = 'Choisir une image (JPG, PNG · max 5MB)';
  const icon = document.getElementById('image-upload-icon');
  if (icon) icon.textContent = '📁';
}


// ══════════════════════════════════════════════════════════════
//  PAGE — TABLEAU DE BORD TIPSTER
// ══════════════════════════════════════════════════════════════
function isMobile() { return window.innerWidth < 900; }

async function renderPageDashboardTipster(container) {
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';
  const mob = isMobile();

  container.innerHTML = '<div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted)">⏳ Chargement...</div>';

  // Stats depuis les pronos déjà chargés
  const pronos = state.pronos;
  const won       = pronos.filter(p => p.status === 'won').length;
  const lost      = pronos.filter(p => p.status === 'lost').length;
  const pending   = pronos.filter(p => p.status === 'pending').length;
  const finished  = won + lost;
  const winRate   = finished > 0 ? Math.round(won / finished * 100) : 0;
  const totalAchats    = pronos.reduce((s,p) => s + (parseInt(p.buyers)||0), 0);
  const derniers3      = pronos.slice(0, 3);

  // Acheteurs uniques via fetch
  let uniqueBuyers = 0;
  try {
    const rB = await fetch(`${SUPA}/rest/v1/purchases?select=user_id&apikey=${ANON}`, { headers: { apikey: ANON } });
    const purchases = await rB.json();
    if (Array.isArray(purchases)) {
      // On filtre les pronos du tipster
      const pronoIds = new Set(pronos.map(p => p.id));
      const rBAll = await fetch(`${SUPA}/rest/v1/purchases?select=user_id,prono_id&apikey=${ANON}`, { headers: { apikey: ANON } });
      const allPurch = await rBAll.json();
      if (Array.isArray(allPurch)) {
        const myPurch = allPurch.filter(a => pronoIds.has(a.prono_id));
        uniqueBuyers = new Set(myPurch.map(a => a.user_id)).size;
      }
    }
  } catch(e) {}

  // Changelog
  let changelog = [];
  try {
    const rCL = await fetch(`${SUPA}/rest/v1/changelog?select=id,titre,description,created_at&order=created_at.desc&apikey=${ANON}`, { headers: { apikey: ANON } });
    changelog = await rCL.json();
  } catch(e) {}

  // Stats plateforme
  let platNbTipsters = 0, platNbPronos = 0, platWinRate = 0, platNbParieurs = 0;
  try {
    const [rPT, rPP, rPU] = await Promise.all([
      fetch(`${SUPA}/rest/v1/profiles?role=eq.tipster&select=id&apikey=${ANON}`, { headers: { apikey: ANON } }),
      fetch(`${SUPA}/rest/v1/pronos?select=status&apikey=${ANON}`, { headers: { apikey: ANON } }),
      fetch(`${SUPA}/rest/v1/profiles?role=eq.user&select=id&apikey=${ANON}`, { headers: { apikey: ANON } }),
    ]);
    const tipsArr  = await rPT.json().catch(()=>[]);
    const pronosArr= await rPP.json().catch(()=>[]);
    const usersArr = await rPU.json().catch(()=>[]);
    platNbTipsters = Array.isArray(tipsArr)  ? tipsArr.length  : 0;
    platNbParieurs = Array.isArray(usersArr) ? usersArr.length : 0;
    if (Array.isArray(pronosArr)) {
      platNbPronos = pronosArr.length;
      const fin = pronosArr.filter(p => p.status==='won'||p.status==='lost').length;
      const w   = pronosArr.filter(p => p.status==='won').length;
      platWinRate = fin > 0 ? Math.round(w/fin*100) : 0;
    }
  } catch(e) {}

  // Achats via freebet pour ce tipster
  let freebetAchats = [], freebetWon = 0, freebetLost = 0;
  try {
    const pronoIds = pronos.map(p => p.id).filter(Boolean);
    if (pronoIds.length > 0) {
      const rFB = await fetch(`${SUPA}/rest/v1/purchases?select=prono_id,is_freebet&is_freebet=eq.true&apikey=${ANON}`, { headers: { apikey: ANON } });
      const allFB = await rFB.json();
      if (Array.isArray(allFB)) {
        const pronoSet = new Set(pronoIds);
        freebetAchats = allFB.filter(a => pronoSet.has(a.prono_id));
        freebetAchats.forEach(a => {
          const p = pronos.find(pr => pr.id === a.prono_id);
          if (p) {
            if (p.status === 'won') freebetWon++;
            else if (p.status === 'lost') freebetLost++;
          }
        });
      }
    }
  } catch(e) {}

  const freebetHtml = freebetAchats.length > 0 ? `
    <div style="background:var(--bg);border:1px solid #EF9F27;border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-md)">
      <div style="padding:12px 12px 8px;display:flex;justify-content:space-between;align-items:center">
        <div style="font-size:0.88rem;font-weight:700;color:var(--text-dark)">Achats via freebet</div>
        <div style="display:flex;align-items:center;gap:6px">
          <button onclick="toggleFreebetTipsterInfo()" style="width:18px;height:18px;border-radius:50%;border:1.5px solid #EF9F27;background:#FFF8EE;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#854F0B;cursor:pointer;flex-shrink:0">i</button>
          <span style="background:#FFF8EE;color:#633806;font-size:0.72rem;font-weight:600;padding:2px 8px;border-radius:20px;border:0.5px solid #EF9F27">${freebetAchats.length} achat${freebetAchats.length > 1 ? 's' : ''}</span>
        </div>
      </div>
      <div id="freebet-tipster-info" style="display:none;padding:0 12px 10px">
        <div style="background:#FFF8EE;border:0.5px solid #EF9F27;border-radius:var(--radius-md);padding:10px 12px;font-size:0.78rem;color:#633806;line-height:1.6">
          Le freebet est un crédit offert gratuitement aux parieurs par PayPerWin. Quand un parieur utilise ce crédit pour acheter votre prono, vous ne percevez pas de commission sur cet achat.
        </div>
      </div>
      <div style="padding:8px 12px;border-top:0.5px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:0.82rem;color:var(--text-muted)">Dont gagnés</span>
        <span style="font-size:0.82rem;font-weight:700;color:#27500A">${freebetWon} prono${freebetWon > 1 ? 's' : ''}</span>
      </div>
      <div style="padding:8px 12px;border-top:0.5px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:0.82rem;color:var(--text-muted)">Dont perdus</span>
        <span style="font-size:0.82rem;font-weight:700;color:#791F1F">${freebetLost} prono${freebetLost > 1 ? 's' : ''}</span>
      </div>
    </div>` : '';

  // Graphiques performance : achats cumulés + gains cumulés vs moyenne plateforme
  // Trier les pronos par date croissante
  const pronosSorted = [...pronos].sort((a, b) => new Date(a.created_at||a.match_date||0) - new Date(b.created_at||b.match_date||0));

  // Achats cumulés prono par prono
  let cumAchats = 0;
  const achatsData = pronosSorted.map(p => { cumAchats += (parseInt(p.buyers)||0); return cumAchats; });

  // Gains cumulés (90% des achats sur pronos gagnés)
  let cumGains = 0;
  const gainsData = pronosSorted.map(p => {
    if (p.status === 'won') cumGains += Math.round((parseInt(p.buyers)||0) * parseFloat(p.price||0) * 0.9);
    return cumGains;
  });

  const totalAchatsChart = achatsData.length > 0 ? achatsData[achatsData.length-1] : 0;
  const totalGainsChart  = gainsData.length > 0  ? gainsData[gainsData.length-1]  : 0;

  // Popups explicatifs
  const popupDefs = {
    solde:    { title: 'Solde disponible', text: 'Ce montant correspond à 90% des gains sur vos pronos gagnants, après commission PayPerWin de 10%. Il sera viré chaque lundi.' },
    winrate:  { title: 'Win rate', text: 'Pourcentage de vos pronos terminés (gagnés ou perdus) qui ont été gagnants. Les pronos annulés ne sont pas comptabilisés.' },
    pronos:   { title: 'Pronos créés', text: 'Nombre total de pronos publiés sur la plateforme. Le chiffre en dessous indique combien sont encore en attente de résultat.' },
    acheteurs:{ title: 'Acheteurs', text: 'Nombre de membres distincts ayant acheté au moins un de vos pronos. Le total indique le cumul de tous vos achats.' },
  };

  function statCardHtml(key, label, val, sub, colorClass='') {
    return `<div onclick="showTipsterStatPopup('${key}')" style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 12px;cursor:pointer;position:relative">
      <div style="position:absolute;top:6px;right:8px;font-size:10px;color:var(--text-muted);opacity:.5">?</div>
      <div style="font-size:0.68rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px">${label}</div>
      <div style="font-size:${mob?'1.2rem':'1.3rem'};font-weight:800;color:${colorClass==='green'?'var(--success)':colorClass==='blue'?'var(--primary)':'var(--text-dark)'}">${val}</div>
      <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px">${sub}</div>
    </div>`;
  }

  const statsHtml = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      ${statCardHtml('solde',   'Solde dispo',  formatEuros(MOCK_TIPSTER.balance), formatEuros(MOCK_TIPSTER.pending) + ' en attente', 'blue')}
      ${statCardHtml('winrate', 'Win rate',     finished>0 ? winRate+'%' : '—',   'Sur pronos terminés', 'green')}
    </div>
    <div id="tipster-popup-row1" style="margin-top:4px"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;margin-bottom:var(--space-md)">
      ${statCardHtml('pronos',    'Pronos créés', pronos.length, pending + ' en cours')}
      ${statCardHtml('acheteurs', 'Acheteurs',    uniqueBuyers,  totalAchats + ' achats au total')}
    </div>
    <div id="tipster-popup-row2" style="margin-top:-8px;margin-bottom:var(--space-md)"></div>`;

  const chartUid = 'c' + Date.now();
  const chartHtml = pronosSorted.length < 2 ? `
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px;margin-bottom:var(--space-md);text-align:center;font-size:0.85rem;color:var(--text-muted)">
      Pas encore assez de données pour afficher les graphiques.
    </div>` : `
    <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:var(--space-md)">
      <!-- Graphique 1 : Achats cumulés -->
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);padding:12px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
          <div>
            <div style="font-size:0.68rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px">Achats cumulés</div>
            <div style="display:flex;gap:12px">
              <span style="display:flex;align-items:center;gap:4px;font-size:0.72rem;color:var(--text-muted)">
                <span style="width:10px;height:2.5px;background:#378ADD;border-radius:2px;display:inline-block"></span>Vous
              </span>
              <span style="display:flex;align-items:center;gap:4px;font-size:0.72rem;color:var(--text-muted)">
                <span style="width:10px;height:0;border-top:2px dashed #888;display:inline-block"></span>Moyenne
              </span>
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:1.1rem;font-weight:800;color:#185FA5">${totalAchatsChart}</div>
            <div style="font-size:0.68rem;color:var(--text-muted)">achats</div>
          </div>
        </div>
        <div style="position:relative;width:100%;height:85px"><canvas id="chartA-${chartUid}" role="img" aria-label="Achats cumulés vs moyenne plateforme">Achats cumulés du tipster.</canvas></div>
      </div>
      <!-- Graphique 2 : Gains cumulés -->
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);padding:12px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
          <div>
            <div style="font-size:0.68rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px">Gains cumulés</div>
            <div style="display:flex;gap:12px">
              <span style="display:flex;align-items:center;gap:4px;font-size:0.72rem;color:var(--text-muted)">
                <span style="width:10px;height:2.5px;background:#3B6D11;border-radius:2px;display:inline-block"></span>Vous
              </span>
              <span style="display:flex;align-items:center;gap:4px;font-size:0.72rem;color:var(--text-muted)">
                <span style="width:10px;height:0;border-top:2px dashed #888;display:inline-block"></span>Moyenne
              </span>
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:1.1rem;font-weight:800;color:#3B6D11">+${totalGainsChart} €</div>
            <div style="font-size:0.68rem;color:var(--text-muted)">gagnés</div>
          </div>
        </div>
        <div style="position:relative;width:100%;height:85px"><canvas id="chartG-${chartUid}" role="img" aria-label="Gains cumulés vs moyenne plateforme">Gains cumulés du tipster.</canvas></div>
      </div>
    </div>`;

  const statusBadge = { pending:'<span style="background:#E6F1FB;color:#0C447C;font-size:0.72rem;padding:2px 7px;border-radius:10px">⏳ Attente</span>', won:'<span style="background:#EAF3DE;color:#27500A;font-size:0.72rem;padding:2px 7px;border-radius:10px">✓ Gagné</span>', lost:'<span style="background:#FCEBEB;color:#791F1F;font-size:0.72rem;padding:2px 7px;border-radius:10px">✕ Perdu</span>', cancelled:'<span style="background:#FFF3E0;color:#E65100;font-size:0.72rem;padding:2px 7px;border-radius:10px">⊘ Annulé</span>' };

  const derniersHtml = `
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-md)">
      ${derniers3.length > 0 ? derniers3.map(p => `
        <div style="padding:10px 12px;border-bottom:0.5px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:8px">
          <div style="min-width:0;flex:1">
            <div style="font-size:0.85rem;font-weight:700;color:var(--text-dark);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.game}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px">${p.sport||''} · ${formatDate(p.match_date||p.date)} · ${parseInt(p.buyers)||0} acheteur(s)</div>
          </div>
          <div style="flex-shrink:0">${statusBadge[p.status]||''}</div>
        </div>`).join('')
      : '<div style="padding:12px;font-size:0.85rem;color:var(--text-muted)">Aucun prono pour le moment.</div>'}
      <button onclick="navigateTo('pronos')" style="width:100%;padding:9px;font-size:0.8rem;color:var(--primary);background:none;border:none;border-top:0.5px solid var(--border);cursor:pointer;font-family:var(--font-body)">Voir tous mes pronos →</button>
    </div>`;

  const changelogHtml = `
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-md)">
      ${Array.isArray(changelog) && changelog.length > 0
        ? changelog.slice(0,3).map(c => `
          <div class="dash-tip-news" onclick="this.classList.toggle('open')" style="padding:10px 12px;border-bottom:0.5px solid var(--border);cursor:pointer">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
              <div style="font-size:0.85rem;font-weight:600;color:var(--text-dark)">${c.titre}</div>
              <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
                <span style="font-size:0.7rem;color:var(--text-muted)">${formatDate(c.created_at)}</span>
                <span class="dash-tip-arrow" style="font-size:0.85rem;color:var(--text-muted);transition:transform .2s">›</span>
              </div>
            </div>
            <div class="dash-tip-desc" style="display:none;font-size:0.78rem;color:var(--text-muted);margin-top:6px;line-height:1.5">${c.description||''}</div>
          </div>`).join('')
        : '<div style="padding:12px;font-size:0.85rem;color:var(--text-muted)">Aucune nouveauté.</div>'}
      <button onclick="navigateTo('feedback')" style="width:100%;padding:9px;font-size:0.8rem;color:var(--primary);background:none;border:none;border-top:0.5px solid var(--border);cursor:pointer;font-family:var(--font-body)">Voir toutes les nouveautés →</button>
    </div>`;

  // Templates preview dashboard acheteur — fidèles au vrai dashboard user
  function buildPreviewDashboard(slot) {
    const isFeatured = slot === 'featured';
    const isRising   = slot === 'rising';

    const stats4 = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
        <div style="background:var(--bg);border:0.5px solid var(--border);border-radius:6px;padding:8px 10px">
          <div style="font-size:7px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">Solde disponible</div>
          <div style="font-size:16px;font-weight:800;color:var(--primary)">12 €</div>
          <div style="font-size:7px;color:var(--text-muted);margin-top:1px">Prêt à investir</div>
        </div>
        <div style="background:var(--bg);border:0.5px solid var(--border);border-radius:6px;padding:8px 10px">
          <div style="font-size:7px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">Pronos achetés</div>
          <div style="font-size:16px;font-weight:800;color:var(--text-dark)">11</div>
          <div style="font-size:7px;color:var(--text-muted);margin-top:1px">4V · 0D · 6 annulés</div>
        </div>
        <div style="background:var(--bg);border:0.5px solid var(--border);border-radius:6px;padding:8px 10px">
          <div style="font-size:7px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">Taux de réussite</div>
          <div style="font-size:16px;font-weight:800;color:var(--text-dark)">100%</div>
          <div style="font-size:7px;color:var(--text-muted);margin-top:1px">Sur pronos terminés</div>
        </div>
        <div style="background:var(--bg);border:0.5px solid var(--border);border-radius:6px;padding:8px 10px">
          <div style="font-size:7px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">Remboursé</div>
          <div style="font-size:16px;font-weight:800;color:var(--text-dark)">7 €</div>
          <div style="font-size:7px;color:var(--text-muted);margin-top:1px">Perdus + annulés</div>
        </div>
      </div>`;

    const featuredBloc = isFeatured ? `
      <div style="font-size:7px;font-weight:700;color:#0C447C;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">👇 Votre emplacement</div>
      <div style="background:var(--bg);border:1.5px solid #185FA5;border-radius:8px;overflow:hidden;margin-bottom:8px">
        <div style="display:flex;gap:8px;padding:8px 8px 6px">
          <div style="width:40px;height:40px;border-radius:50%;background:#B5D4F4;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#0C447C;flex-shrink:0">V</div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px">
              <span style="background:#FAEEDA;color:#633806;font-size:7px;font-weight:700;padding:1px 5px;border-radius:5px">Sponsorisé</span>
              <span style="background:#FAEEDA;color:#633806;font-size:7px;font-weight:700;padding:1px 5px;border-radius:5px">⭐ Top Tipster</span>
            </div>
            <div style="font-size:11px;font-weight:800;color:var(--text-dark)">Votre pseudo</div>
            <div style="font-size:8px;color:var(--text-muted);margin-top:1px">Votre description</div>
            <div style="font-size:9px;font-weight:700;color:#0F6E56;margin-top:3px">🏆 76% <span style="font-size:8px;color:var(--text-muted);font-weight:400">win rate · 📊 48 pronos · cote 3,2</span></div>
          </div>
        </div>
        <div style="border-top:0.5px solid var(--border);padding:5px;text-align:center;font-size:9px;font-weight:700;color:var(--primary)">Voir ses pronos →</div>
      </div>` : `
      <div style="font-size:7px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Tipster à la une</div>
      <div style="background:var(--bg);border:0.5px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:8px">
        <div style="display:flex;gap:8px;padding:8px 8px 6px">
          <div style="width:40px;height:40px;border-radius:50%;background:#B5D4F4;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#0C447C;flex-shrink:0">J</div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px">
              <span style="background:#FAEEDA;color:#633806;font-size:7px;font-weight:700;padding:1px 5px;border-radius:5px">Sponsorisé</span>
              <span style="background:#FAEEDA;color:#633806;font-size:7px;font-weight:700;padding:1px 5px;border-radius:5px">⭐ Top Tipster</span>
            </div>
            <div style="font-size:11px;font-weight:800;color:var(--text-dark)">jerome-bet</div>
            <div style="font-size:8px;color:var(--text-muted);margin-top:1px">Spécialiste Ligue 1 & CL</div>
            <div style="font-size:9px;font-weight:700;color:#0F6E56;margin-top:3px">🏆 76% <span style="font-size:8px;color:var(--text-muted);font-weight:400">win rate · 📊 48 pronos · cote 3,2</span></div>
          </div>
        </div>
        <div style="border-top:0.5px solid var(--border);padding:5px;text-align:center;font-size:9px;font-weight:700;color:var(--primary)">Voir ses pronos →</div>
      </div>`;

    const twitterBloc = `
      <div style="background:var(--bg);border:0.5px solid var(--border);border-radius:8px;display:flex;align-items:center;gap:8px;padding:8px 10px;margin-bottom:8px">
        <div style="width:28px;height:28px;border-radius:50%;background:#000;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.737-8.835L1.254 2.25H8.08l4.259 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </div>
        <div style="flex:1">
          <div style="font-size:10px;font-weight:700;color:var(--text-dark)">Suivez-nous sur X</div>
          <div style="font-size:8px;color:var(--text-muted);margin-top:1px">Actus, alertes pronos et offres exclusives</div>
        </div>
        <span style="background:#2563EB;color:white;border-radius:14px;padding:4px 10px;font-size:9px;font-weight:700;flex-shrink:0">Suivre</span>
      </div>`;

    const achatsBloc = `
      <div style="font-size:7px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Mes derniers achats</div>
      <div style="background:var(--bg);border:0.5px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:8px">
        <div style="padding:7px 9px;border-bottom:0.5px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:6px">
          <div><div style="font-size:10px;font-weight:700;color:var(--text-dark)">PSG vs Marseille</div><div style="font-size:8px;color:var(--text-muted)">jerome-bet · Foot · 05/04</div></div>
          <span style="background:#EAF3DE;color:#27500A;font-size:8px;padding:2px 6px;border-radius:8px;flex-shrink:0">✓ Gagné</span>
        </div>
        <div style="padding:7px 9px;border-bottom:0.5px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:6px">
          <div><div style="font-size:10px;font-weight:700;color:var(--text-dark)">NBA PERF JOUEUR</div><div style="font-size:8px;color:var(--text-muted)">adnbetting · Basket · 07/04</div></div>
          <span style="background:#E6F1FB;color:#0C447C;font-size:8px;padding:2px 6px;border-radius:8px;flex-shrink:0">⏳ Attente</span>
        </div>
        <div style="padding:7px 9px;display:flex;justify-content:space-between;align-items:center;gap:6px">
          <div><div style="font-size:10px;font-weight:700;color:var(--text-dark)">BIG SAFE TENNIS</div><div style="font-size:8px;color:var(--text-muted)">hippopronos · Tennis · 04/04</div></div>
          <span style="background:#FCEBEB;color:#791F1F;font-size:8px;padding:2px 6px;border-radius:8px;flex-shrink:0">✕ Perdu</span>
        </div>
      </div>`;

    const nouveautesBloc = `
      <div style="font-size:7px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Nouveautés</div>
      <div style="background:var(--bg);border:0.5px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:8px">
        <div style="padding:7px 9px;border-bottom:0.5px solid var(--border)">
          <div style="font-size:10px;font-weight:700;color:var(--text-dark)">Images sur les pronostics</div>
          <div style="font-size:8px;color:var(--text-muted);margin-top:1px">09/04/2026</div>
        </div>
        <div style="padding:7px 9px">
          <div style="font-size:10px;font-weight:700;color:var(--text-dark)">Explorer les pronos — nouveau design</div>
          <div style="font-size:8px;color:var(--text-muted);margin-top:1px">08/04/2026</div>
        </div>
      </div>`;

    const statsPlateBloc = `
      <div style="font-size:7px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Statistiques plateforme</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;margin-bottom:8px">
        <div style="background:var(--bg);border:0.5px solid var(--border);border-radius:6px;padding:6px;text-align:center"><div style="font-size:14px;font-weight:800;color:var(--text-dark)">45</div><div style="font-size:7px;color:var(--text-muted);margin-top:1px">Tipsters</div></div>
        <div style="background:var(--bg);border:0.5px solid var(--border);border-radius:6px;padding:6px;text-align:center"><div style="font-size:14px;font-weight:800;color:var(--text-dark)">320</div><div style="font-size:7px;color:var(--text-muted);margin-top:1px">Pronos joués</div></div>
        <div style="background:var(--bg);border:0.5px solid var(--border);border-radius:6px;padding:6px;text-align:center"><div style="font-size:14px;font-weight:800;color:var(--text-dark)">68%</div><div style="font-size:7px;color:var(--text-muted);margin-top:1px">Taux global</div></div>
      </div>`;

    const risingBloc = isRising ? `
      <div style="font-size:7px;font-weight:700;color:#085041;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">👇 Votre emplacement</div>
      <div style="background:var(--bg);border:1.5px solid #639922;border-radius:8px;overflow:hidden;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:8px;padding:8px 10px">
          <div style="width:34px;height:34px;border-radius:50%;background:#C0DD97;border:2px solid #639922;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#3B6D11;flex-shrink:0">V</div>
          <div style="flex:1;min-width:0">
            <span style="background:#E1F5EE;color:#085041;font-size:7px;font-weight:700;padding:1px 5px;border-radius:5px">Tipster en progression</span>
            <div style="font-size:11px;font-weight:800;color:var(--text-dark);margin-top:2px">Votre pseudo</div>
            <div style="display:flex;gap:8px;margin-top:3px">
              <span style="font-size:8px;color:var(--text-muted)"><strong style="color:var(--text-dark)">76%</strong> win rate</span>
              <span style="font-size:8px;color:var(--text-muted)"><strong style="color:var(--text-dark)">48</strong> pronos</span>
              <span style="font-size:8px;color:var(--text-muted)">cote <strong style="color:var(--text-dark)">3,2</strong></span>
            </div>
          </div>
          <span style="border:1.5px solid #639922;color:#3B6D11;border-radius:10px;padding:4px 9px;font-size:9px;font-weight:700;flex-shrink:0">Voir →</span>
        </div>
      </div>` : '';

    const sondageBloc = `
      <div style="font-size:7px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Sondage</div>
      <div style="background:var(--bg);border:0.5px solid var(--border);border-radius:8px;padding:8px 9px">
        <div style="font-size:10px;font-weight:700;color:var(--text-dark);margin-bottom:6px">Quel sport vous intéresse le plus ?</div>
        <div style="position:relative;border:0.5px solid var(--border);border-radius:6px;padding:5px 8px;margin-bottom:5px;overflow:hidden">
          <div style="position:absolute;top:0;left:0;height:100%;width:52%;background:#E6F1FB;z-index:0;border-radius:6px"></div>
          <div style="position:relative;z-index:1;display:flex;justify-content:space-between;font-size:9px"><span style="color:var(--text-dark)">Foot</span><span style="color:#185FA5;font-weight:700">52%</span></div>
        </div>
        <div style="position:relative;border:0.5px solid var(--border);border-radius:6px;padding:5px 8px;overflow:hidden">
          <div style="position:absolute;top:0;left:0;height:100%;width:28%;background:#E6F1FB;z-index:0;border-radius:6px"></div>
          <div style="position:relative;z-index:1;display:flex;justify-content:space-between;font-size:9px"><span style="color:var(--text-dark)">Tennis</span><span style="color:var(--text-muted)">28%</span></div>
        </div>
      </div>`;

    // Pour featured : votre emplacement est EN HAUT (juste après stats), puis le reste
    // Pour rising : votre emplacement est EN BAS (après statsPlate), comme sur le vrai dashboard
    return `
    <div style="background:var(--bg-soft);border-radius:12px;border:0.5px solid var(--border);overflow:hidden;font-family:var(--font-body)">
      <div style="background:var(--bg);padding:8px 12px;display:flex;justify-content:space-between;align-items:center;border-bottom:0.5px solid var(--border)">
        <span style="font-size:13px;font-weight:800;color:var(--text-dark)">Tableau de bord</span>
        <span style="background:#E6F1FB;color:#0C447C;border-radius:14px;padding:3px 10px;font-size:10px;font-weight:600">🔥 12 €</span>
      </div>
      <div style="padding:10px;display:flex;flex-direction:column;gap:0">
        ${stats4}
        ${featuredBloc}
        ${twitterBloc}
        ${achatsBloc}
        ${nouveautesBloc}
        ${statsPlateBloc}
        ${risingBloc}
        ${sondageBloc}
      </div>
    </div>`;
  }

  // Charge les clics + historique pour un slot depuis Supabase
  async function loadSponsorData(slot, tipsterId) {
    const url = new URL(SUPA + '/rest/v1/sponsors_clicks_history');
    url.searchParams.set('select', 'mois,clicks');
    url.searchParams.set('tipster_id', 'eq.' + tipsterId);
    url.searchParams.set('slot', 'eq.' + slot);
    url.searchParams.set('order', 'mois.desc');
    url.searchParams.set('apikey', ANON);
    try {
      const r = await fetch(url.toString(), { headers: { apikey: ANON } });
      const rows = await r.json();
      if (!Array.isArray(rows)) return { total: 0, history: [] };
      const total = rows.reduce((s, r) => s + (parseInt(r.clicks) || 0), 0);
      return { total, history: rows };
    } catch(e) { return { total: 0, history: [] }; }
  }

  function sponsorBlocHtml(slot, label, badgeStyle, titre, data) {
    const { total, history } = data;
    const hasHistory = history.length > 0;
    const previewContent = buildPreviewDashboard(slot);
    const icoX = `<svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.737-8.835L1.254 2.25H8.08l4.259 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
    const icoMail = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`;

    const historyHtml = hasHistory
      ? history.map(row => {
          const [y, m] = row.mois.split('-');
          const moisLabel = new Date(parseInt(y), parseInt(m)-1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
          return `<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 12px;border-top:0.5px solid var(--border)">
            <span style="font-size:0.78rem;color:var(--text-muted)">${moisLabel.charAt(0).toUpperCase()+moisLabel.slice(1)}</span>
            <span style="font-size:0.82rem;font-weight:700;color:var(--text-dark)">${parseInt(row.clicks)||0} clics</span>
          </div>`;
        }).join('')
      : `<div style="padding:10px 12px;font-size:0.78rem;color:var(--text-muted);border-top:0.5px solid var(--border)">
          Aucun historique pour le moment. Contactez-nous sur X ou par mail pour être mis en avant.
        </div>`;

    const thisMois = history.length > 0 ? (parseInt(history[0].clicks)||0) : 0;
    const badgeMois = hasHistory
      ? `<span style="background:#FAEEDA;color:#633806;font-size:0.72rem;font-weight:600;padding:3px 10px;border-radius:20px">+${thisMois} ce mois</span>`
      : `<span style="background:var(--bg-soft);color:var(--text-muted);font-size:0.72rem;font-weight:600;padding:3px 10px;border-radius:20px">Pas encore actif</span>`;

    return `
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 12px 10px">
          <div>
            <div style="${badgeStyle};font-size:0.72rem;font-weight:700;padding:2px 8px;border-radius:10px;display:inline-block;margin-bottom:5px">${label}</div>
            <div style="font-size:0.88rem;font-weight:700;color:var(--text-dark)">${titre}</div>
          </div>
          <div style="display:flex;gap:6px;flex-shrink:0">
            <a href="https://x.com/payperwin_co" target="_blank" style="background:#EF9F27;border-radius:20px;padding:5px 10px;display:flex;align-items:center;gap:4px;text-decoration:none">
              ${icoX}<span style="font-size:0.72rem;font-weight:600;color:white">X</span>
            </a>
            <a href="mailto:contact@payperwin.co" style="background:#3B6D11;border-radius:20px;padding:5px 10px;display:flex;align-items:center;gap:4px;text-decoration:none">
              ${icoMail}<span style="font-size:0.72rem;font-weight:600;color:white">Mail</span>
            </a>
          </div>
        </div>
        <div style="border-top:0.5px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:10px 12px">
          <div>
            <div style="font-size:1.3rem;font-weight:800;color:var(--text-dark)">${total}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);margin-top:1px">clics générés au total</div>
          </div>
          ${badgeMois}
        </div>
        ${historyHtml}
        <div onclick="toggleTipsterPreview('${slot}')" style="display:flex;align-items:center;justify-content:space-between;border-top:0.5px solid var(--border);padding:9px 12px;font-size:0.78rem;color:var(--text-muted);cursor:pointer">
          <span>Voir comment vous seriez affiché</span>
          <span id="arrow-tip-${slot}" style="font-size:0.85rem;transition:transform .2s">›</span>
        </div>
      </div>
      <div id="preview-tip-${slot}" style="display:none;background:rgba(0,0,0,0.5);border-radius:var(--radius-lg);padding:14px;margin-bottom:8px">
        <div style="font-size:0.68rem;font-weight:600;color:white;text-align:center;margin-bottom:10px;text-transform:uppercase;letter-spacing:.04em">Dashboard acheteur — vue complète</div>
        <div>${previewContent}</div>
        <a href="https://x.com/payperwin_co" target="_blank" style="display:flex;align-items:center;justify-content:center;gap:7px;background:#000;color:white;border-radius:20px;padding:9px 16px;font-size:0.82rem;font-weight:600;text-decoration:none;margin-top:10px">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.737-8.835L1.254 2.25H8.08l4.259 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          Contacter sur X
        </a>
        <button onclick="closeTipsterPreview('${slot}')" style="background:var(--bg-soft);border:0.5px solid var(--border);border-radius:20px;padding:6px 16px;font-size:0.78rem;color:var(--text-dark);cursor:pointer;font-family:var(--font-body);margin-top:8px;display:block;width:100%;text-align:center">Fermer ×</button>
      </div>`;
  }

  // Bloc stats plateforme pour le dashboard tipster
  const statsPlatePopupsTip = {
    parieurs: { title: 'Parieurs', text: 'Nombre total de membres inscrits sur PayPerWin qui achètent des pronostics.' },
    tipsters: { title: 'Tipsters', text: 'Nombre de tipsters actifs inscrits sur PayPerWin qui publient des pronostics.' },
    pronos:   { title: 'Pronos joués', text: 'Nombre total de pronostics publiés sur la plateforme depuis le lancement.' },
    winrate:  { title: 'Taux global', text: 'Pourcentage de pronostics terminés gagnants, sur l\'ensemble des tipsters.' },
  };
  const statsPlateHtmlTip = `
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-md)">
      <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:12px">
        ${[
          { key:'parieurs', label:'Parieurs',    val: platNbParieurs },
          { key:'tipsters', label:'Tipsters',    val: platNbTipsters },
          { key:'pronos',   label:'Pronos joués',val: platNbPronos },
          { key:'winrate',  label:'Taux global', val: platWinRate+'%' },
        ].map(s => `
          <div onclick="showStatsPlateTipsterPopup('${s.key}')" style="background:var(--bg-soft);border-radius:var(--radius-md);padding:8px 6px;text-align:center;cursor:pointer;position:relative">
            <div style="position:absolute;top:4px;right:5px;font-size:9px;color:var(--text-muted);opacity:.5">?</div>
            <div style="font-size:${mob?'0.95rem':'1rem'};font-weight:700;color:var(--text-dark)">${s.val}</div>
            <div style="font-size:0.65rem;color:var(--text-muted);margin-top:2px;line-height:1.2">${s.label}</div>
          </div>`).join('')}
      </div>
      <div id="stats-plate-tipster-popup" style="padding:0"></div>
    </div>`;

  // Charger les données sponsor pour les 2 slots en parallèle
  const user = await getCurrentUser();
  const [dataFeatured, dataRising] = await Promise.all([
    loadSponsorData('featured', user.id),
    loadSponsorData('rising', user.id)
  ]);

  const sponsorHtml = `
    <div style="margin-bottom:var(--space-md)">
      ${sponsorBlocHtml('featured', '⭐ Tipster à la une', 'background:#FAEEDA;color:#633806', 'Emplacement premium', dataFeatured)}
      ${sponsorBlocHtml('rising', '🚀 Tipster en progression', 'background:#E1F5EE;color:#085041', 'Emplacement secondaire', dataRising)}
    </div>`;

  // Rendu final
  if (!document.getElementById('page-content')) return;

  const styleTag = `<style>
    .dash-tip-news.open .dash-tip-desc { display:block !important }
    .dash-tip-news.open .dash-tip-arrow { display:inline-block;transform:rotate(90deg) }
    .dash-tip-news:last-child { border-bottom:none !important }
  </style>`;

  if (mob) {
    container.innerHTML = `${styleTag}
      <div class="section-header" style="margin-bottom:8px"><div><h2>Tableau de bord</h2></div></div>
      ${statsHtml}
      ${chartHtml}
      <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Mes derniers pronos</div>
      ${derniersHtml}
      <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Statistiques plateforme</div>
      ${statsPlateHtmlTip}
      <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Nouveautés plateforme</div>
      ${changelogHtml}
      ${sponsorHtml}
      ${freebetHtml}`;
  } else {
    container.innerHTML = `${styleTag}
      <div class="section-header"><div><h2>Tableau de bord</h2></div></div>
      ${statsHtml}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-lg)">
        <div>
          ${chartHtml}
          <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Booster votre visibilité</div>
          ${sponsorHtml.replace('<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-md)">','<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-md)">').replace('<div style="padding:12px 12px 10px;font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;border-bottom:0.5px solid var(--border);margin-bottom:10px">Booster votre visibilité</div>','')}
        </div>
        <div>
          <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Mes derniers pronos</div>
          ${derniersHtml}
          <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Statistiques plateforme</div>
          ${statsPlateHtmlTip}
          <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Nouveautés plateforme</div>
          ${changelogHtml}
          ${freebetHtml}
        </div>
      </div>`;
  }

  window.toggleFreebetTipsterInfo = function() {
    const el = document.getElementById('freebet-tipster-info');
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
  };

  // Fonctions popup stat
  window.showStatsPlateTipsterPopup = function(key) {
    const area = document.getElementById('stats-plate-tipster-popup');
    if (!area) return;
    if (area.dataset.open === key) { area.style.padding='0'; area.innerHTML=''; area.dataset.open=''; return; }
    area.dataset.open = key;
    const p = statsPlatePopupsTip[key];
    area.style.padding = '0 12px 10px';
    area.innerHTML = `<div style="background:var(--bg-soft);border-radius:var(--radius-md);padding:10px 12px;border:1px solid var(--border);display:flex;justify-content:space-between;gap:8px">
      <div>
        <div style="font-size:0.85rem;font-weight:700;color:var(--text-dark);margin-bottom:3px">${p.title}</div>
        <div style="font-size:0.78rem;color:var(--text-muted);line-height:1.5">${p.text}</div>
      </div>
      <button onclick="const a=document.getElementById('stats-plate-tipster-popup');a.innerHTML='';a.style.padding='0';a.dataset.open='';" style="font-size:1rem;color:var(--text-muted);background:none;border:none;cursor:pointer;flex-shrink:0">×</button>
    </div>`;
  };

  window.showTipsterStatPopup = function(key) {
    const row1Keys = ['solde', 'winrate'];
    const areaId = row1Keys.includes(key) ? 'tipster-popup-row1' : 'tipster-popup-row2';
    const otherAreaId = row1Keys.includes(key) ? 'tipster-popup-row2' : 'tipster-popup-row1';
    const area = document.getElementById(areaId);
    const otherArea = document.getElementById(otherAreaId);
    if (!area) return;
    // Vider l'autre rangée
    if (otherArea) { otherArea.innerHTML = ''; otherArea.dataset.open = ''; }
    // Toggle
    if (area.dataset.open === key) { area.innerHTML = ''; area.dataset.open = ''; return; }
    area.dataset.open = key;
    const p = popupDefs[key];
    area.innerHTML = `<div style="background:var(--bg-soft);border-radius:var(--radius-md);padding:10px 12px;border:1px solid var(--border);display:flex;justify-content:space-between;gap:8px;margin-bottom:4px">
      <div>
        <div style="font-size:0.85rem;font-weight:700;color:var(--text-dark);margin-bottom:3px">${p.title}</div>
        <div style="font-size:0.78rem;color:var(--text-muted);line-height:1.5">${p.text}</div>
      </div>
      <button onclick="['tipster-popup-row1','tipster-popup-row2'].forEach(id=>{const el=document.getElementById(id);if(el){el.innerHTML='';el.dataset.open='';}});" style="font-size:1rem;color:var(--text-muted);background:none;border:none;cursor:pointer;flex-shrink:0">×</button>
    </div>`;
  };

  // Initialiser les graphiques Chart.js après rendu du DOM
  if (pronosSorted.length >= 2) {
    setTimeout(() => {
      const ANON2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
      const SUPA2 = 'https://haezbgglpghjrgdpmcrj.supabase.co';
      const n = pronosSorted.length;
      const labels = Array(n).fill('');
      const chartOpts = (color, dashColor) => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } }
      });

      // Moyenne plateforme : on charge les purchases de tous les tipsters
      fetch(`${SUPA2}/rest/v1/purchases?select=prono_id,amount,created_at&order=created_at.asc&apikey=${ANON2}`, { headers: { apikey: ANON2 } })
        .then(r => r.json())
        .then(allP => {
          // Charger pronos pour avoir les tipster_id
          return fetch(`${SUPA2}/rest/v1/pronos?select=id,tipster_id,status,price,created_at&order=created_at.asc&apikey=${ANON2}`, { headers: { apikey: ANON2 } })
            .then(r => r.json())
            .then(allPronos => ({ allP, allPronos }));
        })
        .then(({ allP, allPronos }) => {
          // Grouper par tipster
          const tipsterIds = [...new Set(allPronos.map(p => p.tipster_id).filter(Boolean))];
          const nbTipsters = Math.max(1, tipsterIds.length);
          const purchMap = {};
          (allP||[]).forEach(a => { if (!purchMap[a.prono_id]) purchMap[a.prono_id] = 0; purchMap[a.prono_id]++; });

          // Pour chaque tipster, calculer achats cumulés et gains cumulés sur n pronos
          const allAchats = tipsterIds.map(tid => {
            const tPronos = allPronos.filter(p => p.tipster_id === tid).slice(0, n);
            let cum = 0;
            return tPronos.map(p => { cum += purchMap[p.id]||0; return cum; });
          }).filter(a => a.length > 0);

          const allGains = tipsterIds.map(tid => {
            const tPronos = allPronos.filter(p => p.tipster_id === tid).slice(0, n);
            let cum = 0;
            return tPronos.map(p => {
              if (p.status === 'won') cum += Math.round((purchMap[p.id]||0) * parseFloat(p.price||0) * 0.9);
              return cum;
            });
          }).filter(a => a.length > 0);

          // Moyenne par position
          const avgAchats = Array(n).fill(0).map((_, i) => {
            const vals = allAchats.map(a => a[i]||0);
            return vals.length > 0 ? Math.round(vals.reduce((s,v)=>s+v,0)/vals.length) : 0;
          });
          const avgGains = Array(n).fill(0).map((_, i) => {
            const vals = allGains.map(a => a[i]||0);
            return vals.length > 0 ? Math.round(vals.reduce((s,v)=>s+v,0)/vals.length) : 0;
          });

          // Graphique achats
          const cA = document.getElementById('chartA-' + chartUid);
          if (cA) {
            new Chart(cA, {
              type: 'line',
              data: { labels, datasets: [
                { data: achatsData.slice(0, n), borderColor: '#378ADD', borderWidth: 2, pointRadius: 0, tension: 0.4 },
                { data: avgAchats, borderColor: '#888780', borderWidth: 1.5, borderDash: [5,4], pointRadius: 0, tension: 0.4 }
              ]},
              options: chartOpts('#378ADD', '#888780')
            });
          }

          // Graphique gains
          const cG = document.getElementById('chartG-' + chartUid);
          if (cG) {
            new Chart(cG, {
              type: 'line',
              data: { labels, datasets: [
                { data: gainsData.slice(0, n), borderColor: '#3B6D11', borderWidth: 2, pointRadius: 0, tension: 0.4 },
                { data: avgGains, borderColor: '#888780', borderWidth: 1.5, borderDash: [5,4], pointRadius: 0, tension: 0.4 }
              ]},
              options: chartOpts('#3B6D11', '#888780')
            });
          }
        })
        .catch(() => {
          // En cas d'erreur, afficher juste les données du tipster sans moyenne
          const cA = document.getElementById('chartA-' + chartUid);
          if (cA) new Chart(cA, { type:'line', data:{ labels, datasets:[{ data:achatsData, borderColor:'#378ADD', borderWidth:2, pointRadius:0, tension:0.4 }]}, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},tooltip:{enabled:false}}, scales:{x:{display:false},y:{display:false}} } });
          const cG = document.getElementById('chartG-' + chartUid);
          if (cG) new Chart(cG, { type:'line', data:{ labels, datasets:[{ data:gainsData, borderColor:'#3B6D11', borderWidth:2, pointRadius:0, tension:0.4 }]}, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},tooltip:{enabled:false}}, scales:{x:{display:false},y:{display:false}} } });
        });
    }, 100);
  }

  window.toggleTipsterPreview = function(slot) {
    const el = document.getElementById('preview-tip-' + slot);
    const ar = document.getElementById('arrow-tip-' + slot);
    const other = slot === 'featured' ? 'rising' : 'featured';
    const otherEl = document.getElementById('preview-tip-' + other);
    const otherAr = document.getElementById('arrow-tip-' + other);
    if (el.style.display !== 'none') { el.style.display = 'none'; ar.style.transform = ''; }
    else {
      if (otherEl) { otherEl.style.display = 'none'; otherAr.style.transform = ''; }
      el.style.display = 'block'; ar.style.transform = 'rotate(90deg)';
    }
  };

  window.closeTipsterPreview = function(slot) {
    const el = document.getElementById('preview-tip-' + slot);
    if (el) el.style.display = 'none';
    const ar = document.getElementById('arrow-tip-' + slot);
    if (ar) ar.style.transform = '';
  };
}

// ══════════════════════════════════════════════════════════════
//  PAGE — TABLEAU DE BORD TIPSTER
// ══════════════════════════════════════════════════════════════
function isMobile() { return window.innerWidth < 900; }