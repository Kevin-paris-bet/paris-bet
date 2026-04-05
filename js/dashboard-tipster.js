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
    pronos: 'Mes pronostics',
    solde:  'Solde & Virements',
    rib:    'Mes informations bancaires',
    stats:  'Mes statistiques',
    compte: 'Mon compte',
    explorer: 'Explorer les tipsters',
    feedback: 'Feedback & Nouveautés',
  };
  document.getElementById('topbar-title').textContent = titles[page] || 'Dashboard';

  // Rendre la bonne page
  const content = document.getElementById('page-content');
  content.innerHTML = '';

  if (page === 'pronos')   renderPagePronos(content);
  if (page === 'solde')    renderPageSolde(content);
  if (page === 'rib')      renderPageRIB(content);
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
      <a href="#" onclick="navigateTo('rib')" style="color:var(--blue)">Modifier mon RIB →</a>
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
  const { data: { user } } = await sb.auth.getUser();
  if (!user) { showToast('Erreur : non connecté', 'error'); return; }

  try {
    const r = await fetch('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/profiles?id=eq.' + user.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + ANON },
      body: JSON.stringify({ rib_name: name, rib_iban: iban, rib_bic: bic })
    });
    if (r.ok || r.status === 204) {
      MOCK_TIPSTER.ribSaved = true;
      showToast('Coordonnées bancaires enregistrées ! ✓', 'success');
      navigateTo('rib');
    } else {
      showToast('Erreur lors de la sauvegarde', 'error');
    }
  } catch(e) {
    showToast('Erreur réseau', 'error');
  }
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
  container.innerHTML = `
    <div style="max-width:560px;display:flex;flex-direction:column;gap:var(--space-lg)">

      <!-- Photo de profil -->
      <div class="rib-card">
        <div class="rib-card__header">
          <div style="font-size:1.6rem">📸</div>
          <div>
            <h3>Photo de profil</h3>
            <p>Visible sur votre page publique</p>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:var(--space-lg);margin-bottom:var(--space-lg)">
          <div id="avatar-preview" style="width:80px;height:80px;border-radius:50%;overflow:hidden;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:1.8rem;font-weight:700;color:white;flex-shrink:0">
            ${MOCK_TIPSTER.avatarUrl
              ? `<img src="${MOCK_TIPSTER.avatarUrl}" style="width:100%;height:100%;object-fit:cover" />`
              : `${(MOCK_TIPSTER.pseudo || MOCK_TIPSTER.firstName)[0].toUpperCase()}`
            }
          </div>
          <div style="flex:1">
            <label class="btn btn-outline" style="cursor:pointer;display:inline-block">
              📁 Choisir une photo
              <input type="file" id="avatar-input" accept="image/*" style="display:none" onchange="previewAvatar(this)" />
            </label>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:6px">JPG, PNG · Max 5MB · Compressée automatiquement</div>
          </div>
        </div>
        <button class="btn btn-primary" style="width:100%" onclick="saveAvatar()">
          Enregistrer la photo
        </button>
      </div>

      <!-- Modifier la description -->
      <div class="rib-card">
        <div class="rib-card__header">
          <div style="font-size:1.6rem">📝</div>
          <div>
            <h3>Description</h3>
            <p>Présentez-vous à vos acheteurs</p>
          </div>
        </div>
        <div class="form-group">
          <label>Votre description <span style="color:var(--text-muted);font-weight:400">(max 300 caractères)</span></label>
          <textarea class="input input-textarea" id="new-description" maxlength="300"
            placeholder="Ex: Spécialiste Ligue 1 depuis 5 ans, 68% de win rate sur 200+ pronos..."
            style="min-height:100px">${MOCK_TIPSTER.description || ''}</textarea>
        </div>
        <button class="btn btn-primary" style="width:100%" onclick="saveDescription()">
          Enregistrer la description
        </button>
      </div>

      <!-- Nom & Prénom -->
      <div class="rib-card">
        <div class="rib-card__header">
          <div style="font-size:1.6rem">👤</div>
          <div>
            <h3>Nom & Prénom</h3>
            <p>Vos informations personnelles (non publiques)</p>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Prénom</label>
            <div class="input-wrap">
              <span class="input-icon">👤</span>
              <input class="input" type="text" id="new-firstname" placeholder="Prénom" value="${MOCK_TIPSTER.firstName || ''}" />
            </div>
          </div>
          <div class="form-group">
            <label>Nom</label>
            <div class="input-wrap">
              <span class="input-icon">👤</span>
              <input class="input" type="text" id="new-lastname" placeholder="Nom" value="${MOCK_TIPSTER.lastName || ''}" />
            </div>
          </div>
        </div>
        <button class="btn btn-primary" style="width:100%" onclick="saveNomPrenom()">
          Enregistrer
        </button>
      </div>

      <!-- Modifier le pseudo -->
      <div class="rib-card">
        <div class="rib-card__header">
          <div style="font-size:1.6rem">🏷️</div>
          <div>
            <h3>Pseudo</h3>
            <p>Pseudo actuel : <strong>${MOCK_TIPSTER.pseudo || '—'}</strong></p>
          </div>
        </div>
        <div class="form-group">
          <label>Nouveau pseudo</label>
          <div class="input-wrap">
            <span class="input-icon">🏷️</span>
            <input class="input" type="text" id="new-pseudo" placeholder="ex: jerome-bet" oninput="checkPseudoAvailable()" autocomplete="off" />
          </div>
          <div id="pseudo-check-tip" style="font-size:0.8rem;margin-top:4px"></div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">3-20 caractères · lettres, chiffres, tirets uniquement</div>
        </div>
        <button class="btn btn-primary" style="width:100%" onclick="savePseudo()">
          Mettre à jour le pseudo
        </button>
      </div>

      <!-- Modifier l'email -->
      <div class="rib-card">
        <div class="rib-card__header">
          <div style="font-size:1.6rem">✉️</div>
          <div>
            <h3>Adresse email</h3>
            <p>Email actuel : <strong>${MOCK_TIPSTER.email || '—'}</strong></p>
          </div>
        </div>
        <div class="form-group">
          <label>Nouvel email</label>
          <div class="input-wrap">
            <span class="input-icon">✉️</span>
            <input class="input" type="email" id="new-email" placeholder="nouveau@email.com" />
          </div>
        </div>
        <button class="btn btn-primary" style="width:100%" onclick="saveEmail()">
          Mettre à jour l'email
        </button>
      </div>

      <!-- Modifier le mot de passe -->
      <div class="rib-card">
        <div class="rib-card__header">
          <div style="font-size:1.6rem">🔒</div>
          <div>
            <h3>Mot de passe</h3>
            <p>Choisissez un mot de passe sécurisé</p>
          </div>
        </div>
        <div class="form-group">
          <label>Nouveau mot de passe</label>
          <div class="input-wrap">
            <span class="input-icon">🔒</span>
            <input class="input" type="password" id="new-password" placeholder="Minimum 8 caractères" />
          </div>
        </div>
        <div class="form-group">
          <label>Confirmer le mot de passe</label>
          <div class="input-wrap">
            <span class="input-icon">🔒</span>
            <input class="input" type="password" id="confirm-password" placeholder="Répétez le mot de passe" />
          </div>
        </div>
        <button class="btn btn-primary" style="width:100%" onclick="savePassword()">
          Mettre à jour le mot de passe
        </button>
      </div>

    </div>
  `;
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

  const btn = document.querySelector('[onclick="saveAvatar()"]');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Upload en cours...'; }

  try {
    const { data: { session } } = await sb.auth.getSession();
    const userId = session?.user?.id;
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
    showToast('✓ Photo de profil mise à jour !', 'success');
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

