# Plan de revisión de temporizador, horarios y planes — Plaza Fitness

## Objetivo

Refinar la experiencia **Functional Pulse** de Plaza Fitness mediante un temporizador más familiar y legible, un tablero de horarios exclusivamente informativo, una selección de planes más clara y ajustes precisos a las reglas operativas. La actualización mantendrá la identidad visual graphite, hueso mineral y rojo señal, además del cierre de contacto y marquee ya aprobados.

| Área | Decisión aprobada |
|---|---|
| Temporizador | Contador horizontal `MM:SS`, desde `01:00`, con cuenta regresiva y pitido suave opcional por segundo |
| Horarios | **Tablero de sesiones**, sin acciones de reserva ni enlaces de WhatsApp por franja |
| Planes | **Selector de atleta** mediante dos credenciales grandes: General y Estudiante |
| Plan destacado | **Progresión 12 — $60.000** como “Más elegido” |
| Reglas | Texto visible y actualizado para reserva, cancelación y cupos de sábado |
| Pieza informativa | Eliminar la gráfica desplegable de reglas y olvidar ese recurso de la página |

## Cambios propuestos

### 1. Sustituir el simulador por temporizador horizontal

El mini simulador circular `READY / MOVE / RESET` será reemplazado por un contador rectangular horizontal, tipo reloj de entrenamiento, con minutos y segundos grandes. Comenzará en **01:00**, descenderá hasta `00:00` y podrá reiniciarse. Tendrá un control de iniciar/pausar y un interruptor de sonido.

El pitido será una señal breve y discreta por segundo, generada únicamente después de que la persona visitante active el temporizador y el sonido. Nunca habrá autoplay. Se mantendrá compatibilidad con `prefers-reduced-motion` y se reducirá el impacto visual en móvil.

### 2. Rehacer los horarios como Tablero de sesiones

El actual Circuito Semanal se reemplazará por un tablero de sesiones inspirado en la señalética de un gimnasio: columnas para **L/M/V**, **M/J** y **Sábado**, con bloques claros agrupados por mañana, mediodía y tarde. Cada horario será una pieza informativa estática; no tendrá enlace, botón, reserva ni estado que sugiera disponibilidad en tiempo real.

La sección indicará con claridad que la toma de cupos y la agenda digital se integrarán posteriormente para alumnos activos y terminales de profesores. La estructura visual quedará preparada para evolucionar a ese sistema, pero la versión actual no fingirá esa funcionalidad.

### 3. Implementar Selector de atleta para planes

Antes de mostrar las tarjetas se añadirá un selector prominente formado por dos credenciales grandes: **Plan General** y **Plan Estudiante**. La credencial activa se elevará visualmente, tendrá borde rojo, una ficha de identificación y un texto de contexto; la otra quedará visible pero en segundo plano. Al cambiar entre ellas, las tarjetas realizarán una transición escalonada controlada.

El badge **“Más elegido”** migrará desde Base 8 hacia **Progresión 12 — $60.000** en planes generales. La tarjeta destacada recibirá un énfasis visual de señal, conservando el rojo como acento de conversión y no como superficie dominante.

### 4. Corregir textos de reglas y retirar la gráfica

Las seis reglas permanecerán abiertas y legibles. Se actualizarán específicamente estos textos:

| Métrica | Cambio de copy |
|---|---|
| 2 horas | Explicar que la cancelación con dos horas de anticipación evita perder el crédito de la clase. |
| Jueves 22:30 | Explicar que en ese momento se activan los cupos para las clases del sábado, ideal para organizar el entrenamiento de fin de semana. |

Se eliminará el acordeón “Ver pieza informativa original” y la imagen asociada de la sección de reglas. No se utilizará ese recurso en este bloque ni se mantendrán referencias visuales sobrantes.

## Fases de implementación

1. **Actualizar estructura y contenido.** Retirar el simulador circular, las acciones de horarios y la gráfica de reglas; corregir el badge del plan de $60.000 y los textos operativos.
2. **Construir los componentes de interacción.** Implementar el reloj horizontal con audio opt-in, el Tablero de sesiones informativo y el Selector de atleta con sus transiciones de planes.
3. **Refinar responsive y accesibilidad.** Asegurar lectura clara de horarios en desktop, tablet y celular; comprobar que el temporizador se controla por teclado, se silencia y respeta preferencias de reducción de movimiento.
4. **Verificar y publicar.** Ejecutar TypeScript y build de producción, revisar visualmente los tres breakpoints, guardar checkpoint y sincronizar la rama de GitHub sin alterar `main`.

## Plan de pruebas

Se comprobará que el temporizador inicia exactamente en `01:00`, que avanza en segundos, se puede pausar/reiniciar y no emite sonido hasta que se active manualmente. Se verificará que cada bloque horario no navega ni abre WhatsApp, que el Selector de atleta cambia correctamente entre planes y que Progresión 12 tiene el badge “Más elegido”.

También se revisarán los textos actualizados de reglas, la ausencia total de la gráfica descartada, el modal de inscripción existente, la navegación en móvil, el contraste, el foco de teclado, TypeScript y el build de producción.

## Supuestos y riesgos

La agenda en tiempo real, el inicio de sesión de alumnos activos y la sincronización con terminales de profesores no se implementarán aún. Esta revisión solo dejará el diseño del tablero preparado para integrarse posteriormente con ese sistema. El pitido depende de una interacción de usuario por restricciones de navegador y se mantendrá apagado por defecto.
