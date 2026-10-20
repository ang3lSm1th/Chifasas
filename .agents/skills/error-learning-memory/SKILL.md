---
name: error-learning-memory
description: Sistema ultracompacto y eficiente en tokens para registrar, consultar y aprender de errores cometidos durante el desarrollo, asegurando que la IA no repita fallos a medida que el proyecto escala.
---

# Error Learning & Compact Memory Protocol (Token-Efficient)

## 1. Objetivo y Filosofía
Mantener un registro vivo de lecciones aprendidas y errores resueltos en el repositorio con un formato **ultracompacto (estilo conciso / caveman)** para:
1. Impedir que el agente o el equipo repita errores en fases avanzadas del proyecto.
2. Evitar el desperdicio de tokens de contexto mediante notas atómicas de 1 a 2 líneas.
3. Facilitar la consulta instantánea antes de diseñar o codificar cada nueva tarea.

---

## 2. Formato del Archivo de Memoria (`Spec/memory/error-log.md`)
Cada entrada debe seguir estrictamente este esquema condensado:

```markdown
### [TAG-FECHA] [Componente/Módulo]
- **Error**: Breve descripción del fallo o síntoma.
- **Causa Raíz**: Qué lo provocó a bajo nivel.
- **Regla de Prevención**: Qué hacer siempre para evitarlo (en 1 línea imperativa).
```

---

## 3. Flujo de Trabajo Mandatorio
1. **Antes de codificar o especificar una tarea**:
   - Leer `Spec/memory/error-log.md` para verificar que la solución no colisione con trampas previas identificadas.
2. **Al encontrar y corregir un bug o fallo en el Loop de Rectificación**:
   - Inmediatamente registrar la entrada en `Spec/memory/error-log.md`.
   - No añadir explicaciones teóricas extensas ni código redundante; solo la regla preventiva accionable.
3. **Mantenimiento**:
   - Mantener el archivo por debajo de 300 líneas mediante consolidación de reglas afines.
