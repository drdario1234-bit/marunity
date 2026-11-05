
// auth.js - MarUnity - Maneja la sesión de verdad

const SUPABASE_URL = 'https://kaqytprpjqpptrjeerrt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JwTyhcOihTtDmL6VtuK2SQ_b_WHriql';

// Crear una única instancia de Supabase
const supabaseAuth = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// Hacer accesible el cliente desde script.js
window.supabaseAuth = supabaseAuth;

async function actualizarSesionUI() {
  const nombreEl = document.getElementById('sidebar-user-name');
  const emailEl = document.getElementById('sidebar-user-email');
  const sesionEmailEl = document.getElementById('sesion-email-texto');
  const dotEl = document.getElementById('sesion-estado-dot');
  const btnAccion = document.getElementById('btn-accion-sesion');
  const tituloEl = document.getElementById('sesion-titulo');
  const subtituloEl = document.getElementById('sesion-subtitulo');

  const { data: { session } } = await supabaseAuth.auth.getSession();

  if (session && session.user) {
    const email = session.user.email || 'Usuario';
    const nombre = email.split('@')[0];

    if (nombreEl) nombreEl.textContent = nombre;
    if (emailEl) emailEl.textContent = email;
    if (sesionEmailEl) sesionEmailEl.textContent = email;
    if (dotEl) dotEl.classList.add('on');
    if (tituloEl) tituloEl.textContent = 'Ajuste de sesión';
    if (subtituloEl) subtituloEl.textContent = 'Sesión iniciada';
    if (btnAccion) btnAccion.textContent = 'Cerrar sesión';

  } else {
    if (nombreEl) nombreEl.textContent = 'Invitado';
    if (emailEl) emailEl.textContent = 'Iniciar sesión';
    if (sesionEmailEl) sesionEmailEl.textContent = 'No iniciaste sesión';
    if (dotEl) dotEl.classList.remove('on');
    if (tituloEl) tituloEl.textContent = 'Ajuste de sesión';
    if (subtituloEl) subtituloEl.textContent = 'Gestioná tu cuenta';
    if (btnAccion) btnAccion.textContent = 'Ir a iniciar sesión';
  }
}

document.addEventListener('DOMContentLoaded', () => {

  actualizarSesionUI();

  const btnAccion = document.getElementById('btn-accion-sesion');

  if (btnAccion) {
    btnAccion.addEventListener('click', async () => {
      const { data: { session } } = await supabaseAuth.auth.getSession();

      if (session) {
        await supabaseAuth.auth.signOut();
        window.location.href = 'login.html';
      } else {
        window.location.href = 'login.html';
      }
    });
  }

  const emailEl = document.getElementById('sidebar-user-email');

  if (emailEl) {
    emailEl.addEventListener('click', () => {
      window.location.href = 'login.html';
    });
  }

  supabaseAuth.auth.onAuthStateChange(() => {
    actualizarSesionUI();
  });

});
