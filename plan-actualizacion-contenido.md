# Plan de actualización — Plaza Fitness

## Objetivo

Transformar la sección comercial de Plaza Fitness en una experiencia **Performance Command**: un recorrido de alto contraste en negro, rojo señal y micro-señalética de rendimiento que permita entender el método, elegir un plan, visualizar sus créditos y recorrer los nuevos horarios sin una tabla tradicional. La implementación incorporará el contenido operacional de las gráficas entregadas, usará **Calle Quillota 656** como dirección pública y conservará la línea visual ya instalada en la landing.

> **Decisión de diseño acordada:** “A — Performance Command”, con tarjetas de plan en **Perspective Reveal** y vínculos explícitos entre créditos, sesiones y horarios disponibles.

## Alcance de contenido y fuente de verdad

| Bloque del sitio | Contenido que se integrará | Fuente entregada |
|---|---|---|
| Método / propuesta | Definición del entrenamiento funcional, acompañamiento de profesores por estación, corrección de postura y adaptación al nivel de cada alumno. | Texto del usuario |
| Planes | Modalidades General y Estudiantes, clase única, packs de 8 y 12 clases, créditos de sábados y valores. | Gráfica “Valores Power Funcional” |
| Horarios | Sesiones de lunes a sábado agrupadas por patrón semanal, junto con el beneficio de sábados. | Gráfica “Nuevos Horarios” |
| Inscripción y pago | Datos que debe enviar el alumno, datos de transferencia y acceso a aplicación de reservas. | Gráfica “Paso a Paso” |
| Reglas operativas | Ventana de reserva, límite previo a la clase, cancelación, beneficios, activación y pausa médica. | Gráfica “Información Importante” |
| Contacto | WhatsApp `+56 9 5225 4029` y ubicación `Calle Quillota 656, Viña del Mar`. | Gráfica de horarios + decisión confirmada |

## Arquitectura de la experiencia

### 1. Actualización del bloque “Método Plaza”

Se reescribirá el manifiesto existente para comunicar que Plaza Fitness entrega clases dinámicas de entrenamiento funcional con profesores presentes en cada estación. El texto explicará la enseñanza de ejercicios, cuidado de postura y adaptación al nivel individual, cerrando con los beneficios sobre capacidades respiratorias, cardiovasculares, musculares y articulares. El tono seguirá siendo breve, físico y profesional, evitando promesas médicas o de resultados no verificables.

La sección conservará la composición editorial asimétrica y añadirá un módulo de tres señales: **guía técnica**, **progresión adaptada** y **movimiento integral**. Esto permite situar el entrenamiento funcional antes de mostrar precios y horarios.

### 2. Zona de horarios “Pulse Grid”

> En lugar de una tabla fija, el horario se presentará como una pista de sesiones activas.

La nueva zona tendrá una cabecera de gran escala con el texto “Encuentra tu pulso” y un selector segmentado de tres rutas: **Lun / Mié / Vie**, **Mar / Jue** y **Sábado**. Cada ruta revelará bandas temporales posicionadas sobre un rail horizontal de día, con los horarios como cápsulas rojas que emiten un pulso al entrar en pantalla. En desktop se podrá recorrer lateralmente con rueda o arrastre; en móvil se convertirá en un carrusel de días de ancho completo, con botones accesibles y swipe nativo.

| Ruta semanal | Clases publicadas |
|---|---|
| Lunes, miércoles y viernes | 08:30–09:30, 09:30–10:30, 12:00–13:00, 17:00–18:00, 18:00–19:00, 19:00–20:00 |
| Martes y jueves | 08:30–09:30, 09:30–10:30, 12:00–13:00, 18:00–19:00, 19:00–20:00, 20:00–21:00 |
| Sábado | 09:30–10:30, 10:30–11:30, presentadas como sesiones de regalo incluidas según el plan aplicable |

El componente mostrará el contador de sesiones de cada ruta y un CTA contextual “Reservar esta franja” que llevará a WhatsApp con el día y horario preseleccionados. La experiencia no requerirá hover: todos los estados estarán disponibles mediante toque y teclado.

### 3. Planes conectados a créditos

Los planes pasarán de una banda genérica a un sistema de elección por **audiencia** y **créditos**. Primero, el visitante elegirá “General” o “Estudiante”; después visualizará tres niveles de crédito. Cada selección actualizará de forma sincronizada el rail de horarios y la explicación de los sábados de regalo.

| Audiencia | Opción | Precio | Créditos y beneficio |
|---|---:|---:|---|
| General | Clase única | $8.000 | 1 clase |
| General | Base | $45.000 | 8 clases + 4 sábados de regalo |
| General | Progresión | $60.000 | 12 clases + 4 sábados de regalo |
| Estudiante | Clase única | $6.000 | 1 clase |
| Estudiante | Base | $36.000 | 8 clases + 4 sábados de regalo |
| Estudiante | Progresión | $46.000 | 12 clases + 4 sábados de regalo |

Cada tarjeta se construirá con **Perspective Reveal**. En desktop, al foco o hover inclinará suavemente su plano y abrirá una cara posterior con la lectura “X créditos / Y sábados incluidos”, requisitos de reserva y el CTA de inscripción. En celular, tocar “Ver detalle” activará exactamente la misma vista mediante un panel expandible, para que el patrón sea comprensible sin gesto oculto. Los botones principales derivarán a WhatsApp con el plan elegido codificado en el mensaje.

### 4. Recorrido de inscripción y pagos

Después de los planes se añadirá una sección “Activa tu plan” en forma de secuencia cinemática de tres pasos. El primer paso solicitará nombre completo, email, RUT, comprobante de pago y certificado de alumno regular cuando corresponda. El segundo mostrará los datos de transferencia con opción de copiar cada línea. El tercero explicará que el usuario y contraseña para la aplicación de reservas llegarán al correo registrado.

| Dato bancario | Valor a publicar |
|---|---|
| Titular | Deportes Plaza Fitness Limitada |
| RUT | 77.603.706-0 |
| Banco | Banco de Chile |
| Tipo de cuenta | Cuenta Corriente |
| Número de cuenta | 00-535-05830-06 |
| Email de comprobantes | plazafitnesschile@gmail.com |

Los datos de pago se presentarán como información para copiar, no como un formulario de cobro. El CTA seguirá abriendo WhatsApp para que el equipo confirme disponibilidad e inscripción.

### 5. Reglas y beneficios operativos

Se creará un panel “Reglas de la pista” con tarjetas de lectura progresiva. Las reglas incluirán reserva disponible por 30 días, reserva hasta 30 minutos antes del inicio, cancelación con dos horas de anticipación para conservar crédito, pausas mediante certificado médico y activación de la clase de regalo el jueves a las 22:30. Cada regla tendrá una microetiqueta de tiempo y una señal visual roja, con un acordeón accesible para no saturar el scroll.

La información sobre clases de regalo se conectará con los planes y los sábados. Debido a que una gráfica menciona bloques de regalo `10:30–11:30` o `11:30–12:30`, mientras la gráfica de horarios publicada muestra `09:30–10:30` y `10:30–11:30`, durante la implementación se usará el **horario semanal confirmado** como fuente visible y se redactará el beneficio como “4 sábados de regalo según horario vigente”. Esta discrepancia quedará marcada para una futura corrección editorial si Plaza Fitness confirma otro bloque de sábados.

### 6. Uso de las piezas gráficas aportadas

Las imágenes entregadas se cargarán al almacenamiento del proyecto y se utilizarán de forma selectiva como material de apoyo y trazabilidad: una composición editorial en el bloque de inscripción, una pieza de horarios como referencia expandible y una pieza de valores dentro de un panel “ver información oficial”. Los datos relevantes se reconstruirán en HTML interactivo y accesible; no se usarán las imágenes como sustituto de los horarios o precios, ya que en celular resultarían difíciles de leer y no permitirían interacción.

El logotipo oficial de Plaza Fitness permanecerá como marca principal. Las nuevas gráficas externas con “A Gym” se tratarán como material informativo de referencia y no reemplazarán el branding oficial del sitio.

## Cambios técnicos previstos

| Área | Cambio |
|---|---|
| `Home.tsx` | Incorporar datos tipados de horarios, planes, créditos, reglas, inscripción y transferencia; crear componentes modulares para `SchedulePulseGrid`, `PlanPerspectiveCard`, `EnrollmentSequence` y `PolicyRail`. |
| `index.css` | Añadir sistema visual Performance Command, transiciones 3D bajo `prefers-reduced-motion`, layouts con scroll-snap, estados táctiles y breakpoints mobile/tablet/desktop. |
| Navegación | Agregar ancla “Horarios” y mantener CTAs que guíen entre planes, horarios y WhatsApp. |
| Contacto | Cambiar la dirección visible y el enlace de ubicación a `Calle Quillota 656, Viña del Mar`. |
| Recursos | Subir las cuatro gráficas entregadas al almacenamiento web y referenciarlas desde HTML solo donde aporten contexto. |
| GitHub | Tras validar la actualización, sincronizar el proyecto con `alexisnegrocalderon/fitnessgymplaza` mediante un nuevo commit en `main`. |

## Diseño responsive, accesibilidad y calidad

La experiencia se construirá mobile-first. Los efectos 3D de Perspective Reveal tendrán una alternativa mediante botón para pantallas táctiles y navegación por teclado. El rail de horarios tendrá control por botones, swipe y foco visible. Se respetará `prefers-reduced-motion`, se revisará el contraste rojo/blanco sobre graphite y se evitarán elementos esenciales dependientes de una animación.

La ubicación del sitio se actualizará a **Calle Quillota 656, Viña del Mar** de forma consistente en la sección de contacto, footer, metadatos visibles y CTAs de navegación. El número de WhatsApp seguirá siendo `+56 9 5225 4029`.

## Plan de verificación

1. Comprobar que todos los datos de horario, planes, créditos, transferencia y reglas coinciden con las fuentes entregadas.
2. Revisar que seleccionar un plan actualice los créditos y el mensaje de CTA a WhatsApp, sin perder información al cambiar entre General y Estudiante.
3. Probar el Perspective Reveal con mouse, toque y teclado, verificando que no sea necesario hover para acceder a los detalles.
4. Capturar y revisar visualmente las vistas desktop, tablet y celular; comprobar que los horarios no se comporten como tabla fija y que los textos sean legibles.
5. Ejecutar TypeScript y build de producción; corregir errores de diseño o compilación antes de guardar el checkpoint.
6. Guardar una nueva versión de la landing y hacer commit/push de la actualización validada al repositorio de GitHub indicado.

## Supuestos y riesgos abiertos

El plan asume que los precios, horarios, datos bancarios y reglas presentes en las gráficas son vigentes para publicación. La única inconsistencia identificada es la hora exacta de las sesiones de regalo de sábado; se mostrará el horario vigente de la gráfica de horarios y se mantendrá el beneficio de “4 sábados de regalo” sin prometer un bloque distinto hasta que sea confirmado. No se implementará cobro ni reserva automática: la conversión seguirá ocurriendo por WhatsApp y la aplicación externa de Plaza Fitness.
