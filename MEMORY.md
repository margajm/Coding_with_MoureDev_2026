# MEMORY.md — Diario de Estudio

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- v1 funcionando: registrar sesiones (fecha, tema, minutos), racha actual y lista de sesiones.
- Datos en localStorage, clave `diario-estudio-sesiones`.
- Mejor racha histórica con fecha de inicio y día de la semana.
- Total de minutos estudiados esta semana (lunes a domingo, sin fechas futuras), en formato Xh Ym.
- Sección de racha y minutos semanales movidas arriba, debajo del título.
- Paleta de colores: morado #7007EA, naranja #FF603B, blanco #FFFFFF.

## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer.
- Mejor racha se deriva de las sesiones guardadas; no se almacena por separado.
- Desempate por ventanas: 30 → 60 → 90 días; se muestra solo la más reciente.
- Varias sesiones el mismo día cuentan como un solo día.
- Las fechas futuras no suman para ninguna racha ni para el total semanal.
- Semana = lunes a domingo; el total semanal se calcula sobre esa ventana.
- Formato de fecha: "lunes 15 de junio" (sin año, nombre del mes completo).
- Cero sesiones: mostrar 0 sin fecha.

## Aprendizajes y errores a evitar
- No usar `toISOString()` ni `new Date("AAAA-MM-DD")`: se interpretan en UTC y desplazan el día.
- No guardar la mejor racha por separado en localStorage (quedaría huérfana al editar/borrar sesiones).
- No reescribir `app.js` entero; hacer cambios pequeños y enfocados.
- Cuidado con el operador || en JavaScript: JSON.parse(x) || [] falla si x es null porque JSON.parse(null) lanza error antes de evaluar ||. Siempre paréntesis: JSON.parse(x || '[]').

## Próximos pasos
- (vacío por ahora)
