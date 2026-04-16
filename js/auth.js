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
  loadAuthStats();

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
  // Afficher/masquer les champs selon le rôle
  const nameFields    = document.getElementById('name-fields');
  const pseudoField   = document.getElementById('pseudo-field');
  const referralField = document.getElementById('referral-field');
  if (nameFields)    nameFields.style.display    = role === 'tipster' ? 'none' : '';
  if (pseudoField)   pseudoField.style.display   = role === 'tipster' ? '' : 'none';
  if (referralField) referralField.style.display = role === 'tipster' ? 'none' : '';
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
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });
    if (error) throw new Error(error.message);

    // Récupérer le profil pour rediriger selon le rôle
    const { data: profile } = await sb
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    const role = profile?.role || 'user';
    if (role === 'admin')          window.location.href = '/pages/dashboard-admin.html';
    else if (role === 'moderator') window.location.href = '/pages/dashboard-moderator.html';
    else if (role === 'tipster')   window.location.href = '/pages/dashboard-tipster.html';
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
  const isTipster = authState.selectedRole === 'tipster';
  const firstName = document.getElementById('reg-firstname').value.trim();
  const lastName  = document.getElementById('reg-lastname').value.trim();
  const pseudo    = document.getElementById('reg-pseudo')?.value.trim() || '';
  const email     = document.getElementById('reg-email').value.trim();
  const pw        = document.getElementById('reg-pw').value;
  const terms     = document.getElementById('reg-terms').checked;
  const referralCode = document.getElementById('reg-referral')?.value.trim().toUpperCase() || '';
  const btn       = document.getElementById('btn-register');

  // Validations
  if (!isTipster && (!firstName || !lastName)) { showToast('Veuillez renseigner votre prénom et nom.', 'error'); return; }
  if (isTipster && !pseudo) { showToast('Veuillez renseigner votre pseudo.', 'error'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Adresse email invalide.', 'error'); return; }
  if (pw.length < 8) { showToast('Le mot de passe doit faire au moins 8 caractères.', 'error'); return; }
  if (!terms) { showToast('Veuillez accepter les conditions d\'utilisation.', 'error'); return; }

  setLoading(btn, true);

  try {
    const { data, error } = await sb.auth.signUp({
      email,
      password: pw,
      options: {
        data: {
          first_name: isTipster ? pseudo : firstName,
          last_name:  isTipster ? '' : lastName,
          pseudo:     isTipster ? pseudo : null,
          role:       authState.selectedRole,
        }
      }
    });
    if (error) throw new Error(error.message);

    // Générer le referral_code et sauvegarder referred_by
    const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
    const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';
    if (data?.user?.id) {
      try {
        const updates = {};
        // Code parrain utilisé
        if (referralCode) updates.referred_by = referralCode;
        // Générer referral_code : pseudo pour tipster, PPW+numéro pour user
        if (isTipster) {
          updates.referral_code = pseudo.toUpperCase();
        } else {
          // Compter les users existants pour attribuer le bon numéro
          const rCount = await fetch(`${SUPA}/rest/v1/profiles?select=id&role=eq.user&apikey=${ANON}`, {
            headers: { apikey: ANON, Authorization: 'Bearer ' + ANON }
          });
          const existingUsers = await rCount.json();
          const userNumber = Array.isArray(existingUsers) ? existingUsers.length : 1;
          updates.referral_code = 'PPW' + userNumber;
        }
        if (Object.keys(updates).length > 0) {
          await fetch(`${SUPA}/rest/v1/profiles?id=eq.${data.user.id}&apikey=${ANON}`, {
            method: 'PATCH',
            headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
            body: JSON.stringify(updates)
          });
        }
      } catch(e) { console.error('Referral setup error:', e); }
    }

    // Meta Pixel — événement inscription
    if (typeof fbq === 'function') {
      if (isTipster) fbq('trackCustom', 'InscriptionTipster');
      else fbq('trackCustom', 'InscriptionUser');
    }

    // Ajout contact dans Brevo (liste tipsters=4, users=3)
    fetch('/api/sync-brevo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        prenom: isTipster ? pseudo : firstName,
        listId: isTipster ? 4 : 3
      })
    }).catch(() => {});

    // Connecter automatiquement après inscription
    const { error: loginError } = await sb.auth.signInWithPassword({ email, password: pw });

    if (loginError) {
      // Si confirmation email requise, afficher le message de succès avec bon lien
      const dashboard = isTipster ? '/pages/dashboard-tipster.html' : '/pages/dashboard-user.html';
      document.getElementById('btn-goto-dashboard').href = dashboard;
      document.getElementById('form-register').style.display = 'none';
      document.getElementById('register-success').classList.add('show');
    } else {
      // Connexion réussie → redirection directe
      const dashboard = isTipster ? '/pages/dashboard-tipster.html' : '/pages/dashboard-user.html';
      window.location.href = dashboard;
    }

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

// ── Stats page auth ───────────────────────────────────────────
async function loadAuthStats() {
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
  const SUPA = 'https://haezbgglpghjrgdpmcrj.supabase.co';
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  try {
    const [r1, r2, r3] = await Promise.all([
      fetch(`${SUPA}/rest/v1/profiles?select=id&role=eq.tipster&apikey=${ANON}`),
      fetch(`${SUPA}/rest/v1/profiles?select=id&role=eq.user&apikey=${ANON}`),
      fetch(`${SUPA}/rest/v1/profiles?select=total_deposits&role=eq.user&apikey=${ANON}`),
    ]);
    const tipsters = await r1.json();
    const users    = await r2.json();
    const deposits = await r3.json();
    const total    = Array.isArray(deposits)
      ? deposits.reduce((s, p) => s + parseFloat(p.total_deposits || 0), 0)
      : 0;
    set('auth-stat-tipsters', Array.isArray(tipsters) ? tipsters.length + '+' : '0');
    set('auth-stat-users',    Array.isArray(users)    ? users.length    + '+' : '0');
    set('auth-stat-paid',     total > 0 ? Math.round(total).toLocaleString('fr-FR') + '€+' : '0€');
  } catch(e) {
    set('auth-stat-tipsters', '—');
    set('auth-stat-users',    '—');
    set('auth-stat-paid',     '—');
  }
}
