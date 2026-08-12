# Plaza Fitness — Dirección creativa

## Tres rutas iniciales

### 1. Laboratorio de Movimiento
Una identidad editorial-athletic de alto contraste: graphite profundo, hueso mineral y rojo señal como pulso de energía. La experiencia se siente como una campaña de performance, no como una plantilla de gimnasio.

**Probability:** 0.07

### 2. Costa Brutalista
Arquitectura visual inspirada en hormigón, señalética costera y tipografía monumental; directa, física y local, con una tensión entre espacio vacío y bloques de información.

**Probability:** 0.04

### 3. Club de Medianoche
Una atmósfera nocturna de club privado, con superficies oscuras, reflejos de acero y acentos cromáticos más intensos para comunicar exclusividad y disciplina.

**Probability:** 0.02

## Dirección elegida: Laboratorio de Movimiento

### Design Movement
**Editorial Athletic + Swiss Kinetic Design.** La composición toma la precisión de una revista de rendimiento y la convierte en una coreografía web: titulares comprimidos, señalética mínima, fotografías recortadas con intención y bloques que parecen moverse mientras el usuario avanza.

### Core Principles
1. **La fuerza vive en el contraste:** graphite casi negro para el foco, hueso cálido para respirar y rojo señal para marcar acción.
2. **Nada se alinea por accidente:** layouts con diagonales, offsets, superposiciones y márgenes asimétricos que imitan la transferencia de peso del entrenamiento funcional.
3. **La textura demuestra calidad:** vidrio ahumado, grano sutil, líneas de medición y superficies mates; nunca fondos planos sin intención.
4. **La interacción es física:** el scroll debe sentirse como avanzar por un circuito; cada transición tiene una dirección, un ritmo y un punto de descanso.

### Color Philosophy
El **graphite** (#0E1110) comunica concentración y el carácter de un espacio recién remodelado. El **hueso mineral** (#EAE7DF) introduce la luz costera de Viña del Mar sin caer en un blanco clínico. El **rojo señal** (#D92D20) es el nuevo pulso visual de Plaza Fitness: aparece como una línea de energía, una guía de navegación y un acento de conversión, no como un relleno omnipresente. Un rojo coral claro (#FF8D84) se reserva para etiquetas sobre fondo oscuro.

### Layout Paradigm
La página funciona como una **pista editorial de izquierda a derecha** dentro de un lienzo vertical: el hero es un escenario inmersivo, la propuesta de valor se fragmenta en un manifiesto lateral, y los planes se convierten en una banda horizontal cinemática con snap suave. Se evita el “hero centrado + tres columnas” como estructura por defecto; la jerarquía se construye con desplazamiento, escala y cortes de imagen.

### Signature Elements
- **Línea de medición roja:** un trazo fino con ticks numéricos que acompaña títulos, progreso de scroll y separadores.
- **Tarjetas de vidrio ahumado:** superficies semitransparentes, blur real, bordes blancos de baja opacidad y sombras internas, siempre con un detalle rojo de interacción.
- **Sello “VF / 2026”:** micro-sello de reinauguración que ancla la nueva etapa del espacio sin inventar testimonios ni claims no entregados.

### Interaction Philosophy
La interacción debe sentirse **intencional, breve y táctil**. Los botones responden con una pequeña compresión; las tarjetas de planes se elevan solo unos píxeles; la navegación usa anclas claras. El scroll horizontal se explica con una guía visual y también funciona con teclado y touch. WhatsApp es el CTA primario porque reduce fricción y conecta directamente con el negocio.

### Animation
El video del hero entra como una respiración lenta con overlay oscuro, mientras el texto aparece por capas y el marcador rojo se dibuja de izquierda a derecha. Los bloques del manifiesto reciben una entrada escalonada de 40–70 ms. Las imágenes secundarias usan parallax leve —solo transform y opacity— para evitar mareo y mantener rendimiento. Los planes avanzan con `scroll-snap-type: x mandatory` en desktop y touch; en mobile se comportan como cards apiladas con swipe natural. Todo movimiento no esencial se desactiva dentro de `prefers-reduced-motion`.

### Typography System
- **Display:** `Barlow Condensed`, 700–800, en mayúsculas controladas, tracking negativo para titulares compactos y de alto impacto.
- **Body/UI:** `Manrope`, 400–700, para datos, navegación, descripciones y CTAs con excelente legibilidad.
- **Jerarquía:** display XL para el claim del hero; display L para títulos de sección; body amplio para manifiesto; microcopy en 10–12 px con tracking positivo y estilo de señalética.

### Brand Essence
**Entrenamiento funcional y personalizado para personas que quieren moverse con más potencia, precisión y constancia en Viña del Mar.**

**Personality:** potente · preciso · cercano

### Brand Voice
Los titulares son cortos, físicos y seguros. Los CTA son directos, humanos y accionables; la microcopia no promete transformaciones irreales ni usa lenguaje de “antes y después”.

> **Titular:** “Entrena como si importara. Porque importa.”

> **CTA:** “Conversemos por WhatsApp”

### Wordmark & Logo
El logotipo oficial aportado por Plaza Fitness es la pieza principal de identidad: una calavera de alto contraste entre discos y barras, acompañada por el wordmark texturizado “PLAZA FITNESS”. Debe aparecer completo en el header, footer, sello visual y favicon, manteniendo su fondo negro integrado al sistema graphite. No se debe reconstruir con tipografía ni separar el símbolo del nombre en esos puntos de marca.

### Signature Brand Color
**Signal Red — #D92D20.** Es un rojo intenso, físico y propietario, pensado para destacar sobre graphite y hueso como una señal de esfuerzo y decisión.

## Style Decisions

- **Color update:** La firma visual cambia de Electric Cobalt a Signal Red por decisión del negocio; los tokens y estados interactivos deben conservar el mismo rol de precisión, guía y conversión.
- **Mobile logo rule:** En pantallas pequeñas el símbolo y el wordmark completo “PLAZA FITNESS” deben permanecer visibles; el micro-sello secundario se oculta para proteger la legibilidad.
- **Original logo rule:** El PNG original de calavera y wordmark es la fuente única para todas las apariciones de marca; el favicon usa el mismo archivo para asegurar reconocimiento consistente.
