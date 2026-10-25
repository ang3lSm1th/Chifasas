# menu-catalog Specification

## Purpose

Permite estructurar jerárquicamente la carta de comidas y bebidas del restaurante y asignar cada plato a su estación KDS correspondiente para su preparación.

## Requirements

### Requirement: Estructura jerárquica de catálogo
El sistema SHALL permitir la creación de categorías, subcategorías y productos divididos por tipo principal entre COMIDA y BEBIDA.

#### Scenario: Creación de un plato con estación KDS de destino
- **WHEN** el administrador crea el producto "Arroz Chaufa Especial" asignado a la categoría "Chaufas" y a la estación KDS "Woks"
- **THEN** el sistema guarda el producto asociando su estación de destino para el enrutamiento de cocina

#### Scenario: Creación de bebida con control de inventario
- **WHEN** el administrador registra un producto de tipo "BEBIDA"
- **THEN** el sistema habilita el flag de control de inventario y establece su stock inicial

### Requirement: Consulta de catálogo para comandero
El sistema SHALL proveer la carta completa agrupada por categorías activas para el comandero táctil de las meseras.

#### Scenario: Listado de carta en salón
- **WHEN** una mesera consulta el catálogo de productos disponibles en su turno
- **THEN** el sistema retorna únicamente las categorías y productos activos del tenant correspondiente
