## Cambios

### 1. `src/pages/Index.tsx` — Aviso legal
- Quitar la frase final `" Esta versión es temporal y de acceso restringido."` del `legalNotice` (línea 16). Mantener el resto del aviso de propiedad intelectual y privacidad.
- En el aviso compacto (línea 144), reemplazar `" · Acceso restringido y uso temporal."` por una versión sin esa connotación, por ejemplo `" · Propiedad intelectual de ACOPP y los ponentes."`.

### 2. `src/components/AccessGate.tsx` — Quitar "provisional" y "organizadores"
- Línea 113: `"Acceso provisional"` → `"Acceso restringido"` (o simplemente `"Acceso"`).
- Línea 119: `"Previsualización restringida para organizadores"` → `"Bitácora de Resonancia · Acceso para asistentes"`.
- Línea 121: reemplazar el texto sobre "revisión editorial / validación interna" por algo neutro como: `"Ingresa con las credenciales compartidas por la organización del congreso para acceder a la bitácora completa."`.
- Línea 136: `"Ingreso de organizadores"` → `"Ingreso de asistentes"`.
- Línea 138: `"Introduce las credenciales provisionales..."` → `"Introduce tus credenciales para desbloquear la vista completa de la bitácora."`.
- Mantener "Control de acceso" tal cual (línea 135).
- Mensajes de error con la palabra "temporal" (línea 72) se mantienen, ya que se refieren a una desconexión técnica puntual, no a la naturaleza del producto.

### 3. Credencial de acceso
- La contraseña (`PREVIEW_GATE_PASSWORD`) se mantiene sin cambios.
- El usuario (`PREVIEW_GATE_USERNAME`) cambia de `organizadores` a `asistentes`. Esto se hace actualizando el secret en Lovable Cloud mediante el formulario seguro — no se toca código de la edge function. Te pediré que ingreses el nuevo valor (`asistentes`) cuando ejecute el plan.

### Lo que NO cambia
- Footer de Equilibria.
- Aviso legal y de privacidad (queda, sólo se le retira la coletilla de "temporal/restringido").
- Lógica de la edge function `preview-access` y del `AccessGate`.
- Contenido del congreso.
