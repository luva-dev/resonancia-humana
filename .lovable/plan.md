
## Corrección: cada ponencia con su propio Markdown visible y separado

La regla final debe quedar así:

```text
Ponencia A → su propio archivo .md → sus propios fragmentos RAG
Ponencia B → su propio archivo .md → sus propios fragmentos RAG
Ponencia C → su propio archivo .md → sus propios fragmentos RAG
```

El archivo cargado nunca debe aparecer como si aplicara a todas las ponencias.

## Qué está fallando ahora

La vista de admin está mezclando dos conceptos:

1. `congress_sessions.markdown_filename`
   - Es el nombre esperado o sugerido del archivo.
   - No confirma que el Markdown ya esté cargado.

2. `transcripts.markdown_filename`
   - Es el archivo realmente subido para esa ponencia.
   - Este es el dato que debe mostrarse como “cargado”.

Por eso la interfaz puede hacer parecer que todas las ponencias tienen el mismo MD o que el archivo cargado se refleja globalmente.

## Plan de implementación

### 1. Mostrar estado real por ponencia en admin

Actualizaré `src/pages/Admin.tsx` para cargar, además de las ponencias, el estado real de `transcripts`.

En la lista desplegable y/o en el panel de carga se mostrará por cada ponencia:

```text
Sandra Rozo — El liderazgo empieza por dentro
Estado: Cargado
Archivo cargado: El-liderazgo-empieza-por-dentro-e086c016-e2ed.md
Fragmentos: 14
Última actualización: fecha/hora
```

Y si no tiene documento:

```text
Emmanuel Pérez — El cuerpo en las organizaciones
Estado: Sin Markdown cargado
```

### 2. Dejar un badge/indicador claro de “Cargado”

La pantalla de admin tendrá un indicador visible para que sepas exactamente qué ponencias ya tienen documento.

Ejemplo:

```text
[Cargado] Omar Osses — El coaching hoy...
[Sin MD] Emmanuel Pérez — El cuerpo en las organizaciones
```

El badge se basará en `transcripts`, no en el nombre sugerido guardado en `congress_sessions`.

### 3. Mantener selección manual de ponencia

El flujo seguirá igual:

```text
1. Seleccionas la ponencia
2. Arrastras o eliges el archivo .md
3. Se muestra el nombre del archivo pendiente
4. Guardas
5. Ese archivo queda asociado solo a esa ponencia
```

El nombre del archivo no decide la ponencia. La ponencia la decide el dropdown.

### 4. Evitar cargas accidentales al cambiar de ponencia

Cuando cambies de ponencia, limpiaré el archivo pendiente no guardado para evitar confusiones.

Así no ocurrirá esto:

```text
subo archivo de Omar
↓
cambio a Pedro sin darme cuenta
↓
guardo archivo equivocado en Pedro
```

La interfaz mostrará claramente:

```text
Ponencia seleccionada: Pedro Makabe
Archivo pendiente: ninguno
Archivo cargado actualmente: pedro.md
```

### 5. Guardar únicamente sobre la ponencia seleccionada

Reforzaré la lógica de guardado para que haga esto:

```text
transcripts.session_id = selectedSession
transcripts.markdown_filename = nombre real del archivo subido
transcripts.markdown_content = contenido del archivo subido
```

Después, los fragmentos se regenerarán solo para esa transcripción:

```text
delete transcript_chunks where transcript_id = transcript.id
insert chunks nuevos con session_id = selectedSession
```

No habrá ninguna actualización masiva sobre todas las ponencias.

### 6. Reflejar el estado en la vista del usuario general

Actualizaré la vista pública para que cada ponencia muestre su propio estado:

```text
Omar Osses
Badge: Transcripción disponible
Botón: Descargar transcripción

Emmanuel Pérez
Badge: Transcripción pendiente
Botón: No disponible / deshabilitado
```

Cuando el usuario descargue, descargará el Markdown real de esa ponencia desde `transcripts`, no el nombre sugerido del catálogo.

### 7. Garantizar que “Tejer sabiduría” use el Markdown correcto

La función de IA ya busca fragmentos por `session_id`, pero revisaré el flujo completo para asegurar:

```text
Usuario selecciona Sandra Rozo
↓
se envía el UUID de Sandra Rozo
↓
resonance-query busca transcript_chunks.session_id = UUID de Sandra Rozo
↓
la respuesta usa solo los fragmentos de Sandra Rozo
```

Si el usuario selecciona varias ponencias, la IA usará los fragmentos de esas ponencias específicas, no un Markdown global.

### 8. Corregir datos ya cargados si quedaron duplicados

Revisaré los registros existentes en `transcripts`.

Si hay dos ponencias con el mismo Markdown por error, lo dejaré visible y corregible desde admin. Si la duplicación es claramente accidental, limpiaré la asociación incorrecta para que puedas volver a cargar el archivo correcto por ponencia.

No borraré documentos correctos sin necesidad.

### 9. Reforzar la integridad de tablas si falta algo

Verificaré y, si hace falta, agregaré migraciones para asegurar:

```text
transcripts.session_id único por ponencia
transcripts.session_id referencia a congress_sessions.id
transcript_chunks.transcript_id referencia a transcripts.id
transcript_chunks.session_id referencia a congress_sessions.id
```

Esto hace imposible tener múltiples transcripciones activas para la misma ponencia o fragmentos sin relación clara.

## Archivos y base de datos a tocar

```text
src/pages/Admin.tsx
- Cargar estado real de transcripts.
- Mostrar badge Cargado / Sin MD.
- Mostrar nombre correcto del archivo cargado por ponencia.
- Limpiar archivo pendiente al cambiar de ponencia.
- Guardar y refrescar solo la ponencia seleccionada.

src/pages/Index.tsx
- Cargar disponibilidad real de Markdown por ponencia.
- Mostrar estado al usuario general.
- Descargar el Markdown propio de cada ponencia.

src/components/ModuleAccordion.tsx
- Mostrar badges de disponibilidad.
- Deshabilitar o aclarar descarga cuando no exista transcripción.

supabase/functions/resonance-query/index.ts
- Revisar que el contexto RAG use fragmentos por session_id seleccionado.

Base de datos
- Verificar restricciones.
- Corregir duplicados o asociaciones erróneas existentes.
```

## Resultado esperado

En admin verás algo como:

```text
Omar Osses — Cargado — omar.md
Pedro Makabe — Cargado — pedro.md
Sandra Rozo — Cargado — sandra.md
Emmanuel Pérez — Sin MD
```

En la vista pública, cada ponencia reflejará su propio estado.

Y al “Tejer sabiduría”:

```text
selección de una ponencia = usa el Markdown de esa ponencia
selección de varias ponencias = usa los Markdown de esas ponencias
```

Subir o reemplazar el `.md` de una ponencia no modificará ni mostrará cambios en las demás.
