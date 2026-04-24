
## Ajuste del resultado y del Word descargable

Voy a corregir dos cosas relacionadas con “Tejer sabiduría”:

1. Que el resultado ya no muestre texto interno/dummy debajo de la síntesis.
2. Que el Word descargado sea un informe ejecutivo bonito, sobrio, cómodo de leer y alineado con la estética de la página, pero sin fondo negro.

## 1. Limpiar el texto que aparece después del resultado

En la función backend `resonance-query` hay una línea que devuelve:

```ts
respuesta de la IA + rag_notice
```

Eso hace que aparezcan instrucciones internas o texto que no aporta valor.

Cambiaré la lógica para que:

```text
La IA sí reciba el rag_notice como instrucción interna.
El usuario NO vea el rag_notice.
El frontend reciba solo la síntesis final.
```

También agregaré una limpieza defensiva para eliminar, si llegaran a aparecer, bloques como:

```text
MANDATO DE VERDAD
RAG Notice
Aviso RAG
separadores técnicos
símbolos decorativos innecesarios
```

## 2. Convertir el Markdown a Word real

Actualmente el Word exporta el texto casi línea por línea, por eso aparecen símbolos como:

```text
**
###
---
-
```

Voy a reemplazar esa exportación por una conversión real de Markdown a elementos Word:

```text
# Título        → título real
## Sección      → subtítulo real
**negrita**     → negrita real
*itálica*       → itálica real
- viñeta        → lista real de Word
1. punto        → lista numerada real
---             → se elimina o se convierte en espacio visual limpio
```

El resultado debe verse parecido a la página, pero adaptado a un informe ejecutivo.

## 3. Diseño visual del Word: sobrio, claro y fácil de leer

El documento no tendrá fondo negro. Usará una estética clara, cálida y discreta inspirada en la página.

Propuesta de estilo:

```text
Fondo principal:
- Marfil cálido / pergamino muy suave

Fondos decorativos:
- Bandas suaves color arena o vino muy transparente
- Detalles laterales discretos
- Separadores finos, no símbolos
- Sin saturación ni elementos pesados

Texto:
- Negro o gris carbón muy oscuro
- Fácil de leer
- Alto contraste sobre fondo claro

Títulos:
- Negro / gris carbón
- Sin colores fuertes
- Estilo editorial sobrio

Fuente:
- Georgia o Aptos/Arial según compatibilidad Word
- Cuerpo cómodo de 11–12 pt
- Títulos 18–22 pt
```

No será una copia oscura de la web. Será una versión clara, formal y presentable.

## 4. Estructura del informe ejecutivo

El Word quedará organizado así:

```text
Bitácora de Resonancia
Informe ejecutivo de síntesis

Fecha
Intención del usuario
Ponencias seleccionadas

Síntesis ejecutiva
[respuesta de la IA con formato real]

Nota metodológica
Síntesis generada a partir de la intención del usuario y las ponencias seleccionadas disponibles en la Bitácora.
```

La sección “Aviso RAG” será reemplazada por una nota metodológica breve, profesional y no técnica.

## 5. Fondos decorativos discretos

Como el exportador usa `docx`, implementaré los fondos decorativos con recursos seguros para Word:

```text
- Bloques/secciones con sombreado claro
- Párrafos con bordes inferiores finos
- Encabezado visual sobrio
- Caja destacada para la intención del usuario
- Caja suave para la nota metodológica
```

Evitaré elementos que puedan romperse en Google Docs o Word, como fondos complejos, tablas usadas como separadores o símbolos ornamentales.

## 6. Archivos a modificar

```text
supabase/functions/resonance-query/index.ts
- Dejar de concatenar rag_notice a la respuesta.
- Mantener rag_notice solo como instrucción interna.
- Agregar limpieza defensiva de instrucciones internas.

src/components/ResonanceModal.tsx
- Reemplazar exportación raw por exportación DOCX formateada.
- Convertir Markdown a títulos, párrafos, listas, negritas e itálicas reales.
- Agregar diseño claro, sobrio y decorativo al informe.
- Quitar símbolos y separadores técnicos.
- Cambiar “Aviso RAG” por “Nota metodológica”.
```

## Resultado esperado

Después del cambio:

```text
En pantalla:
- Solo se verá la síntesis útil.
- No aparecerá texto dummy ni instrucciones internas.

En Word:
- No aparecerán asteriscos, numerales Markdown ni separadores raros.
- El documento tendrá fondo claro, no negro.
- Tendrá detalles decorativos discretos y sobrios.
- Será cómodo de leer.
- Se verá como un informe ejecutivo listo para presentar.
```
