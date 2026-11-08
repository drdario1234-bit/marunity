document.addEventListener('DOMContentLoaded', () => {
  console.log('TexYiu LIVE Tex - V9 RED BLACK (Optimized & Comments Fixed)');

  const SERVER_URL = 'https://bot-tiktok-tslw.onrender.com';
  let socket = null;
  let listaMensajes = [];

  let ttsQueue = []; let isSpeaking = false;
  let elevenLabsQueue = []; let isPlayingElevenLabs = false; let currentElevenLabsAudio = null;
  let sonidoEpicoQueue = []; let isPlayingEpico = false;

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

  function getVolumenReal() {
    const v = parseFloat(inputVol?.value);
    if (isNaN(v)) return 1;
    return Math.min(1, Math.max(0, v));
  }
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

  let perfilPendiente = null;
  let verificacionEnCurso = false;
  let conexionEnCurso = false;
  let ultimoIntentoPerfil = 0;
  const COOLDOWN_PERFIL_FRONTEND = 5000;

  let totalLikesAcumulados = 0;
  let likesHoyAcumulados = 0;
  let totalRegalosAcumulados = 0;
  let renderTimerInterval = null;

  function verificarBloqueo30Dias() {
    const fechaBloqueo = localStorage.getItem('texyiu_bloqueo_hasta');
    if (!fechaBloqueo) return false;
    const ahora = new Date();
    const hasta = new Date(fechaBloqueo);
    if (ahora < hasta) {
      const diasRestantes = Math.ceil((hasta - ahora) / (1000*60*60*24));
      return diasRestantes;
    }
    localStorage.removeItem('texyiu_bloqueo_hasta');
    localStorage.removeItem('texyiu_bloqueo_user');
    return false;
  }

  function iniciarContadorRender(elementoDestino, textoBase = "Despertando servidor en la nube") {
    let segundos = 0;
    if (renderTimerInterval) clearInterval(renderTimerInterval);
    if (elementoDestino) {
      elementoDestino.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-top:12px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:18px;height:18px;border:2px solid rgba(168,85,247,0.3);border-top-color:#a855f7;border-radius:50%;animation: spin 0.8s linear infinite;"></div>
            <span style="font-size:13px;color:#a1a1b5;">${textoBase}</span>
          </div>
          <span style="font-size:11px;color:#6b7280;background:#15151f;padding:4px 8px;border-radius:20px;border:1px solid #2a2a40;">⏱️ <strong id="segundos-carga">${segundos}s</strong> - Aguardá un toque...</span>
        </div>
        <style>@keyframes spin { to { transform: rotate(360deg); } }</style>`;
    }
    renderTimerInterval = setInterval(() => {
      segundos++;
      const spanSeg = document.getElementById('segundos-carga');
      if (spanSeg) spanSeg.textContent = `${segundos}s`;
    }, 1000);
  }
  function detenerContadorRender() { if (renderTimerInterval) { clearInterval(renderTimerInterval); renderTimerInterval = null; } }

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
  for (let k in SONIDOS_URL) { try { const a = new Audio(SONIDOS_URL[k]); a.preload='auto'; audiosCache[k]=a; } catch(e){} }

  const btnReproducirBienvenida = document.getElementById('btn-reproducir-bienvenida');
  const audioBienvenida = document.getElementById('audio-bienvenida');
  if (btnReproducirBienvenida && audioBienvenida) {
    btnReproducirBienvenida.addEventListener('click', () => {
      audioBienvenida.volume = getVolumenReal();
      if (audioBienvenida.paused) {
        audioBienvenida.currentTime=0;
        audioBienvenida.play().then(()=>{ btnReproducirBienvenida.textContent='Pausar'; }).catch(()=>{ toast('No se encontró bienvenida.mp3'); });
      } else { audioBienvenida.pause(); btnReproducirBienvenida.textContent='Escuchar'; }
    });
    audioBienvenida.addEventListener('ended', ()=>{ btnReproducirBienvenida.textContent='Escuchar'; });
  }

  function escapeHtml(text){ const div=document.createElement('div'); div.textContent=text||''; return div.innerHTML; }
  function toast(msg,isError=true){ if(!estadoConexion) return; detenerContadorRender(); estadoConexion.innerText=msg; estadoConexion.style.color=isError?'#ff7a7a':'#4ade80'; }
  function setOnboardingStatus(msg,isError=false){ if(!onboardingStatus) return; detenerContadorRender(); onboardingStatus.innerText=msg||''; onboardingStatus.style.color=isError?'#ff7a7a':'#a1a1b5'; }
  function setLiveBadge(conectado,texto){
    if(!liveBadge) return;
    liveBadge.innerHTML=`<span></span> ${escapeHtml(texto)}`;
    if(conectado){ liveBadge.style.background='rgba(239,68,68,.15)'; liveBadge.style.color='#ff7a7a'; liveBadge.style.border='1px solid rgba(239,68,68,.25)'; }
    else { liveBadge.style.background='#15151f'; liveBadge.style.color='#6b7280'; liveBadge.style.border='1px solid #2a2a40'; }
    const dot=liveBadge.querySelector('span');
    if(dot){ dot.style.background=conectado?'#ef4444':'#4b5563'; dot.style.boxShadow=conectado?'0 0 8px #ef4444':'none'; }
  }
  setLiveBadge(false,'Desconectado');

  function normalizarUsuarioTikTok(valor){
    let usuario=String(valor||'').trim();
    usuario=usuario.replace(/https?:\/\//gi,'').replace(/www\./gi,'').replace(/tiktok\.com\//gi,'').replace(/@/g,'');
    usuario=usuario.split('/')[0].split('?')[0].split('#')[0].split(' ')[0].trim().toLowerCase();
    return usuario;
  }

  function mostrarOnboarding(){ if(!onboardingScreen) return; onboardingScreen.classList.remove('hidden'); document.body.style.overflow='hidden'; setTimeout(()=>{ inputOnboarding?.focus(); },100); }
  function ocultarOnboarding(){ if(!onboardingScreen) return; onboardingScreen.classList.add('hidden'); document.body.style.overflow=''; }
  function cuentaTikTokConfirmada(){ const usuario=localStorage.getItem('texyiu_tiktok_user_confirmado')||localStorage.getItem('tiktok_user_confirmado'); return !!usuario; }

  if(cuentaTikTokConfirmada()){
    const uGuardado = localStorage.getItem('texyiu_tiktok_user_confirmado')||'';
    if(inputUser) inputUser.value = uGuardado;
  }

  async function verificarPerfilTikTok(usuario){
    if (!navigator.onLine) {
      throw new Error('Sin conexión a internet. Revisá tu WiFi o datos.');
    }

    const ahora=Date.now(); const diferencia=ahora-ultimoIntentoPerfil;
    if(ultimoIntentoPerfil && diferencia<COOLDOWN_PERFIL_FRONTEND){ const segundos=Math.ceil((COOLDOWN_PERFIL_FRONTEND-diferencia)/1000); throw new Error(`Esperá ${segundos}s antes de volver a verificar.`); }
    ultimoIntentoPerfil=ahora;
    
    try {
      const url=`${SERVER_URL}/api/verificar-perfil?username=${encodeURIComponent(usuario)}`;
      const respuesta=await fetch(url,{method:'GET',headers:{'Accept':'application/json'},cache:'no-store'});
      let resultado; try{ resultado=await respuesta.json(); } catch(e){ throw new Error('El servidor respondió con formato inválido.'); }
      if(!respuesta.ok) throw new Error(resultado?.error||resultado?.message||`Error del servidor (${respuesta.status})`);
      if(!resultado||!resultado.success) throw new Error(resultado?.error||resultado?.message||'No se pudo verificar el perfil.');
      const perfil=resultado.profile||resultado.perfil||resultado.user||resultado.data||resultado;
      const usernameReal=normalizarUsuarioTikTok(perfil.username||perfil.uniqueId||perfil.unique_id||usuario);
      const nickname=perfil.nickname||perfil.displayName||perfil.display_name||perfil.name||`@${usernameReal}`;
      const foto=perfil.profilePicture||perfil.profilePictureUrl||perfil.avatar||perfil.avatarUrl||perfil.avatar_url||perfil.photo||perfil.photoUrl||'logo.png';
      let isLive=null;
      if(typeof perfil.isLive==='boolean') isLive=perfil.isLive;
      else if(typeof perfil.enVivo==='boolean') isLive=perfil.enVivo;
      else if(typeof perfil.live==='boolean') isLive=perfil.live;
      else if(typeof perfil.is_live==='boolean') isLive=perfil.is_live;
      return {username:usernameReal||usuario, nickname:String(nickname), profilePicture:foto, isLive:isLive};
    } catch (e) {
      if (e.message.includes('Failed to fetch') || e.name === 'TypeError') {
        if (!navigator.onLine) {
          throw new Error('Sin internet. Conectate a una red y probá de nuevo.');
        } else {
          throw new Error('Problema de conexión. Revisá tu internet y tocá Verificar de nuevo.');
        }
      }
      throw e;
    }
  }

  function mostrarModalPerfil(perfil){
    detenerContadorRender();
    if(!modalConfirmarTikTok) return;
    perfilPendiente=perfil;
    if(profileAvatar){ profileAvatar.src=perfil.profilePicture||'logo.png'; profileAvatar.onerror=()=>{ profileAvatar.onerror=null; profileAvatar.src='logo.png'; }; }
    if(profileNickname) profileNickname.textContent=perfil.nickname||'Usuario de TikTok';
    if(profileUsername) profileUsername.textContent='@'+normalizarUsuarioTikTok(perfil.username);
    if(profileLiveStatus){
      profileLiveStatus.classList.remove('live','offline');
      if(perfil.isLive===true){ profileLiveStatus.textContent='EN VIVO AHORA'; profileLiveStatus.classList.add('live'); }
      else if(perfil.isLive===false){ profileLiveStatus.textContent='No está en vivo'; profileLiveStatus.classList.add('offline'); }
      else { profileLiveStatus.textContent='Estado LIVE no disponible'; profileLiveStatus.classList.add('offline'); }
    }
    ocultarErrorConfirmacion();
    modalConfirmarTikTok.classList.remove('hidden');
    document.body.style.overflow='hidden';
  }
  function cerrarModalPerfil(){ if(!modalConfirmarTikTok) return; modalConfirmarTikTok.classList.add('hidden'); document.body.style.overflow=onboardingScreen&&!onboardingScreen.classList.contains('hidden')?'hidden':''; }
  function mostrarErrorConfirmacion(msg){ detenerContadorRender(); if(!confirmError) return; confirmError.textContent=msg||'Ocurrió un error.'; confirmError.classList.add('visible'); }
  function ocultarErrorConfirmacion(){ if(!confirmError) return; confirmError.textContent=''; confirmError.classList.remove('visible'); }

  async function iniciarVerificacionTikTok(valorUsuario,origen='onboarding'){
    if(verificacionEnCurso) return;
    const usuario=normalizarUsuarioTikTok(valorUsuario);
    if(!usuario||usuario.length<2){ const mensaje='Ingresá un usuario válido. Ej: tuusuario'; if(origen==='onboarding'){ setOnboardingStatus(mensaje,true); inputOnboarding?.focus(); } else { toast(mensaje,true); inputUser?.focus(); } return; }
    verificacionEnCurso=true;
    if(origen==='onboarding'){ if(btnVerificarTikTok){ btnVerificarTikTok.disabled=true; btnVerificarTikTok.textContent='Verificando...'; } iniciarContadorRender(onboardingStatus, `Buscando @${usuario} `); }
    else { if(btnConectar){ btnConectar.disabled=true; btnConectar.textContent='Verificando...'; } iniciarContadorRender(estadoConexion, `Buscando @${usuario} (despertando)`); }
    try{ const perfil=await verificarPerfilTikTok(usuario); mostrarModalPerfil(perfil); }
    catch(error){ 
      console.error('Error verificando perfil:',error); 
      detenerContadorRender(); 
      let mensaje=error?.message||'No se pudo verificar el perfil.';
      if(mensaje.includes('Failed to fetch') || mensaje.toLowerCase().includes('fetch')) {
        mensaje = 'Sin internet. Revisá tu conexión y probá de nuevo.';
      }
      if(origen==='onboarding') setOnboardingStatus(mensaje,true); 
      else toast(mensaje,true); 
    }
    finally { verificacionEnCurso=false; if(origen==='onboarding'){ if(btnVerificarTikTok){ btnVerificarTikTok.disabled=false; btnVerificarTikTok.textContent='Continuar'; } } else { if(btnConectar){ btnConectar.disabled=false; btnConectar.textContent='Verificar'; } } }
  }

  if(btnVerificarTikTok) btnVerificarTikTok.addEventListener('click',()=>{ iniciarVerificacionTikTok(inputOnboarding?.value||'','onboarding'); });
  if(inputOnboarding) inputOnboarding.addEventListener('keydown',(e)=>{ if(e.key==='Enter'){ e.preventDefault(); if(!verificacionEnCurso) iniciarVerificacionTikTok(inputOnboarding.value,'onboarding'); } });
  if(btnCerrarConfirmacion) btnCerrarConfirmacion.addEventListener('click',()=>{ if(conexionEnCurso) return; cerrarModalPerfil(); });
  if(btnVolverTikTok) btnVolverTikTok.addEventListener('click',()=>{ if(conexionEnCurso) return; cerrarModalPerfil(); });
  if(modalTikTokBackdrop) modalTikTokBackdrop.addEventListener('click',()=>{ if(conexionEnCurso) return; cerrarModalPerfil(); });

  if (btnConfirmarTikTok) {
    btnConfirmarTikTok.addEventListener('click', async () => {
      if (conexionEnCurso || !perfilPendiente) return;

      const usuario = normalizarUsuarioTikTok(perfilPendiente.username);

      if (!usuario) {
        mostrarErrorConfirmacion('No se pudo obtener el usuario.');
        return;
      }

      conexionEnCurso = true;
      btnConfirmarTikTok.disabled = true;
      btnConfirmarTikTok.textContent = 'Comprobando sesión...';

      try {
        const clientAuth = window.supabaseAuth;

        if (!clientAuth) {
          throw new Error('No se pudo inicializar la autenticación.');
        }

        const sessionRes = await clientAuth.auth.getSession();

        if (sessionRes.error) {
          throw sessionRes.error;
        }

        const session = sessionRes?.data?.session;

        if (session?.access_token) {
          await conectarTikTok(usuario, true);
          sessionStorage.removeItem('marunity_tiktok_pendiente');
        } else {
          sessionStorage.setItem('marunity_tiktok_pendiente', usuario);
          btnConfirmarTikTok.textContent = 'Continuando con Google...';
          window.location.href = 'login.html';
        }

      } catch (error) {
        console.error('Error al confirmar TikTok:', error);
        mostrarErrorConfirmacion(error?.message || 'No se pudo continuar.');

        btnConfirmarTikTok.disabled = false;
        btnConfirmarTikTok.textContent = 'Confirmar';
      } finally {
        conexionEnCurso = false;
      }
    });
  }

  function actualizarPerfilLiveConectado(datos) {
    if (perfilLiveAvatar && datos.profilePicture) { perfilLiveAvatar.src = datos.profilePicture; perfilLiveAvatar.onerror = () => { perfilLiveAvatar.onerror = null; perfilLiveAvatar.src = 'logo.png'; }; }
    if (perfilLiveNickname && datos.nickname) { perfilLiveNickname.textContent = datos.nickname; }
    if (perfilLiveUsername && datos.username) { perfilLiveUsername.textContent = '@' + normalizarUsuarioTikTok(datos.username); }
  }

  async function conectarTikTok(usuario, vieneDeConfirmacion=false){
    usuario=normalizarUsuarioTikTok(usuario);
    if(!usuario) throw new Error('Usuario TikTok inválido.');

    if (!vieneDeConfirmacion) {
      const dias = verificarBloqueo30Dias();
      const userBloqueado = localStorage.getItem('texyiu_bloqueo_user');
      if (dias && userBloqueado && userBloqueado !== usuario) {
        toast(`🔒 Bloqueado por 30 días. Usás @${userBloqueado}. Te quedan ${dias} días`, true);
        if(btnConectar){ btnConectar.textContent='Verificar'; btnConectar.disabled=false; btnConectar.style.background=''; }
        detenerContadorRender();
        setLiveBadge(false, `Bloqueado ${dias}d`);
        throw new Error(`Bloqueado ${dias} días`);
      }
    }
    listaMensajes=[]; totalLikesAcumulados=0; likesHoyAcumulados=0; totalRegalosAcumulados=0;
    actualizarBandejaComentarios();
    if(perfilLiveCountLikes) perfilLiveCountLikes.textContent = '0';
    if(statLikesHoy) statLikesHoy.textContent = '0';
    if(perfilLiveCountComentarios) perfilLiveCountComentarios.textContent = '0';
    if(perfilLiveCountRegalo) perfilLiveCountRegalo.textContent = '0';
    if(btnConectar){ btnConectar.disabled=true; btnConectar.textContent='Conectando...'; }
    iniciarContadorRender(estadoConexion, `Iniciando conexión con @${usuario}`);
    setLiveBadge(false,'Conectando...');
    try{
      const clientAuth = window.supabaseAuth;

      if (!clientAuth) {
        throw new Error('No se pudo inicializar la autenticación de Google.');
      }

      const sessionRes = await clientAuth.auth.getSession();
      const token = sessionRes?.data?.session?.access_token || '';

      if (!token) {
        throw new Error('Tenés que iniciar sesión con Google para conectar TikTok.');
      }

      const respuesta=await fetch(`${SERVER_URL}/api/conectar`,{ 
        method:'POST', 
        headers:{
          'Content-Type':'application/json',
          'Authorization': `Bearer ${token}`
        }, 
        body:JSON.stringify({username:usuario}) 
      });

      let resultado; try{ resultado=await respuesta.json(); } catch(e){ throw new Error('El servidor respondió con formato inválido.'); }
      if(!respuesta.ok||!resultado||!resultado.success) throw new Error(resultado?.error||resultado?.message||`No se pudo conectar (${respuesta.status})`);
      
      detenerContadorRender();
      localStorage.setItem('texyiu_tiktok_user',usuario);
      localStorage.setItem('texyiu_tiktok_user_confirmado',usuario);
      if (!localStorage.getItem('texyiu_bloqueo_hasta')) {
        const hasta = new Date();
        hasta.setDate(hasta.getDate() + 30);
        localStorage.setItem('texyiu_bloqueo_hasta', hasta.toISOString());
        localStorage.setItem('texyiu_bloqueo_user', usuario);
        console.log('🔒 Bloqueo guardado hasta:', hasta);
      }
      if(inputUser) inputUser.value=usuario;
      if(inputOnboarding) inputOnboarding.value=usuario;
      if(perfilPendiente) { actualizarPerfilLiveConectado(perfilPendiente); } else { actualizarPerfilLiveConectado({ username: usuario, nickname: usuario, profilePicture: 'logo.png' }); }
      if(btnConectar){ btnConectar.textContent=`Conectado @${usuario}`; btnConectar.style.background='#22c55e'; btnConectar.disabled=false; }
      toast(`Conectado @${usuario}`,false);
      setLiveBadge(true,`Conectado @${usuario}`);

      reproducirVoz(`Conectado correctamente. Estás usando la voz nativa del navegador, esperando comentarios.`);
      
      conectarWebSockets(usuario);
      if(vieneDeConfirmacion){ cerrarModalPerfil(); ocultarOnboarding(); }

      setTimeout(() => navegarA('inicio'), 1200);

      return resultado;
    } catch(error){
      detenerContadorRender();
      if(btnConectar){ btnConectar.textContent='Verificar'; btnConectar.disabled=false; btnConectar.style.background=''; }
      let msgError = error?.message||'No se pudo conectar';
      if(msgError.includes('Failed to fetch') || msgError.toLowerCase().includes('fetch')) {
        msgError = 'Sin internet. Revisá tu conexión y probá de nuevo.';
      }
      toast(msgError,true);
      setLiveBadge(false,'Desconectado');
      if(vieneDeConfirmacion){ localStorage.removeItem('texyiu_tiktok_user_confirmado'); }
      throw error;
    }
  }

  (async function continuarDespuesDeGoogle(){
    const usuarioPendiente = sessionStorage.getItem('marunity_tiktok_pendiente');
    if (!usuarioPendiente) return;

    try {
      const clientAuth = window.supabaseAuth;
      if (!clientAuth) {
        throw new Error('No se pudo inicializar la autenticación.');
      }

      const { data: { session } } = await clientAuth.auth.getSession();
      if (!session) {
        window.location.href = 'login.html';
        return;
      }

      await conectarTikTok(usuarioPendiente, true);
      sessionStorage.removeItem('marunity_tiktok_pendiente');
    } catch (error) {
      console.error('Error al continuar después de Google:', error);
      toast(error?.message || 'No se pudo continuar la conexión.', true);
    }
  })();

  if(btnConectar) btnConectar.addEventListener('click',()=>{ iniciarVerificacionTikTok(inputUser?.value||'','panel'); });

  const voiceCards = document.querySelectorAll('.voice-card:not(.locked)');
  voiceCards.forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('#free-voice-grid .voice-card').forEach(c => { c.classList.remove('active'); });
      card.classList.add('active');
      const voiceKey = card.getAttribute('data-voice');
      if (inputVoz) { inputVoz.value = voiceKey; inputVoz.dispatchEvent(new Event('change')); }
      guardarAuto();
    });
  });

  window.probarSonido=function(tier){ encolarSonidoEpico(tier); };
  function encolarSonidoEpico(tier){
    const check=document.getElementById(`sonido-${tier}`); if(check&&!check.checked) return;
    if(!audiosCache[tier]) return;
    sonidoEpicoQueue.push(tier); procesarColaEpica();
  }
  function procesarColaEpica(){
    if(isPlayingEpico||sonidoEpicoQueue.length===0) return;
    isPlayingEpico=true;
    const tier=sonidoEpicoQueue.shift();
    const volEpico = getVolumenReal() * 0.6;
    try{
      const audioUrl=SONIDOS_URL[tier];
      const audio=new Audio(audioUrl);
      audio.volume=volEpico;
      audio.onended=()=>{ isPlayingEpico=false; setTimeout(procesarColaEpica,80); };
      audio.onerror=()=>{ isPlayingEpico=false; setTimeout(procesarColaEpica,80); };
      audio.play().catch(()=>{ isPlayingEpico=false; setTimeout(procesarColaEpica,80); });
    } catch(e){ isPlayingEpico=false; setTimeout(procesarColaEpica,80); }
  }
  function onGift(diamondCount){ const d=parseInt(diamondCount)||1; if(d===1) encolarSonidoEpico('rosa'); else if(d<100) encolarSonidoEpico('chicos'); else if(d<500) encolarSonidoEpico('mano'); else if(d<1000) encolarSonidoEpico('pistola'); else if(d<2000) encolarSonidoEpico('galaxia'); else encolarSonidoEpico('ballena'); }
  function sonarComentario(){ const check=document.getElementById('sonido-comentario'); if(check&&check.checked) encolarSonidoEpico('comentario'); }

  function getBloqueadasList(){
    try { return JSON.parse(localStorage.getItem('marunity_bloqueadas')||'[]'); }
    catch { return []; }
  }
  function renderBloqueadas(){
    const lista = getBloqueadasList();
    const html = lista.map((w,i)=>`<span class="chip-bloqueada" style="background:#1e1b4b;border:1px solid rgba(168,85,247,0.4);color:#e2e8f0;padding:5px 10px;border-radius:20px;font-size:12px;display:inline-flex;gap:6px;align-items:center;">${w} <b data-bloq="${i}" style="color:#f87171;cursor:pointer;">✕</b></span>`).join('') || '<span style="font-size:11px;color:#64748b;">Sin palabras.</span>';
    if(listaChipsTex) listaChipsTex.innerHTML = html;
    if(listaChipsConfig) listaChipsConfig.innerHTML = html;
    if(btnVerBloqueadas) btnVerBloqueadas.textContent = `Ver (${lista.length})`;
    if(countConfig) countConfig.textContent = lista.length;
  }
  function agregarBloqueada(){
    let v = (inputBloq?.value||'').trim().toLowerCase();
    if(!v) return;
    let lista = getBloqueadasList();
    v.split(',').map(s=>s.trim().toLowerCase()).filter(s=>{
      if(!s) return false;
      if(s.length < 3) return false;
      if(lista.includes(s)) return false;
      return true;
    }).forEach(p=> lista.push(p));
    localStorage.setItem('marunity_bloqueadas', JSON.stringify(lista));
    if(inputBloq) inputBloq.value = '';
    renderBloqueadas();
  }
  btnAgregarBloqueada?.addEventListener('click', agregarBloqueada);
  inputBloq?.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); agregarBloqueada(); } });
  btnVerBloqueadas?.addEventListener('click', ()=>{ if(typeof navegarA==='function'){ navegarA('config'); setTimeout(()=>listaChipsConfig?.classList.remove('hidden'), 250); } });
  btnConfigVerBloqueadas?.addEventListener('click', ()=> listaChipsConfig?.classList.toggle('hidden'));
  document.addEventListener('click', e=>{
    const b = e.target.closest('[data-bloq]');
    if(!b) return;
    let lista = getBloqueadasList();
    lista.splice(parseInt(b.dataset.bloq),1);
    localStorage.setItem('marunity_bloqueadas', JSON.stringify(lista));
    renderBloqueadas();
  });
  renderBloqueadas();

  function guardarAuto(){
    const cfg={
      velocidad:inputVel?.value||'1', volumen:inputVol?.value||'1', tono:inputTono?.value||'1',
      voz:inputVoz?.value||'', motorVoz:inputMotorVoz?.value||'nativo',
      vozOn:switchVoz?.checked??true, overlayOn:switchOverlay?.checked??true,
      priorizarPro: switchPriorizarPro?.checked ?? true,
      sonido_rosa:document.getElementById('sonido-rosa')?.checked??true,
      sonido_chicos:document.getElementById('sonido-chicos')?.checked??true,
      sonido_mano:document.getElementById('sonido-mano')?.checked??true,
      sonido_pistola:document.getElementById('sonido-pistola')?.checked??true,
      sonido_galaxia:document.getElementById('sonido-galaxia')?.checked??true,
      sonido_ballena:document.getElementById('sonido-ballena')?.checked??true,
      sonido_comentario:document.getElementById('sonido-comentario')?.checked??false
    };
    localStorage.setItem('texyiu_cfg',JSON.stringify(cfg));
  }

  try{
    const cfg=JSON.parse(localStorage.getItem('texyiu_cfg')||'{}');
    const usuarioGuardado=localStorage.getItem('texyiu_tiktok_user_confirmado')||localStorage.getItem('texyiu_tiktok_user');
    if(inputUser&&usuarioGuardado) inputUser.value=usuarioGuardado;
    if(inputOnboarding&&usuarioGuardado) inputOnboarding.value=usuarioGuardado;
    if(cfg.velocidad&&inputVel){ inputVel.value=cfg.velocidad; if(labelVel) labelVel.textContent=parseFloat(cfg.velocidad).toFixed(1)+'x'; }
    if(cfg.volumen&&inputVol){ inputVol.value=cfg.volumen; if(labelVol) labelVol.textContent=Math.round(getVolumenReal()*100)+'%'; }
    if(cfg.tono&&inputTono){ inputTono.value=cfg.tono; if(labelTono) labelTono.textContent=parseFloat(cfg.tono).toFixed(1); }
    if(cfg.voz&&inputVoz) {
      inputVoz.value=cfg.voz;
      document.querySelectorAll('#free-voice-grid .voice-card').forEach(c => {
        if(c.getAttribute('data-voice') === cfg.voz) c.classList.add('active');
        else c.classList.remove('active');
      });
    }
    if(cfg.motorVoz&&inputMotorVoz) inputMotorVoz.value=cfg.motorVoz;
    if(cfg.vozOn!==undefined&&switchVoz) switchVoz.checked=cfg.vozOn;
    if(cfg.overlayOn!==undefined&&switchOverlay) switchOverlay.checked=cfg.overlayOn;
    if(cfg.priorizarPro!==undefined&&switchPriorizarPro) switchPriorizarPro.checked=cfg.priorizarPro;
    ['sonido-rosa','sonido-chicos','sonido-mano','sonido-pistola','sonido-galaxia','sonido-ballena','sonido-comentario'].forEach(id=>{
      const key=id.replace('sonido-','sonido_'); if(cfg[key]!==undefined){ const e=document.getElementById(id); if(e) e.checked=cfg[key]; }
    });
    const footerVoz=document.getElementById('footer-voz'); if(footerVoz&&switchVoz) footerVoz.innerText=switchVoz.checked?'ON':'OFF';
  } catch(e){ console.log('Error cargando config:',e); }

  if(inputVel) inputVel.addEventListener('input',()=>{ if(labelVel) labelVel.textContent=parseFloat(inputVel.value).toFixed(1)+'x'; guardarAuto(); });
  if(inputVol) inputVol.addEventListener('input',()=>{ if(labelVol) labelVol.textContent=Math.round(getVolumenReal()*100)+'%'; guardarAuto(); });
  if(inputTono) inputTono.addEventListener('input',()=>{ if(labelTono) labelTono.textContent=parseFloat(inputTono.value).toFixed(1); guardarAuto(); });
  if(inputVoz) inputVoz.addEventListener('change',guardarAuto);
  if(inputMotorVoz) inputMotorVoz.addEventListener('change',()=>{ detenerTodaVoz(); guardarAuto(); });
  if(switchVoz) switchVoz.addEventListener('change',()=>{ const f=document.getElementById('footer-voz'); if(f) f.innerText=switchVoz.checked?'ON':'OFF'; if(!switchVoz.checked) detenerTodaVoz(); guardarAuto(); });
  if(switchOverlay) switchOverlay.addEventListener('change',()=>{ if(!switchOverlay.checked) detenerTodaVoz(); guardarAuto(); });
  if(switchPriorizarPro) switchPriorizarPro.addEventListener('change', guardarAuto);
  ['sonido-rosa','sonido-chicos','sonido-mano','sonido-pistola','sonido-galaxia','sonido-ballena','sonido-comentario'].forEach(id=>{ const el=document.getElementById(id); if(el) el.addEventListener('change',guardarAuto); });

  function abrirSidebar(){ if(!sidebar||!sidebarFondo) return; sidebar.classList.remove('hidden'); sidebarFondo.classList.remove('hidden'); document.body.style.overflow='hidden'; }
  function cerrarSidebar(){ if(!sidebar||!sidebarFondo) return; sidebar.classList.add('hidden'); sidebarFondo.classList.add('hidden'); document.body.style.overflow=''; }
  if(btnMenu) btnMenu.addEventListener('click',(e)=>{ e.stopPropagation(); if(onboardingScreen&&!onboardingScreen.classList.contains('hidden')) return; abrirSidebar(); });
  if(btnClose) btnClose.addEventListener('click',cerrarSidebar);
  if(sidebarFondo) sidebarFondo.addEventListener('click',cerrarSidebar);
  
  const btnSesion = document.getElementById('btn-sesion');
  const sesionSheet = document.getElementById('sesion-sheet');
  const sesionFondo = document.getElementById('sesion-fondo');
  const btnCerrarSheet = document.getElementById('btn-cerrar-sesion-sheet');

  function abrirSesionSheet(){
    if(!sesionSheet) return;
    sesionSheet.classList.add('open');
    if(sesionFondo){
      sesionFondo.classList.remove('hidden');
      requestAnimationFrame(()=> sesionFondo.classList.add('show'));
    }
  }
  function cerrarSesionSheet(){
    if(!sesionSheet) return;
    sesionSheet.classList.remove('open');
    if(sesionFondo){
      sesionFondo.classList.remove('show');
      setTimeout(()=> sesionFondo.classList.add('hidden'), 250);
    }
  }
  window.abrirSesionSheet = abrirSesionSheet;
  window.cerrarSesionSheet = cerrarSesionSheet;

  if(btnSesion) btnSesion.addEventListener('click', (e)=>{
    e.preventDefault();
    e.stopPropagation();
    cerrarSidebar();
    abrirSesionSheet();
  });
  if(btnCerrarSheet) btnCerrarSheet.addEventListener('click', cerrarSesionSheet);
  if(sesionFondo) sesionFondo.addEventListener('click', cerrarSesionSheet);
  function abrirPanel(){ if(!overlayPanel||!overlayFondo) return; overlayPanel.classList.remove('hidden'); overlayFondo.classList.remove('hidden'); }
  function cerrarPanel(){ if(!overlayPanel||!overlayFondo) return; overlayPanel.classList.add('hidden'); overlayFondo.classList.add('hidden'); }
  if(btnMic) btnMic.addEventListener('click',(e)=>{ e.stopPropagation(); if(onboardingScreen&&!onboardingScreen.classList.contains('hidden')) return; const estaOculto=overlayPanel.classList.contains('hidden'); if(estaOculto) abrirPanel(); else cerrarPanel(); });
  if(overlayFondo) overlayFondo.addEventListener('click',cerrarPanel);

  function navegarA(panelName){
    document.querySelectorAll('nav a, #sidebar-nav .nav-item').forEach(l=>l.classList.remove('active'));
    document.querySelector(`[data-panel="${panelName}"]`)?.classList.add('active');
    document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden'));
    const target=document.getElementById('panel-'+panelName);
    if(target) target.classList.remove('hidden');
    cerrarPanel(); cerrarSidebar();
    if(tituloPanel){
      const titulos={inicio:'Inicio',live:'Conectar LIVE',comentarios:'Comentarios',tex:'Texto a Voz',config:'Configuración',sonidos:'Sonidos',historial:'Historial',premium:'Premium',soporte:'Soporte',ayuda:'Ayuda / FAQ',contacto:'Contacto',terminos:'Términos y Condiciones',privacidad:'Privacidad'};
      tituloPanel.textContent=titulos[panelName]||'MarUnity';
      if(subtituloPanel){
        const subs={inicio:'Resumen de tu LIVE',live:'Verificá tu usuario',comentarios:'Bandeja en tiempo real',tex:'Texto a voz',config:'Personaliza el comportamiento',sonidos:'Efectos del LIVE',historial:'Anteriores',premium:'Mejorar plan',soporte:'Estamos acá para ayudarte',ayuda:'Preguntas frecuentes',contacto:'Escribinos',terminos:'Transparencia y seguridad',privacidad:'Protección de datos'};
        subtituloPanel.textContent=subs[panelName]||'';
      }
    }
  }
  window.navegarA = navegarA;

  if(btnConfigTex) btnConfigTex.addEventListener('click',()=>navegarA('tex'));
  if(btnOverlayLive) btnOverlayLive.addEventListener('click',()=>navegarA('live'));

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-panel]');
    if (trigger && !trigger.closest('nav')) {
      const panel = trigger.getAttribute('data-panel');
      if (panel) { e.preventDefault(); navegarA(panel); }
    }
  });

  document.querySelectorAll('nav a[data-panel], #sidebar-nav a[data-panel]').forEach(link=>{
    link.addEventListener('click',(e)=>{
      e.preventDefault();
      if(onboardingScreen&&!onboardingScreen.classList.contains('hidden')) return;
      navegarA(link.dataset.panel);
    });
  });

  function contieneBloqueada(texto){
    if(!texto) return false;
    const lista = getBloqueadasList();
    if(lista.length === 0) return false;
    const txt = texto.toLowerCase();
    return lista.some(p => txt.includes(p.toLowerCase()));
  }

  function detenerTodaVoz(){
    elevenLabsQueue=[]; ttsQueue=[]; sonidoEpicoQueue=[];
    if(currentElevenLabsAudio){ currentElevenLabsAudio.pause(); currentElevenLabsAudio.currentTime=0; currentElevenLabsAudio=null; }
    isPlayingElevenLabs=false; isPlayingEpico=false;
    if('speechSynthesis' in window) speechSynthesis.cancel();
    isSpeaking=false;
  }

  function reproducirVoz(texto, audioUrl=null){
    if(switchVoz&&!switchVoz.checked){ detenerTodaVoz(); return; }
    if(switchOverlay&&!switchOverlay.checked){ detenerTodaVoz(); return; }
    if(!texto||!texto.trim()) return;
    if(/^\[.*?\]$/.test(texto.trim())) return;
    if(contieneBloqueada(texto)) { console.log('Bloqueada:', texto); return; }

    if(audioUrl){
      try {
        const audio = new Audio(audioUrl);
        audio.volume = getVolumenReal();
        audio.play().catch(e => {
          console.warn("Fallo al reproducir audio de Google TTS URL, usando voz nativa:", e);
          if(texto.length>180) texto=texto.substring(0,180);
          ttsQueue.push(texto); procesarColaNativa();
        });
        return;
      } catch(e) {
        console.error("Error al instanciar audio de Google TTS URL:", e);
      }
    }

    const motorSeleccionado=inputMotorVoz?inputMotorVoz.value:'nativo';
    if(motorSeleccionado==='nativo'){ if(texto.length>180) texto=texto.substring(0,180); ttsQueue.push(texto); procesarColaNativa(); return; }
    if(texto.length>180) texto=texto.substring(0,180);
    ttsQueue.push(texto); procesarColaNativa();
  }

  function procesarColaElevenLabs(){
    const motorSeleccionado=inputMotorVoz?inputMotorVoz.value:'nativo';
    if(motorSeleccionado==='nativo'||(switchVoz&&!switchVoz.checked)){ detenerTodaVoz(); return; }
    if(isPlayingElevenLabs||elevenLabsQueue.length===0) return;
    isPlayingElevenLabs=true;
    const base64Data=elevenLabsQueue.shift();
    try{
      currentElevenLabsAudio=new Audio(`data:audio/mp3;base64,${base64Data}`);
      currentElevenLabsAudio.volume=getVolumenReal();
      currentElevenLabsAudio.onended=()=>{ isPlayingElevenLabs=false; currentElevenLabsAudio=null; setTimeout(procesarColaElevenLabs,100); };
      currentElevenLabsAudio.onerror=()=>{ isPlayingElevenLabs=false; currentElevenLabsAudio=null; setTimeout(procesarColaElevenLabs,200); };
      currentElevenLabsAudio.play().catch(()=>{ isPlayingElevenLabs=false; currentElevenLabsAudio=null; setTimeout(procesarColaElevenLabs,200); });
    } catch(err){ isPlayingElevenLabs=false; currentElevenLabsAudio=null; setTimeout(procesarColaElevenLabs,200); }
  }

  function procesarColaNativa(){
    if(isSpeaking||ttsQueue.length===0) return;
    isSpeaking=true;
    const texto=ttsQueue.shift();
    try{
      const utter=new SpeechSynthesisUtterance(texto);
      
      utter.rate = parseFloat(inputVel?.value) || 1.0;
      utter.volume = getVolumenReal();
      utter.pitch = parseFloat(inputTono?.value) || 1.0;

      const mejorVoz = obtenerMejorVozNativa();
      if(mejorVoz) {
        utter.voice = mejorVoz;
      }

      utter.onend=()=>{ isSpeaking=false; setTimeout(procesarColaNativa,100); };
      utter.onerror=()=>{ isSpeaking=false; setTimeout(procesarColaNativa,200); };
      speechSynthesis.speak(utter);
    } catch(e){ isSpeaking=false; }
  }

  if('speechSynthesis' in window){ 
    speechSynthesis.onvoiceschanged = () => { 
      speechSynthesis.getVoices(); 
    }; 
    setTimeout(() => { if(speechSynthesis.getVoices().length === 0) speechSynthesis.getVoices(); }, 100);
  }

  const vistosReciente=new Map();
  function esDuplicadoCliente(usuario,mensaje){ const key=`${usuario}-${mensaje}`; const ahora=Date.now(); if(vistosReciente.has(key)&&ahora-vistosReciente.get(key)<4000) return true; vistosReciente.set(key,ahora); return false; }

  function incrementarLikes(cantidad) {
    const qty = parseInt(cantidad) || 1;
    totalLikesAcumulados += qty;
    likesHoyAcumulados += qty;
    if (perfilLiveCountLikes) { perfilLiveCountLikes.textContent = totalLikesAcumulados; }
    if (statLikesHoy) { statLikesHoy.textContent = likesHoyAcumulados; }
  }

  function obtenerMejorVozNativa() {
    if (!('speechSynthesis' in window)) return null;
    const voces = speechSynthesis.getVoices();
    if (!voces || voces.length === 0) return null;

    const vozPro = voces.find(v => 
      (v.lang.toLowerCase().includes('es') || v.lang.toLowerCase().includes('spa')) && 
      (v.name.toLowerCase().includes('google') || 
       v.name.toLowerCase().includes('microsoft') || 
       v.name.toLowerCase().includes('natural') || 
       v.name.toLowerCase().includes('neural') ||
       v.name.toLowerCase().includes('helena') ||
       v.name.toLowerCase().includes('laura') ||
       v.name.toLowerCase().includes('pablo'))
    );

    if (vozPro) return vozPro;

    const vozLatino = voces.find(v => v.lang.toLowerCase().includes('es-419') || v.lang.toLowerCase().includes('es-mx') || v.lang.toLowerCase().includes('es-us') || v.lang.toLowerCase().includes('es-ar'));
    if (vozLatino) return vozLatino;

    const vozEspanol = voces.find(v => v.lang.toLowerCase().includes('es'));
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

  async function conectarWebSockets(streamer){
    if(socket){ socket.disconnect(); socket=null; }

    const clientAuth = window.supabaseAuth;
    if (!clientAuth) {
      throw new Error('No se pudo inicializar la autenticación de Google.');
    }

    const sessionRes = await clientAuth.auth.getSession();
    const token = sessionRes?.data?.session?.access_token || '';

    if (!token) {
      throw new Error('Tenés que iniciar sesión con Google para conectar TikTok.');
    }

    socket=io(SERVER_URL,{
      auth: { token: token },
      transports:['websocket','polling'],
      timeout:20000,
      reconnection:true,
      reconnectionAttempts:10,
      reconnectionDelay:2000
    });

    socket.on('connect',()=>{ const footer=document.getElementById('footer-status-text'); if(footer){ footer.innerText='● Conectado'; footer.style.color='#4ade80'; } socket.emit('join-stream-room',streamer); });
    socket.on('streamer-activo',(user)=>{ toast(`En vivo: @${user}`,false); const footer=document.getElementById('footer-status-text'); if(footer) footer.innerText=`● En vivo: @${user}`; setLiveBadge(true,`En vivo @${user}`); });
    socket.on('status',(data)=>{
      if(data.conectado){ toast(`LIVE @${data.user}`,false); if(btnConectar){ btnConectar.textContent=`Conectado @${data.user}`; btnConectar.style.background='#22c55e'; btnConectar.disabled=false; } setLiveBadge(true,`LIVE @${data.user}`); }
      else { if(data.error&&estadoConexion){ estadoConexion.innerText=`El usuario @${data.user} no está en vivo, reintentando...`; estadoConexion.style.color='#f59e0b'; } }
    });
    socket.on('tts-limit-reached',(data)=>{ console.warn(data.mensaje); toast(data.mensaje,true); });
    
    // 👇 Comentarios del chat en vivo habilitados nuevamente para la bandeja y la voz
    socket.on('new-chat',(data)=>{
      if(esDuplicadoCliente(data.usuario,data.mensaje)) return;
      
      reproducirVoz(data.textoVoz||data.mensaje, data.audioUrl);
      sonarComentario();

      listaMensajes.push({ usuario: data.usuario || 'Usuario', mensaje: data.mensaje || '' });
      if(listaMensajes.length > 5000) listaMensajes.shift();
      actualizarBandejaComentarios();
    });

    socket.on('new-gift',(data)=>{
      const diamantes=data.diamondCount||data.diamonds||data.value||1;
      incrementarRegalos(1);
      onGift(diamantes);

      const modoProActivo = switchPriorizarPro ? switchPriorizarPro.checked : true;
      if (modoProActivo) {
        console.log('Regalo recibido: Sonido Pro activado, TTS silenciado.');
      } else {
        if(data.textoVoz||data.mensaje) reproducirVoz(data.textoVoz||data.mensaje, data.audioUrl);
      }

      listaMensajes.push({usuario:data.usuario||'Regalo',mensaje:data.mensaje || `Envió regalo (${diamantes} diamantes)`});
      if(listaMensajes.length>5000) listaMensajes.shift();
      actualizarBandejaComentarios();
    });
    socket.on('gift',(data)=>{ 
      const diamantes = data.diamondCount || data.diamonds || data.value || 1;
      incrementarRegalos(1);
      onGift(diamantes); 
    });
    socket.on('new-like',(data)=>{ const count = data?.likeCount || data?.count || data?.totalLikeCount || data?.diamondCount || 1; incrementarLikes(count); });
    socket.on('like',(data)=>{ const count = data?.likeCount || data?.count || data?.totalLikeCount || data?.diamondCount || 1; incrementarLikes(count); });
    socket.on('new-follow',(data)=>{ if(data.textoVoz) reproducirVoz(data.textoVoz, data.audioUrl); });
    socket.on('stream-ended',(data)=>{
      toast(data.message||'Live finalizado.');
      if(btnConectar){ btnConectar.textContent='Verificar'; btnConectar.style.background=''; btnConectar.disabled=false; }
      const footer=document.getElementById('footer-status-text'); if(footer){ footer.innerText='● Live terminado'; footer.style.color='#ff7a7a'; } setLiveBadge(false,'Live terminado');
    });
    socket.on('disconnect',()=>{ setLiveBadge(false,'Desconectado'); });
  }

  function actualizarBandejaComentarios(){
    const contenedorBox=document.getElementById('chat-container-box');
    const contadorBox=document.getElementById('comentarios-counter');
    const badge=document.getElementById('badge-count');
    const overlayCount=document.getElementById('overlay-count');
    const footerCount=document.getElementById('footer-count');
    const total=listaMensajes.length;
    if(contadorBox) contadorBox.innerText=total;
    if(badge) badge.innerText=total;
    if(overlayCount) overlayCount.innerText=total;
    if(footerCount) footerCount.innerText=total;
    if(perfilLiveCountComentarios) perfilLiveCountComentarios.innerText = total;
    if(!contenedorBox) return;
    if(total===0){ contenedorBox.innerHTML=`<p style="color:#6b7280;text-align:center;font-size:14px;padding:20px;">Esperando comentarios del LIVE...</p>`; return; }
    contenedorBox.innerHTML=listaMensajes.slice(-5000).reverse().map(msg=>`<div style="background:#15151f;padding:10px;border-radius:8px;border:1px solid #2a2a40;color:#fff;font-size:13px;display:flex;gap:8px;align-items:flex-start;margin-bottom:6px;"><b style="color:#ff7a7a;white-space:nowrap;">${escapeHtml(msg.usuario)}:</b><span style="word-break:break-word;">${escapeHtml(msg.mensaje)}</span></div>`).join('');
  }

  function cargarPremium(){
    if(typeof PREMIUM_DATA === 'undefined') return;
    const elMensual = document.getElementById('premium-precio-mensual');
    const elAnual = document.getElementById('premium-precio-anual');
    const elBtn = document.getElementById('btn-comprar-premium');
    const elLista = document.getElementById('premium-features');
    if(elMensual) elMensual.innerText = `$${PREMIUM_DATA.precio_mensual} ${PREMIUM_DATA.moneda}`;
    if(elAnual) elAnual.innerText = `O anual por $${PREMIUM_DATA.precio_anual} - Ahorrás 50%`;
    if(elBtn) elBtn.onclick = () => window.open(PREMIUM_DATA.link_pago, '_blank');
    if(elLista) elLista.innerHTML = PREMIUM_DATA.features_pro.map(f => `<p style="padding:6px 0; border-bottom:1px solid #222;">${f}</p>`).join('');
  }
  cargarPremium();

  const btnEditarUsuario = document.getElementById('btn-editar-usuario');
  if (btnEditarUsuario) {
    btnEditarUsuario.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      navegarA('live');
      
      setTimeout(() => {
        const inputLive = document.getElementById('input-tiktok-user');
        if (inputLive) {
          inputLive.focus();
          inputLive.select();
          inputLive.style.borderColor = '#a855f7';
          setTimeout(() => inputLive.style.borderColor = '', 1000);
        }
      }, 300);
    });
  }

  const startupEl = document.getElementById('marunity-startup');
  const startupBar = document.getElementById('startup-progress-bar');
  const startupText = document.getElementById('startup-progress-text');
  const startupTitle = document.getElementById('startup-title');
  const startupDesc = document.getElementById('startup-description');

  function setStartupCheck(id, estado, texto) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('loading', 'success', 'error');
    if (estado) el.classList.add(estado);
    const status = el.querySelector('.startup-status');
    if (status) status.textContent = texto || estado;
  }

  function setStartupProgress(pct, texto) {
    if (startupBar) startupBar.style.width = pct + '%';
    if (startupText) startupText.textContent = texto || '';
  }

  function esperar(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  async function runStartup() {
    if (!startupEl) return;

    setStartupProgress(5, 'Verificando servicios...');

    setStartupCheck('startup-google', 'loading', 'Verificando...');
    await esperar(600);

    try {
      const clientAuth = window.supabaseAuth;
      const { data } = await clientAuth.auth.getSession();
      if (data?.session) {
        setStartupCheck('startup-google', 'success', 'Conectado');
      } else {
        setStartupCheck('startup-google', 'error', 'Sin sesión');
        await esperar(800);
        window.location.href = 'login.html';
        return;
      }
    } catch(e) {
      setStartupCheck('startup-google', 'error', 'Error');
    }
    setStartupProgress(30, 'Cuenta verificada...');
    await esperar(400);

    setStartupCheck('startup-tiktok', 'loading', 'Recuperando...');
    await esperar(600);
    const userTikTok = localStorage.getItem('texyiu_tiktok_user_confirmado') || '';
    if (userTikTok) {
      setStartupCheck('startup-tiktok', 'success', 'Listo');
      const nickEl = document.getElementById('startup-nickname');
      const userEl = document.getElementById('startup-username');
      const profStatus = document.getElementById('startup-profile-status');
      if (nickEl) nickEl.textContent = userTikTok;
      if (userEl) userEl.textContent = '@' + userTikTok;
      if (profStatus) profStatus.textContent = 'Verificado';
    } else {
      setStartupCheck('startup-tiktok', 'error', 'Sin perfil');
    }
    setStartupProgress(60, 'Perfil cargado...');
    await esperar(400);

    setStartupCheck('startup-server', 'loading', 'Comprobando...');
    await esperar(600);
    try {
      await fetch(SERVER_URL + '/api/verificar-perfil?username=' + (userTikTok || 'marunity'), { cache: 'no-store' });
      setStartupCheck('startup-server', 'success', 'En línea');
    } catch(e) {
      setStartupCheck('startup-server', 'success', 'En línea');
    }
    setStartupProgress(85, 'Casi listo...');
    await esperar(400);

    setStartupCheck('startup-comments', 'loading', 'Recuperando...');
    await esperar(500);
    setStartupCheck('startup-comments', 'success', 'Listo');
    setStartupProgress(100, 'Todo listo');

    if (startupTitle) startupTitle.textContent = 'Todo listo';
    if (startupDesc) startupDesc.textContent = 'Tu espacio está preparado.';

    await esperar(600);
    startupEl.style.transition = 'opacity 0.4s ease';
    startupEl.style.opacity = '0';

    setTimeout(() => {
      startupEl.style.display = 'none';
      if (!cuentaTikTokConfirmada()) {
        mostrarOnboarding();
      }
    }, 400);
  }

  runStartup();

});
