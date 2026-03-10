# Motor de Colores (Explicación del Sistema)

## Glosario de Términos
*   **Variable CSS (Custom Property):** Un espacio de memoria en los estilos de la página que guarda un valor (ej: `--color-primary: #1a91db;`). Si se actualiza la variable, todos los elementos que la estén usando cambiarán de color simultáneamente.
*   **color-mix():** Una función matemática moderna de CSS que permite mezclar dos colores (por ejemplo, mezclar el Primary con un 10% de blanco) para generar sombras o iluminaciones sin necesidad de usar librerías externas.
*   **Daltonismo:** Condición visual donde los contrastes típicos fallan. El sistema incluye paletas especiales optimizadas para esta accesibilidad.

---

## ¿Cómo se manejan los colores en el código?
El corazón de los colores vive en `src/stores/useThemeStore.js`. Allí existe un objeto (Diccionario) lógico que define qué representa cada color fundamental:

```javascript
colors: {
  primary: '#1a91db',
  accent: '#db8b1a',
  secondary: '#3f8bba',
  bgPage: '#f0f2f5',
  textPrimary: '#121212',
}
```

### ¿Cómo sabe el sistema cuál es primario, secundario, etc?
El sistema lo sabe mediante **Nomenclatura Semántica**. Las llaves (`primary`, `accent`, etc.) no cambian nunca; lo único que cambia es su valor hexadecimal (`#...`). 
Cuando un componente Vue en la plataforma quiere un botón, no le dice "píntate de Azul", le dice "píntate usando la variable `var(--color-primary)`".

### Variables Derivadas Autogeneradas (La Magia del Sistema)
El sistema genera decenas de colores a partir de solo 5 mediante cálculos automáticos en JavaScript y CSS (`color-mix` y conversiones de Hexadecimal a RGB). 
*   **Sombras:** El sistema descompone el color Primario a RGB y genera iteraciones translúcidas (`rgba(X, Y, Z, 0.15)`). Esto garantiza que las sombras de las tarjetas siempre tengan el "tono" del color primario, haciéndolas orgánicas.
*   **Fondos de tarjetas (`bgCard`):** Mezcla el fondo de página con una pequeñísima pizca del texto principal para crear un recuadro apenas visible pero lujoso.

---

## ¿Dónde se ve cada color?

1.  **Primario (Primary):** Es la identidad de marca (El azul del mar).
    *   *Se ve en:* El botón principal, el Navbar, el Footer, bordes de `<input>` al seleccionarlos, Títulos H1 gigantes y fondos de tablas.
2.  **Secundario (Secondary):** Un color de soporte para acciones pasivas.
    *   *Se ve en:* Botones de "Cancelar" o flujos alternos, medallas (badges) informativas de la plataforma.
3.  **Acento (Accent):** Es el color de urgencia o llamado a la acción comercial. Debe contrastar fuertemente (ej. Naranja frente al Azul).
    *   *Se ve en:* Los precios en tamaño grande (ej. `$125`), ofertas y notas importantes en los editores.
4.  **Fondo de Página (bgPage):** 
    *   *Se ve en:* El fondo infinito detrás de toda la aplicación, espacios vacíos. Si el sistema pasa a modo Oscuro, esto cambia a `#121212` e invierte toda la luz.
5.  **Letras (textPrimary / textSecondary):**
    *   *Se ve en:* Los párrafos, las descripciones. El TextSecondary se genera agregando transparencia al texto primario para detalles menores, notas de autor o fechas.
