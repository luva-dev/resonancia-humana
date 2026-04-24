
## Objetivo

Corregir la carga de archivos `.md` en admin manteniendo exactamente el flujo que necesitas:

```text
1. Tú eliges la ponencia en una lista desplegable
2. Tú subes o arrastras el archivo Markdown
3. La app toma el contenido del archivo
4. Lo guarda asociado a la ponencia elegida
5. Lo fragmenta para que el motor de IA pueda usarlo
```

El nombre del archivo no será usado para decidir la ponencia. La relación correcta será:

```text
ponencia seleccionada en dropdown = ponencia asociada al Markdown
```

## Diagnóstico actual

Hay una desalineación entre la app y la base de datos:

- La vista admin conserva la lista desplegable, pero actualmente usa ponencias del código con IDs tipo:
  ```text
  b0-omar-osses
  ```
- La tabla espera IDs reales tipo UUID:
  ```text
  48156d8c-0bad-4cf5-9be0-5828df87e31b
  ```
- Por eso aparece el error:
  ```text
  invalid input syntax for type uuid
  ```

Además, la base de datos actualmente tiene 6 ponencias genéricas, mientras que el código contiene 11 ponencias reales del congreso.

## Plan de corrección

### 1. Corregir la fuente de ponencias del admin

Actualizaré `src/pages/Admin.tsx` para que la lista desplegable cargue las ponencias reales desde la base de datos, no desde la lista local antigua.

Nuevo flujo:

```text
/admin
↓
lee congress_sessions
↓
muestra las ponencias en el dropdown
↓
cada opción usa el UUID real
↓
el archivo .md se guarda sin error
```

La UI seguirá teniendo:

- selector de ponencia;
- zona para arrastrar archivo `.md`;
- botón “Guardar y fragmentar”.

No volveré a poner un campo para copiar y pegar el Markdown.

### 2. Corregir las tablas/datos de ponencias

Actualizaré los datos de la tabla `congress_sessions` para que contenga las 11 ponencias reales que ya están definidas en la app:

```text
1. Omar Osses — El coaching hoy: evolución y escenarios futuros
2. Pedro Makabe — Ser, conciencia y transformación
3. Sandra Rozo — El liderazgo empieza por dentro
4. María Victoria García — Competencias humanas para liderar en la complejidad
5. Minerva Gebran — Culturas con sentido
6. Juan Vera — Tecnología e inteligencia artificial: el desafío humano
7. Violeta Hoshi — Mindfulness que mueve organizaciones
8. Emmanuel Pérez — El cuerpo en las organizaciones
9. Erika Salazar — Innovación y agilidad cultural
10. Enrique Horna — Cómo manifestar metas y hacer realidad los sueños
11. Conversatorio integrador
```

Esto no requiere cambiar la estructura principal de las tablas; requiere corregir los datos para que las ponencias disponibles en la app sean las mismas que existen en la base de datos.

Si hace falta, también dejaré una columna auxiliar segura para conservar el identificador legible anterior, por ejemplo:

```text
legacy_key = b0-omar-osses
```

pero la relación técnica seguirá usando el UUID real.

### 3. Hacer que la vista pública use las mismas ponencias

Actualizaré `src/pages/Index.tsx` para que también lea `congress_sessions` desde la base de datos.

Así, la selección pública y la carga admin hablarán el mismo idioma:

```text
Admin carga Markdown sobre UUID real
↓
Usuario selecciona ponencia con ese mismo UUID
↓
Tejer sabiduría envía UUID real
↓
resonance-query encuentra los fragmentos correctos
```

Esto evita que el usuario seleccione una ponencia de la lista antigua mientras los Markdown están guardados en otra lista distinta.

### 4. Mantener la asociación manual por ponencia

La lógica de guardado quedará así:

```text
selectedSession = UUID de la ponencia elegida
filename = nombre real del archivo subido
markdown = contenido leído del archivo
```

Luego se guarda:

```text
transcripts.session_id = selectedSession
transcripts.markdown_filename = filename
transcripts.markdown_content = contenido completo del .md
```

Y se generan fragmentos:

```text
transcript_chunks.session_id = selectedSession
transcript_chunks.transcript_id = id de la transcripción
transcript_chunks.content = fragmento del Markdown
```

El nombre del archivo será solo informativo. No determinará la ponencia.

### 5. Mejorar validaciones y mensajes

Agregaré validaciones claras:

- si no hay ponencia seleccionada:
  ```text
  Selecciona primero una ponencia.
  ```
- si no hay archivo:
  ```text
  Carga un archivo Markdown antes de guardar.
  ```
- si el archivo no es `.md`:
  ```text
  Carga únicamente archivos Markdown.
  ```
- si ocurre un error de relación:
  ```text
  No se pudo guardar la transcripción. Revisa que la ponencia exista en la base de datos.
  ```

### 6. Confirmación sobre el resultado de “Tejer sabiduría”

Ahora mismo el resultado funciona así:

```text
Usuario selecciona ponencias
↓
escribe una intención o pregunta
↓
presiona “Tejer sabiduría”
↓
se abre el modal
↓
la función resonance-query busca fragmentos de esas ponencias
↓
la IA responde en pantalla
```

La descarga en Word todavía no está implementada. La puedo agregar en esta misma corrección para que, después de generar la respuesta, aparezca:

```text
Descargar Word
```

El archivo `.docx` incluiría:

- título: Bitácora de Resonancia;
- fecha;
- intención del usuario;
- ponencias seleccionadas;
- respuesta generada por IA;
- aviso RAG.

### 7. Archivos a modificar

```text
src/pages/Admin.tsx
- Cargar ponencias desde base de datos.
- Mantener dropdown.
- Mantener carga directa del archivo .md.
- Guardar usando UUID real.
- Mejorar mensajes de error.

src/pages/Index.tsx
- Cargar ponencias desde base de datos.
- Usar los mismos UUIDs que admin.

src/components/ResonanceModal.tsx
- Opcionalmente agregar botón “Descargar Word” después de generar respuesta.

package.json
- Agregar dependencia para generar .docx si se implementa descarga Word.

Base de datos
- Corregir/insertar las 11 ponencias reales en congress_sessions.
- Mantener transcripts y transcript_chunks ligados a UUID real.
```

## Resultado esperado

Después de la corrección:

```text
Seleccionas una ponencia
↓
arrastras el .md aunque tenga cualquier nombre
↓
guardas
↓
la transcripción queda ligada a esa ponencia
↓
Tejer sabiduría usa esos fragmentos correctamente
```

El error de UUID desaparece porque la app dejará de intentar guardar IDs como `b0-omar-osses` en campos UUID.
