/**
 * ============================================================
 *  PARIS-BET — COMPOSANTS RÉUTILISABLES (navbar + footer)
 *  Ces fonctions injectent la navbar et le footer dans
 *  chaque page automatiquement. Modifier ici = modifier
 *  sur toutes les pages d'un coup.
 * ============================================================
 */

// ── Injecter la Navbar ────────────────────────────────────────
async function renderNavbar({ transparent = false, activePage = '' } = {}) {
  const el = document.getElementById('navbar');
  if (!el) return;

  // Vérifier si l'utilisateur est connecté
  let isLoggedIn = false;
  let userDashboard = CONFIG.pages.auth + '#login';
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      isLoggedIn = true;
      // Récupérer le rôle pour rediriger vers le bon dashboard
      const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';
      const rProf = await fetch('https://haezbgglpghjrgdpmcrj.supabase.co/rest/v1/profiles?select=role&id=eq.' + user.id + '&apikey=' + ANON, { headers: { 'apikey': ANON } });
      const prof = await rProf.json();
      if (Array.isArray(prof) && prof.length > 0) {
        const role = prof[0].role;
        if (role === 'admin') userDashboard = CONFIG.pages.admin;
        else if (role === 'tipster') userDashboard = CONFIG.pages.tipster;
        else userDashboard = CONFIG.pages.user;
      }
    }
  } catch(e) {}

  el.innerHTML = `
    <nav class="navbar ${transparent ? 'navbar--transparent' : ''}">
      <div class="container navbar__inner">

        <a href="/" class="navbar__logo">
          Pay<span>PerWin</span>
        </a>

        <ul class="navbar__links">
          ${CONFIG.navLinks.map(l => `
            <li><a href="${l.href}" class="navbar__link">${l.label}</a></li>
          `).join('')}
        </ul>

        <div class="navbar__actions">
          <button id="navbar-theme-btn" onclick="toggleTheme()" style="background:none;border:1.5px solid var(--border);border-radius:var(--radius-md);padding:8px 12px;cursor:pointer;font-size:1rem;color:var(--text-muted);transition:all var(--transition)" title="Changer de thème">🌙</button>
          ${isLoggedIn
            ? `<a href="/${userDashboard}" class="btn btn-primary btn--sm">Mon espace →</a>`
            : `<a href="/pages/auth.html#login"    class="btn btn-outline btn--sm">Connexion</a>
               <a href="/pages/auth.html#register" class="btn btn-primary btn--sm">Démarrer</a>`
          }
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
          <button id="navbar-theme-btn" onclick="toggleTheme()" style="background:none;border:1.5px solid var(--border);border-radius:var(--radius-md);padding:8px 12px;cursor:pointer;font-size:1rem;color:var(--text-muted);transition:all var(--transition)" title="Changer de thème">🌙</button>
          ${isLoggedIn
            ? `<a href="/${userDashboard}" class="btn btn-primary">Mon espace →</a>`
            : `<a href="/pages/auth.html#login"    class="btn btn-outline">Connexion</a>
               <a href="/pages/auth.html#register" class="btn btn-primary">Démarrer gratuitement</a>`
          }
        </div>
      </div>
    </nav>
  `;

  // Scroll effect — pas de transparent au chargement
  const nav = el.querySelector('.navbar');
  if (transparent) {
    nav.classList.toggle('navbar--scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', () => {
    nav.classList.toggle('navbar--scrolled', window.scrollY > 40);
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
            <a href="${CONFIG.pages.home}" class="navbar__logo">Pay<span>PerWin</span></a>
            <p>PayPerWin est la plateforme incontournable pour les pronostiqueurs souhaitant monétiser leur audience avec des méthodes innovantes et honnêtes.</p>
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
              <li><a href="${CONFIG.pages.cgu || '/pages/cgu.html'}">Conditions d'utilisation</a></li>
              <li><a href="${CONFIG.pages.confidentialite || '/pages/confidentialite.html'}">Politique de confidentialité</a></li>
              <li><a href="${CONFIG.pages.mentionsLegales || '/pages/mentions-legales.html'}">Mentions légales</a></li>
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
