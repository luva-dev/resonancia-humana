## Objetivo

Hacer que el botón flotante de “Tejer sabiduría” no aparezca al inicio de la landing en móvil mientras la persona está leyendo la Bitácora y el Manual de uso, y que empiece a mostrarse cuando ya entra a la sección **Programa Oficial · Día 2 / Ponencias del Congreso**.

## Qué voy a cambiar

1. Detectar cuándo el usuario ya llegó a la sección de ponencias.
   - Usar la sección `#voces` como punto de activación.
   - En móvil, el botón aparecerá solo cuando esa sección entre en viewport o cuando el usuario haga scroll hasta ella.

2. Mantener el comportamiento actual en escritorio.
   - En desktop no tocaré la experiencia que ya funciona bien.
   - El ajuste será principalmente responsive para pantallas pequeñas.

3. Ocultar el FAB durante la lectura inicial.
   - Mientras el usuario esté viendo el hero, la Bitácora y el Manual de uso, el botón no se mostrará.
   - Así se evita que tape texto o compita visualmente con el manual.

4. Mantener intacto el panel de “Tejer sabiduría”.
   - Cuando el botón aparezca, seguirá funcionando igual.
   - Su panel conservará la posición móvil ya corregida para no chocar con la insignia inferior.

## Resultado esperado

En smartphone:
- Al entrar, no se verá el botón flotante.
- La lectura del encabezado y del Manual de uso quedará limpia.
- Cuando el usuario llegue a **Ponencias del Congreso**, aparecerá el botón.
- El botón seguirá disponible durante la exploración de los bloques para seleccionar ponencias.

## Detalles técnicos

Archivos a tocar:
- `src/pages/Index.tsx`

Implementación prevista:
- Añadir una referencia a la sección `#voces`.
- Escuchar visibilidad/posición de esa sección con `IntersectionObserver` o una comprobación de scroll equivalente.
- Crear un estado tipo `showFabOnMobile`.
- Aplicar renderizado condicional al contenedor flotante:
  - móvil: visible solo desde `#voces`
  - escritorio: visible como hasta ahora

Criterio de activación recomendado:
- Mostrar el FAB cuando el encabezado de `Ponencias del Congreso` entre en pantalla o quede muy cerca del borde superior, para que aparezca justo cuando empieza a ser útil.