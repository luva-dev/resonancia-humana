## Objetivo

Mover el botón flotante de “Tejer sabiduría” más arriba en pantallas pequeñas para que no quede tapado por la insignia “Edit with Lovable” y se pueda pulsar cómodamente.

## Qué voy a cambiar

1. Ajustar la posición del contenedor flotante en `src/pages/Index.tsx`.
   - Mantener la posición actual en escritorio.
   - Subir el botón y su panel en móvil con un `bottom` mayor.
   - Añadir margen compatible con safe areas de iPhone para que no quede pegado al borde inferior.

2. Hacer el ajuste responsive.
   - En móvil: separar más el FAB del borde inferior.
   - En tablet/escritorio: conservar el layout actual para no romper la composición que ya funciona bien.

3. Verificar que el panel desplegable también siga viéndose completo.
   - El botón y el panel deben seguir alineados.
   - El panel no debe salirse de la pantalla en viewport estrecho.

## Recomendación adicional

He comprobado que la insignia de Lovable está visible ahora mismo en las publicaciones (`hide_badge: false`).
Si quieres, después puedo dejar además la insignia oculta en la versión publicada para eliminar por completo esa interferencia allí. Eso no sustituye el ajuste del botón en preview, pero sí mejora la experiencia en el sitio publicado.

## Resultado esperado

En smartphone:
- El botón “Tejer sabiduría” quedará un poco más alto.
- Ya no quedará debajo de la insignia.
- Se podrá tocar cómodamente con una mano.
- El panel flotante seguirá siendo legible y usable.

## Detalles técnicos

Archivo principal:
- `src/pages/Index.tsx`

Cambio previsto:
- Reemplazar la posición fija actual `bottom-6 right-6` por una variante responsive, por ejemplo una base más alta en móvil y la actual desde `sm` o `md`.
- Si hace falta, complementar con una separación basada en safe area para dispositivos con barra inferior o gestos.