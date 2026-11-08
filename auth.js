// auth.js - MarUnity - Maneja la sesión de verdad

const SUPABASE_URL = 'https://kaqytprpjqpptrjeerrt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JwTyhcOihTtDmL6VtuK2SQ_b_WHriql';

// Crear una única instancia de Supabase con detección automática de URL y sesión
const supabaseAuth = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true // 👈 IMPERATIVO: Atrapa el token al volver de Google
    }
  }
);

// Hacer accesible el cliente desde script.js
window.supabaseAuth = supabaseAuth;

// 🛡️ Función para ofuscar el correo electrónico con asteriscos (grabación profesional)
function ofuscarCorreo(correo) {
  if (!correo || !correo.includes('@')) return correo;
  const partes = correo.split('@');
  const usuario = partes[0];
  const dominio = partes[1];
  
  if (usuario.length <= 2) {
    return usuario[0] + '***@' + dominio;
  }
  
  const visibleInicio = usuario.substring(0, 1);
  const visibleFin = usuario.substring(usuario.length - 1);
  const asteriscos = '*'.repeat(Math.min(usuario.length - 2, 5));
  
  return `${visibleInicio}${asteriscos}${visibleFin}@${dominio}`;
}
window.ofuscarCorreo = ofuscarCorreo;

async function actualizarSesionUI() {
  const nombreEl = document.getElementById('sidebar-user-name');
  const emailEl = document.getElementById('sidebar-user-email');
  const sesionEmailEl = document.getElementById('sesion-email-texto');
  const dotEl = document.getElementById('sesion-estado-dot');
  const btnAccion = document.getElementById('btn-accion-sesion');
  const tituloEl = document.getElementById('sesion-titulo');
  const subtituloEl = document.getElementById('sesion-subtitulo');

  try {
    const { data: { session } } = await supabaseAuth.auth.getSession();

    if (session && session.user) {
      const emailReal = session.user.email || 'Usuario';
      const emailOculto = ofuscarCorreo(emailReal); // 👈 Protege tu correo en pantalla
      const nombre = emailReal.split('@')[0];

      if (nombreEl) nombreEl.textContent = nombre;
      if (emailEl) emailEl.textContent = emailOculto;       
      if (sesionEmailEl) sesionEmailEl.textContent = emailOculto; 
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
  } catch (err) {
    console.error("Error al actualizar la UI de sesión:", err);
  }
}

// ============================================================
// EXPORTACIÓN DE FUNCIONES DE SESIÓN PARA USO GLOBAL
// ============================================================
window.actualizarSesionUI = actualizarSesionUI;

// Manejador del botón de acción en el sheet de sesión
document.addEventListener('click', async (e) => {
  if (e.target && e.target.id === 'btn-accion-sesion') {
    try {
      const { data: { session } } = await supabaseAuth.auth.getSession();
      if (session) {
        await supabaseAuth.auth.signOut();
      }
      window.location.href = 'login.html';
    } catch (err) {
      window.location.href = 'login.html';
    }
  }

  if (e.target && e.target.id === 'sidebar-user-email') {
    window.location.href = 'login.html';
  }
});

// Escuchar cambios de sesión de forma global de manera limpia
supabaseAuth.auth.onAuthStateChange(() => {
  actualizarSesionUI();
});
