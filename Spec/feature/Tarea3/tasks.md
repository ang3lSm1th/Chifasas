# Desglose de Tareas Técnicas - Tarea 3: Catálogo, Stock de Bebidas y Pantallas KDS Dinámicas

## 1. Tareas del Orquestador Senior (SaaS Architect & Security Lead)
- [ ] **ORQ-01**: Validar las relaciones de `kds_stations` y `products` asegurando aislamiento multi-tenant por `tenant_id`.
- [ ] **ORQ-02**: Verificar que la regla inmutable de notificación a Caja no dependa de configuración del usuario (despacho obligatorio a caja).
- [ ] **ORQ-03**: Supervisar el **Loop de Rectificación**: Revisar reporte del Tester y aprobar transición.

---

## 2. Tareas del Desarrollador Backend (NestJS & WebSockets)
- [ ] **BE-01**: Crear migraciones para las tablas `kds_stations`, `categories`, `subcategories`, `products` y `inventory_movements` con soft-deletes (`@DeleteDateColumn`).
- [ ] **BE-02**: Implementar `KdsStationsModule`:
  - CRUD de pantallas KDS restringido a rol `ADMIN`.
  - Generación de salas de WebSocket dinámicas por tenant y estación.
- [ ] **BE-03**: Implementar `CatalogModule`:
  - Jerarquía de categorías, subcategorías y productos.
  - Asignación de `kds_station_id` en productos.
  - Endpoint para consulta de catálogo agrupado para comandero de meseras.
- [ ] **BE-04**: Implementar `InventoryModule`:
  - Lógica de descuento atómico de stock para bebidas.
  - Bloqueo de adición de productos con `current_stock <= 0`.
  - Registro histórico en `inventory_movements`.
- [ ] **BE-05**: Implementar `OrderDispatcherService` con despacho dual inmutable a Caja y enrutamiento dinámico a pantallas KDS.

---

## 3. Tareas del Desarrollador Frontend (Next.js SPAs)
- [ ] **FE-01**: Construir interfaz de Gestión de Pantallas KDS (`/admin/pantallas-kds`):
  - Formulario para crear Pantalla 1, Pantalla 2, Pantalla 3, etc. con nombre y color distintivo.
- [ ] **FE-02**: Construir interfaz de Gestión de Catálogo (`/admin/carta`):
  - Pestañas separadas para Comidas y Bebidas.
  - Selector de Pantalla KDS de destino al crear o editar platos.
- [ ] **FE-03**: Construir vista de Inventario de Bebidas (`/admin/inventario`):
  - Visualización del stock actual y badges de agotado.
  - Modal para registro de ingresos de mercadería.
- [ ] **FE-04**: Implementar SPA Dinámica de Cocina KDS (`/kds/[stationId]`):
  - Conexión por WebSocket a la sala de la pantalla seleccionada.
  - Tarjetas de comanda con tiempo transcurrido, alertas sonoras y botones táctiles de cambio de estado.

---

## 4. Tareas del Tester / QA Senior (Enrutamiento y Concurrencia)
- [ ] **QA-01 (Prueba de Enrutamiento Dinámico KDS)**:
  - Crear Pantalla 1 ("Woks"), Pantalla 2 ("Broaster") y Pantalla 3 ("Bar").
  - Asignar un Chaufa a Pantalla 1, un Broaster a Pantalla 2 y una Gaseosa a Pantalla 3.
  - Emitir un pedido mixto -> Validar que cada pantalla reciba exclusivamente sus ítems correspondientes.
- [ ] **QA-02 (Prueba de Despacho Inmutable a Caja)**:
  - Validar que el pedido mixto anterior aparezca completo e íntegro (Chaufa + Broaster + Gaseosa) en la pantalla de Caja sin excepción.
- [ ] **QA-03 (Prueba de Agotamiento de Stock de Bebidas)**:
  - Configurar stock = 1 para una gaseosa.
  - Confirmar un pedido con esa gaseosa.
  - Intentar realizar un segundo pedido con la misma gaseosa -> Validar que el sistema emita error de stock agotado y bloquee el pedido.
- [ ] **QA-04 (Prueba de Aislamiento de Pantallas entre Tenants)**:
  - Verificar que las pantallas KDS del Tenant A no reciban eventos ni sockets del Tenant B.

---

## 5. Checklist del Loop de Rectificación (Aprobación Formal)
- [ ] ¿El Orquestador Senior validó la arquitectura de KDS dinámicas y el despacho inmutable a caja?
- [ ] ¿El Desarrollador Backend completó el enrutamiento WebSocket y el control de inventario de bebidas?
- [ ] ¿El Desarrollador Frontend construyó las SPAs KDS dinámicas y el catálogo jerárquico?
- [ ] ¿El Tester Senior verificó la separación de comandas por pantalla y la recepción íntegra en caja?
