// ==========================================
// SISTEMA DE AUTENTICACIÓN UGC
// Versión 2.0 - Integrado con sistema existente
// ==========================================

(function() {
'use strict';

console.log('🔐 Iniciando sistema de autenticación UGC...');

// ==========================================
// CONFIGURACIÓN
// ==========================================

const CONFIG_AUTH = {
    paginaLogin: 'login.html',
    paginaAdmin: 'index.html',
    paginaConsulta: 'consulta.html',
    sesionKey: 'usuarioUGC'
};

// ==========================================
// VERIFICAR AUTENTICACIÓN AL CARGAR
// ==========================================

function verificarAutenticacion() {
    const paginaActual = window.location.pathname.split('/').pop() || 'index.html';
    const usuarioData = localStorage.getItem(CONFIG_AUTH.sesionKey);

    console.log('📄 Página actual:', paginaActual);

    // Si estamos en la página de login, no hacer nada más
    if (paginaActual === CONFIG_AUTH.paginaLogin) {
        console.log('✅ Página de login - No se requiere autenticación');
        return null;
    }

    // Si no hay sesión activa
    if (!usuarioData) {
        console.log('❌ No hay sesión activa');
        console.log('🔀 Redirigiendo a login...');
        window.location.href = CONFIG_AUTH.paginaLogin;
        return null;
    }

    // Parsear datos del usuario
    const usuario = JSON.parse(usuarioData);
    console.log('✅ Usuario autenticado:', usuario.nombre);
    console.log('👤 Rol:', usuario.rol);

    // Verificar acceso según rol y página
    if (paginaActual === CONFIG_AUTH.paginaAdmin && usuario.rol !== 'administrador') {
        console.log('⚠️ Acceso denegado a index.html - Rol no autorizado');
        window.location.href = CONFIG_AUTH.paginaConsulta;
        return null;
    }

    if (paginaActual === CONFIG_AUTH.paginaConsulta && usuario.rol === 'administrador') {
        console.log('ℹ️ Administrador accediendo a vista de consulta (permitido)');
    }

    return usuario;
}

// ==========================================
// CONFIGURAR INTERFAZ SEGÚN ROL
// ==========================================

function configurarInterfazSegunRol(usuario) {
    if (!usuario) return;

    console.log('🎨 Configurando interfaz para:', usuario.rol);

    // Mostrar info del usuario en el header
    mostrarInfoUsuario(usuario);

    // Si es usuario de consulta, deshabilitar controles
    if (usuario.rol === 'consulta') {
        console.log('🔒 Aplicando modo solo lectura...');
        setTimeout(() => {
            deshabilitarControlesEdicion();
            mostrarBannerSoloLectura();
        }, 500);
    }
}

// ==========================================
// DESHABILITAR CONTROLES DE EDICIÓN
// ==========================================

function deshabilitarControlesEdicion() {
    console.log('🔒 Deshabilitando controles de edición...');

    // Deshabilitar todos los botones de acción
    const selectoresBotones = [
        'button[onclick*="guardar"]',
        'button[onclick*="Guardar"]',
        'button[onclick*="eliminar"]',
        'button[onclick*="Eliminar"]',
        'button[onclick*="editar"]',
        'button[onclick*="Editar"]',
        'button[onclick*="crear"]',
        'button[onclick*="Crear"]',
        'button[onclick*="registrar"]',
        'button[onclick*="Registrar"]',
        'button[type="submit"]',
        '.btn-guardar',
        '.btn-eliminar',
        '.btn-editar',
        '.btn-crear'
    ];

    selectoresBotones.forEach(selector => {
        document.querySelectorAll(selector).forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.4';
            btn.style.cursor = 'not-allowed';
            btn.title = '🔒 Acción no permitida - Usuario de solo consulta';
            
            // Prevenir clics
            btn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                mostrarAlertaPermisos();
                return false;
            };
        });
    });

    // Deshabilitar inputs en formularios
    const inputs = document.querySelectorAll('input:not([type="search"]), textarea, select');
    inputs.forEach(input => {
        // No deshabilitar inputs de búsqueda/filtro
        if (input.id && (input.id.includes('buscar') || input.id.includes('filtro'))) {
            return;
        }
        
        input.disabled = true;
        input.style.cursor = 'not-allowed';
        input.style.background = '#f3f4f6';
    });

    console.log('✅ Controles deshabilitados');
}

// ==========================================
// MOSTRAR BANNER DE SOLO LECTURA
// ==========================================

function mostrarBannerSoloLectura() {
    // Verificar si ya existe
    if (document.getElementById('bannerSoloLectura')) return;

    const banner = document.createElement('div');
    banner.id = 'bannerSoloLectura';
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        color: #78350f;
        padding: 12px 20px;
        text-align: center;
        font-weight: 600;
        font-size: 0.9em;
        z-index: 999999;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        animation: slideDown 0.5s ease-out;
    `;

    banner.innerHTML = `
        <span style="font-size: 1.2em; margin-right: 8px;">🔒</span>
        <strong>MODO SOLO LECTURA</strong> - 
        No puedes crear, editar ni eliminar registros. 
        Para solicitar permisos de administrador, contacta a la Unidad de Gestión de Convivencia.
    `;

    document.body.insertBefore(banner, document.body.firstChild);

    // Agregar animación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-100%);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);

    console.log('✅ Banner de solo lectura mostrado');
}

// ==========================================
// MOSTRAR INFO DE USUARIO
// ==========================================

function mostrarInfoUsuario(usuario) {
    // Buscar header
    const header = document.querySelector('header, .header, .navbar, .top-bar');
    
    if (!header) {
        console.log('⚠️ No se encontró header, creando info en body');
        crearInfoUsuarioFlotante(usuario);
        return;
    }

    // Crear elemento de info
    const userInfo = document.createElement('div');
    userInfo.id = 'userInfoUGC';
    userInfo.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        background: rgba(255,255,255,0.15);
        padding: 8px 16px;
        border-radius: 20px;
        margin-left: auto;
        backdrop-filter: blur(10px);
    `;

    const rolEmoji = usuario.rol === 'administrador' ? '👑' : '👤';
    const rolColor = usuario.rol === 'administrador' ? '#fbbf24' : '#60a5fa';
    const rolTexto = usuario.rol === 'administrador' ? 'Administrador' : 'Solo Consulta';

    userInfo.innerHTML = `
        <span style="font-size: 1.5em;">${rolEmoji}</span>
        <div style="text-align: left; line-height: 1.3;">
            <div style="font-size: 0.85em; font-weight: 600; color: white;">
                ${usuario.nombre}
            </div>
            <div style="font-size: 0.7em; color: ${rolColor};">
                ${rolTexto}
            </div>
        </div>
        <button onclick="cerrarSesionUGC()" 
                style="background: #dc2626; color: white; border: none; 
                       padding: 6px 14px; border-radius: 8px; cursor: pointer; 
                       font-size: 0.8em; font-weight: 600; transition: all 0.3s;"
                onmouseover="this.style.background='#991b1b'"
                onmouseout="this.style.background='#dc2626'">
            🚪 Salir
        </button>
    `;

    header.appendChild(userInfo);
    console.log('✅ Info de usuario agregada al header');
}

function crearInfoUsuarioFlotante(usuario) {
    const userInfo = document.createElement('div');
    userInfo.id = 'userInfoUGC';
    userInfo.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 999998;
        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
        color: white;
        padding: 12px 20px;
        border-radius: 15px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 12px;
    `;

    const rolEmoji = usuario.rol === 'administrador' ? '👑' : '👤';
    const rolTexto = usuario.rol === 'administrador' ? 'Admin' : 'Consulta';

    userInfo.innerHTML = `
        <span style="font-size: 1.5em;">${rolEmoji}</span>
        <div style="text-align: left; line-height: 1.3;">
            <div style="font-size: 0.85em; font-weight: 600;">
                ${usuario.nombre}
            </div>
            <div style="font-size: 0.7em; opacity: 0.8;">
                ${rolTexto}
            </div>
        </div>
        <button onclick="cerrarSesionUGC()" 
                style="background: #dc2626; color: white; border: none; 
                       padding: 6px 12px; border-radius: 6px; cursor: pointer; 
                       font-size: 0.75em; font-weight: 600;">
            Salir
        </button>
    `;

    document.body.appendChild(userInfo);
}

// ==========================================
// MOSTRAR ALERTA DE PERMISOS
// ==========================================

function mostrarAlertaPermisos() {
    alert('🔒 Acción No Permitida\n\nNo tienes permisos para realizar esta acción.\n\nTu cuenta es de SOLO LECTURA.\n\nPara solicitar permisos de administrador, contacta a la Unidad de Gestión de Convivencia.');
}

// ==========================================
// FUNCIONES GLOBALES
// ==========================================

// Cerrar sesión
window.cerrarSesionUGC = function() {
    const confirmar = confirm('¿Estás seguro de que deseas cerrar sesión?');
    
    if (confirmar) {
        localStorage.removeItem(CONFIG_AUTH.sesionKey);
        console.log('👋 Sesión cerrada');
        window.location.href = CONFIG_AUTH.paginaLogin;
    }
};

// Obtener usuario actual
window.obtenerUsuarioActualUGC = function() {
    const usuarioData = localStorage.getItem(CONFIG_AUTH.sesionKey);
    return usuarioData ? JSON.parse(usuarioData) : null;
};

// Verificar si es administrador
window.esAdministradorUGC = function() {
    const usuario = window.obtenerUsuarioActualUGC();
    return usuario && usuario.rol === 'administrador';
};

// Verificar si puede realizar acción
window.puedeRealizarAccionUGC = function(accion) {
    const usuario = window.obtenerUsuarioActualUGC();
    
    if (!usuario) {
        alert('⚠️ Debes iniciar sesión para realizar esta acción.');
        window.location.href = CONFIG_AUTH.paginaLogin;
        return false;
    }
    
    if (usuario.rol === 'consulta') {
        mostrarAlertaPermisos();
        return false;
    }
    
    return true;
};

// ==========================================
// INICIALIZACIÓN
// ==========================================

// Ejecutar al cargar DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 DOM cargado - Inicializando autenticación...');
    
    const usuario = verificarAutenticacion();
    
    if (usuario) {
        configurarInterfazSegunRol(usuario);
    }
});

// También ejecutar inmediatamente (por si DOMContentLoaded ya pasó)
if (document.readyState === 'loading') {
    console.log('⏳ Esperando carga del DOM...');
} else {
    console.log('⚡ DOM ya cargado - Ejecutando verificación inmediata...');
    const usuario = verificarAutenticacion();
    if (usuario) {
        configurarInterfazSegunRol(usuario);
    }
}

console.log('✅ Sistema de autenticación UGC v2.0 cargado');

})();
