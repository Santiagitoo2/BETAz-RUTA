let mapa;
let marcadores = {};
let hijoActual = null;
let intervalActualizacion = null;

const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual'));
if (!usuarioActual || usuarioActual.tipo !== 'padre') {
    window.location.href = 'login.html';
}

document.getElementById('padreNombre').innerHTML = `<i class="fas fa-user"></i> ${usuarioActual.nombre}`;

function mostrarNotificacion(mensaje, tipo) {
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion';
    notificacion.style.borderLeftColor = tipo === 'success' ? '#00d68f' : '#e74c3c';
    notificacion.innerHTML = `<i class="fas ${tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i> ${mensaje}`;
    document.body.appendChild(notificacion);
    setTimeout(() => notificacion.remove(), 3000);
}

function inicializarMapa() {
    mapa = L.map('map').setView([-0.1807, -78.4678], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(mapa);
}

function cargarHijos() {
    const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    const hijos = usuarios.filter(u => u.tipo === 'estudiante' && u.padreVinculado === usuarioActual.id);
    const container = document.getElementById('hijosList');
    
    if (hijos.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 30px;"><i class="fas fa-child fa-3x" style="color:#ccc;"></i><p>No tienes hijos vinculados</p><p><strong>Tu código de invitación:</strong> ${usuarioActual.codigoInvitacion}</p><small>Comparte el link de invitación con tu hijo</small></div>`;
        
        // Mostrar link de invitación
        const linkContainer = document.getElementById('linkContainer');
        if (linkContainer) {
            linkContainer.style.display = 'block';
            const linkCompleto = `${window.location.origin}${window.location.pathname.replace('parents-dashboard.html', 'register.html')}?codigo=${usuarioActual.codigoInvitacion}`;
            document.getElementById('linkInvitacion').value = linkCompleto;
        }
        return;
    }
    
    // Ocultar link si ya tiene hijos
    const linkContainer = document.getElementById('linkContainer');
    if (linkContainer) linkContainer.style.display = 'none';
    
    container.innerHTML = hijos.map(h => `<div class="hijo-card" onclick="seleccionarHijo(${h.id})" data-id="${h.id}"><div><i class="fas fa-user-graduate"></i> <strong>${h.nombre}</strong></div><div><i class="fas fa-school"></i> ${h.unidadEducativa}</div><div><i class="fas fa-clock"></i> Última conexión: ${h.ultimaConexion || 'No disponible'}</div></div>`).join('');
}

function copiarLink() {
    const link = document.getElementById('linkInvitacion');
    link.select();
    document.execCommand('copy');
    mostrarNotificacion('✅ Link copiado al portapapeles', 'success');
}

function seleccionarHijo(id) {
    document.querySelectorAll('.hijo-card').forEach(c => c.classList.remove('active'));
    const card = document.querySelector(`.hijo-card[data-id="${id}"]`);
    if (card) card.classList.add('active');
    hijoActual = id;
    document.getElementById('ubicacionInfo').style.display = 'block';
    if (intervalActualizacion) clearInterval(intervalActualizacion);
    intervalActualizacion = setInterval(() => actualizarUbicacionHijo(id), 5000);
    actualizarUbicacionHijo(id);
    mostrarNotificacion(`📍 Monitoreando a ${card?.querySelector('strong')?.innerText || 'hijo'}`, 'success');
}

function actualizarUbicacionHijo(hijoId) {
    const ubicacionGuardada = localStorage.getItem(`ubicacion_hijo_${hijoId}`);
    if (ubicacionGuardada) {
        const ubicacion = JSON.parse(ubicacionGuardada);
        document.getElementById('ubicacionInfo').innerHTML = `<i class="fas fa-map-marker-alt"></i> Última ubicación: ${new Date(ubicacion.timestamp).toLocaleTimeString()}<br>📍 ${ubicacion.lat.toFixed(4)}, ${ubicacion.lng.toFixed(4)}`;
        
        if (marcadores[hijoId]) {
            marcadores[hijoId].setLatLng([ubicacion.lat, ubicacion.lng]);
        } else {
            const icono = L.divIcon({
                html: `<div style="background:#e74c3c;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 0 10px #e74c3c;"><i class="fas fa-child" style="color:white;"></i></div>`,
                iconSize: [30, 30]
            });
            const nombreHijo = document.querySelector(`.hijo-card[data-id="${hijoId}"] strong`)?.innerText || 'Hijo';
            marcadores[hijoId] = L.marker([ubicacion.lat, ubicacion.lng], { icon: icono }).addTo(mapa).bindPopup(`📍 ${nombreHijo} está aquí`);
            mapa.setView([ubicacion.lat, ubicacion.lng], 15);
        }
    } else {
        document.getElementById('ubicacionInfo').innerHTML = '<i class="fas fa-map-marker-alt"></i> Esperando primera ubicación del hijo...';
    }
}

function cargarAlertas() {
    const alertas = JSON.parse(localStorage.getItem('alertasParentales') || '[]');
    const container = document.getElementById('alertasList');
    if (alertas.length === 0) {
        container.innerHTML = '<p>Sin alertas recientes</p>';
    } else {
        container.innerHTML = alertas.slice(0, 10).map(a => `<div class="alerta-item"><strong>🚨 ${a.mensaje}</strong><br><small>${a.fecha}</small></div>`).join('');
    }
}

function actualizarTodo() {
    cargarHijos();
    cargarAlertas();
    if (hijoActual) actualizarUbicacionHijo(hijoActual);
    mostrarNotificacion('✅ Datos actualizados', 'success');
}

function cerrarSesion() {
    localStorage.removeItem('usuarioActual');
    window.location.href = 'login.html';
}

// Exportar funciones globales
window.copiarLink = copiarLink;
window.actualizarTodo = actualizarTodo;
window.cerrarSesion = cerrarSesion;
window.seleccionarHijo = seleccionarHijo;

inicializarMapa();
cargarHijos();
cargarAlertas();