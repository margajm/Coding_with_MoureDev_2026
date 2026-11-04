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

// FIXED: Use parentheses to avoid JSON.parse(null) TypeError
// If localStorage.getItem returns null, use '[]' instead
let sesiones = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

console.log('Sesiones cargadas al iniciar:', sesiones.length);

// Function to save sessions to localStorage with error handling
function guardar() {
  try {
    const datos = JSON.stringify(sesiones);
    localStorage.setItem(STORAGE_KEY, datos);
    console.log('Sesiones guardadas:', sesiones.length);
  } catch (e) {
    console.error('Error guardando sesiones en localStorage:', e);
    alert('No se pudieron guardar las sesiones. ¿Está lleno el localStorage o hay restricciones del navegador?');
  }
}

function fechaLocalYYYYMMDD(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function diaAnterior(fechaStr) {
  const partes = fechaStr.split('-').map(Number);
  // Validación: asegurar que tengamos todas las partes
  if (partes.length < 3) {
    console.error('Formato de fecha inválido en diaAnterior:', fechaStr);
    return fechaLocalYYYYMMDD();
  }
  const d = new Date(partes[0], partes[1] - 1, partes[2]);
  if (isNaN(d.getTime())) {
    console.error('Fecha inválida al crear objeto Date:', partes);
    return fechaLocalYYYYMMDD();
  }
  d.setDate(d.getDate() - 1);
  return fechaLocalYYYYMMDD(d);
}

function tieneSesion(fechaStr) {
  if (!sesiones || !Array.isArray(sesiones)) return false;
  return sesiones.some(s => s && s.fecha === fechaStr);
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

// FIXED: Added try-catch for robust session saving
function guardarConErrorHandling() {
  try {
    // Validación adicional antes de guardar
    if (!Array.isArray(sesiones)) {
      sesiones = [];
      console.error('sesiones no es un array, reiniciando');
    }
    const datos = JSON.stringify(sesiones);
    localStorage.setItem(STORAGE_KEY, datos);
    console.log('✓ Sesiones guardadas exitosamente:', sesiones.length);
    return true;
  } catch (e) {
    console.error('✗ Error al guardar sesiones:', e);
    alert('Error guardando sesiones. Presiona F12 para ver la consola.');
    return false;
  }
}

function fechaHaceDias(hoyStr, dias) {
  const partes = hoyStr.split('-').map(Number);
  if (partes.length < 3) return fechaLocalYYYYMMDD();
  const d = new Date(partes[0], partes[1] - 1, partes[2]);
  if (isNaN(d.getTime())) return fechaLocalYYYYMMDD();
  d.setDate(d.getDate() - dias + 1);
  return fechaLocalYYYYMMDD(d);
}

function calcularMejorRachaEnVentana(ventanaDias) {
  const hoy = fechaLocalYYYYMMDD();
  const desde = fechaHaceDias(hoy, ventanaDias);

  // Validación: asegurar que sesiones es un array
  const sesionesValidas = Array.isArray(sesiones) ? sesiones : [];
  
  const fechasUnicas = [...new Set(sesionesValidas.map(s => s ? s.fecha : ''))].filter(f => f);
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
  const sesionesValidas = Array.isArray(sesiones) ? sesiones : [];
  const sesionesMes = sesionesValidas.filter(s => s && s.fecha >= inicioMes && s.fecha <= finMes);
  const diasUnicos = [...new Set(sesionesMes.map(s => s.fecha))];

  return diasUnicos.length;
}

function calcularMinutosEstaSemana() {
  const hoy = fechaLocalYYYYMMDD();
  const desde = lunesDeEstaSemana();

  const sesionesValidas = Array.isArray(sesiones) ? sesiones : [];
  return sesionesValidas
    .filter(s => s && s.fecha >= desde && s.fecha <= hoy)
    .reduce((total, s) => total + (s ? s.minutos : 0), 0);
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
  if (partes.length < 3) return 'Fecha inválida';
  const d = new Date(partes[0], partes[1] - 1, partes[2]);
  if (isNaN(d.getTime())) return 'Fecha inválida';
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

function renderRacha() {
  const racha = calcularRacha();
  numeroRacha.textContent = racha === 1 ? '1 día' : `${racha} días`;
  
  try {
    const diasMes = calcularDiasEsteMes();
    numeroDiasMes.textContent = diasMes === 1 ? "1 día" : `${diasMes} días`;
  } catch (e) {
    console.error('Error calculando días este mes:', e);
    numeroDiasMes.textContent = "0 días";
  }
  
  renderMejorRacha();
  renderMinutosSemana();
}

function ren
