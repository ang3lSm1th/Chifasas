# kds-management Specification

## Purpose

Permite crear, configurar y operar estaciones de cocina KDS dinámicas e independientes (1..N) para la preparación de pedidos en cada restaurante o inquilino.

## Requirements

### Requirement: Creación dinámica de pantallas KDS por tenant
El sistema SHALL permitir al usuario con rol ADMIN crear y configurar múltiples estaciones KDS dinámicas identificadas por nombre y color distintivo, aisladas por tenant_id.

#### Scenario: Registro exitoso de una nueva estación KDS
- **WHEN** un usuario ADMIN envía el nombre "Woks" y color "#F59E0B" para su restaurante
- **THEN** el sistema registra la estación KDS y genera su identificador único para la sala operativa

#### Scenario: Rechazo de duplicados en el mismo tenant
- **WHEN** un usuario intenta registrar una estación KDS con un nombre idéntico a una ya existente en el mismo tenant
- **THEN** el sistema responde con error de conflicto 409

### Requirement: Salas en tiempo real por estación KDS
El sistema SHALL gestionar canales en tiempo real aislados para cada estación KDS permitiendo a los dispositivos de cocina recibir pedidos instantáneamente.

#### Scenario: Conexión de pantalla de cocina a su estación
- **WHEN** un terminal de cocina accede a su identificador de estación KDS
- **THEN** el sistema lo suscribe a la sala correspondiente y sincroniza las órdenes pendientes de preparación
