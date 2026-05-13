## Objetivo

Ocultar la ponencia de Enrique Horna para que no aparezca ni sea accesible en la bitácora pública.

## Enfoque

Añadir una bandera `is_hidden` (boolean) a `congress_sessions` para poder ocultar/mostrar ponencias sin perderlas. Marcar la de Enrique Horna como oculta y filtrarla en las consultas y políticas públicas.

## Cambios

### 1. Migración de base de datos

- `ALTER TABLE public.congress_sessions ADD COLUMN is_hidden boolean NOT NULL DEFAULT false;`
- Marcar como ocultas todas las filas cuyo `speaker` contenga "Enrique Horna" (búsqueda case-insensitive con `ILIKE '%Enrique Horna%'`).
- Reemplazar la política pública de SELECT en `congress_sessions` para que solo devuelva filas con `is_hidden = false` (los admins siguen viendo todo por la política de admin existente).

### 2. Frontend (`src/pages/Index.tsx`)

- Añadir `.eq("is_hidden", false)` al `select` de `congress_sessions`.
- El `fallbackSessions` (`src/lib/congressData.ts`) también se filtra: si contiene a Enrique Horna, se excluye del array que se setea por defecto.

### 3. Tipo `CongressSession`

- Añadir `is_hidden?: boolean` opcional en `src/lib/congressData.ts` para mantener consistencia con el esquema.

## Detalles técnicos

- Mantengo la fila en la base de datos (no `DELETE`) para poder revertir el ocultamiento fácilmente si más adelante se quiere volver a publicar.
- La política RLS pública se sustituye, no se elimina, para que `anon` y `authenticated` no vean la ponencia oculta.
- No se requiere UI nueva en este paso (panel admin para gestionar visibilidad queda fuera de alcance; si lo necesitas después, lo añadimos).

## Resultado esperado

- La ponencia de Enrique Horna desaparece del acordeón de módulos en la home.
- No es seleccionable ni descargable, y tampoco la devuelve la API a usuarios públicos.
- Sigue almacenada en la base de datos por si se quiere reactivar.
