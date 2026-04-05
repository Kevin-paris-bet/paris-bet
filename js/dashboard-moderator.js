/**
 * ============================================================
 *  PAYPERWIN — JS DASHBOARD MODÉRATEUR (dashboard-moderator.js)
 *  Accès limité : validation des résultats uniquement
 * ============================================================
 */

const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';

const modState = {
  pronos: [],
  pronosFilter: 'pending',
  user: null,
};

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuth(['moderator', 'admin']);
  if (!user) return;

  modState.user = user;

  // Mettre à jour la sidebar
  const name = (user.profile.first_name || '') + ' ' + (user.profile.last_name || '');
  const initials = ((user.profile.first_name?.[0] || '') + (user.profile.last_name?.[0] || '')).toUpperCase() || 'MO';
  const sidebarName   = document.getElementById('sidebar-name');
  const sidebarAvatar = document.getElementById('sidebar-avatar');
  if (sidebarName)   sidebarName.textContent  = name.trim() || 'Modérateur';
  if (sidebarAvatar) sidebarAvatar.textContent = initials;

  syncThemeUI();
  await loadPronos();
  navigateTo('pronos');
});

// ── Navigation ────────────────────────────────────────────────
function navigateTo(page) {
  const sidebar  = document.querySelector('.sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('show');

  document.querySelectorAll('.sidebar__link').forEach(l =>
    l.classList.toggle('active', l.dataset.page === page)
  );
  const titles = { pronos: 'Valider les résultats', images: 'Validation des images' };
  document.getElementById('topbar-title').textContent = titles[page] || 'Modération';
  const content = document.getElementById('page-content');
  content.innerHTML = '';
  if (page === 'pronos') renderPronos(content);
  if (page === 'images') renderPageImages(content);
}

// renderPageImages et validateImage sont partagés avec admin
// On les réutilise directement (même code Supabase)
async function renderPageImages(container) {
  const ANON2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA2 = 'https://haezbgglpghjrgdpmcrj.supabase.co';
  container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">⏳ Chargement...</div>';
  try {
    const r = await fetch(`${SUPA2}/rest/v1/pronos?select=id,game,sport,match_date,tipster_id,image_url,image_status&image_status=neq.none&image_url=not.is.null&order=created_at.desc&apikey=${ANON2}`, {
      headers: { apikey: ANON2, 'Authorization': 'Bearer ' + ANON2 }
    });
    const pronos = await r.json();
    const tipsterIds = [...new Set((pronos||[]).map(p => p.tipster_id).filter(Boolean))];
    let profilesMap = {};
    if (tipsterIds.length > 0) {
      const rP = await fetch(`${SUPA2}/rest/v1/profiles?select=id,first_name,last_name,pseudo&id=in.(${tipsterIds.join(',')})&apikey=${ANON2}`, { headers: { apikey: ANON2, 'Authorization': 'Bearer ' + ANON2 } });
      const profiles = await rP.json();
      (profiles||[]).forEach(p => profilesMap[p.id] = p.pseudo || (p.first_name + ' ' + p.last_name));
    }
    const pending  = (pronos||[]).filter(p => p.image_status === 'pending');
    const approved = (pronos||[]).filter(p => p.image_status === 'approved');
    const rejected = (pronos||[]).filter(p => p.image_status === 'rejected');
    function imageCard(p, showActions) {
      const tipster = profilesMap[p.tipster_id] || '—';
      const statusBadge = p.image_status === 'pending' ? '<span class="badge badge-pending">⏳ En attente</span>' : p.image_status === 'approved' ? '<span class="badge badge-won">✓ Approuvée</span>' : '<span class="badge badge-lost">🚫 Refusée</span>';
      return `<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);padding:var(--space-md);display:flex;gap:var(--space-md);align-items:flex-start">
        <img src="${p.image_url}" style="width:180px;height:120px;object-fit:cover;border-radius:var(--radius-md);flex-shrink:0;cursor:pointer" onclick="window.open('${p.image_url}','_blank')" />
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px">
            <div><div class="prono-title">${p.game}</div><div class="prono-meta">${p.sport||'—'} · par ${tipster}</div></div>
            ${statusBadge}
          </div>
          ${showActions ? `<div style="display:flex;gap:8px;margin-top:8px">
            <button class="btn btn-primary btn--sm" onclick="validateImageMod('${p.id}','approved')">✓ Approuver</button>
            <button class="btn btn-outline btn--sm" style="color:var(--error);border-color:var(--error)" onclick="validateImageMod('${p.id}','rejected')">🚫 Refuser</button>
          </div>` : ''}
        </div>
      </div>`;
    }
    container.innerHTML = `
      <div class="section-header"><div><h2>Validation des images</h2><p>${pending.length} en attente · ${approved.length} approuvées · ${rejected.length} refusées</p></div></div>
      ${pending.length > 0 ? `<div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;color:var(--warning);margin-bottom:var(--space-sm)">⏳ En attente (${pending.length})</div><div style="display:flex;flex-direction:column;gap:var(--space-md);margin-bottom:var(--space-xl)">${pending.map(p => imageCard(p, true)).join('')}</div>` : '<div style="text-align:center;padding:40px;color:var(--text-muted)">✅ Aucune image en attente.</div>'}
      ${approved.length > 0 ? `<div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;color:var(--success);margin-bottom:var(--space-sm)">✓ Approuvées (${approved.length})</div><div style="display:flex;flex-direction:column;gap:var(--space-md);margin-bottom:var(--space-xl)">${approved.map(p => imageCard(p, false)).join('')}</div>` : ''}
      ${rejected.length > 0 ? `<div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;color:var(--error);margin-bottom:var(--space-sm)">🚫 Refusées (${rejected.length})</div><div style="display:flex;flex-direction:column;gap:var(--space-md)">${rejected.map(p => imageCard(p, false)).join('')}</div>` : ''}`;
  } catch(e) { container.innerHTML = `<div style="color:var(--error);text-align:center;padding:40px">Erreur : ${e.message}</div>`; }
}

async function validateImageMod(pronoId, status) {
  const ANON2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  try {
    await fetch(`https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/pronos?id=eq.${pronoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', apikey: ANON2, 'Authorization': 'Bearer ' + ANON2 },
      body: JSON.stringify({ image_status: status })
    });
    showToast(status === 'approved' ? 'Image approuvée ✓' : 'Image refusée', status === 'approved' ? 'success' : 'info');
    renderPageImages(document.getElementById('page-content'));
  } catch(e) { showToast('Erreur : ' + e.message, 'error'); }
}

// ── Charger les pronos depuis Supabase ────────────────────────
async function loadPronos() {
  const rP = await fetch(`${SUPA}/rest/v1/pronos?select=id,tipster_id,game,sport,match_date,price,status,buyers,cote,content&order=created_at.desc&apikey=${ANON}`, {
    headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON }
  });
  const pronos = await rP.json();

  modState.pronos = Array.isArray(pronos) ? pronos : [];

  // Badge en attente
  const pending = modState.pronos.filter(p => p.status === 'pending').length;
  const badge = document.getElementById('badge-pronos');
  if (badge) { badge.textContent = pending > 0 ? pending : ''; badge.style.display = pending > 0 ? '' : 'none'; }
}

// ── Render pronos ─────────────────────────────────────────────
function renderPronos(c) {
  const filters = [
    ['pending', '⏳ En attente'],
    ['won',     '✓ Gagnés'],
    ['lost',    '✕ Perdus'],
    ['cancelled','⊘ Annulés'],
    ['all',     'Tous'],
  ];

  const filtered = modState.pronosFilter === 'all'
    ? modState.pronos
    : modState.pronos.filter(p => p.status === modState.pronosFilter);

  const statusBadge = {
    pending:   `<span class="badge badge-pending">⏳ En attente</span>`,
    won:       `<span class="badge badge-won">✓ Gagné</span>`,
    lost:      `<span class="badge badge-lost">✕ Perdu</span>`,
    cancelled: `<span class="badge badge-cancelled">⊘ Annulé</span>`,
  };

  const isMobile = window.innerWidth <= 768;

  const rows = filtered.length
    ? filtered.map(p => {
        const actionBtns = p.status === 'pending'
          ? `<div style="display:flex;gap:4px;flex-wrap:wrap">
               <button class="btn-validate btn-validate--won"   onclick="validateProno('${p.id}','won')">✓ Gagné</button>
               <button class="btn-validate btn-validate--lost"  onclick="validateProno('${p.id}','lost')">✕ Perdu</button>
               <button class="btn-validate btn-validate--cancel" onclick="validateProno('${p.id}','cancelled')">⊘</button>
             </div>`
          : `<span style="font-size:0.75rem;color:var(--text-muted)">Validé</span>`;

        if (isMobile) {
          return `
          <div style="padding:var(--space-md) var(--space-lg);border-bottom:1px solid var(--border)">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px">
              <div>
                <div class="prono-title">${p.game}</div>
                <div class="prono-meta">${p.sport || ''} · ${p.match_date || '—'}</div>
              </div>
              ${statusBadge[p.status] || ''}
            </div>
            <div style="display:flex;align-items:center;gap:var(--space-md);margin-bottom:8px;font-size:0.82rem;color:var(--text-muted)">
              <span>Cote : <strong style="color:var(--blue)">${p.cote ? parseFloat(p.cote).toFixed(2) : '—'}</strong></span>
            </div>
            ${p.content ? `<div style="font-size:0.82rem;color:var(--text-muted);line-height:1.5;margin-bottom:10px;padding:8px 10px;background:var(--bg-soft);border-radius:var(--radius-sm)">${p.content}</div>` : ''}
            ${actionBtns}
          </div>`;
        }

        return `
        <div class="table-row" style="grid-template-columns:2fr 1fr 1fr 160px">
          <div>
            <div class="prono-title">${p.game}</div>
            <div class="prono-meta">${p.sport || ''} · ${p.match_date || '—'}</div>
            ${p.content ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px;line-height:1.4">${p.content}</div>` : ''}
          </div>
          <div style="font-size:0.85rem;font-weight:600;color:var(--blue)">${p.cote ? parseFloat(p.cote).toFixed(2) : '—'}</div>
          <div>${statusBadge[p.status] || ''}</div>
          <div>${actionBtns}</div>
        </div>`;
      }).join('')
    : `<div class="empty-state"><div class="empty-state__icon">✅</div><h3>Aucun pronostic ici</h3><p>Essayez un autre filtre.</p></div>`;

  const tableHeader = isMobile ? '' : `
    <div class="table-header" style="grid-template-columns:2fr 1fr 1fr 160px">
      <span>Match</span><span>Cote</span><span>Statut</span><span>Action</span>
    </div>`;

  c.innerHTML = `
    <div class="section-header">
      <div>
        <h2>Validation des résultats</h2>
        <p>Validez les pronostics terminés. Chaque validation déclenche les crédits ou remboursements automatiquement.</p>
      </div>
    </div>

    <div class="achats-filters" style="margin-bottom:var(--space-lg)">
      ${filters.map(([f, l]) => `
        <button class="filter-btn ${modState.pronosFilter === f ? 'active' : ''}"
          onclick="setFilter('${f}')">${l}</button>`).join('')}
    </div>

    <div class="pronos-table" style="${isMobile ? 'padding:0' : ''}">
      ${tableHeader}
      ${rows}
    </div>
  `;
}

function setFilter(f) {
  modState.pronosFilter = f;
  navigateTo('pronos');
}

// ── Validation ────────────────────────────────────────────────
async function validateProno(id, status) {
  const p = modState.pronos.find(p => p.id === id);
  if (!p) return;

  const labels = { won: 'GAGNÉ', lost: 'PERDU', cancelled: 'ANNULÉ' };
  const msgs = {
    won:       `✓ Valider comme GAGNÉ ?\n→ Le tipster sera crédité de ${formatEuros(p.revenue * 0.9)}\n→ Commission PayPerWin : ${formatEuros(p.revenue * 0.1)}`,
    lost:      `✕ Valider comme PERDU ?\n→ Les ${p.buyers || 0} acheteur(s) seront intégralement remboursés`,
    cancelled: `⊘ Valider comme ANNULÉ ?\n→ Les ${p.buyers || 0} acheteur(s) seront intégralement remboursés`,
  };

  if (!confirm(msgs[status])) return;

  try {
    // Mettre à jour le statut du prono
    const r1 = await fetch(`${SUPA}/rest/v1/pronos?id=eq.${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + ANON },
      body: JSON.stringify({ status })
    });
    if (!r1.ok) throw new Error('Erreur mise à jour prono');

    // Récupérer les achats
    const rA = await fetch(`${SUPA}/rest/v1/purchases?select=*&prono_id=eq.${id}&apikey=${ANON}`, {
      headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON }
    });
    const purchases = await rA.json();

    if (Array.isArray(purchases) && purchases.length > 0) {
      if (status === 'won') {
        const total = purchases.reduce((s, a) => s + parseFloat(a.amount || 0), 0);
        const tipsterShare = total * 0.9;

        const rTP = await fetch(`${SUPA}/rest/v1/profiles?select=balance&id=eq.${p.tipster_id}&apikey=${ANON}`, {
          headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON }
        });
        const tpData = await rTP.json();
        const currentBalance = parseFloat(tpData?.[0]?.balance || 0);

        await fetch(`${SUPA}/rest/v1/profiles?id=eq.${p.tipster_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + ANON },
          body: JSON.stringify({ balance: currentBalance + tipsterShare })
        });

        await fetch(`${SUPA}/rest/v1/purchases?prono_id=eq.${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + ANON },
          body: JSON.stringify({ status: 'won' })
        });

      } else {
        // Rembourser chaque acheteur
        for (const achat of purchases) {
          const rUP = await fetch(`${SUPA}/rest/v1/profiles?select=balance&id=eq.${achat.user_id}&apikey=${ANON}`, {
            headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON }
          });
          const upData = await rUP.json();
          const bal = parseFloat(upData?.[0]?.balance || 0);
          await fetch(`${SUPA}/rest/v1/profiles?id=eq.${achat.user_id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + ANON },
            body: JSON.stringify({ balance: bal + parseFloat(achat.amount || 0) })
          });
        }
        await fetch(`${SUPA}/rest/v1/purchases?prono_id=eq.${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + ANON },
          body: JSON.stringify({ status })
        });
      }
    }

    // Mettre à jour localement et re-render
    p.status = status;
    const toastType = status === 'won' ? 'success' : 'info';
    showToast(`"${p.game}" validé comme ${labels[status]} ✓`, toastType);
    navigateTo('pronos');

  } catch(err) {
    showToast('Erreur : ' + err.message, 'error');
  }
}

// ── Sidebar mobile ────────────────────────────────────────────
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
}

// ── Helpers ───────────────────────────────────────────────────
function formatEuros(n) {
  return (parseFloat(n) || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const colors = {
    error:   ['var(--error-pale)',   'var(--error)',   '✕'],
    success: ['var(--success-pale)', 'var(--success)', '✓'],
    info:    ['var(--blue-pale)',    'var(--blue)',     'ℹ'],
  };
  const [bg, border, icon] = colors[type] || colors.info;
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span>${icon}</span> ${message}`;
  Object.assign(t.style, {
    position:'fixed', bottom:'24px', left:'50%', transform:'translateX(-50%)',
    background:bg, border:`1px solid ${border}`, borderRadius:'var(--radius-md)',
    padding:'12px 24px', fontSize:'0.87rem', fontFamily:'var(--font-body)',
    color:'var(--text-dark)', zIndex:'9999', boxShadow:'var(--shadow-md)',
    whiteSpace:'nowrap'
  });
  document.body.appendChild(t);
  setTimeout(() => t?.remove(), 3500);
}

async function logout() {
  await sb.auth.signOut();
  window.location.href = '/pages/auth.html';
}
