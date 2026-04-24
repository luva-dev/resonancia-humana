
## Qué está ocurriendo

Hay dos problemas visibles en lo que aparece:

### 1. La API key está llegando al frontend

En la vista `/admin`, la app está leyendo directamente la tabla de configuración IA y está trayendo este campo:

```text
api_key
```

Eso significa que la clave privada aparece en la respuesta de red del navegador. Aunque estés en admin, no es lo ideal: una API key privada no debe viajar al frontend. Debe quedarse en backend.

### 2. El endpoint configurado para Gemini parece incompleto

La función `resonance-query` está haciendo el `fetch` directamente a:

```text
https://generativelanguage.googleapis.com/v1beta/openai/
```

Pero la API compatible con OpenAI normalmente debe recibir la llamada en el endpoint completo de chat completions, por ejemplo:

```text
https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
```

Ahora mismo la función usa `settings.base_url` como URL final. Si ese valor está incompleto, la IA falla aunque la key exista.

## Corrección que implementaré

### 1. Mantener la llamada IA solo en backend

El botón “Tejer sabiduría” seguirá llamando a:

```text
resonance-query
```

No se hará ninguna llamada directa desde React a Gemini ni a ningún proveedor externo.

El flujo correcto será:

```text
Usuario pulsa Tejer sabiduría
↓
Frontend envía intención + sessionIds a resonance-query
↓
Backend busca prompts + fragmentos .md
↓
Backend llama al LLM con la API key segura
↓
Frontend recibe la respuesta Markdown
↓
ReactMarkdown la renderiza visualmente
```

### 2. Dejar de exponer `api_key` en `/admin`

Modificaré `src/pages/Admin.tsx` para que ya no haga:

```text
select provider, base_url, model, api_key, temperature, max_tokens
```

En su lugar:

- leerá configuración pública/mask desde una función backend;
- mostrará la API key como “configurada” o “no configurada”;
- solo enviará una nueva key si tú escribes una nueva;
- si dejas el campo vacío, no sobrescribirá la key existente.

Así evitamos que la clave privada aparezca en Network.

### 3. Ajustar la función de administración de IA

Actualizaré `supabase/functions/admin-ai-settings/index.ts` para que:

- valide que el usuario sea admin;
- devuelva configuración sin revelar `api_key`;
- permita guardar cambios de proveedor/modelo/endpoint/temperatura/tokens;
- permita reemplazar la API key solo cuando se envíe una nueva;
- nunca devuelva la key real al navegador.

### 4. Corregir `resonance-query`

Actualizaré `supabase/functions/resonance-query/index.ts` para que:

- construya correctamente el endpoint final;
- si `base_url` termina en `/openai/`, agregue `chat/completions`;
- si ya viene completo, lo respete;
- valide errores del proveedor y devuelva mensajes más útiles internamente;
- mantenga hacia el usuario el mensaje amable:
  ```text
  Hubo una desconexión temporal al consultar la bitácora. Por favor, inténtalo de nuevo.
  ```

### 5. Mejorar el payload RAG

La función seguirá enviando:

```text
System message:
- system_prompt
- style_prompt
- rag_notice

Contexto:
- fragmentos de transcript_chunks filtrados por los session_id seleccionados

User prompt:
- intención exacta escrita por el usuario
```

También reforzaré que cada fragmento indique de qué ponencia viene:

```text
[Fragmento 1 · Pedro Makabe · Ser, conciencia y transformación]
contenido...
```

Esto ayuda a que la respuesta cite mejor al ponente correcto.

### 6. Mantener loading, Markdown y Word

No cambiaré lo que ya está bien:

- loading con spinner:
  ```text
  Tejiendo saberes. Por favor, mantén la presencia unos segundos...
  ```
- renderizado con `ReactMarkdown`;
- botón “Descargar Word” después de recibir respuesta;
- descarga `.docx` con intención, ponencias y síntesis.

## Archivos a modificar

```text
src/pages/Admin.tsx
- Dejar de leer api_key directamente.
- Usar función backend segura para cargar/guardar configuración IA.
- Mostrar estado “API key configurada” sin exponerla.

supabase/functions/admin-ai-settings/index.ts
- Implementar GET/POST seguro para configuración IA.
- Enmascarar api_key.
- Validar admin.

supabase/functions/resonance-query/index.ts
- Corregir endpoint final del proveedor.
- Mejorar construcción del contexto RAG.
- Mejorar errores internos sin exponer secretos.

src/components/ResonanceModal.tsx
- Mantener integración actual.
- Opcionalmente mostrar detalle diferenciado para 402/429 si el backend lo devuelve.
```

## Resultado esperado

Después del cambio:

```text
1. La API key ya no aparecerá en Network.
2. El botón Tejer sabiduría usará la API real desde backend.
3. Gemini recibirá el endpoint correcto.
4. La respuesta se generará desde los .md de las ponencias seleccionadas.
5. El usuario verá Markdown bien formateado.
6. El usuario podrá descargar el resultado en Word.
```
