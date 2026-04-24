
## Objetivo

Mejorar la visualización de las ponencias seleccionadas en el panel flotante de “Tejer sabiduría”, especialmente cuando se eligen muchas o todas, para que no se vea apiñado ni ilegible.

Ahora el panel muestra cada selección en una línea muy pequeña y truncada:

```text
Ponente — título largo...
Ponente — título largo...
Ponente — título largo...
```

Cuando hay 11 ponencias seleccionadas, el bloque queda demasiado comprimido y no permite entender bien qué se eligió.

## Solución propuesta

### 1. Reemplazar la lista apiñada por un resumen claro

En el panel flotante, cuando haya varias ponencias seleccionadas, mostraré primero un resumen legible:

```text
11 ponencias seleccionadas
4 bloques temáticos
```

Y debajo una visualización más ordenada.

### 2. Agrupar por participante o por bloque temático

Para que sea fácil leer, agruparé las selecciones por bloque temático y mostraré dentro el nombre del participante como dato principal.

Ejemplo:

```text
El coaching hoy
- Omar Osses
- Pedro Makabe

Personas que influyen
- Sandra Rozo
- María Victoria García

Culturas que evolucionan
- Minerva Gebran
- Juan Vera
- Violeta Hoshi
```

Esto evita que el usuario tenga que leer títulos largos todos juntos.

### 3. Usar una vista compacta pero clara en el panel pequeño

Como el panel flotante tiene poco ancho, aplicaré una versión compacta:

```text
El coaching hoy
Omar Osses · Pedro Makabe

Personas que influyen
Sandra Rozo · María Victoria García
```

Con:

- títulos de bloque en color acento;
- nombres de participantes en texto claro;
- separación visual entre bloques;
- altura máxima con scroll cómodo;
- sin cajas demasiado finas ni líneas amontonadas.

### 4. Agregar una opción para ver el detalle completo

Para no saturar el panel flotante, agregaré un botón o enlace discreto:

```text
Ver detalle de ponencias
```

Al activarlo, podrá expandirse la lista con:

```text
Participante
Título de la ponencia
```

Esto permite que el panel sea limpio por defecto, pero que el usuario pueda confirmar exactamente qué eligió.

### 5. Mejorar también el modal principal

En el modal grande, la sección “Voces seleccionadas” también usa chips con títulos largos. La ajustaré para que se lea mejor:

- mostrar participante primero;
- título debajo en texto más pequeño;
- usar tarjetas compactas;
- mantener scroll si hay muchas;
- conservar la estética oscura, vino y dorada de la página.

Ejemplo visual:

```text
Voces seleccionadas

Omar Osses
El coaching hoy: evolución y escenarios futuros

Pedro Makabe
Ser, conciencia y transformación
```

### 6. Mantener intacta la lógica de IA

No cambiaré la conexión con la API ni la generación del resultado.

Solo cambiaré la presentación visual de las ponencias seleccionadas antes de enviar la consulta.

El payload seguirá usando:

```text
sessionIds: selectedSessions.map(session => session.id)
```

Así que la IA seguirá recibiendo las ponencias correctas.

## Archivos a modificar

```text
src/pages/Index.tsx
- Rediseñar el bloque de ponencias seleccionadas dentro del panel flotante.
- Agrupar selecciones por módulo/bloque.
- Mostrar nombres de participantes de forma clara.
- Agregar vista compacta y opción de detalle.

src/components/ResonanceModal.tsx
- Mejorar la sección “Voces seleccionadas”.
- Reemplazar chips truncados por tarjetas o lista legible.
- Mostrar ponente como dato principal y título como dato secundario.
```

## Resultado esperado

Después del cambio:

```text
Cuando selecciones 1 o pocas ponencias:
- Se verá el nombre del participante y el título claramente.

Cuando selecciones todas:
- No se verá una lista apiñada.
- Se agruparán por bloque temático.
- Será fácil entender qué voces están seleccionadas.
- El panel seguirá siendo compacto y usable.
- El modal principal mostrará el detalle completo de manera ordenada.
```

La experiencia quedará más clara, legible y coherente con el diseño sobrio de la página.
