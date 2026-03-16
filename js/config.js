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
    name:        "PayPerWin",
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
      a: "Vous achetez un pronostic avec votre solde. La somme est mise « en attente ». Si le pari est gagné, le tipster est crédité. Si le pari est perdu ou annulé, vous êtes intégralement remboursé sur votre solde."
    },
    {
      q: "Comment recharger mon solde ?",
      a: "Depuis votre tableau de bord, cliquez sur « Recharger ». Paiement sécurisé. Le solde est disponible immédiatement."
    },
    {
      q: "Comment devenir tipster ?",
      a: "Inscrivez-vous, choisissez le rôle « Tipster ». Une fois votre compte créé, vous pouvez personnaliser votre page et ajouter vos premiers pronostics. Vous pouvez ensuite partager le lien de votre page avec votre audience pour commencer à vendre vos pronostics."
    },
    {
      q: "Quand les tipsters sont-ils payés ?",
      a: "Les virements sont effectués chaque lundi, à condition que le solde du tipster dépasse 30€. Les fonds proviennent uniquement des paris validés comme gagnants."
    },
    {
      q: "Qui valide les résultats des paris ?",
      a: "L'équipe PayPerWin valide manuellement chaque résultat (gagné, perdu ou annulé). Cela garantit la fiabilité et protège les utilisateurs contre toute fraude."
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
