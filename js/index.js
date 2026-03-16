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

// ── Stats héro (temps réel depuis Supabase) ───────────────────
async function injectStats() {
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';

  const set = (id, val) => {
    const node = document.getElementById(id);
    if (node) node.textContent = val;
  };

  try {
    // Tipsters actifs
    const r1 = await fetch(`${SUPA}/rest/v1/profiles?select=id&role=eq.tipster&apikey=${ANON}`);
    const tipsters = await r1.json();
    set('stat-tipsters', Array.isArray(tipsters) ? tipsters.length + '+' : '0');

    // Utilisateurs
    const r2 = await fetch(`${SUPA}/rest/v1/profiles?select=id&role=eq.user&apikey=${ANON}`);
    const users = await r2.json();
    set('stat-users', Array.isArray(users) ? users.length + '+' : '0');

    // Total versé aux tipsters = 90% des achats sur pronos gagnés
    const r3 = await fetch(`${SUPA}/rest/v1/purchases?select=amount&status=eq.won&apikey=${ANON}`);
    const wonPurchases = await r3.json();
    const total = Array.isArray(wonPurchases)
      ? wonPurchases.reduce((s, p) => s + parseFloat(p.amount || 0), 0) * 0.9
      : 0;
    set('stat-paid', total > 0 ? Math.round(total).toLocaleString('fr-FR') + '€+' : '0€');

  } catch(e) {
    // Fallback sur les stats CONFIG si erreur réseau
    set('stat-tipsters', CONFIG.stats.tipsters);
    set('stat-users',    CONFIG.stats.users);
    set('stat-paid',     CONFIG.stats.paidOut);
  }
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

// ── Toggle note simulateur ────────────────────────────────────
function toggleSimNote() {
  const note = document.getElementById('sim-note');
  const icon = document.getElementById('sim-note-icon');
  const visible = note.style.display !== 'none';
  note.style.display = visible ? 'none' : 'block';
  icon.textContent = visible ? '▶' : '▼';
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
