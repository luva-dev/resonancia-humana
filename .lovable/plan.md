
Sí: tu diseño es correcto y además es la forma más eficiente para bajar consumo de tokens. En vez de enviar todos los `.md` completos cada vez que una persona consulta, construiremos una arquitectura tipo RAG liviana: el administrador carga transcripciones por ponencia, configura su API y prompt, y el público solo interactúa con una experiencia limpia de “Bitácora de Resonancia”.

## Decisión de arquitectura

Construiré primero la plataforma con:

- Experiencia pública Human Shift / ACOPP basada en el brochure.
- Panel administrador discreto.
- Carga de transcripciones `.md` por ponencia.
- Configuración de API propia.
- Configuración editable del prompt maestro.
- Consulta pública con selección de voces y respuesta IA.
- Recuperación por fragmentos relevantes para reducir tokens.

Esto permite que el costo de IA dependa de tu API y no de cargar todos los documentos completos en cada consulta.

## 1. Seguridad y acceso administrador

Crearé autenticación con Lovable Cloud / Supabase Auth.

Usuario administrador inicial:

```text
Correo: luva@equilibria.lat
Clave: Equilibria2025!
```

Como confirmaste que no necesitas perfil, no crearé tabla de perfiles.

Sí crearé una tabla separada de roles, por seguridad:

```text
user_roles
- id
- user_id
- role
```

El rol `admin` se validará en backend, no en localStorage ni en lógica visible del navegador.

La tuerquita de administración funcionará así:

- En la experiencia pública será discreta.
- Solo aparecerá como acceso administrativo cuando el usuario administrador esté autenticado y validado.
- El acceso directo podrá estar en `/admin`.
- Si alguien entra a `/admin` sin sesión, verá login.
- Si inicia sesión pero no tiene rol admin, no podrá acceder.

## 2. Panel administrador

El módulo admin tendrá tres áreas principales.

### A. Carga de contenido por ponencia

El administrador podrá seleccionar una ponencia y cargar/pegar su transcripción Markdown.

Campos:

```text
Módulo
Ponencia
Ponente
Archivo .md / contenido Markdown
Estado: pendiente / cargado / actualizado
Fecha de última actualización
```

Las transcripciones quedarán asociadas al modelo del congreso:

```ts
{
  modulo_id,
  sesion_id,
  ponente,
  titulo,
  archivo_md,
  contenido_md
}
```

No subiremos todavía los `.md`; dejaremos listo el módulo para que luego tú los cargues.

### B. Configuración de API

El admin tendrá un espacio para configurar:

```text
Proveedor IA
Endpoint base opcional
Modelo
API key
Temperatura
Máximo de tokens de respuesta
```

La API key no se usará desde el frontend público. Se enviará a una función segura de backend para evitar exposición directa.

Importante: no guardaré la API key en localStorage ni en código público.

### C. Prompt maestro editable

El admin podrá escribir y guardar el prompt principal de la Bitácora.

Ejemplo de estructura:

```text
Eres la Bitácora de Resonancia del congreso The Human Shift 2026.
Responde desde una voz sobria, humana, reflexiva y práctica.
No inventes contenido.
Cruza la intención del usuario únicamente con los fragmentos seleccionados.
Incluye una síntesis, tensiones emergentes y una pregunta de cierre.
```

También incluiré un campo para instrucciones de estilo:

```text
Tono
Formato de respuesta
Nivel de profundidad
Restricciones
```

## 3. Base de datos propuesta

Crearé tablas para sostener la arquitectura.

```text
user_roles
- id
- user_id
- role

sessions
- id
- module_id
- speaker
- title
- summary
- tags
- markdown_filename
- sort_order

transcripts
- id
- session_id
- markdown_content
- uploaded_by
- created_at
- updated_at

transcript_chunks
- id
- transcript_id
- session_id
- chunk_index
- content
- keywords
- token_estimate

ai_settings
- id
- provider
- base_url
- model
- encrypted_api_key / stored_api_key_reference
- temperature
- max_tokens
- updated_by
- updated_at

prompt_settings
- id
- system_prompt
- style_prompt
- rag_notice
- updated_by
- updated_at
```

Las tablas tendrán RLS:

- Público: no puede leer transcripciones completas ni configuración de API.
- Admin: puede gestionar contenido y configuración.
- Edge function: puede leer lo necesario para responder.

## 4. Flujo público de usuario

La experiencia pública mantendrá la idea original:

```text
1. Explora módulos
2. Selecciona voces / ponencias
3. Escribe "Tu Propia Voz"
4. Consulta a la Bitácora
5. Recibe Reporte de Resonancia
```

El usuario público no verá:

- API key
- prompt maestro
- panel de carga
- transcripciones completas
- configuración técnica

Solo verá:

- módulos del congreso
- ponentes
- resumen de cada sesión
- selección de voces
- modal “Portal de Articulación”
- respuesta generada

## 5. Motor IA / RAG liviano

Para bajar tokens, no enviaremos todos los Markdown completos.

La función segura hará esto:

```text
Usuario selecciona ponencias
↓
Usuario escribe consulta
↓
Backend identifica transcripciones seleccionadas
↓
Divide o usa chunks ya preparados
↓
Selecciona solo fragmentos relevantes
↓
Construye prompt final compacto
↓
Llama a tu API configurada
↓
Devuelve Reporte de Resonancia
```

Esto reduce consumo porque el prompt final enviará algo como:

```text
Prompt maestro
+
Pregunta del usuario
+
Voces seleccionadas
+
5 a 10 fragmentos relevantes
```

En vez de:

```text
Prompt maestro
+
Todos los .md completos
```

## 6. Consumo estimado de tokens

Dependerá del tamaño de las transcripciones, pero esta arquitectura ayuda mucho.

### Sin RAG, enviando Markdown completos

Si una ponencia tiene entre 5.000 y 12.000 tokens:

```text
1 ponencia: 5.000 - 12.000 tokens
3 ponencias: 15.000 - 36.000 tokens
7 ponencias: 35.000 - 84.000+ tokens
```

Eso sería caro y lento.

### Con RAG liviano por fragmentos

En cada consulta se enviaría aproximadamente:

```text
Prompt maestro: 800 - 1.500 tokens
Pregunta usuario: 50 - 300 tokens
Fragmentos relevantes: 2.000 - 6.000 tokens
Respuesta IA: 800 - 1.500 tokens
```

Total estimado por consulta:

```text
3.500 - 9.500 tokens
```

Incluso si el usuario selecciona muchas ponencias, el sistema solo enviará los fragmentos más relevantes.

## 7. Diseño visual

Mantendré la marca del brochure como fuente principal:

- Fondo negro/carbón.
- Rojo Human Shift como bloque institucional.
- Tipografía elegante y seria.
- Módulos con estructura de programa.
- Interacciones suaves.
- Panel admin sobrio, no protagónico.
- Tuerquita discreta arriba.
- Modal de IA oscuro con blur.
- Botón “Tejer Sabiduría” como acción principal.

La experiencia pública seguirá sintiéndose como un espacio de reflexión, no como un dashboard técnico.

## 8. Archivos y componentes a implementar

Modificaré o crearé:

```text
src/pages/Index.tsx
- Experiencia pública completa

src/pages/Admin.tsx
- Panel administrador

src/pages/Auth.tsx
- Login admin

src/App.tsx
- Rutas públicas y privadas

src/index.css
- Tokens visuales Human Shift

src/lib/congressData.ts
- Arquitectura inicial de módulos y ponencias

src/lib/supabase.ts
- Cliente Supabase / Lovable Cloud

src/components/AdminGate.tsx
- Protección por rol admin

src/components/ResonanceModal.tsx
- Portal de Articulación

src/components/ModuleAccordion.tsx
- Exploración de módulos

supabase/functions/resonance-query/index.ts
- Consulta IA segura con RAG liviano

supabase/functions/admin-ai-settings/index.ts
- Guardado/lectura segura de configuración IA

supabase/functions/admin-transcripts/index.ts
- Carga y procesamiento de transcripciones
```

## 9. Migraciones necesarias

Crearé migraciones para:

- roles seguros;
- sesiones del congreso;
- transcripciones;
- chunks;
- configuración IA;
- configuración de prompt;
- políticas RLS;
- función `has_role`.

También crearé el usuario administrador y le asignaré rol `admin`.

## 10. Orden de implementación

### Fase 1: Plataforma visual y flujo público

- Reemplazar placeholder.
- Crear diseño Human Shift.
- Crear módulos y selección de ponencias.
- Crear modal “Tu Propia Voz”.
- Crear reporte simulado.

### Fase 2: Admin seguro

- Crear login.
- Crear rol admin.
- Crear ruta `/admin`.
- Crear tuerquita discreta.
- Crear panel de carga Markdown.
- Crear panel de API.
- Crear panel de prompt.

### Fase 3: Backend IA

- Crear edge function de consulta.
- Leer configuración IA segura.
- Recuperar chunks relevantes.
- Construir prompt compacto.
- Llamar a la API configurada.
- Devolver Reporte de Resonancia con RAG Notice.

### Fase 4: Preparación para cargar `.md`

- Dejar listo el formulario para cargar transcripciones.
- Procesar Markdown en fragmentos.
- Asociar cada archivo con su ponencia.
- Mostrar estado de carga por sesión.

## 11. Recomendación final

Recomiendo no subir todavía los `.md`.

Primero construimos:

```text
diseño + arquitectura + admin + módulo de carga + prompt + API
```

Luego tú cargas las transcripciones desde el panel admin.

Esto es mejor porque:

- validamos primero la experiencia visual;
- dejamos la marca Human Shift bien resuelta;
- evitamos gastar tokens innecesarios ahora;
- construimos el sistema para que los `.md` entren ordenados por ponencia;
- el costo de IA queda derivado a tu API;
- la consulta final será mucho más eficiente.
