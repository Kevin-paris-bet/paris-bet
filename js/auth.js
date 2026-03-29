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
  // Afficher le champ pseudo uniquement pour les tipsters
  const pseudoField = document.getElementById('pseudo-field');
  if (pseudoField) pseudoField.style.display = role === 'tipster' ? 'block' : 'none';
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

// ── Validation pseudo ─────────────────────────────────────────
let pseudoTimer = null;
async function validatePseudo() {
  const input  = document.getElementById('reg-pseudo');
  const err    = document.getElementById('reg-pseudo-err');
  const check  = document.getElementById('pseudo-check');
  const val    = input.value.trim().toLowerCase();
  const valid  = /^[a-z0-9-]{3,20}$/.test(val);

  input.classList.toggle('error', val.length > 0 && !valid);
  input.classList.toggle('valid', false);
  if (err) err.classList.toggle('show', val.length > 0 && !valid);
  if (check) check.textContent = '';
  if (!valid) return false;

  // Vérification unicité en base avec debounce
  clearTimeout(pseudoTimer);
  if (check) check.innerHTML = '<span style="color:var(--text-muted)">⏳ Vérification...</span>';
  pseudoTimer = setTimeout(async () => {
    try {
      const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
      const r = await fetch(`https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/profiles?select=id&pseudo=eq.${val}&apikey=${ANON}`);
      const data = await r.json();
      if (Array.isArray(data) && data.length > 0) {
        input.classList.add('error');
        input.classList.remove('valid');
        if (check) check.innerHTML = '<span style="color:var(--error)">✕ Ce pseudo est déjà pris</span>';
      } else {
        input.classList.remove('error');
        input.classList.add('valid');
        if (check) check.innerHTML = '<span style="color:var(--success)">✓ Ce pseudo est disponible</span>';
      }
    } catch(e) {}
  }, 500);
  return true;
}
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
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });
    if (error) throw new Error(error.message);

    // Récupérer le profil pour rediriger selon le rôle
    const { data: profile } = await sb
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    const role = profile?.role || 'user';
    if (role === 'admin')   window.location.href = '/pages/dashboard-admin.html';
    else if (role === 'tipster') window.location.href = '/pages/dashboard-tipster.html';
    else                    window.location.href = '/pages/dashboard-user.html';

  } catch (err) {
    const msg = err.message.includes('Invalid login')
      ? 'Email ou mot de passe incorrect.'
      : err.message;
    showToast(msg, 'error');
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
  const isTipster = authState.selectedRole === 'tipster';
  const pseudo    = isTipster ? document.getElementById('reg-pseudo')?.value.trim().toLowerCase() : null;

  // Validations
  if (!firstName || !lastName) { showToast('Veuillez renseigner votre prénom et nom.', 'error'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Adresse email invalide.', 'error'); return; }
  if (pw.length < 8) { showToast('Le mot de passe doit faire au moins 8 caractères.', 'error'); return; }
  if (!terms) { showToast('Veuillez accepter les conditions d\'utilisation.', 'error'); return; }

  // Validation pseudo pour les tipsters
  if (isTipster) {
    if (!pseudo || !/^[a-z0-9-]{3,20}$/.test(pseudo)) {
      showToast('Veuillez choisir un pseudo valide (3-20 caractères, lettres/chiffres/tirets).', 'error'); return;
    }
    // Vérifier unicité une dernière fois
    const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
    const r = await fetch(`https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/profiles?select=id&pseudo=eq.${pseudo}&apikey=${ANON}`);
    const existing = await r.json();
    if (Array.isArray(existing) && existing.length > 0) {
      showToast('Ce pseudo est déjà pris, choisissez-en un autre.', 'error'); return;
    }
  }

  setLoading(btn, true);

  try {
    const { data, error } = await sb.auth.signUp({
      email,
      password: pw,
      options: {
        data: {
          first_name: firstName,
          last_name:  lastName,
          role:       authState.selectedRole,
          pseudo:     pseudo || null,
        }
      }
    });
    if (error) throw new Error(error.message);

    // Si tipster, mettre à jour le pseudo dans profiles
    if (isTipster && pseudo && data?.user?.id) {
      const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
      await fetch(`https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/profiles?id=eq.${data.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + ANON },
        body: JSON.stringify({ pseudo })
      });
    }

    // Succès — mettre à jour le lien vers le bon dashboard
    const dashboardUrl = authState.selectedRole === 'tipster'
      ? '/pages/dashboard-tipster.html'
      : '/pages/dashboard-user.html';
    const btnDashboard = document.getElementById('btn-goto-dashboard');
    if (btnDashboard) btnDashboard.href = dashboardUrl;

    document.getElementById('form-register').style.display = 'none';
    document.getElementById('register-success').classList.add('show');

  } catch (err) {
    showToast(err.message || 'Une erreur est survenue.', 'error');
  } finally {
    setLoading(btn, false);
  }
}

// ── Google Auth ───────────────────────────────────────────────
async function handleGoogleAuth() {
  await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/pages/dashboard-user.html' }
  });
}

// ── Stats dynamiques (colonne gauche) ─────────────────────────
async function injectAuthStats() {
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';
  const set = (id, val) => { const n = document.getElementById(id); if (n) n.textContent = val; };
  try {
    const r1 = await fetch(`${SUPA}/rest/v1/profiles?select=id&role=eq.tipster&apikey=${ANON}`);
    const tipsters = await r1.json();
    set('auth-stat-tipsters', Array.isArray(tipsters) ? tipsters.length + '+' : '0');

    const r2 = await fetch(`${SUPA}/rest/v1/profiles?select=id&role=eq.user&apikey=${ANON}`);
    const users = await r2.json();
    set('auth-stat-users', Array.isArray(users) ? users.length + '+' : '0');

    const r3 = await fetch(`${SUPA}/rest/v1/purchases?select=amount&status=eq.won&apikey=${ANON}`);
    const won = await r3.json();
    const total = Array.isArray(won) ? won.reduce((s, p) => s + parseFloat(p.amount || 0), 0) * 0.9 : 0;
    set('auth-stat-paid', total > 0 ? Math.round(total).toLocaleString('fr-FR') + '€+' : '0€');
  } catch(e) {
    set('auth-stat-tipsters', '—');
    set('auth-stat-users', '—');
    set('auth-stat-paid', '—');
  }
}

document.addEventListener('DOMContentLoaded', () => { injectAuthStats(); });

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
