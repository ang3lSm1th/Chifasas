# Tasks: Catálogo Jerárquico, Stock de Bebidas y Pantallas KDS Dinámicas

## 1. Migración y Entidades de Base de Datos

- [x] 1.1 Crear migración `003-catalog-kds-inventory.sql` con las tablas `kds_stations`, `categories`, `subcategories`, `products` e `inventory_movements` vinculadas por `tenant_id` y soft-deletes, y verificar ejecutándola en el contenedor MySQL.
- [x] 1.2 Definir entidades TypeORM (`KdsStation`, `Category`, `Subcategory`, `Product`, `InventoryMovement`) en `backend/src/modules/` y verificar que compilen y se registren en `DatabaseModule`.

## 2. Backend: Pantallas KDS Dinámicas y Enrutamiento

- [x] 2.1 Implementar `KdsStationsModule` con CRUD restringido a rol `ADMIN` (`POST`, `GET`, `PATCH`, `DELETE`) y verificar con tests unitarios en vitest.
- [x] 2.2 Configurar el Gateway de WebSockets para salas dinámicas `room:tenant_{id}:kds_{stationId}` y `room:tenant_{id}:cashier` y verificar suscripción de clientes mediante test de integración.
- [x] 2.3 Implementar `OrderDispatcherService` asegurando que cada comanda fragmenta ítems hacia sus salas KDS y emite inmutablemente la comanda completa a la sala de Caja, verificando con prueba automatizada de despacho dual.

## 3. Backend: Catálogo e Inventario Atómico de Bebidas

- [x] 3.1 Implementar `CatalogModule` con endpoints para gestionar categorías, subcategorías y productos con asignación a pantalla KDS, y verificar con tests de controlador y servicio.
- [x] 3.2 Implementar `InventoryModule` con decremento transaccional de stock (`UPDATE products SET current_stock = current_stock - :qty WHERE current_stock >= :qty`) y rechazo por stock insuficiente, y verificar con test de concurrencia en vitest.

## 4. Frontend Web: Gestión y SPAs Táctiles (Next.js)

- [x] 4.1 Construir la SPA de gestión de pantallas KDS en `/admin/pantallas-kds` con paleta Executive Precision Dark y selectores de color distintivos, verificando que cree y liste estaciones vía RTK Query.
- [x] 4.2 Construir la SPA de gestión de carta en `/admin/carta` con pestañas para Comidas y Bebidas y selector de pantalla KDS destino, verificando la creación y edición de productos.
- [x] 4.3 Construir la SPA de inventario en `/admin/inventario` con alertas visuales de stock bajo y modal para ingresos de mercadería, verificando la actualización reactiva.
- [x] 4.4 Implementar la SPA dinámica de cocina KDS en `/kds/[stationId]` con conexión WebSocket a la estación, tarjetas táctiles de pedido, temporizador en `JetBrains Mono` y transiciones spring de Emil Kowalski, verificando recepción en tiempo real.

## 5. Validación Integral y QA

- [x] 5.1 Ejecutar prueba de comanda mixta (Chaufa a Wok, Broaster a Freidora, Gaseosa a Bar) y verificar fragmentación exacta en pantallas KDS y recepción completa en Caja.
- [x] 5.2 Ejecutar prueba de agotamiento de stock intentando comprar una bebida con stock = 0 y verificar el bloqueo inmediato con error 400.
- [x] 5.3 Validar aislamiento multi-tenant comprobando que las pantallas KDS del Tenant A no reciban eventos del Tenant B.
