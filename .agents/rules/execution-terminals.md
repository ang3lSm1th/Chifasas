# Regla de Ejecución de Servidores con Puertos Visibles

Al ejecutar o poner en marcha la aplicación web y sus servicios principales:
1. **Servicios con Puertos Esenciales**:
   - Backend API ([NestJS](file:///d:/ChifaMariana/backend) - puerto 3001).
   - Frontend Web ([Next.js](file:///d:/ChifaMariana/frontend) - puerto 3000).
2. **Visibilidad en Terminal / Puertos**:
   - Deben ejecutarse en segundo plano como procesos persistentes (`IsDaemon: true` en `run_command`) de modo que el panel de **Terminal** y la pestaña **Ports** del IDE reflejen claramente que los servidores están abiertos y escuchando peticiones.
   - Solo aplica a las terminales/procesos donde se ejecuten servicios que abren puertos para ver e interactuar con la aplicación, no a comandos efímeros como builds, migraciones, scripts puntuales o tests.
