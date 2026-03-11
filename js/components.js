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
