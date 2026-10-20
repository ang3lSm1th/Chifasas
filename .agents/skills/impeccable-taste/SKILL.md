---
name: impeccable-taste
description: Estándares de diseño de élite (Impeccable Design / Taste) y microinteracciones de Emil Kowalski basados en el sistema Executive Precision Dark, con Redux Toolkit (RTK/RTK Query) para interfaces táctiles de alta gama en Next.js/React.
---

# Impeccable Design & Emil Kowalski Principles - Executive Precision Dark

## 1. Tokens de Color del Sistema "Executive Precision Dark"
La paleta está calibrada para entornos de salón y cocina con iluminación variable y pantallas táctiles de alta intensidad:

| Token | Hex | Rol en el Sistema |
|---|---|---|
| **Canvas Background** | `#0B0F17` | Fondo global profundo (Deep Slate Black) |
| **Card / Panel Surface** | `#131823` | Superficie de tarjetas de comanda, paneles KDS y formularios |
| **Surface Elevated** | `#1A2234` | Modales flotantes, tooltips y menús desplegables |
| **Border / Divider** | `#20293A` | Delimitador sutil de componentes y celdas |
| **Primary** | `#2563EB` | Acciones principales, botones de confirmación, tabs activas |
| **Secondary (Success)** | `#10B981` | Turno de caja abierto, pedidos listos, cobro confirmado |
| **Tertiary (Warning/WIP)** | `#D97706` | Platos en preparación, stock de bebidas bajo, alertas |
| **Neutral (Muted Text)** | `#757681` | Etiquetas secundarias, placeholders y timestamps |
| **Text Primary** | `#F8FAFC` | Texto de máxima jerarquía y contraste |
| **Text Secondary** | `#94A3B8` | Subtítulos, descripciones y datos auxiliares |

---

## 2. Tipografía Jerárquica
- **Headline**: `Inter` (Font-weight 600 / 700, letter-spacing: -0.02em). Para títulos de pantalla, nombres de mesa y categorías.
- **Body**: `Inter` (Font-weight 400 / 500, line-height: 1.5). Para contenido interactivo y descripciones de platos.
- **Label / Data Metrics**: `JetBrains Mono` (Font-weight 500 / 600). **Obligatorio** para montos en soles (`S/ 24.50`), contadores de tiempo en cocina (`04:32 min`), códigos de comanda y códigos de operación Yape/Plin.

---

## 3. Principios de Interacción y Animación (Emil Kowalski)
1. **Física del Movimiento**:
   - Usar siempre curvas de desaceleración suaves: `cubic-bezier(0.16, 1, 0.3, 1)` (spring-like curve).
   - Duraciones calibradas: microinteracciones a 150ms-200ms; entradas de modales o tarjetas a 250ms-300ms.
   - Restringir animaciones a `transform` y `opacity` para garantizar 60/120 FPS sin consumo excesivo de CPU.
2. **Feedback Táctil Inmediato**:
   - En botones táctiles de salón y KDS: efecto active `transform: scale(0.97)` con respuesta menor a 16ms.
   - Sonner / Toasts para notificaciones contextuales suaves en esquina inferior o superior sin interrumpir la operación.
3. **Cero Layout Shifts (CLS = 0)**:
   - Uso de Skeletons con fondo `#1A2234` y shimmer sutil. Espacios de comanda con dimensiones pre-asignadas.

---

## 4. Gestión de Estado Global con Redux Toolkit (RTK)
- **RTK Store Centralizado**:
  - `shiftSlice`: Estado del turno activo, balance en caja y persistencia de sesión.
  - `orderCartSlice`: Carrito de toma de pedidos en salón con actualización atómica de ítems y selector de pantallas KDS.
  - `kdsSlice`: Estado en memoria de las comandas recibidas por WebSocket, agrupadas por estado (`PENDIENTE`, `PREPARANDO`, `LISTO`).
- **RTK Query**: Caching automático, revalidación en segundo plano y mutaciones optimistas para catálogo y mesas.
