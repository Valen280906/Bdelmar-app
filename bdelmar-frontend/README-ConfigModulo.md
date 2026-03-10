# Guía para Exposición: Módulo de Configuración de la Interfaz

Esta guía está redactada de manera sencilla para que cualquier persona pueda presentar cómo está construido, qué librerías emplea y qué lógicas destacan en el Código del "Módulo de Configuración" de Administrador.

---

## 🎯 1. Objetivo del Módulo
Este módulo permite a los administradores personalizar la apariencia visual de la aplicación web en **tiempo real**. Las configuraciones globales como la paleta de colores, el tamaño de la tipografía y las familias de fuentes se gestionan de manera amigable y se aplican instantáneamente en toda la aplicación sin requerir recargar la página.

---

## 🏗️ 2. Arquitectura General: ¿Cómo se logró la Magia en Tiempo Real?
El funcionamiento central del módulo se basa fuertemente en usar un **Estado Global** y conectarlo con **Variables Nativas de CSS (`Custom Properties`)**.

### El "Cerebro" (Manejo del Estado): `useThemeStore.js`
En aplicaciones convencionales, pasar la información de un color desde un "Panel de Admin" hasta un "Botón" en otra página se vuelve un caos de código. Aquí lo resolvimos utilizando un almacén global (`Store`).
- **¿Qué guarda el Store de Pinia?** Guarda variables llamadas `state` que incluyen: el modo (claro/oscuro), los 5 colores principales y los tamaños de las fuentes (H1, H2, H3, Párrafo). Además, tiene un **"Estado Borrador" (`draftColors`)** que sirve para previsualizar sin arruinar tu diseño guardado si decides cancelar.
- **La gran Función Clave: `applyToDom()`**
  - ¿Cómo cambian los colores solos sin recargar? Esta función viaja al bloque principal del HTML del navegador (`document.documentElement.style`) y le inyecta directamente CSS nativo. Por ejemplo, evalúa el color seleccionado (`#1a91db`) y efectúa: `r.setProperty('--color-primary', '#1a91db')`.
  - Como toda la estructura de la aplicación está construida para alimentarse de esas variables de CSS (Ej: `button { background: var(--color-primary); }`), **absolutamente todos** los botones cambiarán a azul.
- **Almacenamiento del lado Cliente (`localStorage`)**: Las preferencias se guardan en el navegador. Cuando se refresca la página o se cierra, el sistema ejecuta `loadFromStorage()`, recuperando el aspecto personalizado.

---

## 🧩 3. Componentes Principales y Funciones Clave

### A. Edición de Colores: `PaletteEditor.vue`
Permite al administrador ajustar 5 colores principales de la aplicación.
- **¿Cómo se logró el selector?** Usando un elemento nativo de HTML5 `<input type="color">`, que invoca al moderno selector de colores propio del sistema operativo (Windows/Mac/Móvil).
- **Derivación de colores Inteligente:** Para no obligar al usuario a elegir 20 colores, nosotros solo le pedimos 5. Usando trucos CSS modernos como `color-mix()` y nuestra función JavaScript `hexToRgb()`, derivamos variantes transparentes, sombras envolventes (`--shadow-sm`) y bordes suaves **totalmente de manera automática** a partir de los 5 principales.

### B. Gestión de Tamaños de Texto: `TypographyEditor.vue`
Este componente utiliza componentes tipo deslizadores (sliders) generados con `<input type="range">`.
- **Restricción y Jerarquía Visual (`onSliderChange`):**
  - Cuando se mueve el "slider", se dispara esta función. Su misión principal es una protección muy importante: garantizar que las **reglas del diseño web se respeten rígidamente**. 
  - La función bloquea que un Subtítulo (H2) sea más grande que el Título Principal (H1). Si el usuario intenta romper esta jerarquía arrastrando el deslizador, la acción fracasa, el slider retrocede a su lugar y usamos nuestro "Composable" *useToast* para emitir una notificación al administrador de por qué no puede hacer eso.

### C. Gestor de Tipografías: `FontManager.vue`
Es una de las partes más potentes del módulo. ¡Es capaz de traer e integrar tipografías externas e inyectarlas al sitio dinámicamente bajo dos métodos!
- **Método 1: Desde Google Fonts**
  - **Función Usada (`uploadFont`)**: El admnistrador escribe el nombre exacto de la fuente de Google Fonts. El JavaScript la toma, sustituye los espacios por signos de más (`+`), y dinámicamente crea y adjunta un elemento `<link href="URL">` hacia los servidores de Google justo dentro de la cabeza (`<head>`) de nuestra página.
- **Método 2: Subir tu propio Archivo Local (`.ttf`, `.woff`)**
  - **Función Usada (`uploadFont` sección archivo)**: Este es el método más difícil. No subimos el archivo a nuestro base de datos backend, sino que lo resolvemos de inmediato en el navegador del usuario utilizando tecnología Front-end. 
  - Usamos el **`FileReader API`**, esta API de JavaScript lee el peso entero de tu archivo TTF o WOFF y lo convierte a algo llamado formato **`DataURL` (Código largo en Base64)**.
  - Luego lo tomamos en el store (`useThemeStore.js`) y llamamos la API nativa de JavaScript de fuentes: `new FontFace('NombreDeTuLetra', 'url(BASE64...)')`. De tal manera que la fuente queda "instalada" temporalmente en el caché del sitio e inmediatamente lista para usar.

---

## 📚 4. Librerías Analizadas y su Rol Vital

Para no programar todo de cero desde "JavaScript Vainilla", usamos el ecosistema moderno:
1. **Vue.js 3 (`<script setup>`, Composition API):**
   - Es el framework central de nuestra arquitectura Front-end. El uso de `setup` nos permite declarar variables como `fontName = ref('')`. Cuando el usuario modifique `fontName`, Vue interviene actualizando y volviendo a dibujar esa variable reactivamente en el HTML, y solo **ese fragmento** pequeño, permitiendo un gran rendimiento en vez de recargar grandes partes de la estructura.

2. **Pinia (`useThemeStore.js`):**
   - Es la librería estándar de "State Management" de Vue3. Organiza todas las variables como una "base de datos del cliente interno". Es crucial para evitar que el estado y las variables anduviesen dispersas entre distintos archivos incontrolablemente. Centraliza toda la lógica pesada relacionada con colores.

3. **DataTables para Vue3 (`datatables.net` / `datatables.net-vue3`):**
   - Esta estupenda librería Open Source la implementamos en `FontManager.vue`. En lugar de hacer a mano una tabla de fuentes visuales, esta librería envuelve la tabla transformándola agregándole automáticamente de "caja" características como: Búsqueda Global, Paginación Automática de Resultados (útil cuando los usuarios instalan docenas de fuentes) y estilos limpios prediseñados para tablas organizadas.
