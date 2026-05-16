// Variables Globales
let escuelas = [];
let map = null;
let markers = [];
let currentFilter = {
    estado: { rojo: true, amarillo: true, verde: true },
    prioritarias: false
};
let currentView = 'mapa';
let calendarDate = new Date();

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    initMapa();
    actualizarTodo();
    
    // Event Listeners para navegación
    document.getElementById('nav-mapa').addEventListener('click', () => navegarA('mapa'));
    document.getElementById('nav-planilla').addEventListener('click', () => navegarA('planilla'));
    document.getElementById('nav-estadisticas').addEventListener('click', () => navegarA('estadisticas'));
    document.getElementById('nav-importar').addEventListener('click', () => navegarA('importar'));
    document.getElementById('nav-calendario').addEventListener('click', () => navegarA('calendario'));
});

// --- DATOS ---

function cargarDatos() {
    const data = localStorage.getItem('escuelas_data');
    if (data) {
        escuelas = JSON.parse(data);
    } else {
        cargarDatosDemo();
    }
}

function guardarLocal() {
    localStorage.setItem('escuelas_data', JSON.stringify(escuelas));
}

function cargarDatosDemo() {
    if (escuelas.length > 0) return;
    escuelas = [
        {
            id: 1,
            escuela: "21",
            nombre: "Juan José de Urquiza",
            direccion: "Av. Olmos 123",
            localidad: "Córdoba",
            departamento: "Capital",
            tipo: "Primaria",
            telefono: "0351-4222222",
            lat: -31.4135,
            lng: -64.1811,
            estado: "verde",
            prioritaria: true,
            fechaCoordinada: "2026-05-10T09:00",
            fechaRealizada: "2026-05-10T10:30",
            charlistas: "Carlos G., Ana M.",
            alumnos: 45,
            imagenGrupo: "",
            imagenFormulario: "",
            observaciones: "Excelente participación."
        },
        {
            id: 2,
            escuela: "145",
            nombre: "Dante Alighieri",
            direccion: "Bv. San Juan 450",
            localidad: "Córdoba",
            departamento: "Capital",
            tipo: "Primaria",
            telefono: "0351-4333333",
            lat: -31.4182,
            lng: -64.1885,
            estado: "amarillo",
            prioritaria: false,
            fechaCoordinada: "2026-05-20T11:00",
            fechaRealizada: "",
            charlistas: "",
            alumnos: 0,
            imagenGrupo: "",
            imagenFormulario: "",
            observaciones: ""
        },
        {
            id: 3,
            escuela: "8",
            nombre: "Sarmiento",
            direccion: "Ruta 9 km 200",
            localidad: "Pilar",
            departamento: "Río Segundo",
            tipo: "Secundaria",
            telefono: "03572-471111",
            lat: -31.6783,
            lng: -63.8794,
            estado: "rojo",
            prioritaria: true,
            fechaCoordinada: "",
            fechaRealizada: "",
            charlistas: "",
            alumnos: 0,
            imagenGrupo: "",
            imagenFormulario: "",
            observaciones: "Llamar por la tarde."
        }
    ];
    guardarLocal();
}

// --- MAPA ---

function initMapa() {
    map = L.map('map').setView([-31.4135, -64.1811], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Re-centrar al cargar
    setTimeout(() => {
        ajustarVistaMapa();
    }, 500);
}

function crearIcono(estado, prioritaria) {
    let color = estado === 'verde' ? '#16a34a' : (estado === 'amarillo' ? '#eab308' : '#ef4444');
    let borderColor = prioritaria ? '#9333ea' : 'rgba(0,0,0,0.2)';
    let borderWeight = prioritaria ? '4px' : '2px';
    let star = prioritaria ? '<span style="position:absolute; top:-8px; right:-8px; font-size:14px;">⭐</span>' : '';

    const html = `
        <div class="pin-marker pin-${estado} ${prioritaria ? 'pin-prioritaria' : ''}" 
             style="background-color: ${color}; border: ${borderWeight} solid ${borderColor}; position: relative;">
            ${star}
        </div>
    `;
    return L.divIcon({
        html: html,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });
}

function renderMapa() {
    // Limpiar markers anteriores
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    const filtradas = obtenerEscuelasFiltradas();

    filtradas.forEach(esc => {
        if (esc.lat && esc.lng) {
            const marker = L.marker([esc.lat, esc.lng], { icon: crearIcono(esc.estado, esc.prioritaria) })
                .addTo(map)
                .on('click', () => mostrarDetalle(esc.id));
            markers.push(marker);
        }
    });

    if (filtradas.length > 0) {
        ajustarVistaMapa();
    }
}

function ajustarVistaMapa() {
    if (markers.length === 0) return;
    const group = new L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.1));
}

// --- FILTROS ---

function filtrarEstado(estado) {
    currentFilter.estado[estado] = !currentFilter.estado[estado];
    
    // Si activamos uno de estos, desactivamos "Todas" si no coincide
    const btn = document.getElementById(`btn-filter-${estado}`);
    if (currentFilter.estado[estado]) {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }

    // Si todos están activos, "Todas" debería estar activo
    const todasBtn = document.getElementById('btn-filter-todas');
    if (currentFilter.estado.rojo && currentFilter.estado.amarillo && currentFilter.estado.verde) {
        todasBtn.classList.add('active');
    } else {
        todasBtn.classList.remove('active');
    }

    renderMapa();
}

function filtrarTodas() {
    currentFilter.estado.rojo = true;
    currentFilter.estado.amarillo = true;
    currentFilter.estado.verde = true;
    currentFilter.prioritarias = false;

    document.getElementById('btn-filter-rojo').classList.add('active');
    document.getElementById('btn-filter-amarillo').classList.add('active');
    document.getElementById('btn-filter-verde').classList.add('active');
    document.getElementById('btn-filter-todas').classList.add('active');
    document.getElementById('btn-filter-prioritarias').classList.remove('active');

    renderMapa();
}

function filtrarPrioritarias() {
    currentFilter.prioritarias = !currentFilter.prioritarias;
    const btn = document.getElementById('btn-filter-prioritarias');
    const todasBtn = document.getElementById('btn-filter-todas');

    if (currentFilter.prioritarias) {
        btn.classList.add('active');
        todasBtn.classList.remove('active');
    } else {
        btn.classList.remove('active');
        todasBtn.classList.add('active');
    }

    renderMapa();
}

function obtenerEscuelasFiltradas() {
    return escuelas.filter(esc => {
        const matchEstado = currentFilter.estado[esc.estado];
        const matchPrioritaria = currentFilter.prioritarias ? esc.prioritaria : true;
        return matchEstado && matchPrioritaria;
    });
}

// --- NAVEGACION ---

function navegarA(view) {
    currentView = view;
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.getElementById(`nav-${view}`).classList.add('active');

    // Show selected view
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${view}`).classList.add('active');

    if (view === 'mapa') {
        setTimeout(() => map.invalidateSize(), 100);
    }
    
    // Cerrar sidebar en mobile si está abierto
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
    }

    actualizarTodo();
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// --- DETALLE ---

function mostrarDetalle(id) {
    const esc = escuelas.find(e => e.id == id);
    if (!esc) return;

    const content = document.getElementById('detail-content');
    const empty = document.getElementById('detail-empty');

    empty.classList.add('hidden');
    content.classList.remove('hidden');

    let badgeEstado = `<span class="detail-badge badge-${esc.estado}">${textoEstado(esc.estado)}</span>`;
    let badgePrior = esc.prioritaria ? `<span class="detail-badge badge-prioritaria">⭐ Túnicas en Red</span>` : '';

    content.innerHTML = `
        <div class="detail-school-num">Escuela N° ${esc.escuela}</div>
        <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:10px;">
            ${badgeEstado} ${badgePrior}
        </div>
        <div class="detail-field"><strong>Nombre:</strong> ${esc.nombre}</div>
        <div class="detail-field"><strong>Dirección:</strong> ${esc.direccion || '-'}</div>
        <div class="detail-field"><strong>Localidad:</strong> ${esc.localidad || '-'} (${esc.departamento || '-'})</div>
        <div class="detail-field"><strong>Tipo:</strong> ${esc.tipo}</div>
        <div class="detail-field"><strong>Teléfono:</strong> ${esc.telefono || '-'}</div>
        
        <hr class="detail-divider">
        
        ${esc.fechaCoordinada ? `<div class="detail-field"><strong>Fecha Coordinada:</strong> ${formatearFecha(esc.fechaCoordinada)}</div>` : ''}
        ${esc.fechaRealizada ? `<div class="detail-field"><strong>Fecha Realizada:</strong> ${formatearFecha(esc.fechaRealizada)}</div>` : ''}
        ${esc.charlistas ? `<div class="detail-field"><strong>Charlistas:</strong> ${esc.charlistas}</div>` : ''}
        ${esc.alumnos ? `<div class="detail-field"><strong>Alumnos:</strong> ${esc.alumnos}</div>` : ''}
        
        <div class="detail-field" style="margin-top:5px;">
            ${esc.imagenGrupo ? `<a href="${esc.imagenGrupo}" target="_blank">📸 Imagen Grupo</a>` : ''}
            ${esc.imagenGrupo && esc.imagenFormulario ? ' | ' : ''}
            ${esc.imagenFormulario ? `<a href="${esc.imagenFormulario}" target="_blank">📄 Formulario</a>` : ''}
        </div>

        ${esc.observaciones ? `<div class="detail-field"><strong>Obs:</strong> ${esc.observaciones}</div>` : ''}

        <div class="detail-actions">
            ${esc.estado === 'rojo' ? `<button class="btn btn-amarillo btn-sm" onclick="coordinarEscuela(${esc.id})">🗓️ Coordinar charla</button>` : ''}
            ${esc.estado === 'amarillo' ? `<button class="btn btn-verde btn-sm" onclick="marcarRealizada(${esc.id})">✅ Marcar como realizada</button>` : ''}
            <button class="btn btn-primary btn-sm" onclick="editarEscuela(${esc.id})">✏️ Editar datos</button>
            <button class="btn btn-danger btn-sm" onclick="eliminarEscuela(${esc.id})">🗑️ Eliminar</button>
        </div>
    `;
}

function cerrarDetalle() {
    document.getElementById('detail-content').classList.add('hidden');
    document.getElementById('detail-empty').classList.remove('hidden');
}

// --- MODALES ---

function abrirModalAgregar() {
    document.getElementById('modal-title').innerText = "Agregar escuela";
    document.getElementById('form-escuela').reset();
    document.getElementById('form-id').value = "";
    document.getElementById('modal-overlay').classList.remove('hidden');
}

function cerrarModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
}

function cerrarModalOverlay(e) {
    if (e.target.id === 'modal-overlay') cerrarModal();
}

function guardarEscuela(e) {
    e.preventDefault();
    const id = document.getElementById('form-id').value;
    
    const nuevaEsc = {
        id: id ? parseInt(id) : Date.now(),
        escuela: document.getElementById('form-escuela-num').value,
        nombre: document.getElementById('form-nombre').value,
        direccion: document.getElementById('form-direccion').value,
        localidad: document.getElementById('form-localidad').value,
        departamento: document.getElementById('form-departamento').value,
        tipo: document.getElementById('form-tipo').value,
        telefono: document.getElementById('form-telefono').value,
        lat: parseFloat(document.getElementById('form-lat').value),
        lng: parseFloat(document.getElementById('form-lng').value),
        estado: document.getElementById('form-estado').value,
        fechaCoordinada: document.getElementById('form-fecha-coordinada').value,
        fechaRealizada: document.getElementById('form-fecha-realizada').value,
        charlistas: document.getElementById('form-charlistas').value,
        alumnos: parseInt(document.getElementById('form-alumnos').value) || 0,
        imagenGrupo: document.getElementById('form-imagen-grupo').value,
        imagenFormulario: document.getElementById('form-imagen-formulario').value,
        prioritaria: document.getElementById('form-prioritaria').checked,
        observaciones: document.getElementById('form-observaciones').value
    };

    if (id) {
        const index = escuelas.findIndex(esc => esc.id == id);
        escuelas[index] = nuevaEsc;
    } else {
        escuelas.push(nuevaEsc);
    }

    guardarLocal();
    cerrarModal();
    actualizarTodo();
    mostrarDetalle(nuevaEsc.id);
}

function editarEscuela(id) {
    const esc = escuelas.find(e => e.id == id);
    if (!esc) return;

    document.getElementById('modal-title').innerText = "Editar escuela";
    document.getElementById('form-id').value = esc.id;
    document.getElementById('form-escuela-num').value = esc.escuela;
    document.getElementById('form-nombre').value = esc.nombre;
    document.getElementById('form-direccion').value = esc.direccion;
    document.getElementById('form-localidad').value = esc.localidad;
    document.getElementById('form-departamento').value = esc.departamento;
    document.getElementById('form-tipo').value = esc.tipo;
    document.getElementById('form-telefono').value = esc.telefono;
    document.getElementById('form-lat').value = esc.lat;
    document.getElementById('form-lng').value = esc.lng;
    document.getElementById('form-estado').value = esc.estado;
    document.getElementById('form-fecha-coordinada').value = esc.fechaCoordinada || '';
    document.getElementById('form-fecha-realizada').value = esc.fechaRealizada || '';
    document.getElementById('form-charlistas').value = esc.charlistas || '';
    document.getElementById('form-alumnos').value = esc.alumnos || 0;
    document.getElementById('form-imagen-grupo').value = esc.imagenGrupo || '';
    document.getElementById('form-imagen-formulario').value = esc.imagenFormulario || '';
    document.getElementById('form-prioritaria').checked = esc.prioritaria;
    document.getElementById('form-observaciones').value = esc.observaciones || '';

    document.getElementById('modal-overlay').classList.remove('hidden');
}

function eliminarEscuela(id) {
    if (confirm("¿Estás seguro de que deseas eliminar esta escuela?")) {
        escuelas = escuelas.filter(e => e.id != id);
        guardarLocal();
        cerrarDetalle();
        actualizarTodo();
    }
}

// --- FLUJO ESTADOS ---

function coordinarEscuela(id) {
    document.getElementById('coordinar-id').value = id;
    document.getElementById('coordinar-fecha').value = new Date().toISOString().slice(0, 16);
    document.getElementById('modal-coordinar-overlay').classList.remove('hidden');
}

function cerrarModalCoordinar(e, force = false) {
    if (force || (e && e.target.id === 'modal-coordinar-overlay')) {
        document.getElementById('modal-coordinar-overlay').classList.add('hidden');
    }
}

function confirmarCoordenar() {
    const id = document.getElementById('coordinar-id').value;
    const fecha = document.getElementById('coordinar-fecha').value;
    if (!fecha) return alert("Seleccioná una fecha");

    const index = escuelas.findIndex(e => e.id == id);
    escuelas[index].estado = 'amarillo';
    escuelas[index].fechaCoordinada = fecha;
    
    guardarLocal();
    cerrarModalCoordinar(null, true);
    actualizarTodo();
    mostrarDetalle(id);
}

function marcarRealizada(id) {
    const esc = escuelas.find(e => e.id == id);
    document.getElementById('realizar-id').value = id;
    document.getElementById('realizar-fecha').value = esc.fechaCoordinada || new Date().toISOString().slice(0, 16);
    document.getElementById('realizar-charlistas').value = "";
    document.getElementById('realizar-alumnos').value = "";
    document.getElementById('modal-realizar-overlay').classList.remove('hidden');
}

function cerrarModalRealizar(e, force = false) {
    if (force || (e && e.target.id === 'modal-realizar-overlay')) {
        document.getElementById('modal-realizar-overlay').classList.add('hidden');
    }
}

function confirmarRealizada() {
    const id = document.getElementById('realizar-id').value;
    const fecha = document.getElementById('realizar-fecha').value;
    const charlistas = document.getElementById('realizar-charlistas').value;
    const alumnos = document.getElementById('realizar-alumnos').value;

    if (!fecha || !charlistas || !alumnos) return alert("Completá todos los campos");

    const index = escuelas.findIndex(e => e.id == id);
    escuelas[index].estado = 'verde';
    escuelas[index].fechaRealizada = fecha;
    escuelas[index].charlistas = charlistas;
    escuelas[index].alumnos = parseInt(alumnos);

    guardarLocal();
    cerrarModalRealizar(null, true);
    actualizarTodo();
    mostrarDetalle(id);
}

// --- PLANILLA ---

function renderTabla() {
    const tbody = document.getElementById('planilla-tbody');
    const search = document.getElementById('planilla-search').value.toLowerCase();
    
    const filtradas = escuelas.filter(esc => 
        esc.nombre.toLowerCase().includes(search) || 
        esc.escuela.toLowerCase().includes(search) ||
        esc.localidad.toLowerCase().includes(search)
    );

    tbody.innerHTML = filtradas.map(esc => `
        <tr onclick="seleccionarFila(${esc.id})">
            <td>${esc.escuela}</td>
            <td>${esc.nombre}</td>
            <td>${esc.direccion || ''}</td>
            <td>${esc.tipo}</td>
            <td>${esc.telefono || ''}</td>
            <td><span class="pill pill-${esc.estado}">${textoEstado(esc.estado)}</span></td>
            <td>${esc.prioritaria ? '⭐' : ''}</td>
            <td>${esc.fechaCoordinada ? esc.fechaCoordinada.split('T')[0] : '-'}</td>
            <td>${esc.fechaRealizada ? esc.fechaRealizada.split('T')[0] : '-'}</td>
            <td>${esc.alumnos || 0}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); editarEscuela(${esc.id})">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); eliminarEscuela(${esc.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function seleccionarFila(id) {
    navegarA('mapa');
    mostrarDetalle(id);
}

// --- STATS ---

function actualizarStats() {
    const total = escuelas.length;
    const realizadas = escuelas.filter(e => e.estado === 'verde').length;
    const coordinadas = escuelas.filter(e => e.estado === 'amarillo').length;
    const sincoordinar = escuelas.filter(e => e.estado === 'rojo').length;
    const prioritarias = escuelas.filter(e => e.prioritaria).length;
    const alumnos = escuelas.reduce((sum, e) => sum + (e.alumnos || 0), 0);

    // Update KPI section
    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-realizadas').innerText = realizadas;
    document.getElementById('stat-coordinadas').innerText = coordinadas;
    document.getElementById('stat-sincoordinar').innerText = sincoordinar;
    document.getElementById('stat-prioritarias').innerText = prioritarias;
    document.getElementById('stat-alumnos').innerText = alumnos;

    // Update Statistics view
    if (currentView === 'estadisticas') {
        document.getElementById('est-total').innerText = total;
        document.getElementById('est-realizadas').innerText = realizadas;
        document.getElementById('est-coordinadas').innerText = coordinadas;
        document.getElementById('est-sincoordinar').innerText = sincoordinar;
        document.getElementById('est-prioritarias').innerText = prioritarias;
        document.getElementById('est-alumnos').innerText = alumnos;

        const pctReal = total > 0 ? Math.round((realizadas / total) * 100) : 0;
        const pctCoord = total > 0 ? Math.round((coordinadas / total) * 100) : 0;
        const pctSin = total > 0 ? Math.round((sincoordinar / total) * 100) : 0;

        document.getElementById('progress-pct-realizadas').innerText = pctReal + '%';
        document.getElementById('progress-fill-realizadas').style.width = pctReal + '%';
        
        document.getElementById('progress-pct-coordinadas').innerText = pctCoord + '%';
        document.getElementById('progress-fill-coordinadas').style.width = pctCoord + '%';
        
        document.getElementById('progress-pct-sincoordinar').innerText = pctSin + '%';
        document.getElementById('progress-fill-sincoordinar').style.width = pctSin + '%';
    }
}

// --- IMPORT / EXPORT ---

function exportarJSON() {
    const dataStr = JSON.stringify(escuelas, null, 2);
    document.getElementById('json-preview').value = dataStr;
    
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "escuelas.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importarJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (Array.isArray(data)) {
                escuelas = data;
                guardarLocal();
                actualizarTodo();
                const status = document.getElementById('import-status');
                status.innerText = "¡Datos importados con éxito!";
                status.className = "import-status ok";
                status.classList.remove('hidden');
                setTimeout(() => status.classList.add('hidden'), 3000);
            } else {
                throw new Error("Formato inválido");
            }
        } catch (err) {
            const status = document.getElementById('import-status');
            status.innerText = "Error al importar el archivo.";
            status.className = "import-status err";
            status.classList.remove('hidden');
        }
    };
    reader.readAsText(file);
}

function borrarTodo() {
    if (confirm("¿Estás seguro? Se borrarán todos los datos permanentemente.")) {
        escuelas = [];
        localStorage.removeItem('escuelas_data');
        actualizarTodo();
        cerrarDetalle();
        alert("Datos eliminados.");
    }
}

// --- CALENDARIO ---

function renderCalendario() {
    const grid = document.getElementById('calendar-grid');
    const label = document.getElementById('cal-month-label');
    
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    label.innerText = `${monthNames[month]} ${year}`;

    // Limpiar celdas anteriores (manteniendo headers)
    const headers = Array.from(grid.querySelectorAll('.cal-day-header'));
    grid.innerHTML = "";
    headers.forEach(h => grid.appendChild(h));

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    // Celdas vacías mes anterior
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay; i > 0; i--) {
        const cell = document.createElement('div');
        cell.className = 'cal-cell other-month';
        cell.innerHTML = `<span class="cal-day-num">${prevMonthDays - i + 1}</span>`;
        grid.appendChild(cell);
    }

    // Días del mes
    for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        cell.className = 'cal-cell';
        if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            cell.classList.add('today');
        }

        cell.innerHTML = `<span class="cal-day-num">${d}</span>`;

        // Buscar eventos (charlas coordinadas o realizadas)
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        escuelas.forEach(esc => {
            // Evento Coordinado
            if (esc.fechaCoordinada && esc.fechaCoordinada.startsWith(dateStr)) {
                const ev = document.createElement('div');
                ev.className = 'cal-event cal-event-coordinada';
                ev.innerText = `Esc ${esc.escuela}`;
                ev.onclick = (e) => { e.stopPropagation(); abrirDesdeCalendario(esc.id); };
                cell.appendChild(ev);
            }
            // Evento Realizado (si es distinto a la coordinada, o para reforzar)
            if (esc.fechaRealizada && esc.fechaRealizada.startsWith(dateStr) && esc.fechaRealizada !== esc.fechaCoordinada) {
                const ev = document.createElement('div');
                ev.className = 'cal-event cal-event-realizada';
                ev.innerText = `Esc ${esc.escuela}`;
                ev.onclick = (e) => { e.stopPropagation(); abrirDesdeCalendario(esc.id); };
                cell.appendChild(ev);
            }
        });

        grid.appendChild(cell);
    }
}

function cambiarMes(offset) {
    calendarDate.setMonth(calendarDate.getMonth() + offset);
    renderCalendario();
}

function abrirDesdeCalendario(id) {
    navegarA('mapa');
    mostrarDetalle(id);
}

// --- UTILS ---

function actualizarTodo() {
    renderMapa();
    renderTabla();
    actualizarStats();
    renderCalendario();
}

function textoEstado(est) {
    const textos = { rojo: 'Sin coordinar', amarillo: 'Coordinada', verde: 'Realizada' };
    return textos[est] || est;
}

function formatearFecha(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
