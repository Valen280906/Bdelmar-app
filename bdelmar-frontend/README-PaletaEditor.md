# Editor de Paleta (PaletteEditor)

## Glosario de Términos
*   **Draft (Borrador):** Un estado temporal de los colores que permite al usuario previsualizar los cambios sin aplicarlos de forma permanente a toda la aplicación.
*   **Hexadecimal (Hex):** Un formato de 6 caracteres (ej. `#1a91db`) utilizado en la web para representar colores mediante la combinación de Rojo, Verde y Azul (RGB).
*   **Reactividad:** La capacidad de Vue.js para actualizar la interfaz gráfica automáticamente tan pronto como un dato (como un color) cambia.
*   **DOM (Document Object Model):** La estructura que representa el documento HTML en el navegador.

---

## ¿Cómo funciona la Paleta Editor?
El componente `PaletteEditor.vue` es la interfaz gráfica donde el administrador puede cambiar los colores del sistema. Su funcionamiento se divide en tres pasos principales:

1.  **Lectura de Estados:**
    El componente se conecta al almacenamiento global (Pinia a través de `useThemeStore.js`) y lee los colores actuales o los colores en "draft" (borrador) si el administrador ya empezó a editar.

2.  **Interfaz Interactiva:**
    Muestra 5 campos fijos (`primary`, `accent`, `secondary`, `bgPage`, `textPrimary`). Cada uno tiene un selector de color nativo de HTML (`<input type="color">`). Este selector nativo garantiza que la ventana para elegir el color dependa de si el usuario está en Windows, Mac o un teléfono móvil, ofreciendo siempre una experiencia familiar y optimizada.

3.  **Gestión de Cambios en Tiempo Real:**
    Al mover el selector de color, se dispara el evento `@input`. Esto ejecuta la función `onColorChange()`, la cual:
    *   Le dice al Store (base de datos temporal en el navegador) que inicie un borrador (`startDraft()`) si no se había iniciado.
    *   Actualiza el valor del color específico en el borrador en tiempo real.
    *   Al guardarlo en el Store, la vista del *Preview* detecta el cambio instantáneamente.

## Características adicionales:
*   **Copiar Código Hexadecimal:** Cada color tiene un ícono para copiar el color al portapapeles utilizando el API nativo `navigator.clipboard.writeText`, haciendo que sea fácil para el diseñador llevarse un color exacto a otra herramienta.
*   **Metadatos Visuales:** Al lado de cada color hay una descripción que le indica al usuario final exactamente qué parte de la interfaz se verá afectada (ej. *Títulos, badges, bordes activos*).
