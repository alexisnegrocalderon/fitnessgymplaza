# Plan de rediseño funcional e interactivo — Plaza Fitness

## Objetivo

Transformar la landing de Plaza Fitness para que comunique con mayor precisión el entrenamiento funcional guiado, incorpore movimiento con intención y haga más clara la exploración de horarios, planes y reglas. La actualización conservará la identidad **Performance Command** —graphite, hueso mineral y rojo señal— y mantendrá intacto el bloque final de contacto y su marquee de Plaza Fitness.

La dirección seleccionada por el usuario es la siguiente:

| Área | Decisión aprobada |
|---|---|
| Hero | **“Fuerza que se adapta a ti.”** |
| Método | **“Tu progreso tiene método.”** |
| Horarios | **Circuito Semanal** con tarjetas expandibles por grupo de días |
| Movimiento | **Pulso controlado**: entradas por scroll, líneas de medición, números y respuestas al toque/cursor |
| Reglas | **Panel de reglas visibles** con toda la información legible de inmediato |
| Intervalos | **Mini simulador de sesión** activado por el visitante; sonido suave apagado por defecto |

## Cambios de contenido y arquitectura

### 1. Hero: nuevo mensaje y contador funcional

Se reemplazará el titular actual por **“Fuerza que se adapta a ti.”**. El texto de apoyo enfatizará que Plaza Fitness entrega entrenamiento funcional dinámico, guiado por profesores y adaptado al nivel de cada persona. Se conservará el video centrado y el espacio protegido para el logo del footage.

Se añadirá un mini simulador de sesión visual, compacto y no invasivo. Presentará rondas de `READY`, `MOVE` y `RESET`, con contador regresivo, anillo de progreso y cambio de color de rojo señal. Su audio de pitido será opcional, comenzará desactivado y requerirá una acción explícita de la persona visitante; por defecto no reproducirá sonido ni animaciones intensas en dispositivos con reducción de movimiento activa.

### 2. Método: nueva narrativa y características ampliadas

Se reemplazará la sección “No vienes a repetir” por **“Tu progreso tiene método.”**. El texto institucional se sintetizará en características concretas, con jerarquía visual y microinteracciones de aparición progresiva:

1. **Profesores en cada estación**, para enseñar y acompañar el ejercicio.
2. **Técnica y postura cuidada**, con correcciones oportunas durante la clase.
3. **Nivel adaptado a ti**, según capacidades, experiencia y condición actual.
4. **Entrenamiento global**, que activa los grupos musculares de forma integrada.
5. **Capacidad cardiovascular y respiratoria**, orientada a sostener mejor el esfuerzo cotidiano.
6. **Fuerza, movilidad y articulaciones**, para moverse con más control y seguridad.
7. **Composición corporal y salud activa**, para mejorar o mantener la condición física a largo plazo.

La sección conservará la composición editorial, pero las características pasarán a comportarse como una pista de entrenamiento: una entrada secuencial por scroll y estados de foco discretos al pasar o tocar.

### 3. Horarios: Circuito Semanal sin créditos

Se eliminarán las referencias a créditos, plan conectado, sábados de regalo y reserva individual dentro del módulo de horarios. El bloque se reconstruirá como un **Circuito Semanal** con tarjetas por patrón:

- **Lunes / miércoles / viernes**;
- **Martes / jueves**;
- **Sábado**.

Cada tarjeta tendrá identidad horaria propia, una visualización de intensidad y un estado expandible. Al seleccionarla, revelará sus horas como estaciones de circuito, manteniendo todas las franjas claramente legibles. La interacción se diseñará para mouse y touch: toque para expandir en celular, sin depender de hover. Un CTA llevará a WhatsApp para consultar disponibilidad, sin prometer reserva automática.

### 4. Planes: más movimiento y modal de inscripción

Se conservarán los planes visibles, con mejoras de profundidad y movimiento: entrada escalonada al llegar a la sección, leve inclinación 3D en dispositivos compatibles, pulsos mínimos en el plan destacado y transición de perspectiva más fluida. Se eliminarán las referencias visibles a “créditos” dentro de la experiencia pública, dejando los detalles de uso para un futuro flujo de alumnos activos.

El CTA de cada plan abrirá un **modal de inscripción** en lugar de llevar a una sección fija. El modal tendrá glassmorphism de alto contraste: fondo graphite casi opaco, borde rojo de señal, blur controlado, sombra profunda y una jerarquía futurista. Incluirá el plan seleccionado, pasos de inscripción, datos de transferencia, copia de datos y CTA de WhatsApp. Será accesible mediante teclado, tendrá cierre claro, foco contenido y una versión compacta para celular.

La actual sección “Paso a paso” dejará de estar visible como bloque de página. Su contenido se trasladará por completo a este modal contextual.

### 5. Reglas: Panel de reglas visibles

La sección “Entrena con claridad” se sustituirá por un **Panel de reglas visibles**. Las seis reglas aparecerán abiertas desde el inicio, en una grilla legible que muestre métrica, título y explicación sin requerir seleccionar una tarjeta:

- Reserva hasta 30 días antes.
- Reserva disponible hasta 30 minutos antes de la clase.
- Cancelación sin perder condición hasta 2 horas antes.
- Activación del beneficio de jueves a las 22:30.
- Condiciones de sábados según programación vigente.
- Pausa del plan con certificado médico.

Cada regla tendrá un pequeño movimiento de pulso o subrayado al entrar al viewport, sin ocultar información ni comprometer la legibilidad. En celular se reordenará como una lista de tarjetas de lectura inmediata.

### 6. Retiro de la sección de espacio y preservación del cierre

Se retirará temporalmente el bloque **“Más espacio. Más posibilidades.”** y su navegación asociada si corresponde. Se conservará íntegramente la última sección de contacto, incluido el marquee/scroll de **PLAZA FITNESS**, la ubicación de Calle Quillota 656 y los CTAs existentes.

## Sistema de movimiento y accesibilidad

Las animaciones usarán únicamente transformaciones y opacidad, con duraciones breves y curvas de salida rápidas. El sistema “Pulso controlado” incorporará revelado progresivo de bloques, líneas de medición que se dibujan, números que cuentan una sola vez al entrar en viewport y reacción táctil en tarjetas.

El temporizador y las animaciones no esenciales respetarán `prefers-reduced-motion`. El pitido de intervalos no tendrá reproducción automática: el visitante deberá activar el modo de sesión, podrá silenciarlo y el control deberá ser navegable por teclado.

## Fases de implementación

1. **Reestructurar contenido y navegación.** Actualizar titulares, copy del método, retirar la sección de espacio y eliminar el bloque fijo de inscripción; ajustar los enlaces del header y anclas internas.
2. **Construir el Circuito Semanal.** Implementar las tarjetas de horarios expandibles, sus estados touch/desktop y el CTA de consulta por WhatsApp, sin créditos públicos.
3. **Rediseñar planes y modal.** Refinar tarjetas Perspective Reveal, eliminar créditos visibles, crear el modal de inscripción con datos de transferencia y CTA contextual.
4. **Crear el temporizador y sistema de movimiento.** Añadir el simulador de sesión opt-in, controles de audio, animaciones de scroll y respuesta al toque/cursor.
5. **Rehacer el Panel de reglas.** Exponer las seis reglas de forma permanente, simplificar la jerarquía y añadir microanimaciones sin ocultar contenido.
6. **Validar y publicar.** Probar navegación, modal, temporizador, responsive, preferencias de movimiento y build; revisar desktop, tablet y móvil; guardar checkpoint y actualizar la rama de GitHub correspondiente sin sobrescribir cambios de `main`.

## Plan de pruebas

Se verificará que el hero no cubra el logo del video, que el nuevo titular funcione en todos los anchos, que las tarjetas de horarios sean usables con mouse y touch, y que los detalles horarios se vean sin recortes. Se comprobará que cada plan abre el modal correcto, que los botones de copiar y WhatsApp usan el mensaje contextual y que el foco permanece dentro del modal mientras está abierto.

También se revisará el temporizador con sonido apagado, activado y silenciado; el comportamiento con `prefers-reduced-motion`; los breakpoints desktop, tablet y móvil; TypeScript; build de producción; y los enlaces críticos a ubicación, WhatsApp e inscripción.

## Supuestos y riesgos abiertos

- El módulo de inicio de sesión de alumnos activos, disponibilidad en tiempo real y gestión individual de créditos no se implementará en esta fase; su arquitectura se dejará preparada visualmente, sin prometer funcionalidad inexistente.
- Los horarios actuales se conservarán según la información ya publicada, pero se recomienda confirmarlos antes de una campaña o pauta pagada.
- La inserción de audio requiere interacción del visitante por las políticas de navegadores; por eso se utilizará un control opt-in y nunca autoplay.
- El despliegue Vercel sigue pendiente de la autenticación/permisos del equipo de Vercel. La actualización se mantendrá en una rama de GitHub para evitar sobrescribir `main` hasta que se confirme la integración adecuada.
