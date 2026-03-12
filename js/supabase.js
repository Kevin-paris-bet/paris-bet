/**
 * ============================================================
 *  PARIS-BET — CONNEXION SUPABASE
 *  Ce fichier doit être chargé EN PREMIER sur toutes les pages
 * ============================================================
 */

const SUPABASE_URL  = 'https://haezbgglpghjrgdpmcrj.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXpiZ2dscGdoanJnZHBtY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU1MjksImV4cCI6MjA4ODgwMTUyOX0.p98EHvfT6M9vD69dFH5cpESshBoH6qWeSly4fMhGtqI';

// Initialisation du client Supabase (chargé via CDN dans chaque page HTML)
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Récupère l'utilisateur connecté + son profil complet
 * Retourne null si personne n'est connecté
 */
async function getCurrentUser() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data: profile } = await sb
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { ...user, profile };
}

/**
 * Redirige vers la page de connexion si non connecté
 * À appeler en haut de chaque page protégée
 */
async function requireAuth(allowedRoles = []) {
  const user = await getCurrentUser();

  if (!user) {
    window.location.href = '/pages/auth.html';
    return null;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.profile?.role)) {
    window.location.href = '/pages/auth.html';
    return null;
  }

  return user;
}

/**
 * Déconnexion
 */
async function logout() {
  await sb.auth.signOut();
  window.location.href = '/pages/auth.html';
}
