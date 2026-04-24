## Objetivo

Agregar dos capas de protección en la landing:

1. Un acceso provisional que bloquee todo el contenido hasta validar las credenciales de organizadores.
2. Un aviso legal sticky en la parte superior, visible desde el primer momento y coherente con la estética actual.

## Qué voy a implementar

### 1. Gate de acceso provisional para la landing

Crearé una pantalla de acceso de pantalla completa antes de mostrar cualquier contenido de `/`.

La experiencia tendrá:
- fondo limpio y sobrio, alineado con la paleta actual vino/carbón/dorado;
- marca de Equilibria en formato tipográfico elegante por ahora, porque no hay archivo de logo en `public/`;
- campos `Usuario` y `Contraseña`;
- validación clara con mensaje de error discreto;
- transición al contenido solo cuando el acceso sea válido.

### 2. Implementación segura del acceso

No expondré esas credenciales en el frontend ni las dejaré hardcodeadas en React.

En su lugar:
- almacenaré las credenciales provisionales como secretos del backend;
- crearé una función backend para validar el acceso;
- el frontend enviará usuario/contraseña a esa función;
- tras validación correcta, se guardará una sesión de acceso restringido para la visita actual;
- si no es válida, la landing seguirá bloqueada.

Esto evita que cualquiera vea el usuario y contraseña inspeccionando el código del navegador.

### 3. Banner legal sticky encima de la cabecera principal

Agregaré una franja superior fija/pegajosa por encima del hero principal.

Características:
- será lo primero que verá el usuario al entrar;
- permanecerá visible al hacer scroll;
- tendrá tipografía clara, tamaño destacado y buena legibilidad;
- se integrará visualmente con el tema actual usando tonos discretos y un tratamiento editorial, no un warning genérico.

El texto legal se mostrará completo, con buena jerarquía y espaciado para que siga siendo legible incluso en pantallas medianas.

## Diseño propuesto

### Gate visual

Seguiré el lenguaje ya existente:
- fondos en degradado sobrio, similares a `bg-ritual`;
- acentos dorados y bordes finos;
- tipografía display para la marca y sans serif para campos y apoyo;
- panel central elegante, profesional y limpio.

### Banner legal

Usaré una barra superior con:
- fondo oscuro ligeramente diferenciado del hero;
- borde/acento fino;
- texto claro con contraste alto;
- comportamiento sticky con layering correcto para que no quede oculto por otros elementos.

## Archivos a modificar

```text
src/pages/Index.tsx
- Envolver la landing con el gate de acceso.
- Insertar el banner legal como primer elemento visible.
- Ajustar spacing superior del hero para convivir con el banner sticky.

src/App.tsx
- Si hace falta, envolver la ruta `/` con la lógica de protección o un layout específico.

src/index.css
- Ajustar estilos globales necesarios para el banner sticky y la capa de acceso.

src/components/AccessGate.tsx
- Nuevo componente para la pantalla de acceso provisional.

supabase/functions/preview-access/index.ts
- Nueva función backend para validar usuario/contraseña contra secretos.
```

## Detalles técnicos

```text
Frontend
- Pantalla bloqueante hasta validar acceso.
- Formulario con validación básica y estados de carga/error.
- Persistencia de acceso restringido para la sesión activa.

Backend
- Secrets para usuario y contraseña provisionales.
- Función backend que compara credenciales de forma segura.
- Respuesta simple: autorizado / no autorizado.

UX
- El banner legal irá antes del nav principal.
- El contenido de la landing no se renderizará hasta que el gate sea válido.
- El diseño mantendrá coherencia con la identidad actual del sitio.
```

## Nota importante

No encontré un archivo de logo oficial de Equilibria en el proyecto. Para avanzar sin bloquear la implementación, usaré un logotipo tipográfico sobrio con “Equilibria”. Si luego compartes el logo oficial, lo sustituyo fácilmente.

## Resultado esperado

Después del cambio:

```text
1. La landing quedará bloqueada al entrar.
2. Solo quien tenga las credenciales correctas podrá verla.
3. Las credenciales no quedarán expuestas en el cliente.
4. El banner legal será lo primero visible y quedará sticky.
5. Todo conservará una estética profesional y coherente con el diseño actual.
```