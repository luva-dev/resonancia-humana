
## Diagnóstico del error

El error `400` que aparece en la consola viene del intento de inicio de sesión con contraseña. En este caso no parece ser un error visual de la app, sino de autenticación.

La causa más probable es una de estas:

1. El usuario `luva@equilibria.lat` todavía no existe realmente en el sistema de autenticación.
2. El usuario fue creado, pero quedó pendiente de confirmación por correo.
3. Se está intentando entrar directamente con la clave `Equilibria2025!` antes de completar el alta inicial.

Aunque la base de datos ya tiene la lógica para asignar el rol `admin` a ese correo, eso solo ocurre cuando el usuario existe en el sistema de autenticación. La migración no crea automáticamente el usuario con contraseña.

## Qué voy a corregir

Haré que el acceso admin quede realmente listo para usar con:

```text
Correo: luva@equilibria.lat
Clave: Equilibria2025!
```

sin depender de pasos confusos ni de que tengas que adivinar si debes crear usuario, confirmar correo o iniciar sesión.

## Plan de implementación

### 1. Crear un arranque seguro del usuario administrador

Crearé una función segura de backend para inicializar el administrador.

Reglas de seguridad:

- Solo podrá crear el usuario `luva@equilibria.lat`.
- Solo funcionará si todavía no existe un admin.
- Creará el usuario con la clave `Equilibria2025!`.
- Confirmará únicamente ese usuario inicial para que puedas entrar.
- Asignará el rol `admin` en `user_roles`.
- No dejará expuesta la clave ni permitirá crear otros usuarios.

Flujo:

```text
Función bootstrap-admin
↓
Verifica si ya existe admin
↓
Si no existe, crea luva@equilibria.lat
↓
Asigna rol admin
↓
Marca bootstrap como completado
```

### 2. Corregir la pantalla `/auth`

Actualizaré la pantalla de acceso para que sea más clara:

- Cambiar “Crear usuario admin inicial” por una acción más precisa:
  ```text
  Preparar acceso administrador
  ```
- Mantener el botón:
  ```text
  Entrar
  ```
- Mostrar mensajes claros:
  - “Administrador preparado. Ahora puedes entrar.”
  - “La clave o el correo no coinciden.”
  - “Este acceso ya fue preparado anteriormente.”

### 3. Evitar confusión con confirmación de correo

No activarė el auto-confirm global para todos los usuarios.

Solo dejaré listo el usuario administrador inicial, porque este caso fue solicitado explícitamente como credencial cerrada para el panel.

El resto del sistema de autenticación seguirá protegido.

### 4. Validar el rol admin después del login

Revisaré que el flujo completo quede así:

```text
/auth
↓
login con luva@equilibria.lat
↓
verificación de sesión
↓
verificación backend de rol admin
↓
entrada a /admin
```

Si el usuario existe pero no tiene rol, la función de preparación podrá corregirlo de forma segura.

### 5. Mejorar el manejo de errores

Actualizaré los mensajes para que no dependas de ver la consola.

En vez de solo mostrar el error técnico, la app dirá algo entendible:

```text
No fue posible entrar.
Revisa que hayas preparado el acceso administrador o que la clave sea correcta.
```

Y para errores de confirmación:

```text
El usuario existe, pero no está listo para entrar. Usa “Preparar acceso administrador”.
```

## Archivos a tocar

```text
src/pages/Auth.tsx
- Ajustar botones, mensajes y flujo de preparación admin.

supabase/functions/bootstrap-admin/index.ts
- Nueva función segura para crear/preparar el usuario admin inicial.

src/components/AdminGate.tsx
- Mantener protección por rol, con mensajes más claros si aplica.

supabase/migrations/
- Si hace falta, agregar una tabla mínima de control de bootstrap para impedir reejecuciones inseguras.
```

## Resultado esperado

Después del cambio podrás entrar así:

```text
Ruta: /auth
Correo: luva@equilibria.lat
Clave: Equilibria2025!
```

Si el usuario aún no existe, primero usarás:

```text
Preparar acceso administrador
```

y luego:

```text
Entrar
```

El error `400` dejará de ser un bloqueo silencioso y la plataforma tendrá un flujo inicial de administrador más claro y seguro.
