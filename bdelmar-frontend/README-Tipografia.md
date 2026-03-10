# Tipografía y Fuentes (Typography & Font Manager)

## Glosario de Términos
*   **REM:** Es una unidad de medida en CSS. 1 rem equivale al tamaño de texto base del documento (usualmente 16px). Si usas 2rem, son 32px. Escala mucho mejor que los píxeles (px).
*   **Jerarquía Visual:** El principio de diseño en el cual los elementos más importantes (H1) son más grandes y notorios que los menos importantes (H2, H3, Párrafo).
*   **Google Fonts:** Un servicio de Google que provee miles de tipografías gratuitas que se pueden cargar inyectando una URL en el documento.
*   **Base64 / Data URL:** Una forma de convertir un archivo físico (como un archivo `.ttf`) en una cadena de texto inmensa para poder guardar la fuente dentro del código o la base de datos sin necesitar alojamiento de archivos.

---

## ¿Cómo se edita la Tipografía?
La edición se gestiona desde el componente `TypographyEditor.vue`. Este panel permite modificar el tamaño de 4 niveles de texto: `H1` (Título gigante), `H2` (Subtítulo), `H3` (Subtítulo secundario) y `P` (Párrafo y base).

1.  **Sliders (Deslizadores):**
    Utiliza componentes `<input type="range">`. Cada vez que el usuario desliza uno, el valor se envía al `ThemeStore`.
2.  **Validación de Jerarquía (Lógica de Protección):**
    El sistema es inteligente e impide que el usuario "rompa" el diseño. Existe una regla estricta programada en Vue:
    `H1 > H2 > H3 > P`
    Si el administrador intenta hacer un Párrafo (P) más grande que un Título (H3), el sistema lanza un error en pantalla (Toast) y revierte el control deslizante a su posición válida anterior.
3.  **Actualización global:**
    Al igual que los colores, al mover el slider, los valores REM se inyectan en variables CSS (`--font-size-h1`, `--font-size-p`) que cambian instantáneamente toda la web.

---

## ¿Cómo se manejan las Fuentes?
El gestor de fuentes (`FontManager.vue`) permite instalar tipografías mediante dos métodos revolucionarios:

### 1. Método Google Fonts
El administrador escribe el nombre exacto de la tipografía (ej. *Playfair Display*).
El sistema construye una URL hacia los servidores de Google:
`https://fonts.googleapis.com/css2?family=Playfair+Display...`
E inyecta un `<link>` dinámicamente en el `<head>` de la página.

### 2. Método de Subida Local (Archivos .ttf, .woff)
El usuario sube un archivo directamente. En lugar de enviar ese archivo a un backend pesado, el Frontend lo lee utilizando la API `FileReader` de JavaScript y lo transforma en una **Data URL** (Base64). Luego utiliza la API de navegadores moderna `FontFace` para inyectar y registrar esa cadena de texto como una fuente real en la memoria del navegador (`document.fonts.add()`).

### Asignación de Roles
Las fuentes no se arrojan ciegamente al sistema. Al subirse, pasan a registrarse bajo un **Rol**:
*   `heading`: Usada estrictamente para Títulos (Suele ser Serif).
*   `body`: Usada para los párrafos, menús, y botones (Suele ser Sans-Serif).
Al hacer clic en "Activar", el sistema desactiva cualquier otra fuente que tuviera el mismo rol y aplica la nueva en toda la plataforma instanciando las variables `--font-family-heading` o `--font-family-body`.
