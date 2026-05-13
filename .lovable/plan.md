## Objetivo

Añadir un pie de página discreto al final del listado de ponencias (después del conversatorio integrador) con el crédito de autoría de Equilibria, su logo y un enlace al sitio web.

## Cambios

1. **Copiar el logo** de `user-uploads://Logo_Equilibria_2025_1_1.png` a `src/assets/equilibria-logo.png` para poder importarlo como módulo ES6.

2. **Crear un nuevo componente `src/components/SiteFooter.tsx`** con:
   - Texto: "Esta landing page fue creada por"
   - Logo de Equilibria (altura discreta, ~24-32px) importado desde `@/assets/equilibria-logo.png`
   - Enlace a https://equilibria.lat/ (target="_blank", rel="noopener noreferrer")
   - Estilos discretos: texto pequeño (`text-xs` / `text-sm`), color `text-muted-foreground`, separador superior sutil (`border-t border-border`), padding cómodo, centrado y responsive (en móvil apilado, en desktop en línea).

3. **Insertar `<SiteFooter />` en `src/pages/Index.tsx`** justo después de `<ModuleAccordion ... />` y antes del bloque del FAB flotante, para que aparezca al final del contenido del congreso, fuera de los cuadros de ponencias.

## Detalles visuales

- Layout: `flex flex-col sm:flex-row items-center justify-center gap-3`
- Logo en color teal original sobre el fondo oscuro del sitio (verificar contraste; si hace falta, aplicar leve `opacity-80` para integrarlo).
- Sin CTAs llamativos, sin sombras fuertes — simplemente una línea de crédito tipo "powered by".

## Resultado esperado

Al final de la página de la bitácora aparece una línea discreta con el texto, el logo de Equilibria y el enlace a equilibria.lat, sin competir visualmente con el contenido principal.
