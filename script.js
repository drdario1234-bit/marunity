document.addEventListener('DOMContentLoaded', () => {
  console.log('TexYiu LIVE Tex - V10 RED BLACK (Session & Startup Fixed)');

  const SERVER_URL = 'https://bot-tiktok-tslw.onrender.com';

  let socket = null;
  let listaMensajes = [];

  let ttsQueue = [];
  let isSpeaking = false;
  let elevenLabsQueue = [];
  let isPlayingElevenLabs = false;
  let currentElevenLabsAudio = null;
  let sonidoEpicoQueue = [];
  let isPlayingEpico = false;

  let perfilPendiente = null;
  let verificacionEnCurso = false;
  let conexionEnCurso = false;
  let startupEnCurso = false;
  let ultimoIntentoPerfil = 0;

  const COOLDOWN_PERFIL_FRONTEND = 5000;
  const TIMEOUT_SERVIDOR = 15000;

  let totalLikesAcumulados = 0;
  let likesHoyAcumulados = 0;
  let totalRegalosAcumulados = 0;
  let renderTimerInterval = null;

  const sidebar = document.getElementById('sidebar');
  const sidebarFondo = document.getElementById('sidebar-fondo');
  const btnMenu = document.getElementById('btn-menu');
  const btnClose = document.getElementById('btn-close-menu');
  const overlayPanel = document.getElementById('overlay-panel');
  const overlayFondo = document.getElementById('overlay-fondo');
  const btnMic = document.getElementById('btn-mic-float');

  const inputUser = document.getElementById('input-tiktok-user');
  const btnConectar = document.getElementById('btn-conectar');
  const estadoConexion = document.getElementById('estado-conexion');
  const liveBadge = document.querySelector('.live-badge');

  const btnConfigTex = document.getElementById('btn-config-tex');
  const btnOverlayLive = document.getElementById('btn-overlay-live');

  const inputVel = document.getElementById('range-velocidad-voz');
  const inputVol = document.getElementById('range-volumen');
  const inputTono = document.getElementById('range-tono-voz');

  const labelVel = document.getElementById('label-velocidad');
  const labelTono = document.getElementById('label-tono');
  const labelVol = document.getElementById('label-volumen');

  const inputBloq = document.getElementById('palabras-bloqueadas');
  const inputVoz = document.getElementById('select-voz');
  const inputMotorVoz = document.getElementById('select-motor-voz');

  const switchVoz = document.getElementById('switch-voz');
  const switchOverlay = document.getElementById('switch-overlay');
  const switchPriorizarPro = document.getElementById('switch-priorizar-pro');

  const onboardingScreen = document.getElementById('onboarding-screen');
  const inputOnboarding = document.getElementById('input-tiktok-onboarding');
  const btnVerificarTikTok = document.getElementById('btn-verificar-tiktok');
  const onboardingStatus = document.getElementById('onboarding-status');

  const modalConfirmarTikTok = document.getElementById('modal-confirmar-tiktok');
  const modalTikTokBackdrop = document.getElementById('modal-tiktok-backdrop');
  const btnCerrarConfirmacion = document.getElementById('btn-cerrar-confirmacion');
  const btnVolverTikTok = document.getElementById('btn-volver-tiktok');
  const btnConfirmarTikTok = document.getElementById('btn-confirmar-tiktok');

  const profileAvatar = document.getElementById('profile-avatar');
  const profileNickname = document.getElementById('profile-nickname');
  const profileUsername = document.getElementById('profile-username');
  const profileLiveStatus = document.getElementById('profile-live-status');
  const confirmError = document.getElementById('confirm-error');

  const tituloPanel = document.getElementById('titulo-panel');
  const subtituloPanel = document.getElementById('subtitulo-panel');

  const perfilLiveAvatar = document.getElementById('perfil-live-avatar');
  const perfilLiveNickname = document.getElementById('perfil-live-nickname');
  const perfilLiveUsername = document.getElementById('perfil-live-username');

  const perfilLiveCountComentarios = document.getElementById('perfil-live-count-comentarios');
  const perfilLiveCountLikes = document.getElementById('perfil-live-count-likes');
  const statLikesHoy = document.getElementById('stat-likes-hoy');
  const perfilLiveCountRegalo = document.getElementById('perfil-live-count-regalo');

  const btnAgregarBloqueada = document.getElementById('btn-agregar-bloqueada');
  const btnVerBloqueadas = document.getElementById('btn-ver-bloqueadas');
  const btnConfigVerBloqueadas = document.getElementById('btn-config-ver-bloqueadas');

  const listaChipsTex = document.getElementById('lista-chips-bloqueadas');
  const listaChipsConfig = document.getElementById('config-lista-bloqueadas');
  const countConfig = document.getElementById('config-bloqueadas-count');

  const startupEl = document.getElementById('marunity-startup');
  const startupBar = document.getElementById('startup-progress-bar');
  const startupText = document.getElementById('startup-progress-text');
  const startupTitle = document.getElementById('startup-title');
  const startupDesc = document.getElementById('startup-description');

  // =========================================================
  // UTILIDADES DE SESIÓN Y RED
  // =========================================================

  function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function fetchConTimeout(url, opciones = {}, tiempo = TIMEOUT_SERVIDOR) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), tiempo);

    try {
      return await fetch(url, {
        ...opciones,
        signal: controller.signal
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('El servidor tardó demasiado en responder. Intentá nuevamente.');
      }

      if (error instanceof TypeError || String(error.message).includes('fetch')) {
        throw new Error('No se pudo conectar con el servidor. Revisá tu conexión.');
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function obtenerSesionValida() {
    const clientAuth = window.supabaseAuth;

    if (!clientAuth) {
      throw new Error('El servicio de autenticación todavía no está disponible.');
    }

    const resultado = await clientAuth.auth.getSession();

    if (resultado?.error) {
      throw resultado.error;
    }

    const session = resultado?.data?.session;

    if (!session?.access_token) {
      return null;
    }

    return session;
  }

  // No borrar las preferencias del usuario al cerrar sesión.
  window.cerrarSesionCompleta = async function () {
    try {
      if (socket) {
        socket.disconnect();
        socket = null;
      }

      detenerTodaVoz();

      const clientAuth = window.supabaseAuth;

      if (clientAuth) {
        const resultado = await clientAuth.auth.signOut();

        if (resultado?.error) {
          console.warn('[LOGOUT] Error cerrando sesión:', resultado.error);
        }
      }
    } catch (error) {
      console.warn('[LOGOUT]', error);
    } finally {
      sessionStorage.removeItem('marunity_tiktok_pendiente');
      window.location.replace('login.html');
    }
  };

  function verificarBloqueo30Dias() {
    const fechaBloqueo = localStorage.getItem('texyiu_bloqueo_hasta');

    if (!fechaBloqueo) return false;

    const hasta = new Date(fechaBloqueo);

    if (Number.isNaN(hasta.getTime())) {
      localStorage.removeItem('texyiu_bloqueo_hasta');
      localStorage.removeItem('texyiu_bloqueo_user');
      return false;
    }

    const ahora = new Date();

    if (ahora < hasta) {
      return Math.ceil((hasta - ahora) / (1000 * 60 * 60 * 24));
    }

    localStorage.removeItem('texyiu_bloqueo_hasta');
    localStorage.removeItem('texyiu_bloqueo_user');

    return false;
  }

  // =========================================================
  // CONTADOR DE CARGA DE RENDER
  // =========================================================

  function iniciarContadorRender(elementoDestino, textoBase = 'Despertando servidor en la nube') {
    let segundos = 0;

    detenerContadorRender();

    if (elementoDestino) {
      elementoDestino.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-top:12px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:18px;height:18px;border:2px solid rgba(168,85,247,0.3);border-top-color:#a855f7;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
            <span style="font-size:13px;color:#a1a1b5;">${escapeHtml(textoBase)}</span>
          </div>
          <span style="font-size:11px;color:#6b7280;background:#15151f;padding:4px 8px;border-radius:20px;border:1px solid #2a2a40;">
            ⏱️ <strong id="segundos-carga">0s</strong> - Aguardá un toque...
          </span>
        </div>
        <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
      `;
    }

    renderTimerInterval = setInterval(() => {
      segundos++;

      const spanSeg = document.getElementById('segundos-carga');

      if (spanSeg) {
        spanSeg.textContent = `${segundos}s`;
      }
    }, 1000);
  }

  function detenerContadorRender() {
    if (renderTimerInterval) {
      clearInterval(renderTimerInterval);
      renderTimerInterval = null;
    }
  }

  // =========================================================
  // SONIDOS
  // =========================================================

  const SONIDOS_URL = {
    rosa: 'https://kaqytprpjqpptrjeerrt.supabase.co/storage/v1/object/public/sonidos/upa%20gracias%20por%20ese%20regalazo.mp3',
    chicos: 'https://kaqytprpjqpptrjeerrt.supabase.co/storage/v1/object/public/sonidos/upa%20gracias%20por%20ese%20regalazo.mp3',
    mano: 'https://kaqytprpjqpptrjeerrt.supabase.co/storage/v1/object/public/sonidos/upa%20gracias%20por%20ese%20regalazo.mp3',
    pistola: 'https://kaqytprpjqpptrjeerrt.supabase.co/storage/v1/object/public/sonidos/upa%20gracias%20por%20ese%20regalazo.mp3',
    galaxia: 'https://kaqytprpjqpptrjeerrt.supabase.co/storage/v1/object/public/sonidos/upa%20gracias%20por%20ese%20regalazo.mp3',
    ballena: 'https://kaqytprpjqpptrjeerrt.supabase.co/storage/v1/object/public/sonidos/upa%20gracias%20por%20ese%20regalazo.mp3',
    comentario: 'https://cdn.jsdelivr.net/gh/joshwcomeau/words@master/sounds/pop.mp3'
  };

  const audiosCache = {};

  for (const k in SONIDOS_URL) {
    try {
      const audio = new Audio(SONIDOS_URL[k]);
      audio.preload = 'auto';
      audiosCache[k] = audio;
    } catch (error) {
      console.warn('No se pudo preparar el sonido:', k, error);
    }
  }

  const btnReproducirBienvenida = document.getElementById('btn-reproducir-bienvenida');
  const audioBienvenida = document.getElementById('audio-bienvenida');

  if (btnReproducirBienvenida && audioBienvenida) {
    btnReproducirBienvenida.addEventListener('click', () => {
      audioBienvenida.volume = getVolumenReal();

      if (audioBienvenida.paused) {
        audioBienvenida.currentTime = 0;

        audioBienvenida.play()
          .then(() => {
            btnReproducirBienvenida.textContent = 'Pausar';
          })
          .catch(() => {
            toast('No se encontró bienvenida.mp3');
          });
      } else {
        audioBienvenida.pause();
        btnReproducirBienvenida.textContent = 'Escuchar';
      }
    });

    audioBienvenida.addEventListener('ended', () => {
      btnReproducirBienvenida.textContent = 'Escuchar';
    });
  }

  // =========================================================
  // FUNCIONES GENERALES DE INTERFAZ
  // =========================================================

  function getVolumenReal() {
    const valor = parseFloat(inputVol?.value);

    if (Number.isNaN(valor)) return 1;

    return Math.min(1, Math.max(0, valor));
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  function toast(msg, isError = true) {
    if (!estadoConexion) return;

    detenerContadorRender();

    estadoConexion.textContent = msg;
    estadoConexion.style.color = isError ? '#ff7a7a' : '#4ade80';
  }

  function setOnboardingStatus(msg, isError = false) {
    if (!onboardingStatus) return;

    detenerContadorRender();

    onboardingStatus.textContent = msg || '';
    onboardingStatus.style.color = isError ? '#ff7a7a' : '#a1a1b5';
  }

  function setLiveBadge(conectado, texto) {
    if (!liveBadge) return;

    liveBadge.innerHTML = `<span></span> ${escapeHtml(texto)}`;

    if (conectado) {
      liveBadge.style.background = 'rgba(239,68,68,.15)';
      liveBadge.style.color = '#ff7a7a';
      liveBadge.style.border = '1px solid rgba(239,68,68,.25)';
    } else {
      liveBadge.style.background = '#15151f';
      liveBadge.style.color = '#6b7280';
      liveBadge.style.border = '1px solid #2a2a40';
    }

    const dot = liveBadge.querySelector('span');

    if (dot) {
      dot.style.background = conectado ? '#ef4444' : '#4b5563';
      dot.style.boxShadow = conectado ? '0 0 8px #ef4444' : 'none';
    }
  }

  setLiveBadge(false, 'Desconectado');

  function normalizarUsuarioTikTok(valor) {
    let usuario = String(valor || '').trim();

    usuario = usuario
      .replace(/https?:\/\//gi, '')
      .replace(/www\./gi, '')
      .replace(/tiktok\.com\//gi, '')
      .replace(/@/g, '');

    usuario = usuario
      .split('/')[0]
      .split('?')[0]
      .split('#')[0]
      .split(' ')[0]
      .trim()
      .toLowerCase();

    return usuario;
  }

  function mostrarOnboarding() {
    if (!onboardingScreen) return;

    onboardingScreen.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    setTimeout(() => inputOnboarding?.focus(), 100);
  }

  function ocultarOnboarding() {
    if (!onboardingScreen) return;

    onboardingScreen.classList.add('hidden');
    document.body.style.overflow = '';
  }

  // =========================================================
  // VERIFICACIÓN DEL PERFIL TIKTOK
  // =========================================================

  async function verificarPerfilTikTok(usuario) {
    if (!navigator.onLine) {
      throw new Error('Sin conexión a internet. Revisá tu WiFi o datos.');
    }

    const ahora = Date.now();
    const diferencia = ahora - ultimoIntentoPerfil;

    if (ultimoIntentoPerfil && diferencia < COOLDOWN_PERFIL_FRONTEND) {
      const segundos = Math.ceil((COOLDOWN_PERFIL_FRONTEND - diferencia) / 1000);
      throw new Error(`Esperá ${segundos}s antes de volver a verificar.`);
    }

    ultimoIntentoPerfil = ahora;

    const url = `${SERVER_URL}/api/verificar-perfil?username=${encodeURIComponent(usuario)}`;

    const respuesta = await fetchConTimeout(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    let resultado;

    try {
      resultado = await respuesta.json();
    } catch (error) {
      throw new Error('El servidor respondió con formato inválido.');
    }

    if (!respuesta.ok) {
      throw new Error(
        resultado?.error ||
        resultado?.message ||
        `Error del servidor (${respuesta.status})`
      );
    }

    if (!resultado || !resultado.success) {
      throw new Error(
        resultado?.error ||
        resultado?.message ||
        'No se pudo verificar el perfil.'
      );
    }

    const perfil =
      resultado.profile ||
      resultado.perfil ||
      resultado.user ||
      resultado.data ||
      resultado;

    const usernameReal = normalizarUsuarioTikTok(
      perfil.username ||
      perfil.uniqueId ||
      perfil.unique_id ||
      usuario
    );

    const nickname =
      perfil.nickname ||
      perfil.displayName ||
      perfil.display_name ||
      perfil.name ||
      `@${usernameReal}`;

    const foto =
      perfil.profilePicture ||
      perfil.profilePictureUrl ||
      perfil.avatar ||
      perfil.avatarUrl ||
      perfil.avatar_url ||
      perfil.photo ||
      perfil.photoUrl ||
      'logo.png';

    let isLive = null;

    if (typeof perfil.isLive === 'boolean') isLive = perfil.isLive;
    else if (typeof perfil.enVivo === 'boolean') isLive = perfil.enVivo;
    else if (typeof perfil.live === 'boolean') isLive = perfil.live;
    else if (typeof perfil.is_live === 'boolean') isLive = perfil.is_live;

    return {
      username: usernameReal || usuario,
      nickname: String(nickname),
      profilePicture: foto,
      isLive: isLive
    };
  }

  function mostrarModalPerfil(perfil) {
    detenerContadorRender();

    if (!modalConfirmarTikTok) {
      throw new Error('No se encontró el modal de confirmación de TikTok.');
    }

    perfilPendiente = perfil;

    if (profileAvatar) {
      profileAvatar.src = perfil.profilePicture || 'logo.png';

      profileAvatar.onerror = () => {
        profileAvatar.onerror = null;
        profileAvatar.src = 'logo.png';
      };
    }

    if (profileNickname) {
      profileNickname.textContent = perfil.nickname || 'Usuario de TikTok';
    }

    if (profileUsername) {
      profileUsername.textContent = '@' + normalizarUsuarioTikTok(perfil.username);
    }

    if (profileLiveStatus) {
      profileLiveStatus.classList.remove('live', 'offline');

      if (perfil.isLive === true) {
        profileLiveStatus.textContent = 'EN VIVO AHORA';
        profileLiveStatus.classList.add('live');
      } else if (perfil.isLive === false) {
        profileLiveStatus.textContent = 'No está en vivo';
        profileLiveStatus.classList.add('offline');
      } else {
        profileLiveStatus.textContent = 'Estado LIVE no disponible';
        profileLiveStatus.classList.add('offline');
      }
    }

    ocultarErrorConfirmacion();

    modalConfirmarTikTok.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function cerrarModalPerfil() {
    if (!modalConfirmarTikTok) return;

    modalConfirmarTikTok.classList.add('hidden');

    document.body.style.overflow =
      onboardingScreen && !onboardingScreen.classList.contains('hidden')
        ? 'hidden'
        : '';
  }

  function mostrarErrorConfirmacion(msg) {
    detenerContadorRender();

    if (!confirmError) {
      toast(msg, true);
      return;
    }

    confirmError.textContent = msg || 'Ocurrió un error.';
    confirmError.classList.add('visible');
  }

  function ocultarErrorConfirmacion() {
    if (!confirmError) return;

    confirmError.textContent = '';
    confirmError.classList.remove('visible');
  }

  async function iniciarVerificacionTikTok(valorUsuario, origen = 'onboarding') {
    if (verificacionEnCurso) return;

    const usuario = normalizarUsuarioTikTok(valorUsuario);

    if (!usuario || usuario.length < 2) {
      const mensaje = 'Ingresá un usuario válido. Ej: tuusuario';

      if (origen === 'onboarding') {
        setOnboardingStatus(mensaje, true);
        inputOnboarding?.focus();
      } else {
        toast(mensaje, true);
        inputUser?.focus();
      }

      return;
    }

    verificacionEnCurso = true;

    if (origen === 'onboarding') {
      if (btnVerificarTikTok) {
        btnVerificarTikTok.disabled = true;
        btnVerificarTikTok.textContent = 'Verificando...';
      }

      iniciarContadorRender(onboardingStatus, `Buscando @${usuario}`);
    } else {
      if (btnConectar) {
        btnConectar.disabled = true;
        btnConectar.textContent = 'Verificando...';
      }

      iniciarContadorRender(estadoConexion, `Buscando @${usuario}`);
    }

    try {
      const perfil = await verificarPerfilTikTok(usuario);
      mostrarModalPerfil(perfil);
    } catch (error) {
      console.error('Error verificando perfil:', error);

      const mensaje = error?.message || 'No se pudo verificar el perfil.';

      if (origen === 'onboarding') {
        setOnboardingStatus(mensaje, true);
      } else {
        toast(mensaje, true);
      }
    } finally {
      verificacionEnCurso = false;

      if (origen === 'onboarding') {
        if (btnVerificarTikTok) {
          btnVerificarTikTok.disabled = false;
          btnVerificarTikTok.textContent = 'Continuar';
        }
      } else {
        if (btnConectar) {
          btnConectar.disabled = false;
          btnConectar.textContent = 'Verificar';
        }
      }
    }
  }

  if (btnVerificarTikTok) {
    btnVerificarTikTok.addEventListener('click', () => {
      iniciarVerificacionTikTok(inputOnboarding?.value || '', 'onboarding');
    });
  }

  if (inputOnboarding) {
    inputOnboarding.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();

        if (!verificacionEnCurso) {
          iniciarVerificacionTikTok(inputOnboarding.value, 'onboarding');
        }
      }
    });
  }

  if (btnCerrarConfirmacion) {
    btnCerrarConfirmacion.addEventListener('click', () => {
      if (conexionEnCurso) return;
      cerrarModalPerfil();
    });
  }

  if (btnVolverTikTok) {
    btnVolverTikTok.addEventListener('click', () => {
      if (conexionEnCurso) return;
      cerrarModalPerfil();
    });
  }

  if (modalTikTokBackdrop) {
    modalTikTokBackdrop.addEventListener('click', () => {
      if (conexionEnCurso) return;
      cerrarModalPerfil();
    });
  }

  // =========================================================
  // CONFIRMAR Y GUARDAR VÍNCULO
  // =========================================================

  if (btnConfirmarTikTok) {
    btnConfirmarTikTok.addEventListener('click', async () => {
      if (conexionEnCurso || !perfilPendiente) return;

      const usuario = normalizarUsuarioTikTok(perfilPendiente.username);

      if (!usuario) {
        mostrarErrorConfirmacion('No se pudo obtener el usuario de TikTok.');
        return;
      }

      conexionEnCurso = true;
      btnConfirmarTikTok.disabled = true;
      btnConfirmarTikTok.textContent = 'Verificando sesión...';

      try {
        const session = await obtenerSesionValida();

        if (!session?.access_token) {
          sessionStorage.setItem('marunity_tiktok_pendiente', usuario);

          // No se oculta el modal antes de redirigir.
          window.location.href = 'login.html';
          return;
        }

        const token = session.access_token;

        btnConfirmarTikTok.textContent = 'Guardando vínculo...';

        const respuesta = await fetchConTimeout(
          `${SERVER_URL}/api/guardar-vinculo`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              username: usuario,
              nickname: perfilPendiente.nickname,
              profilePicture: perfilPendiente.profilePicture
            })
          },
          12000
        );

        let resJson = null;

        try {
          resJson = await respuesta.json();
        } catch (error) {
          throw new Error('El servidor respondió con un formato inválido al guardar el vínculo.');
        }

        if (!respuesta.ok) {
          throw new Error(
            resJson?.error ||
            resJson?.message ||
            `No se pudo guardar el vínculo (${respuesta.status}).`
          );
        }

        if (resJson?.success === false) {
          throw new Error(
            resJson.error ||
            resJson.message ||
            'El servidor no confirmó el guardado del vínculo.'
          );
        }

        // La confirmación sigue visible hasta que conectarTikTok termine.
        btnConfirmarTikTok.textContent = 'Conectando TikTok...';

        await conectarTikTok(usuario, true);

        sessionStorage.removeItem('marunity_tiktok_pendiente');

      } catch (error) {
        console.error('[CONFIRMAR TIKTOK]', error);

        mostrarErrorConfirmacion(
          error?.message || 'No se pudo completar la conexión.'
        );

        // Si hubo un error, el usuario conserva el modal y puede reintentar.
      } finally {
        conexionEnCurso = false;

        if (btnConfirmarTikTok) {
          btnConfirmarTikTok.disabled = false;
          btnConfirmarTikTok.textContent = 'Confirmar';
        }
      }
    });
  }

  // =========================================================
  // ACTUALIZAR PERFIL EN EL PANEL
  // =========================================================

  function actualizarPerfilLiveConectado(datos) {
    if (!datos) return;

    if (perfilLiveAvatar && datos.profilePicture) {
      perfilLiveAvatar.src = datos.profilePicture;

      perfilLiveAvatar.onerror = () => {
        perfilLiveAvatar.onerror = null;
        perfilLiveAvatar.src = 'logo.png';
      };
    }

    if (perfilLiveNickname && datos.nickname) {
      perfilLiveNickname.textContent = datos.nickname;
    }

    if (perfilLiveUsername && datos.username) {
      perfilLiveUsername.textContent =
        '@' + normalizarUsuarioTikTok(datos.username);
    }
  }

  // =========================================================
  // CONECTAR TIKTOK
  // =========================================================

  async function conectarTikTok(usuario, vieneDeConfirmacion = false) {
    usuario = normalizarUsuarioTikTok(usuario);

    if (!usuario) {
      throw new Error('Usuario TikTok inválido.');
    }

    if (!vieneDeConfirmacion) {
      const dias = verificarBloqueo30Dias();
      const userBloqueado = localStorage.getItem('texyiu_bloqueo_user');

      if (dias && userBloqueado && userBloqueado !== usuario) {
        const mensaje =
          `🔒 Bloqueado por 30 días. Usás @${userBloqueado}. Te quedan ${dias} días`;

        toast(mensaje, true);

        if (btnConectar) {
          btnConectar.textContent = 'Verificar';
          btnConectar.disabled = false;
          btnConectar.style.background = '';
        }

        detenerContadorRender();
        setLiveBadge(false, `Bloqueado ${dias}d`);

        throw new Error(`Bloqueado ${dias} días`);
      }
    }

    listaMensajes = [];
    totalLikesAcumulados = 0;
    likesHoyAcumulados = 0;
    totalRegalosAcumulados = 0;

    actualizarBandejaComentarios();

    if (perfilLiveCountLikes) perfilLiveCountLikes.textContent = '0';
    if (statLikesHoy) statLikesHoy.textContent = '0';
    if (perfilLiveCountComentarios) perfilLiveCountComentarios.textContent = '0';
    if (perfilLiveCountRegalo) perfilLiveCountRegalo.textContent = '0';

    if (btnConectar) {
      btnConectar.disabled = true;
      btnConectar.textContent = 'Conectando...';
    }

    iniciarContadorRender(
      estadoConexion,
      `Iniciando conexión con @${usuario}`
    );

    setLiveBadge(false, 'Conectando...');

    try {
      const session = await obtenerSesionValida();

      if (!session?.access_token) {
        throw new Error('Tenés que iniciar sesión con Google para conectar TikTok.');
      }

      const respuesta = await fetchConTimeout(
        `${SERVER_URL}/api/conectar`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            username: usuario
          })
        },
        TIMEOUT_SERVIDOR
      );

      let resultado;

      try {
        resultado = await respuesta.json();
      } catch (error) {
        throw new Error('El servidor respondió con formato inválido.');
      }

      if (!respuesta.ok || !resultado || resultado.success !== true) {
        throw new Error(
          resultado?.error ||
          resultado?.message ||
          `No se pudo conectar (${respuesta.status}).`
        );
      }

      detenerContadorRender();

      localStorage.setItem('texyiu_tiktok_user', usuario);
      localStorage.setItem('texyiu_tiktok_user_confirmado', usuario);

      // No reiniciar el bloqueo si ya existe uno vigente.
      const diasBloqueo = verificarBloqueo30Dias();

      if (!diasBloqueo) {
        const hasta = new Date();
        hasta.setDate(hasta.getDate() + 30);

        localStorage.setItem('texyiu_bloqueo_hasta', hasta.toISOString());
        localStorage.setItem('texyiu_bloqueo_user', usuario);
      }

      if (inputUser) inputUser.value = usuario;
      if (inputOnboarding) inputOnboarding.value = usuario;

      if (perfilPendiente) {
        actualizarPerfilLiveConectado(perfilPendiente);
      } else {
        actualizarPerfilLiveConectado({
          username: usuario,
          nickname: usuario,
          profilePicture: 'logo.png'
        });
      }

      if (btnConectar) {
        btnConectar.textContent = `Conectado @${usuario}`;
        btnConectar.style.background = '#22c55e';
        btnConectar.disabled = false;
      }

      toast(`Conectado @${usuario}`, false);

      // La API aceptó la conexión. El estado LIVE real lo informa el socket.
      setLiveBadge(false, 'Esperando LIVE...');

      reproducirVoz(
        'Conectado correctamente. Estás usando la voz nativa del navegador, esperando comentarios.'
      );

      // Esperar la inicialización del socket para capturar errores de autenticación.
      await conectarWebSockets(usuario);

      // Recién ahora se cierra el modal y el onboarding.
      if (vieneDeConfirmacion) {
        cerrarModalPerfil();
        ocultarOnboarding();
      }

      navegarA('inicio');

      return resultado;

    } catch (error) {
      console.error('[CONECTAR TIKTOK]', error);

      detenerContadorRender();

      if (btnConectar) {
        btnConectar.textContent = 'Verificar';
        btnConectar.disabled = false;
        btnConectar.style.background = '';
      }

      const mensaje = error?.message || 'No se pudo conectar.';

      toast(mensaje, true);
      setLiveBadge(false, 'Desconectado');

      // No borrar el vínculo confirmado por un error temporal de conexión.
      throw error;
    }
  }

  if (btnConectar) {
    btnConectar.addEventListener('click', () => {
      iniciarVerificacionTikTok(inputUser?.value || '', 'panel');
    });
  }

  // =========================================================
  // TARJETAS DE VOCES
  // =========================================================

  const voiceCards = document.querySelectorAll('.voice-card:not(.locked)');

  voiceCards.forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('#free-voice-grid .voice-card')
        .forEach(c => c.classList.remove('active'));

      card.classList.add('active');

      const voiceKey = card.getAttribute('data-voice');

      if (inputVoz) {
        inputVoz.value = voiceKey;
        inputVoz.dispatchEvent(new Event('change'));
      }

      guardarAuto();
    });
  });

  // =========================================================
  // SONIDOS DE REGALOS
  // =========================================================

  window.probarSonido = function (tier) {
    encolarSonidoEpico(tier);
  };

  function encolarSonidoEpico(tier) {
    const check = document.getElementById(`sonido-${tier}`);

    if (check && !check.checked) return;
    if (!SONIDOS_URL[tier]) return;

    sonidoEpicoQueue.push(tier);
    procesarColaEpica();
  }

  function procesarColaEpica() {
    if (isPlayingEpico || sonidoEpicoQueue.length === 0) return;

    isPlayingEpico = true;

    const tier = sonidoEpicoQueue.shift();
    const volEpico = getVolumenReal() * 0.6;

    try {
      const audio = new Audio(SONIDOS_URL[tier]);

      audio.volume = volEpico;

      audio.onended = () => {
        isPlayingEpico = false;
        setTimeout(procesarColaEpica, 80);
      };

      audio.onerror = () => {
        isPlayingEpico = false;
        setTimeout(procesarColaEpica, 80);
      };

      audio.play().catch(() => {
        isPlayingEpico = false;
        setTimeout(procesarColaEpica, 80);
      });

    } catch (error) {
      isPlayingEpico = false;
      setTimeout(procesarColaEpica, 80);
    }
  }

  function onGift(diamondCount) {
    const d = parseInt(diamondCount) || 1;

    if (d === 1) encolarSonidoEpico('rosa');
    else if (d < 100) encolarSonidoEpico('chicos');
    else if (d < 500) encolarSonidoEpico('mano');
    else if (d < 1000) encolarSonidoEpico('pistola');
    else if (d < 2000) encolarSonidoEpico('galaxia');
    else encolarSonidoEpico('ballena');
  }

  function sonarComentario() {
    const check = document.getElementById('sonido-comentario');

    if (check && check.checked) {
      encolarSonidoEpico('comentario');
    }
  }

  // =========================================================
  // PALABRAS BLOQUEADAS
  // =========================================================

  function getBloqueadasList() {
    try {
      const lista = JSON.parse(localStorage.getItem('marunity_bloqueadas') || '[]');
      return Array.isArray(lista) ? lista : [];
    } catch (error) {
      return [];
    }
  }

  function renderBloqueadas() {
    const lista = getBloqueadasList();

    const html = lista.map((palabra, index) => `
      <span class="chip-bloqueada" style="background:#1e1b4b;border:1px solid rgba(168,85,247,0.4);color:#e2e8f0;padding:5px 10px;border-radius:20px;font-size:12px;display:inline-flex;gap:6px;align-items:center;">
        ${escapeHtml(palabra)}
        <b data-bloq="${index}" style="color:#f87171;cursor:pointer;">✕</b>
      </span>
    `).join('') || '<span style="font-size:11px;color:#64748b;">Sin palabras.</span>';

    if (listaChipsTex) listaChipsTex.innerHTML = html;
    if (listaChipsConfig) listaChipsConfig.innerHTML = html;

    if (btnVerBloqueadas) {
      btnVerBloqueadas.textContent = `Ver (${lista.length})`;
    }

    if (countConfig) {
      countConfig.textContent = lista.length;
    }
  }

  function agregarBloqueada() {
    const valor = (inputBloq?.value || '').trim().toLowerCase();

    if (!valor) return;

    const lista = getBloqueadasList();

    valor.split(',')
      .map(p => p.trim().toLowerCase())
      .filter(p => p.length >= 3 && !lista.includes(p))
      .forEach(p => lista.push(p));

    localStorage.setItem('marunity_bloqueadas', JSON.stringify(lista));

    if (inputBloq) inputBloq.value = '';

    renderBloqueadas();
  }

  btnAgregarBloqueada?.addEventListener('click', agregarBloqueada);

  inputBloq?.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      agregarBloqueada();
    }
  });

  btnVerBloqueadas?.addEventListener('click', () => {
    navegarA('config');

    setTimeout(() => {
      listaChipsConfig?.classList.remove('hidden');
    }, 250);
  });

  btnConfigVerBloqueadas?.addEventListener('click', () => {
    listaChipsConfig?.classList.toggle('hidden');
  });

  document.addEventListener('click', event => {
    const boton = event.target.closest('[data-bloq]');

    if (!boton) return;

    const lista = getBloqueadasList();
    const index = parseInt(boton.dataset.bloq);

    if (Number.isNaN(index) || index < 0 || index >= lista.length) return;

    lista.splice(index, 1);

    localStorage.setItem('marunity_bloqueadas', JSON.stringify(lista));

    renderBloqueadas();
  });

  renderBloqueadas();

  // =========================================================
  // CONFIGURACIÓN LOCAL
  // =========================================================

  function guardarAuto() {
    const cfg = {
      velocidad: inputVel?.value || '1',
      volumen: inputVol?.value || '1',
      tono: inputTono?.value || '1',
      voz: inputVoz?.value || '',
      motorVoz: inputMotorVoz?.value || 'nativo',

      vozOn: switchVoz?.checked ?? true,
      overlayOn: switchOverlay?.checked ?? true,
      priorizarPro: switchPriorizarPro?.checked ?? true,

      sonido_rosa: document.getElementById('sonido-rosa')?.checked ?? true,
      sonido_chicos: document.getElementById('sonido-chicos')?.checked ?? true,
      sonido_mano: document.getElementById('sonido-mano')?.checked ?? true,
      sonido_pistola: document.getElementById('sonido-pistola')?.checked ?? true,
      sonido_galaxia: document.getElementById('sonido-galaxia')?.checked ?? true,
      sonido_ballena: document.getElementById('sonido-ballena')?.checked ?? true,
      sonido_comentario: document.getElementById('sonido-comentario')?.checked ?? false
    };

    try {
      localStorage.setItem('texyiu_cfg', JSON.stringify(cfg));
    } catch (error) {
      console.warn('No se pudo guardar la configuración:', error);
    }
  }

  try {
    const cfg = JSON.parse(localStorage.getItem('texyiu_cfg') || '{}');

    const usuarioGuardado =
      localStorage.getItem('texyiu_tiktok_user_confirmado') ||
      localStorage.getItem('texyiu_tiktok_user');

    if (inputUser && usuarioGuardado) inputUser.value = usuarioGuardado;
    if (inputOnboarding && usuarioGuardado) inputOnboarding.value = usuarioGuardado;

    if (cfg.velocidad && inputVel) {
      inputVel.value = cfg.velocidad;

      if (labelVel) {
        labelVel.textContent = parseFloat(cfg.velocidad).toFixed(1) + 'x';
      }
    }

    if (cfg.volumen && inputVol) {
      inputVol.value = cfg.volumen;

      if (labelVol) {
        labelVol.textContent = Math.round(getVolumenReal() * 100) + '%';
      }
    }

    if (cfg.tono && inputTono) {
      inputTono.value = cfg.tono;

      if (labelTono) {
        labelTono.textContent = parseFloat(cfg.tono).toFixed(1);
      }
    }

    if (cfg.voz && inputVoz) {
      inputVoz.value = cfg.voz;

      document.querySelectorAll('#free-voice-grid .voice-card')
        .forEach(card => {
          if (card.getAttribute('data-voice') === cfg.voz) {
            card.classList.add('active');
          } else {
            card.classList.remove('active');
          }
        });
    }

    if (cfg.motorVoz && inputMotorVoz) {
      inputMotorVoz.value = cfg.motorVoz;
    }

    if (cfg.vozOn !== undefined && switchVoz) {
      switchVoz.checked = cfg.vozOn;
    }

    if (cfg.overlayOn !== undefined && switchOverlay) {
      switchOverlay.checked = cfg.overlayOn;
    }

    if (cfg.priorizarPro !== undefined && switchPriorizarPro) {
      switchPriorizarPro.checked = cfg.priorizarPro;
    }

    [
      'sonido-rosa',
      'sonido-chicos',
      'sonido-mano',
      'sonido-pistola',
      'sonido-galaxia',
      'sonido-ballena',
      'sonido-comentario'
    ].forEach(id => {
      const key = id.replace('sonido-', 'sonido_');

      if (cfg[key] !== undefined) {
        const elemento = document.getElementById(id);

        if (elemento) elemento.checked = cfg[key];
      }
    });

    const footerVoz = document.getElementById('footer-voz');

    if (footerVoz && switchVoz) {
      footerVoz.innerText = switchVoz.checked ? 'ON' : 'OFF';
    }

  } catch (error) {
    console.warn('Error cargando configuración:', error);
  }

  if (inputVel) {
    inputVel.addEventListener('input', () => {
      if (labelVel) {
        labelVel.textContent = parseFloat(inputVel.value).toFixed(1) + 'x';
      }

      guardarAuto();
    });
  }

  if (inputVol) {
    inputVol.addEventListener('input', () => {
      if (labelVol) {
        labelVol.textContent = Math.round(getVolumenReal() * 100) + '%';
      }

      guardarAuto();
    });
  }

  if (inputTono) {
    inputTono.addEventListener('input', () => {
      if (labelTono) {
        labelTono.textContent = parseFloat(inputTono.value).toFixed(1);
      }

      guardarAuto();
    });
  }

  if (inputVoz) inputVoz.addEventListener('change', guardarAuto);

  if (inputMotorVoz) {
    inputMotorVoz.addEventListener('change', () => {
      detenerTodaVoz();
      guardarAuto();
    });
  }

  if (switchVoz) {
    switchVoz.addEventListener('change', () => {
      const footer = document.getElementById('footer-voz');

      if (footer) {
        footer.innerText = switchVoz.checked ? 'ON' : 'OFF';
      }

      if (!switchVoz.checked) detenerTodaVoz();

      guardarAuto();
    });
  }

  if (switchOverlay) {
    switchOverlay.addEventListener('change', () => {
      if (!switchOverlay.checked) detenerTodaVoz();
      guardarAuto();
    });
  }

  if (switchPriorizarPro) {
    switchPriorizarPro.addEventListener('change', guardarAuto);
  }

  [
    'sonido-rosa',
    'sonido-chicos',
    'sonido-mano',
    'sonido-pistola',
    'sonido-galaxia',
    'sonido-ballena',
    'sonido-comentario'
  ].forEach(id => {
    document.getElementById(id)?.addEventListener('change', guardarAuto);
  });

  // =========================================================
  // SIDEBAR Y NAVEGACIÓN
  // =========================================================

  function abrirSidebar() {
    if (!sidebar || !sidebarFondo) return;

    sidebar.classList.remove('hidden');
    sidebarFondo.classList.remove('hidden');

    document.body.style.overflow = 'hidden';
  }

  function cerrarSidebar() {
    if (!sidebar || !sidebarFondo) return;

    sidebar.classList.add('hidden');
    sidebarFondo.classList.add('hidden');

    document.body.style.overflow = '';
  }

  if (btnMenu) {
    btnMenu.addEventListener('click', event => {
      event.stopPropagation();

      if (onboardingScreen && !onboardingScreen.classList.contains('hidden')) {
        return;
      }

      abrirSidebar();
    });
  }

  if (btnClose) btnClose.addEventListener('click', cerrarSidebar);
  if (sidebarFondo) sidebarFondo.addEventListener('click', cerrarSidebar);

  const btnSesion = document.getElementById('btn-sesion');
  const sesionSheet = document.getElementById('sesion-sheet');
  const sesionFondo = document.getElementById('sesion-fondo');
  const btnCerrarSheet = document.getElementById('btn-cerrar-sesion-sheet');

  function abrirSesionSheet() {
    if (!sesionSheet) return;

    sesionSheet.classList.add('open');

    if (sesionFondo) {
      sesionFondo.classList.remove('hidden');

      requestAnimationFrame(() => {
        sesionFondo.classList.add('show');
      });
    }
  }

  function cerrarSesionSheet() {
    if (!sesionSheet) return;

    sesionSheet.classList.remove('open');

    if (sesionFondo) {
      sesionFondo.classList.remove('show');

      setTimeout(() => {
        sesionFondo.classList.add('hidden');
      }, 250);
    }
  }

  window.abrirSesionSheet = abrirSesionSheet;
  window.cerrarSesionSheet = cerrarSesionSheet;

  if (btnSesion) {
    btnSesion.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();

      cerrarSidebar();
      abrirSesionSheet();
    });
  }

  if (btnCerrarSheet) {
    btnCerrarSheet.addEventListener('click', cerrarSesionSheet);
  }

  if (sesionFondo) {
    sesionFondo.addEventListener('click', cerrarSesionSheet);
  }

  function abrirPanel() {
    if (!overlayPanel || !overlayFondo) return;

    overlayPanel.classList.remove('hidden');
    overlayFondo.classList.remove('hidden');
  }

  function cerrarPanel() {
    if (!overlayPanel || !overlayFondo) return;

    overlayPanel.classList.add('hidden');
    overlayFondo.classList.add('hidden');
  }

  if (btnMic) {
    btnMic.addEventListener('click', event => {
      event.stopPropagation();

      if (onboardingScreen && !onboardingScreen.classList.contains('hidden')) {
        return;
      }

      const estaOculto = overlayPanel?.classList.contains('hidden');

      if (estaOculto) abrirPanel();
      else cerrarPanel();
    });
  }

  if (overlayFondo) {
    overlayFondo.addEventListener('click', cerrarPanel);
  }

  function navegarA(panelName) {
    document.querySelectorAll('nav a, #sidebar-nav .nav-item')
      .forEach(link => link.classList.remove('active'));

    document.querySelector(`[data-panel="${panelName}"]`)
      ?.classList.add('active');

    document.querySelectorAll('.panel')
      .forEach(panel => panel.classList.add('hidden'));

    const target = document.getElementById(`panel-${panelName}`);

    if (target) {
      target.classList.remove('hidden');
    }

    cerrarPanel();
    cerrarSidebar();

    if (tituloPanel) {
      const titulos = {
        inicio: 'Inicio',
        live: 'Conectar LIVE',
        comentarios: 'Comentarios',
        tex: 'Texto a Voz',
        config: 'Configuración',
        sonidos: 'Sonidos',
        historial: 'Historial',
        premium: 'Premium',
        soporte: 'Soporte',
        ayuda: 'Ayuda / FAQ',
        contacto: 'Contacto',
        terminos: 'Términos y Condiciones',
        privacidad: 'Privacidad'
      };

      tituloPanel.textContent = titulos[panelName] || 'MarUnity';

      if (subtituloPanel) {
        const subs = {
          inicio: 'Resumen de tu LIVE',
          live: 'Verificá tu usuario',
          comentarios: 'Bandeja en tiempo real',
          tex: 'Texto a voz',
          config: 'Personaliza el comportamiento',
          sonidos: 'Efectos del LIVE',
          historial: 'Anteriores',
          premium: 'Mejorar plan',
          soporte: 'Estamos acá para ayudarte',
          ayuda: 'Preguntas frecuentes',
          contacto: 'Escribinos',
          terminos: 'Transparencia y seguridad',
          privacidad: 'Protección de datos'
        };

        subtituloPanel.textContent = subs[panelName] || '';
      }
    }
  }

  window.navegarA = navegarA;

  if (btnConfigTex) {
    btnConfigTex.addEventListener('click', () => navegarA('tex'));
  }

  if (btnOverlayLive) {
    btnOverlayLive.addEventListener('click', () => navegarA('live'));
  }

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-panel]');

    if (trigger && !trigger.closest('nav')) {
      const panel = trigger.getAttribute('data-panel');

      if (panel) {
        event.preventDefault();
        navegarA(panel);
      }
    }
  });

  document.querySelectorAll('nav a[data-panel], #sidebar-nav a[data-panel]')
    .forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault();

        if (onboardingScreen && !onboardingScreen.classList.contains('hidden')) {
          return;
        }

        navegarA(link.dataset.panel);
      });
    });

  // =========================================================
  // TEXTO A VOZ
  // =========================================================

  function contieneBloqueada(texto) {
    if (!texto) return false;

    const lista = getBloqueadasList();

    if (lista.length === 0) return false;

    const txt = texto.toLowerCase();

    return lista.some(palabra => txt.includes(palabra.toLowerCase()));
  }

  function detenerTodaVoz() {
    elevenLabsQueue = [];
    ttsQueue = [];
    sonidoEpicoQueue = [];

    if (currentElevenLabsAudio) {
      currentElevenLabsAudio.pause();
      currentElevenLabsAudio.currentTime = 0;
      currentElevenLabsAudio = null;
    }

    isPlayingElevenLabs = false;
    isPlayingEpico = false;

    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }

    isSpeaking = false;
  }

  function reproducirVoz(texto, audioUrl = null) {
    if (switchVoz && !switchVoz.checked) {
      detenerTodaVoz();
      return;
    }

    if (switchOverlay && !switchOverlay.checked) {
      detenerTodaVoz();
      return;
    }

    if (!texto || !texto.trim()) return;
    if (/^\[.*?\]$/.test(texto.trim())) return;

    if (contieneBloqueada(texto)) {
      console.log('Bloqueada:', texto);
      return;
    }

    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl);

        audio.volume = getVolumenReal();

        audio.play().catch(error => {
          console.warn('Falló el audio externo. Se usará voz nativa:', error);

          const textoCorto = texto.length > 180
            ? texto.substring(0, 180)
            : texto;

          ttsQueue.push(textoCorto);
          procesarColaNativa();
        });

        return;

      } catch (error) {
        console.error('Error al reproducir audio externo:', error);
      }
    }

    const motorSeleccionado = inputMotorVoz?.value || 'nativo';

    // Se conserva el motor nativo existente.
    // El motor PRO requiere su integración de audio correspondiente.
    if (motorSeleccionado === 'nativo' || motorSeleccionado === 'elevenlabs') {
      const textoCorto = texto.length > 180
        ? texto.substring(0, 180)
        : texto;

      ttsQueue.push(textoCorto);
      procesarColaNativa();
    }
  }

  function procesarColaNativa() {
    if (isSpeaking || ttsQueue.length === 0) return;

    if (!('speechSynthesis' in window)) {
      ttsQueue = [];
      return;
    }

    isSpeaking = true;

    const texto = ttsQueue.shift();

    try {
      const utter = new SpeechSynthesisUtterance(texto);

      utter.rate = parseFloat(inputVel?.value) || 1;
      utter.volume = getVolumenReal();
      utter.pitch = parseFloat(inputTono?.value) || 1;

      const mejorVoz = obtenerMejorVozNativa();

      if (mejorVoz) {
        utter.voice = mejorVoz;
      }

      utter.onend = () => {
        isSpeaking = false;
        setTimeout(procesarColaNativa, 100);
      };

      utter.onerror = () => {
        isSpeaking = false;
        setTimeout(procesarColaNativa, 200);
      };

      speechSynthesis.speak(utter);

    } catch (error) {
      console.error('Error en voz nativa:', error);
      isSpeaking = false;
    }
  }

  if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = () => {
      speechSynthesis.getVoices();
    };

    setTimeout(() => {
      if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.getVoices();
      }
    }, 100);
  }

  const vistosReciente = new Map();

  function esDuplicadoCliente(usuario, mensaje) {
    const key = `${usuario}-${mensaje}`;
    const ahora = Date.now();

    if (vistosReciente.has(key) && ahora - vistosReciente.get(key) < 4000) {
      return true;
    }

    vistosReciente.set(key, ahora);

    // Evitar que el mapa crezca indefinidamente.
    if (vistosReciente.size > 1000) {
      for (const [clave, fecha] of vistosReciente) {
        if (ahora - fecha > 10000) {
          vistosReciente.delete(clave);
        }
      }
    }

    return false;
  }

  function incrementarLikes(cantidad) {
    const qty = parseInt(cantidad) || 1;

    totalLikesAcumulados += qty;
    likesHoyAcumulados += qty;

    if (perfilLiveCountLikes) {
      perfilLiveCountLikes.textContent = totalLikesAcumulados;
    }

    if (statLikesHoy) {
      statLikesHoy.textContent = likesHoyAcumulados;
    }
  }

  function obtenerMejorVozNativa() {
    if (!('speechSynthesis' in window)) return null;

    const voces = speechSynthesis.getVoices();

    if (!voces || voces.length === 0) return null;

    const vozPro = voces.find(voz => {
      const idioma = voz.lang.toLowerCase();
      const nombre = voz.name.toLowerCase();

      return (
        (idioma.includes('es') || idioma.includes('spa')) &&
        (
          nombre.includes('google') ||
          nombre.includes('microsoft') ||
          nombre.includes('natural') ||
          nombre.includes('neural') ||
          nombre.includes('helena') ||
          nombre.includes('laura') ||
          nombre.includes('pablo')
        )
      );
    });

    if (vozPro) return vozPro;

    const vozLatino = voces.find(voz => {
      const idioma = voz.lang.toLowerCase();

      return (
        idioma.includes('es-419') ||
        idioma.includes('es-mx') ||
        idioma.includes('es-us') ||
        idioma.includes('es-ar')
      );
    });

    if (vozLatino) return vozLatino;

    const vozEspanol = voces.find(voz =>
      voz.lang.toLowerCase().includes('es')
    );

    if (vozEspanol) return vozEspanol;

    return voces[0];
  }

  function incrementarRegalos(cantidad) {
    const qty = parseInt(cantidad) || 1;

    totalRegalosAcumulados += qty;

    if (perfilLiveCountRegalo) {
      perfilLiveCountRegalo.textContent = totalRegalosAcumulados;
    }
  }

  // =========================================================
  // SOCKET.IO
  // =========================================================

  async function conectarWebSockets(streamer) {
    if (typeof io !== 'function') {
      throw new Error('No se pudo cargar Socket.IO. Recargá la página.');
    }

    const session = await obtenerSesionValida();

    if (!session?.access_token) {
      throw new Error('La sesión de Google no está disponible.');
    }

    if (socket) {
      socket.disconnect();
      socket = null;
    }

    const nuevoSocket = io(SERVER_URL, {
      auth: {
        token: session.access_token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    socket = nuevoSocket;

    socket.on('connect', () => {
      if (socket !== nuevoSocket) return;

      const footer = document.getElementById('footer-status-text');

      if (footer) {
        footer.innerText = '● Conectado';
        footer.style.color = '#4ade80';
      }

      nuevoSocket.emit('join-stream-room', streamer);
    });

    socket.on('connect_error', error => {
      if (socket !== nuevoSocket) return;

      console.error('[SOCKET CONNECT ERROR]', error);

      setLiveBadge(false, 'Reconectando...');

      const footer = document.getElementById('footer-status-text');

      if (footer) {
        footer.innerText = '● Reconectando';
        footer.style.color = '#f59e0b';
      }

      toast(
        'El servidor aceptó la solicitud, pero la conexión en tiempo real está fallando.',
        true
      );
    });

    socket.on('streamer-activo', user => {
      if (socket !== nuevoSocket) return;

      toast(`En vivo: @${user}`, false);

      const footer = document.getElementById('footer-status-text');

      if (footer) {
        footer.innerText = `● En vivo: @${user}`;
      }

      setLiveBadge(true, `En vivo @${user}`);
    });

    socket.on('status', data => {
      if (socket !== nuevoSocket) return;

      if (data.conectado) {
        toast(`LIVE @${data.user}`, false);

        if (btnConectar) {
          btnConectar.textContent = `Conectado @${data.user}`;
          btnConectar.style.background = '#22c55e';
          btnConectar.disabled = false;
        }

        setLiveBadge(true, `LIVE @${data.user}`);

      } else {
        if (data.error && estadoConexion) {
          estadoConexion.innerText =
            `El usuario @${data.user} no está en vivo, reintentando...`;

          estadoConexion.style.color = '#f59e0b';
        }
      }
    });

    socket.on('tts-limit-reached', data => {
      console.warn(data.mensaje);
      toast(data.mensaje, true);
    });

    socket.on('new-chat', data => {
      if (socket !== nuevoSocket) return;

      const usuario = data?.usuario || 'Usuario';
      const mensaje = data?.mensaje || '';

      if (esDuplicadoCliente(usuario, mensaje)) return;

      reproducirVoz(data.textoVoz || mensaje, data.audioUrl);
      sonarComentario();

      listaMensajes.push({
        usuario,
        mensaje
      });

      if (listaMensajes.length > 5000) {
        listaMensajes.shift();
      }

      actualizarBandejaComentarios();
    });

    socket.on('new-gift', data => {
      if (socket !== nuevoSocket) return;

      const diamantes =
        data.diamondCount ||
        data.diamonds ||
        data.value ||
        1;

      incrementarRegalos(1);
      onGift(diamantes);

      const modoProActivo = switchPriorizarPro
        ? switchPriorizarPro.checked
        : true;

      if (!modoProActivo) {
        if (data.textoVoz || data.mensaje) {
          reproducirVoz(data.textoVoz || data.mensaje, data.audioUrl);
        }
      }

      listaMensajes.push({
        usuario: data.usuario || 'Regalo',
        mensaje: data.mensaje || `Envió regalo (${diamantes} diamantes)`
      });

      if (listaMensajes.length > 5000) {
        listaMensajes.shift();
      }

      actualizarBandejaComentarios();
    });

    socket.on('gift', data => {
      if (socket !== nuevoSocket) return;

      const diamantes =
        data.diamondCount ||
        data.diamonds ||
        data.value ||
        1;

      incrementarRegalos(1);
      onGift(diamantes);
    });

    socket.on('new-like', data => {
      if (socket !== nuevoSocket) return;

      const count =
        data?.likeCount ||
        data?.count ||
        data?.totalLikeCount ||
        data?.diamondCount ||
        1;

      incrementarLikes(count);
    });

    socket.on('like', data => {
      if (socket !== nuevoSocket) return;

      const count =
        data?.likeCount ||
        data?.count ||
        data?.totalLikeCount ||
        data?.diamondCount ||
        1;

      incrementarLikes(count);
    });

    socket.on('new-follow', data => {
      if (socket !== nuevoSocket) return;

      if (data.textoVoz) {
        reproducirVoz(data.textoVoz, data.audioUrl);
      }
    });

    socket.on('stream-ended', data => {
      if (socket !== nuevoSocket) return;

      toast(data.message || 'Live finalizado.');

      if (btnConectar) {
        btnConectar.textContent = 'Verificar';
        btnConectar.style.background = '';
        btnConectar.disabled = false;
      }

      const footer = document.getElementById('footer-status-text');

      if (footer) {
        footer.innerText = '● Live terminado';
        footer.style.color = '#ff7a7a';
      }

      setLiveBadge(false, 'Live terminado');
    });

    socket.on('disconnect', () => {
      if (socket !== nuevoSocket) return;

      setLiveBadge(false, 'Desconectado');

      const footer = document.getElementById('footer-status-text');

      if (footer) {
        footer.innerText = '● Desconectado';
        footer.style.color = '#ff7a7a';
      }
    });

    return nuevoSocket;
  }

  // =========================================================
  // BANDEJA DE COMENTARIOS
  // =========================================================

  function actualizarBandejaComentarios() {
    const contenedorBox = document.getElementById('chat-container-box');
    const contadorBox = document.getElementById('comentarios-counter');
    const badge = document.getElementById('badge-count');
    const overlayCount = document.getElementById('overlay-count');
    const footerCount = document.getElementById('footer-count');

    const total = listaMensajes.length;

    if (contadorBox) contadorBox.innerText = total;
    if (badge) badge.innerText = total;
    if (overlayCount) overlayCount.innerText = total;
    if (footerCount) footerCount.innerText = total;

    if (perfilLiveCountComentarios) {
      perfilLiveCountComentarios.innerText = total;
    }

    if (!contenedorBox) return;

    if (total === 0) {
      contenedorBox.innerHTML = `
        <p style="color:#6b7280;text-align:center;font-size:14px;padding:20px;">
          Esperando comentarios del LIVE...
        </p>
      `;

      return;
    }

    contenedorBox.innerHTML = listaMensajes
      .slice(-5000)
      .reverse()
      .map(msg => `
        <div style="background:#15151f;padding:10px;border-radius:8px;border:1px solid #2a2a40;color:#fff;font-size:13px;display:flex;gap:8px;align-items:flex-start;margin-bottom:6px;">
          <b style="color:#ff7a7a;white-space:nowrap;">${escapeHtml(msg.usuario)}:</b>
          <span style="word-break:break-word;">${escapeHtml(msg.mensaje)}</span>
        </div>
      `)
      .join('');
  }

  // =========================================================
  // PREMIUM
  // =========================================================

  function cargarPremium() {
    if (typeof PREMIUM_DATA === 'undefined') return;

    const elMensual = document.getElementById('premium-precio-mensual');
    const elAnual = document.getElementById('premium-precio-anual');
    const elBtn = document.getElementById('btn-comprar-premium');
    const elLista = document.getElementById('premium-features');

    if (elMensual) {
      elMensual.innerText =
        `$${PREMIUM_DATA.precio_mensual} ${PREMIUM_DATA.moneda}`;
    }

    if (elAnual) {
      elAnual.innerText =
        `O anual por $${PREMIUM_DATA.precio_anual} - Ahorrás 50%`;
    }

    if (elBtn) {
      elBtn.onclick = () => {
        if (PREMIUM_DATA.link_pago) {
          window.open(PREMIUM_DATA.link_pago, '_blank');
        }
      };
    }

    if (elLista) {
      elLista.innerHTML = PREMIUM_DATA.features_pro
        .map(feature => `<p style="padding:6px 0;border-bottom:1px solid #222;">${escapeHtml(feature)}</p>`)
        .join('');
    }
  }

  cargarPremium();

  // =========================================================
  // EDITAR USUARIO
  // =========================================================

  const btnEditarUsuario = document.getElementById('btn-editar-usuario');

  if (btnEditarUsuario) {
    btnEditarUsuario.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();

      navegarA('live');

      setTimeout(() => {
        const inputLive = document.getElementById('input-tiktok-user');

        if (inputLive) {
          inputLive.focus();
          inputLive.select();
          inputLive.style.borderColor = '#a855f7';

          setTimeout(() => {
            inputLive.style.borderColor = '';
          }, 1000);
        }
      }, 300);
    });
  }

  // =========================================================
  // PANTALLA DE INICIO / RECUPERACIÓN DE SESIÓN
  // =========================================================

  function setStartupCheck(id, estado, texto) {
    const elemento = document.getElementById(id);

    if (!elemento) return;

    elemento.classList.remove('loading', 'success', 'error');

    if (estado) {
      elemento.classList.add(estado);
    }

    const status = elemento.querySelector('.startup-status');

    if (status) {
      status.textContent = texto || estado;
    }
  }

  function setStartupProgress(porcentaje, texto) {
    if (startupBar) {
      startupBar.style.width = porcentaje + '%';
    }

    if (startupText) {
      startupText.textContent = texto || '';
    }
  }

  function mostrarErrorStartup(mensaje) {
    if (startupTitle) {
      startupTitle.textContent = 'No se pudo iniciar MarUnity';
    }

    if (startupDesc) {
      startupDesc.textContent = mensaje;
    }

    let btnRetry = document.getElementById('startup-retry');

    if (!btnRetry && startupDesc?.parentElement) {
      btnRetry = document.createElement('button');

      btnRetry.id = 'startup-retry';
      btnRetry.textContent = 'Reintentar';

      btnRetry.style.cssText = `
        margin-top:16px;
        padding:12px 24px;
        border:0;
        border-radius:10px;
        background:#a855f7;
        color:white;
        font-weight:bold;
        cursor:pointer;
      `;

      startupDesc.parentElement.appendChild(btnRetry);
    }

    if (btnRetry) {
      btnRetry.onclick = () => {
        btnRetry.disabled = true;
        btnRetry.textContent = 'Reintentando...';

        runStartup().finally(() => {
          btnRetry.disabled = false;
          btnRetry.textContent = 'Reintentar';
        });
      };
    }
  }

  function ocultarPantallaStartup() {
    if (!startupEl) return;

    startupEl.style.transition = 'opacity 0.4s ease';
    startupEl.style.opacity = '0';

    setTimeout(() => {
      startupEl.style.display = 'none';
      startupEl.style.opacity = '1';
    }, 450);
  }

  async function consultarVinculoTikTok(token) {
    const respuesta = await fetchConTimeout(
      `${SERVER_URL}/api/consultar-vinculo`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        cache: 'no-store'
      },
      TIMEOUT_SERVIDOR
    );

    const resultado = await respuesta.json().catch(() => null);

    if (respuesta.status === 401) {
      throw new Error('La sesión no pudo ser validada. Volvé a iniciar sesión.');
    }

    if (!respuesta.ok || !resultado || resultado.success !== true) {
      console.error('[CONSULTAR VÍNCULO]', {
        status: respuesta.status,
        resultado
      });

      throw new Error(
        resultado?.error ||
        resultado?.message ||
        'No se pudo consultar tu vínculo de TikTok.'
      );
    }

    return resultado;
  }

  async function runStartup() {
    if (!startupEl || startupEnCurso) return;

    startupEnCurso = true;

    startupEl.style.display = '';
    startupEl.style.opacity = '1';

    setStartupProgress(5, 'Verificando servicios...');
    setStartupCheck('startup-google', 'loading', 'Verificando...');

    if (startupTitle) startupTitle.textContent = 'Preparando tu espacio';
    if (startupDesc) startupDesc.textContent = 'Estamos verificando tu sesión.';

    try {
      // auth.js se carga después de script.js: esperar su inicialización.
      let clientAuth = null;

      for (let i = 0; i < 20; i++) {
        clientAuth = window.supabaseAuth;

        if (clientAuth) break;

        await esperar(250);
      }

      if (!clientAuth) {
        throw new Error('No se pudo inicializar la autenticación. Recargá la página.');
      }

      setStartupProgress(15, 'Recuperando sesión...');

      let session = null;

      for (let i = 0; i < 10; i++) {
        session = await obtenerSesionValida();

        if (session?.access_token) break;

        await esperar(300);
      }

      if (!session?.access_token) {
        setStartupCheck('startup-google', 'error', 'Sesión no disponible');

        if (startupTitle) {
          startupTitle.textContent = 'Necesitás iniciar sesión';
        }

        if (startupDesc) {
          startupDesc.textContent = 'Redirigiendo al inicio de sesión...';
        }

        await esperar(500);

        window.location.replace('login.html');
        return;
      }

      setStartupCheck('startup-google', 'success', 'Conectado');
      setStartupProgress(30, 'Cuenta verificada...');

      await esperar(200);

      setStartupCheck('startup-tiktok', 'loading', 'Consultando vínculo...');

      const resultado = await consultarVinculoTikTok(session.access_token);

      let perfilVinculado = null;

      if (resultado.vinculado === true && resultado.profile) {
        perfilVinculado = resultado.profile;

        setStartupCheck('startup-tiktok', 'success', 'Vínculo encontrado');

      } else {
        setStartupCheck('startup-tiktok', 'success', 'Sin vínculo');
      }

      setStartupProgress(60, 'Perfil procesado...');

      await esperar(200);

      setStartupCheck('startup-server', 'loading', 'Comprobando...');
      await esperar(200);
      setStartupCheck('startup-server', 'success', 'En línea');

      setStartupProgress(85, 'Casi listo...');

      await esperar(200);

      setStartupCheck('startup-comments', 'loading', 'Recuperando...');
      await esperar(200);
      setStartupCheck('startup-comments', 'success', 'Listo');

      setStartupProgress(100, 'Todo listo');

      if (startupTitle) {
        startupTitle.textContent = 'Todo listo';
      }

      if (startupDesc) {
        startupDesc.textContent = 'Tu espacio está preparado.';
      }

      await esperar(300);

      ocultarPantallaStartup();

      if (perfilVinculado) {
        // Un vínculo existente no necesita volver a confirmarse cada vez.
        const usuario = normalizarUsuarioTikTok(
          perfilVinculado.username ||
          perfilVinculado.uniqueId ||
          ''
        );

        if (usuario) {
          localStorage.setItem('texyiu_tiktok_user', usuario);
          localStorage.setItem('texyiu_tiktok_user_confirmado', usuario);

          if (inputUser) inputUser.value = usuario;
          if (inputOnboarding) inputOnboarding.value = usuario;
        }

        actualizarPerfilLiveConectado({
          username: usuario,
          nickname: perfilVinculado.nickname || usuario,
          profilePicture:
            perfilVinculado.profilePicture ||
            perfilVinculado.profilePictureUrl ||
            'logo.png'
        });

        ocultarOnboarding();
        cerrarModalPerfil();

        // Abrir el panel principal sin pedir otra confirmación.
        navegarA('inicio');

        // Si el usuario había iniciado el proceso antes de ir a Google,
        // limpiar el dato pendiente porque el vínculo ya existe.
        sessionStorage.removeItem('marunity_tiktok_pendiente');

      } else {
        // No hay vínculo: conservar el usuario pendiente si venía del login.
        const pendiente = normalizarUsuarioTikTok(
          sessionStorage.getItem('marunity_tiktok_pendiente') || ''
        );

        if (pendiente && inputOnboarding) {
          inputOnboarding.value = pendiente;
        }

        mostrarOnboarding();
      }

    } catch (error) {
      console.error('[STARTUP]', error);

      setStartupCheck('startup-google', 'error', 'No se pudo verificar');

      if (error?.message?.toLowerCase().includes('sesión')) {
        if (startupTitle) {
          startupTitle.textContent = 'Revisá tu sesión';
        }
      }

      mostrarErrorStartup(
        error?.message ||
        'Revisá tu conexión e intentá nuevamente.'
      );

    } finally {
      startupEnCurso = false;
    }
  }

  runStartup();

});
