const STORAGE_KEY = 'diario-estudio-sesiones';

const form = document.getElementById('form-sesion');
const inputFecha = document.getElementById('fecha');
const inputTema = document.getElementById('tema');
const inputMinutos = document.getElementById('minutos');
const lista = document.getElementById('lista-sesiones');
const vacio = document.getElementById('vacio');
const numeroRacha = document.getElementById('numero-racha');
const numeroMejorRacha = document.getElementById('numero-mejor-racha');
const minutosSemana = document.getElementById('minutos-semana');

let sesiones = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

function fechaLocalYYYYMMDD(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function diaAnterior(fechaStr) {
  const partes = fechaStr.split('-').map(Number);
  const d = new Date(partes[0], partes[1] - 1, partes[2]);
  d.setDate(d.getDate() - 1);
  return fechaLocalYYYYMMDD(d);
}

function tieneSesion(fechaStr) {
  return sesiones.some(s => s.fecha === fechaStr);
}

function contarRachaDesde(fechaStr) {
  let cuenta = 0;
  let actual = fechaStr;
  while (tieneSesion(actual)) {
    cuenta++;
    actual = diaAnterior(actual);
  }
  return cuenta;
}

function calcularRacha() {
  const hoy = fechaLocalYYYYMMDD();

  if (tieneSesion(hoy)) {
    return contarRachaDesde(hoy);
  }

  const ayer = diaAnterior(hoy);
  if (tieneSesion(ayer)) {
    return contarRachaDesde(ayer);
  }

  return 0;
}

function guardar() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sesiones));
}

function fechaHaceDias(hoyStr, dias) {
  const partes = hoyStr.split('-').map(Number);
  const d = new Date(partes[0], partes[1] - 1, partes[2]);
  d.setDate(d.getDate() - dias + 1);
  return fechaLocalYYYYMMDD(d);
}

function calcularMejorRachaEnVentana(ventanaDias) {
  const hoy = fechaLocalYYYYMMDD();
  const desde = fechaHaceDias(hoy, ventanaDias);

  const fechasUnicas = [...new Set(sesiones.map(s => s.fecha))];
  const fechasVentana = fechasUnicas.filter(f => f >= desde && f <= hoy);

  if (fechasVentana.length === 0) {
    return { cantidad: 0, fechaInicio: null };
  }

  fechasVentana.sort();

  let mejor = 1;
  let rachaActual = 1;
  let fechaInicioActual = fechasVentana[0];
  let mejoresFechasInicio = [fechaInicioActual];

  for (let i = 1; i < fechasVentana.length; i++) {
    if (diaAnterior(fechasVentana[i]) === fechasVentana[i - 1]) {
      rachaActual++;
    } else {
      if (rachaActual > mejor) {
        mejor = rachaActual;
        mejoresFechasInicio = [fechaInicioActual];
      } else if (rachaActual === mejor) {
        mejoresFechasInicio.push(fechaInicioActual);
      }
      rachaActual = 1;
      fechaInicioActual = fechasVentana[i];
    }
  }

  if (rachaActual > mejor) {
    mejor = rachaActual;
    mejoresFechasInicio = [fechaInicioActual];
  } else if (rachaActual === mejor) {
    mejoresFechasInicio.push(fechaInicioActual);
  }

  // Devolver la más reciente (fecha de inicio más tardía)
  mejoresFechasInicio.sort();
  const masReciente = mejoresFechasInicio[mejoresFechasInicio.length - 1];

  return { cantidad: mejor, fechaInicio: masReciente, hayEmpate: mejoresFechasInicio.length > 1 };
}

function calcularMejorRacha() {
  const ventanas = [30, 60, 90];

  for (let i = 0; i < ventanas.length; i++) {
    const ventana = ventanas[i];
    const resultado = calcularMejorRachaEnVentana(ventana);

    if (resultado.cantidad === 0) {
      return { cantidad: 0, fechaInicio: null };
    }

    const esRachaPerfecta = resultado.cantidad === ventana;
    const sigueHabiendoEmpate = resultado.hayEmpate && esRachaPerfecta;
    const esUltimaVentana = i === ventanas.length - 1;

    if (!sigueHabiendoEmpate || esUltimaVentana) {
      return { cantidad: resultado.cantidad, fechaInicio: resultado.fechaInicio };
    }
  }

  return { cantidad: 0, fechaInicio: null };
}

function lunesDeEstaSemana() {
  const hoy = new Date();
  const dia = hoy.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado
  const offset = dia === 0 ? 6 : dia - 1;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - offset);
  return fechaLocalYYYYMMDD(lunes);
}


function calcularDiasEsteMes() {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const inicioMes = `${año}-${mes}-01`;

  // Obtener último día del mes
  const ultimoDia = new Date(año, mes - 1, 0).getDate();
  const finMes = `${año}-${mes}-${String(ultimoDia).padStart(2, "0")}`;

  // Filtrar sesiones del mes actual y obtener días únicos
  const sesionesMes = sesiones.filter(s => s.fecha >= inicioMes && s.fecha <= finMes);
  const diasUnicos = [...new Set(sesionesMes.map(s => s.fecha))];

  return diasUnicos.length;
}
function calcularMinutosEstaSemana() {
  const hoy = fechaLocalYYYYMMDD();
  const desde = lunesDeEstaSemana();

  return sesiones
    .filter(s => s.fecha >= desde && s.fecha <= hoy)
    .reduce((total, s) => total + s.minutos, 0);
}

function formatearHorasMinutos(totalMinutos) {
  const h = Math.floor(totalMinutos / 60);
  const m = totalMinutos % 60;
  return `${h}h ${m}m`;
}

function renderMinutosSemana() {
  const total = calcularMinutosEstaSemana();
  minutosSemana.textContent = formatearHorasMinutos(total);
}

function formatearFechaDiaSemana(fechaStr) {
  const partes = fechaStr.split('-').map(Number);
  const d = new Date(partes[0], partes[1] - 1, partes[2]);
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

function renderRacha() {
  const racha = calcularRacha();
  numeroRacha.textContent = racha === 1 ? '1 día' : `${racha} días`;
  const diasMes = calcularDiasEsteMes();
  numeroDiasMes.textContent = diasMes === 1 ? "1 día" : `${diasMes} días`;
  renderMejorRacha();
  renderMinutosSemana();
}

function renderMejorRacha() {
  const { cantidad } = calcularMejorRacha();
  numeroMejorRacha.textContent = cantidad === 1 ? '1 día' : `${cantidad} días`;
}

function escapeHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

function renderLista() {
  lista.innerHTML = '';

  const ordenadas = [...sesiones].sort((a, b) => {
    if (b.fecha !== a.fecha) {
      return b.fecha.localeCompare(a.fecha);
    }
    return b.id - a.id;
  });

  if (ordenadas.length === 0) {
    vacio.style.display = 'block';
    return;
  }

  vacio.style.display = 'none';

  for (const s of ordenadas) {
    const li = document.createElement('li');
    li.className = 'sesion';
    li.innerHTML = `
      <div class="datos">
        <div class="fecha">${formatearFechaDiaSemana(s.fecha)}</div>
        <div class="tema">${escapeHtml(s.tema)}</div>
        <div class="minutos">${s.minutos} min</div>
      </div>
    `;
    lista.appendChild(li);
  }
}

function inicializarFecha() {
  inputFecha.value = fechaLocalYYYYMMDD();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const fecha = inputFecha.value;
  const tema = inputTema.value.trim();
  const minutos = parseInt(inputMinutos.value, 10);

  if (!fecha) {
    alert('Selecciona una fecha.');
    return;
  }

  if (!tema) {
    alert('El tema es obligatorio.');
    inputTema.focus();
    return;
  }

  if (!minutos || minutos <= 0) {
    alert('Los minutos deben ser un número mayor que 0.');
    inputMinutos.focus();
    return;
  }

  const sesion = {
    id: Date.now(),
    fecha,
    tema,
    minutos
  };

  sesiones.push(sesion);
  guardar();

  renderRacha();
  renderLista();

  form.reset();
  inicializarFecha();
  inputTema.focus();
});

inicializarFecha();
renderRacha();
renderLista();