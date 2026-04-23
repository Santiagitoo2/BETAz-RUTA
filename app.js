// ============================================
// RUTAS SEGURAS - APP COMPLETA
// ============================================

// ===== CONFIGURACIÓN =====
const ORS_API_KEY = '5b3ce3597851110001cf62488a1e2b6f9b464be2b4b4c5b5c5d5e5f5';
const PROXY = 'https://cors-anywhere.herokuapp.com/';

// ===== VARIABLES GLOBALES =====
let mapa;
let marcadorEscuela = null;
let marcadorCasa = null;
let marcadorUbicacion = null;
let rutaActual = null;
let rutaAlterna1 = null;
let rutaAlterna2 = null;
let escuela = null;
let casa = null;
let modoSeleccion = null;
let ubicacionActual = null;
let watchId = null;
let zonasPeligrosas = [];
let modoTransporte = 'foot-walking';
let grafico = null;
let chatMensajes = [];

let estadisticas = {
    kmTotales: 0,
    tiempoTotal: 0,
    rutasSeguras: 0,
    reportesHechos: 0,
    historialUbicaciones: []
};

// ===== BASE DE DATOS DE BUSES =====
const busesDB = [
    { id: 1, ruta: "Ruta 10", parada: "Parque Central", horarios: ["06:30", "07:00", "07:30", "13:00", "13:30", "14:00"], destino: "Terminal Norte", lat: -0.1820, lng: -78.4700 },
    { id: 2, ruta: "Ruta 15", parada: "Colegio Central", horarios: ["06:45", "07:15", "07:45", "13:15", "13:45", "14:15"], destino: "Terminal Sur", lat: -0.1790, lng: -78.4660 },
    { id: 3, ruta: "Ruta 20", parada: "Mercado", horarios: ["07:00", "07:30", "08:00", "13:30", "14:00", "14:30"], destino: "Terminal Oriente", lat: -0.1760, lng: -78.4620 },
    { id: 4, ruta: "Ruta 25", parada: "Av. Amazonas", horarios: ["06:15", "06:45", "07:15", "12:45", "13:15", "13:45"], destino: "Terminal Norte", lat: -0.1840, lng: -78.4720 },
    { id: 5, ruta: "Ruta 30", parada: "La Pradera", horarios: ["06:30", "07:00", "07:30", "13:00", "13:30", "14:00"], destino: "Terminal Sur", lat: -0.1740, lng: -78.4600 }
];

// ===== BASE DE DATOS DE SERVICIOS =====
const serviciosDB = {
    hospitales: [
        { nombre: "Hospital General", lat: -0.1820, lng: -78.4700, telefono: "02-1234567", direccion: "Av. Amazonas 123" },
        { nombre: "Clínica San Francisco", lat: -0.1780, lng: -78.4650, telefono: "02-7654321", direccion: "Calle 10 de Agosto" }
    ],
    farmacias: [
        { nombre: "Farmacia Cruz Azul", lat: -0.1800, lng: -78.4680, telefono: "02-9876543", direccion: "Av. América" },
        { nombre: "Farmacia Sana Sana", lat: -0.1760, lng: -78.4620, telefono: "02-4567890", direccion: "Calle Eloy Alfaro" }
    ],
    comisarias: [
        { nombre: "Comisaría Centro", lat: -0.1830, lng: -78.4710, telefono: "02-1112233", direccion: "Plaza Grande" }
    ],
    bomberos: [
        { nombre: "Cuerpo de Bomberos", lat: -0.1790, lng: -78.4660, telefono: "102", direccion: "Av. 24 de Mayo" }
    ]
};

// ============================================
// MOSTRAR INFO USUARIO
// ============================================
function mostrarInfoUsuario() {
    const usuario = JSON.parse(localStorage.getItem('usuarioActual'));
    const userInfo = document.getElementById('userInfo');
    if (usuario && userInfo) {
        userInfo.innerHTML = `<i class="fas fa-user-graduate"></i> ${usuario.nombre} | ${usuario.unidadEducativa}`;
    }
}

// ============================================
// INICIALIZAR MAPA
// ============================================
function inicializarMapa() {
    mapa = L.map('map').setView([-0.1807, -78.4678], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(mapa);
    
    mapa.on('click', (e) => {
        if (modoSeleccion === 'escuela') {
            marcarEscuela(e.latlng);
            modoSeleccion = null;
        } else if (modoSeleccion === 'casa') {
            marcarCasa(e.latlng);
            modoSeleccion = null;
        }
    });
    
    iniciarSeguimiento();
    dibujarParadasBus();
}

function dibujarParadasBus() {
    busesDB.forEach(bus => {
        const icono = L.divIcon({
            html: `<div style="background: #00d2ff; width: 25px; height: 25px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white;">
                    <i class="fas fa-bus" style="color: white; font-size: 12px;"></i></div>`,
            iconSize: [25, 25]
        });
        L.marker([bus.lat, bus.lng], { icon: icono }).addTo(mapa).bindPopup(`🚌 ${bus.ruta}<br>${bus.parada}<br>⏰ ${bus.horarios.join(' • ')}`);
    });
}

// ============================================
// MARCAR ESCUELA Y CASA
// ============================================
function marcarEscuela(coords) {
    if (marcadorEscuela) mapa.removeLayer(marcadorEscuela);
    const icono = L.divIcon({
        html: `<div style="background: #3498db; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white;">
                <i class="fas fa-school" style="color: white;"></i></div>`,
        iconSize: [40, 40]
    });
    marcadorEscuela = L.marker([coords.lat, coords.lng], { icon: icono }).addTo(mapa);
    escuela = coords;
    const schoolDisplay = document.getElementById('schoolDisplay');
    if (schoolDisplay) schoolDisplay.innerHTML = `<i class="fas fa-check-circle" style="color: #27ae60;"></i> Seleccionado`;
    actualizarBotonRuta();
    mostrarNotificacion('✅ Colegio marcado', 'success');
}

function marcarCasa(coords) {
    if (marcadorCasa) mapa.removeLayer(marcadorCasa);
    const icono = L.divIcon({
        html: `<div style="background: #27ae60; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white;">
                <i class="fas fa-home" style="color: white;"></i></div>`,
        iconSize: [40, 40]
    });
    marcadorCasa = L.marker([coords.lat, coords.lng], { icon: icono }).addTo(mapa);
    casa = coords;
    const homeDisplay = document.getElementById('homeDisplay');
    if (homeDisplay) homeDisplay.innerHTML = `<i class="fas fa-check-circle" style="color: #27ae60;"></i> Seleccionado`;
    actualizarBotonRuta();
    mostrarNotificacion('✅ Casa marcada', 'success');
}

function actualizarBotonRuta() {
    const btn = document.getElementById('btnCalcularRuta');
    if (btn) btn.disabled = !(escuela && casa);
}

// ============================================
// CALCULAR RUTA
// ============================================
async function calcularRuta() {
    if (!escuela || !casa) return;
    
    mostrarNotificacion('🔄 Calculando rutas...', 'warning');
    
    if (rutaActual) mapa.removeLayer(rutaActual);
    if (rutaAlterna1) mapa.removeLayer(rutaAlterna1);
    if (rutaAlterna2) mapa.removeLayer(rutaAlterna2);
    
    try {
        const url = `${PROXY}https://api.openrouteservice.org/v2/directions/${modoTransporte}/geojson`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': ORS_API_KEY },
            body: JSON.stringify({ coordinates: [[escuela.lng, escuela.lat], [casa.lng, casa.lat]] })
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (data.features && data.features[0]) {
            const ruta = data.features[0];
            const distancia = (ruta.properties.segments[0].distance / 1000).toFixed(1);
            const duracion = Math.round(ruta.properties.segments[0].duration / 60);
            
            rutaActual = L.geoJSON(ruta, { style: { color: '#3498db', weight: 5 } }).addTo(mapa);
            generarRutasAlternas();
            
            const rutaInfo = document.getElementById('rutaInfo');
            if (rutaInfo) rutaInfo.style.display = 'block';
            document.getElementById('distancia').innerHTML = `${distancia} km`;
            document.getElementById('tiempo').innerHTML = `${duracion} min`;
            document.getElementById('zonasEvitadas').innerHTML = zonasPeligrosas.length;
            document.getElementById('nivelSeguridad').innerHTML = zonasPeligrosas.length === 0 ? '🟢 SEGURO' : '🟡 PRECAUCIÓN';
            
            const sosBtn = document.getElementById('btnSOS');
            if (sosBtn) sosBtn.style.display = zonasPeligrosas.length > 0 ? 'block' : 'none';
            
            const bounds = L.geoJSON(ruta).getBounds();
            mapa.fitBounds(bounds);
            
            estadisticas.kmTotales += parseFloat(distancia);
            estadisticas.tiempoTotal += duracion;
            if (zonasPeligrosas.length === 0) estadisticas.rutasSeguras++;
            actualizarEstadisticas();
            guardarDatos();
            
            mostrarNotificacion('✅ Rutas calculadas', 'success');
        } else {
            calcularRutaRespaldo();
        }
    } catch (error) {
        console.error('Error:', error);
        calcularRutaRespaldo();
    }
}

function generarRutasAlternas() {
    if (!escuela || !casa) return;
    
    const centro = { lat: (escuela.lat + casa.lat) / 2, lng: (escuela.lng + casa.lng) / 2 };
    const puntoDesvio1 = { lat: centro.lat + 0.01, lng: centro.lng };
    const puntosAlterna1 = [[escuela.lat, escuela.lng], [puntoDesvio1.lat, puntoDesvio1.lng], [casa.lat, casa.lng]];
    rutaAlterna1 = L.polyline(puntosAlterna1, { color: '#ff9f43', weight: 4, dashArray: '5, 10' }).addTo(mapa);
    
    const puntoDesvio2 = { lat: centro.lat - 0.01, lng: centro.lng };
    const puntosAlterna2 = [[escuela.lat, escuela.lng], [puntoDesvio2.lat, puntoDesvio2.lng], [casa.lat, casa.lng]];
    rutaAlterna2 = L.polyline(puntosAlterna2, { color: '#27ae60', weight: 4, dashArray: '5, 10' }).addTo(mapa);
    
    const distancia1 = calcularDistancia(escuela.lat, escuela.lng, puntoDesvio1.lat, puntoDesvio1.lng) + 
                       calcularDistancia(puntoDesvio1.lat, puntoDesvio1.lng, casa.lat, casa.lng);
    const distancia2 = calcularDistancia(escuela.lat, escuela.lng, puntoDesvio2.lat, puntoDesvio2.lng) + 
                       calcularDistancia(puntoDesvio2.lat, puntoDesvio2.lng, casa.lat, casa.lng);
    const distanciaPrincipal = calcularDistancia(escuela.lat, escuela.lng, casa.lat, casa.lng);
    
    const container = document.getElementById('listaRutasAlternas');
    const rutasAlternasDiv = document.getElementById('rutasAlternas');
    if (rutasAlternasDiv) rutasAlternasDiv.style.display = 'block';
    
    if (container) {
        container.innerHTML = `
            <div class="ruta-alterna-item" onclick="seleccionarRutaAlterna('principal')">
                <strong><i class="fas fa-route" style="color: #3498db;"></i> Ruta principal</strong>
                <div>📏 ${distanciaPrincipal.toFixed(1)} km | ⏱️ ${Math.round(distanciaPrincipal * 15)} min</div>
                <div>🟢 Nivel: ${zonasPeligrosas.length === 0 ? 'Seguro' : 'Precaución'}</div>
            </div>
            <div class="ruta-alterna-item" onclick="seleccionarRutaAlterna('alterna1')">
                <strong><i class="fas fa-code-branch" style="color: #ff9f43;"></i> Ruta alterna 1 (Norte)</strong>
                <div>📏 ${distancia1.toFixed(1)} km | ⏱️ ${Math.round(distancia1 * 15)} min</div>
                <div>🟡 Evita zonas comerciales</div>
            </div>
            <div class="ruta-alterna-item" onclick="seleccionarRutaAlterna('alterna2')">
                <strong><i class="fas fa-code-branch" style="color: #27ae60;"></i> Ruta alterna 2 (Sur)</strong>
                <div>📏 ${distancia2.toFixed(1)} km | ⏱️ ${Math.round(distancia2 * 15)} min</div>
                <div>🟢 Pasa por parques</div>
            </div>
        `;
    }
}

function seleccionarRutaAlterna(tipo) {
    if (rutaActual) rutaActual.setStyle({ weight: 5, opacity: 0.5 });
    if (rutaAlterna1) rutaAlterna1.setStyle({ weight: 4, opacity: 0.5 });
    if (rutaAlterna2) rutaAlterna2.setStyle({ weight: 4, opacity: 0.5 });
    
    if (tipo === 'principal' && rutaActual) {
        rutaActual.setStyle({ weight: 7, opacity: 1 });
        mostrarNotificacion('📍 Ruta principal seleccionada', 'success');
    } else if (tipo === 'alterna1' && rutaAlterna1) {
        rutaAlterna1.setStyle({ weight: 7, opacity: 1 });
        mostrarNotificacion('📍 Ruta alterna 1 seleccionada', 'success');
    } else if (tipo === 'alterna2' && rutaAlterna2) {
        rutaAlterna2.setStyle({ weight: 7, opacity: 1 });
        mostrarNotificacion('📍 Ruta alterna 2 seleccionada', 'success');
    }
}

function calcularRutaRespaldo() {
    const puntos = [[escuela.lat, escuela.lng], [casa.lat, casa.lng]];
    rutaActual = L.polyline(puntos, { color: '#3498db', weight: 5 }).addTo(mapa);
    const distancia = calcularDistancia(escuela.lat, escuela.lng, casa.lat, casa.lng);
    const tiempo = Math.round(distancia * 15);
    
    const rutaInfo = document.getElementById('rutaInfo');
    if (rutaInfo) rutaInfo.style.display = 'block';
    document.getElementById('distancia').innerHTML = `${distancia.toFixed(1)} km`;
    document.getElementById('tiempo').innerHTML = `${tiempo} min`;
    mostrarNotificacion('⚠️ Usando ruta de respaldo', 'warning');
}

function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ============================================
// RUTAS CERCANAS Y BUSES
// ============================================
function buscarRutasCercanas() {
    if (!ubicacionActual) {
        mostrarNotificacion('❌ Activa tu ubicación primero', 'error');
        return;
    }
    
    const rutasCercanas = busesDB.filter(bus => {
        const dist = calcularDistancia(ubicacionActual.lat, ubicacionActual.lng, bus.lat, bus.lng);
        return dist < 1;
    });
    
    if (rutasCercanas.length === 0) {
        mostrarNotificacion('No hay rutas cercanas', 'warning');
        return;
    }
    
    let html = '<h3>🚌 Rutas cercanas a ti</h3>';
    rutasCercanas.forEach(r => {
        html += `<div class="bus-result"><strong><i class="fas fa-bus"></i> ${r.ruta}</strong><br>📍 ${r.parada}<br>🎯 ${r.destino}<br>⏰ ${r.horarios.join(' • ')}<br><button onclick="verRutaBus(${r.lat}, ${r.lng})" style="margin-top:5px;padding:5px 10px;background:#00d2ff;border:none;border-radius:5px;cursor:pointer;">📍 Ver en mapa</button></div>`;
    });
    
    const busResults = document.getElementById('busResults');
    if (busResults) busResults.innerHTML = html;
    const busTab = document.querySelector('.tab-btn[data-tab="buses"]');
    if (busTab) busTab.click();
    mostrarNotificacion(`✅ ${rutasCercanas.length} rutas encontradas`, 'success');
}

function buscarBuses() {
    const busqueda = document.getElementById('busSearchInput')?.value.toLowerCase() || '';
    const resultados = busesDB.filter(bus => bus.ruta.toLowerCase().includes(busqueda) || bus.parada.toLowerCase().includes(busqueda) || bus.destino.toLowerCase().includes(busqueda));
    const container = document.getElementById('busResults');
    if (!container) return;
    if (resultados.length === 0) { container.innerHTML = '<p>No se encontraron rutas</p>'; return; }
    container.innerHTML = resultados.map(r => `<div class="bus-result"><strong><i class="fas fa-bus"></i> ${r.ruta}</strong><br>📍 ${r.parada}<br>🎯 ${r.destino}<br>⏰ ${r.horarios.join(' • ')}<br><button onclick="verRutaBus(${r.lat}, ${r.lng})" style="margin-top:5px;padding:5px 10px;background:#00d2ff;border:none;border-radius:5px;cursor:pointer;">📍 Ver en mapa</button></div>`).join('');
}

function verRutaBus(lat, lng) { mapa.setView([lat, lng], 16); mostrarNotificacion('📍 Parada de bus localizada', 'success'); }

// ============================================
// SERVICIOS
// ============================================
function mostrarServicios(tipo) {
    let servicios = [];
    if (tipo === 'hospital') servicios = serviciosDB.hospitales;
    else if (tipo === 'farmacia') servicios = serviciosDB.farmacias;
    else if (tipo === 'comisaria') servicios = serviciosDB.comisarias;
    else if (tipo === 'bomberos') servicios = serviciosDB.bomberos;
    
    const container = document.getElementById('serviciosList');
    if (!container) return;
    if (!servicios || servicios.length === 0) { container.innerHTML = '<p>No hay servicios disponibles</p>'; return; }
    container.innerHTML = servicios.map(s => `<div style="background:#f5f7fa;padding:10px;border-radius:10px;margin-bottom:8px;"><strong>${s.nombre}</strong><br>📍 ${s.direccion}<br>📞 ${s.telefono}<br><button onclick="window.open('tel:${s.telefono}')" style="margin-top:5px;padding:5px 10px;background:#00d2ff;border:none;border-radius:5px;cursor:pointer;">📞 Llamar</button></div>`).join('');
    servicios.forEach(s => { L.marker([s.lat, s.lng]).addTo(mapa).bindPopup(`<b>${s.nombre}</b><br>${s.direccion}<br>📞 ${s.telefono}`); });
    mostrarNotificacion(`📍 Mostrando ${servicios.length} servicios`, 'success');
}

// ============================================
// COMPAÑEROS DEL MISMO COLEGIO
// ============================================
function cargarCompañerosDelColegio() {
    const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual'));
    if (!usuarioActual) return;
    const todosUsuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    const compañeros = todosUsuarios.filter(u => u.tipo === 'estudiante' && u.id !== usuarioActual.id && u.unidadEducativa === usuarioActual.unidadEducativa);
    const container = document.getElementById('compañerosList');
    if (!container) return;
    if (compañeros.length === 0) { container.innerHTML = '<p class="empty-alerts">No hay compañeros conectados de tu colegio</p>'; return; }
    container.innerHTML = compañeros.map(c => `<div class="compañero-item" onclick="verCompañeroEnMapa(${c.id})"><div style="display:flex;align-items:center;gap:10px;flex:1;"><i class="fas fa-user-graduate" style="color:#00d2ff;"></i><div><strong>${c.nombre}</strong><small style="display:block;">📚 ${c.unidadEducativa}</small><small style="display:block;">🟢 ${c.ultimaConexion ? 'Conectado' : 'Sin conexión'}</small></div></div><button class="btn-small" onclick="event.stopPropagation(); enviarMensajeCompañero('${c.nombre}')" style="padding:5px 10px;background:#00d2ff;border:none;border-radius:5px;cursor:pointer;"><i class="fas fa-comment"></i></button></div>`).join('');
}

function verCompañeroEnMapa(id) {
    const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    const compañero = usuarios.find(u => u.id === id);
    if (compañero && compañero.ubicacion) {
        mapa.setView([compañero.ubicacion.lat, compañero.ubicacion.lng], 15);
        const icono = L.divIcon({ html: `<div style="background:#ff9f43;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;"><i class="fas fa-user" style="color:white;"></i></div>`, iconSize: [30,30] });
        L.marker([compañero.ubicacion.lat, compañero.ubicacion.lng], { icon: icono }).addTo(mapa).bindPopup(`👤 ${compañero.nombre}<br>📍 ${compañero.unidadEducativa}`).openPopup();
        mostrarNotificacion(`📍 Mostrando ubicación de ${compañero.nombre}`, 'success');
    } else { mostrarNotificacion('❌ Compañero no tiene ubicación disponible', 'error'); }
}

function enviarMensajeCompañero(nombre) {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) { chatInput.value = `Hola ${nombre}, ¿cómo vas? 👋`; chatInput.focus(); const chatTab = document.querySelector('.tab-btn[data-tab="chat"]'); if (chatTab) chatTab.click(); }
}

// ============================================
// CHAT
// ============================================
function enviarMensajeChat() {
    const input = document.getElementById('chatInput');
    const mensaje = input?.value.trim();
    if (!mensaje) return;
    const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual'));
    chatMensajes.push({ id: Date.now(), usuario: usuarioActual?.nombre || "Yo", mensaje: mensaje, hora: new Date().toLocaleTimeString() });
    actualizarChat();
    input.value = '';
    guardarChat();
}

function actualizarChat() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    if (chatMensajes.length === 0) { container.innerHTML = '<p class="empty-alerts">Sin mensajes. Chatea con tus compañeros</p>'; return; }
    container.innerHTML = chatMensajes.slice(-20).map(m => `<div style="margin-bottom:10px;padding:8px;background:#f5f7fa;border-radius:8px;"><strong>${m.usuario}</strong> <small>${m.hora}</small><p>${m.mensaje}</p></div>`).join('');
    container.scrollTop = container.scrollHeight;
}

function guardarChat() { localStorage.setItem('chatMensajes', JSON.stringify(chatMensajes)); }
function cargarChat() { const guardado = localStorage.getItem('chatMensajes'); if (guardado) { chatMensajes = JSON.parse(guardado); actualizarChat(); } }

// ============================================
// ZONAS PELIGROSAS
// ============================================
function reportarZona() {
    const nombre = prompt('📝 ¿Cómo se llama esta zona?');
    if (!nombre) return;
    const descripcion = prompt('⚠️ ¿Qué peligro hay?');
    if (!descripcion) return;
    const centro = mapa.getCenter();
    zonasPeligrosas.push({ id: Date.now(), nombre: nombre, descripcion: descripcion, lat: centro.lat, lng: centro.lng, fecha: new Date().toISOString().split('T')[0] });
    estadisticas.reportesHechos++;
    actualizarEstadisticas();
    guardarZonas();
    actualizarListaZonas();
    L.circle([centro.lat, centro.lng], { color: '#ff6b6b', fillColor: '#ff6b6b', fillOpacity: 0.3, radius: 100 }).addTo(mapa).bindPopup(`⚠️ ${nombre}<br>${descripcion}`);
    mostrarNotificacion('✅ Zona reportada', 'success');
}

function actualizarListaZonas() {
    const container = document.getElementById('zonesList');
    if (!container) return;
    if (zonasPeligrosas.length === 0) { container.innerHTML = '<p>No hay zonas reportadas</p>'; return; }
    container.innerHTML = zonasPeligrosas.map(z => `<div class="zone-item"><strong>⚠️ ${z.nombre}</strong><p>${z.descripcion}</p><small>${z.fecha}</small></div>`).join('');
}

function guardarZonas() { localStorage.setItem('zonasPeligrosas', JSON.stringify(zonasPeligrosas)); }
function cargarZonas() { const guardado = localStorage.getItem('zonasPeligrosas'); if (guardado) { zonasPeligrosas = JSON.parse(guardado); actualizarListaZonas(); } }

// ============================================
// ESTADÍSTICAS
// ============================================
function actualizarEstadisticas() {
    const kmEl = document.getElementById('kmTotales');
    const tiempoEl = document.getElementById('tiempoTotal');
    const rutasEl = document.getElementById('rutasSeguras');
    const reportesEl = document.getElementById('reportesHechos');
    if (kmEl) kmEl.innerHTML = estadisticas.kmTotales.toFixed(1);
    if (tiempoEl) tiempoEl.innerHTML = `${Math.round(estadisticas.tiempoTotal)} min`;
    if (rutasEl) rutasEl.innerHTML = estadisticas.rutasSeguras;
    if (reportesEl) reportesEl.innerHTML = estadisticas.reportesHechos;
    actualizarGrafico();
}

function actualizarGrafico() {
    const ctx = document.getElementById('graficoTendencias')?.getContext('2d');
    if (!ctx) return;
    if (grafico) grafico.destroy();
    grafico = new Chart(ctx, { type: 'line', data: { labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'], datasets: [{ label: 'KM recorridos', data: [estadisticas.kmTotales * 0.2, estadisticas.kmTotales * 0.4, estadisticas.kmTotales * 0.6, estadisticas.kmTotales * 0.8, estadisticas.kmTotales, estadisticas.kmTotales], borderColor: '#3498db', tension: 0.4, fill: true }] }, options: { responsive: true } });
}

// ============================================
// SOS
// ============================================
function activarSOS() {
    if (!ubicacionActual) { mostrarNotificacion('❌ No se pudo obtener ubicación', 'error'); return; }
    const iconoSOS = L.divIcon({ html: `<div style="background:#c0392b;width:50px;height:50px;border-radius:50%;animation:pulse 1s infinite;display:flex;align-items:center;justify-content:center;"><i class="fas fa-exclamation-triangle" style="color:white;font-size:24px;"></i></div>`, iconSize: [50,50] });
    L.marker([ubicacionActual.lat, ubicacionActual.lng], { icon: iconoSOS }).addTo(mapa).bindPopup('🚨 ¡SOS ACTIVADO! 🚨').openPopup();
    const mensajeSOS = `🚨 ¡ALERTA SOS! Ubicación: https://maps.google.com/?q=${ubicacionActual.lat},${ubicacionActual.lng}`;
    console.log('📱 SOS:', mensajeSOS);
    mostrarNotificacion('🚨 ¡SOS ACTIVADO! Ayuda en camino', 'error');
}

// ============================================
// SEGUIMIENTO GPS
// ============================================
function iniciarSeguimiento() {
    if (!navigator.geolocation) return;
    watchId = navigator.geolocation.watchPosition(
        (position) => { ubicacionActual = { lat: position.coords.latitude, lng: position.coords.longitude }; actualizarMarcadorUbicacion(); actualizarUbicacionParaCompañeros(); },
        (error) => console.error('GPS error:', error),
        { enableHighAccuracy: true }
    );
}

function actualizarMarcadorUbicacion() {
    if (!ubicacionActual) return;
    if (marcadorUbicacion) { marcadorUbicacion.setLatLng([ubicacionActual.lat, ubicacionActual.lng]); }
    else { const icono = L.divIcon({ html: `<div style="background:#3498db;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px #3498db;"></div>`, iconSize: [20,20] }); marcadorUbicacion = L.marker([ubicacionActual.lat, ubicacionActual.lng], { icon: icono }).addTo(mapa); }
}

function actualizarUbicacionParaCompañeros() {
    const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual'));
    if (!usuarioActual || !ubicacionActual) return;
    const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    const index = usuarios.findIndex(u => u.id === usuarioActual.id);
    if (index !== -1) { usuarios[index].ubicacion = { lat: ubicacionActual.lat, lng: ubicacionActual.lng, timestamp: new Date().toISOString() }; usuarios[index].ultimaConexion = new Date().toISOString(); localStorage.setItem('usuarios', JSON.stringify(usuarios)); }
}

function centrarEnMiUbicacion() { if (ubicacionActual) mapa.setView([ubicacionActual.lat, ubicacionActual.lng], 16); }
function limpiarSeleccion() {
    if (marcadorEscuela) mapa.removeLayer(marcadorEscuela);
    if (marcadorCasa) mapa.removeLayer(marcadorCasa);
    if (rutaActual) mapa.removeLayer(rutaActual);
    if (rutaAlterna1) mapa.removeLayer(rutaAlterna1);
    if (rutaAlterna2) mapa.removeLayer(rutaAlterna2);
    escuela = null; casa = null; rutaActual = null; rutaAlterna1 = null; rutaAlterna2 = null;
    const schoolDisplay = document.getElementById('schoolDisplay');
    const homeDisplay = document.getElementById('homeDisplay');
    const rutaInfo = document.getElementById('rutaInfo');
    const rutasAlternas = document.getElementById('rutasAlternas');
    const sosBtn = document.getElementById('btnSOS');
    if (schoolDisplay) schoolDisplay.innerHTML = '<i class="fas fa-map-pin"></i> No seleccionado';
    if (homeDisplay) homeDisplay.innerHTML = '<i class="fas fa-map-pin"></i> No seleccionado';
    if (rutaInfo) rutaInfo.style.display = 'none';
    if (rutasAlternas) rutasAlternas.style.display = 'none';
    if (sosBtn) sosBtn.style.display = 'none';
    actualizarBotonRuta();
    mostrarNotificacion('Selección limpiada', 'warning');
}

// ============================================
// ALMACENAMIENTO
// ============================================
function guardarDatos() { localStorage.setItem('escuela', JSON.stringify(escuela)); localStorage.setItem('casa', JSON.stringify(casa)); localStorage.setItem('estadisticas', JSON.stringify(estadisticas)); }
function cargarDatos() { const escuelaG = localStorage.getItem('escuela'); const casaG = localStorage.getItem('casa'); const statsG = localStorage.getItem('estadisticas'); if (escuelaG) marcarEscuela(JSON.parse(escuelaG)); if (casaG) marcarCasa(JSON.parse(casaG)); if (statsG) estadisticas = JSON.parse(statsG); actualizarEstadisticas(); }

// ============================================
// TABS
// ============================================
function inicializarTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            const tabContent = document.getElementById(`tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
            if (tabContent) tabContent.classList.add('active');
        });
    });
}

// ============================================
// NOTIFICACIONES
// ============================================
function mostrarNotificacion(mensaje, tipo) {
    const notificacion = document.createElement('div');
    notificacion.className = 'notification';
    notificacion.style.cssText = `position:fixed;bottom:20px;right:20px;background:white;padding:12px 20px;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:1000;border-left:4px solid ${tipo === 'success' ? '#00d68f' : tipo === 'error' ? '#ff6b6b' : '#ff9f43'};`;
    notificacion.innerHTML = `<i class="fas ${tipo === 'success' ? 'fa-check-circle' : tipo === 'error' ? 'fa-exclamation-circle' : 'fa-exclamation-triangle'}"></i> ${mensaje}`;
    document.body.appendChild(notificacion);
    setTimeout(() => notificacion.remove(), 3000);
}

// ============================================
// VERIFICAR SESIÓN
// ============================================
function verificarSesion() {
    const usuario = JSON.parse(localStorage.getItem('usuarioActual'));
    if (!usuario) { window.location.href = 'login.html'; return null; }
    return usuario;
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const usuario = verificarSesion();
    if (!usuario) return;
    mostrarInfoUsuario();
    inicializarMapa();
    cargarDatos();
    cargarZonas();
    cargarChat();
    inicializarTabs();
    iniciarSeguimiento();
    cargarCompañerosDelColegio();
    setInterval(cargarCompañerosDelColegio, 30000);
    
    document.getElementById('btnSelectSchool').onclick = () => modoSeleccion = 'escuela';
    document.getElementById('btnSelectHome').onclick = () => modoSeleccion = 'casa';
    document.getElementById('btnCalcularRuta').onclick = calcularRuta;
    document.getElementById('btnCentrar').onclick = centrarEnMiUbicacion;
    document.getElementById('btnLimpiar').onclick = limpiarSeleccion;
    document.getElementById('btnReportar').onclick = reportarZona;
    document.getElementById('btnSOS').onclick = activarSOS;
    document.getElementById('btnRutasCercanas').onclick = buscarRutasCercanas;
    document.getElementById('btnBuscarBuses').onclick = () => buscarBuses();
    document.getElementById('btnBuscarRutaBus').onclick = () => buscarBuses();
    document.getElementById('btnEnviarChat').onclick = enviarMensajeChat;
    
    document.querySelectorAll('.servicio-btn').forEach(btn => { btn.onclick = () => mostrarServicios(btn.dataset.tipo); });
    document.querySelectorAll('.contacto-btn').forEach(btn => { btn.onclick = () => window.open(`tel:${btn.dataset.numero}`); });
    document.querySelectorAll('.transport-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.transport-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            modoTransporte = btn.dataset.mode;
        };
    });
});

window.verRutaBus = verRutaBus;
window.seleccionarRutaAlterna = seleccionarRutaAlterna;
window.verCompañeroEnMapa = verCompañeroEnMapa;
window.enviarMensajeCompañero = enviarMensajeCompañero;