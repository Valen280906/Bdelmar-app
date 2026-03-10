# 📘 README Técnico Detallado — Módulo de Configuración, Productos y Carrusel

> **¿Para quién es este documento?**  
> Este README está escrito para alguien que quiere **comprender a fondo** cómo está hecho el código, explicando el *por qué* de cada decisión, los términos técnicos con definiciones claras y cómo se conectan los archivos entre sí. Perfecto para prepararse para preguntas de exposición.

---

## 📚 Glosario de Términos (léelos antes que todo)

Antes de explorar el código, es vital entender los conceptos que se repiten:

| Término | Significado sencillo |
|---|---|
| **Variable Nativa de CSS (`Custom Property`)** | Una variable declarada en CSS con `--` al inicio (ej: `--color-primary`). El navegador la entiende nativamente, sin frameworks. Se usa con `var(--nombre)`. |
| **`document.documentElement`** | En JavaScript, es la referencia al elemento `<html>` raíz del documento. Cualquier variable CSS aplicada ahí afecta a **toda** la página. |
| **`reactive()`** | Función de Vue 3. Hace que un objeto JavaScript sea "reactivo": si cambias una propiedad, Vue automáticamente re-dibuja el HTML que depende de ella. |
| **`ref()`** | Función de Vue 3 para hacer reactiva una variable simple (string, número, booleano). Se accede al valor con `.value` en el script. |
| **Pinia / Store** | Librería oficial de Vue 3 para manejar un estado global. Piénsalo como una "base de datos del cliente" que cualquier componente puede leer y modificar. |
| **`<script setup>`** | Forma moderna de escribir componentes Vue 3 (Composition API). Las variables declaradas aquí son automáticamente accesibles en el `<template>`. |
| **`v-for`** | Directiva de Vue que genera una lista de elementos HTML a partir de un array. |
| **`v-if` / `v-else`** | Directiva de Vue que muestra u oculta elementos según una condición. |
| **`:style` / `v-bind`** | Enlaza atributos HTML a variables JavaScript. Con `:style` puedes asignar estilos CSS dinámicamente desde el script. |
| **`@input` / `@click`** | Directivas de Vue para escuchar eventos del usuario (teclear, hacer clic). |
| **`emit`** | Mecanismo de Vue para que un componente hijo le "avise" al componente padre que ocurrió algo. |
| **`composable`** | Una función reutilizable en Vue 3 que encapsula lógica reactiva. Se importa desde cualquier componente. |
| **`scoped`** | Atributo del `<style>` en Vue que hace que los estilos CSS solo afecten a ese componente, sin filtrarse a otros. |
| **`:deep()`** | Selector CSS especial en Vue que permite penetrar el `scoped` para sobrescribir estilos de componentes externos o librerías. |
| **`localStorage`** | Almacenamiento en el navegador del usuario (como una memoria persistente). Los datos sobreviven al cerrar la pestaña. |
| **`FileReader API`** | API nativa del navegador (sin instalar nada) que lee archivos del disco del usuario y los convierte a texto o código. |
| **`DataURL` / `Base64`** | Formato que convierte archivos binarios (como una fuente TTF) en un texto largo de letras/números que puede usarse directamente en CSS o JS. |
| **`FontFace API`** | API nativa del navegador que permite registrar e instalar tipografías en memoria de forma programáticas. |
| **`color-mix()`** | Función nativa de CSS moderno que mezcla dos colores en un porcentaje dado. |
| **`clamp()`** | Función CSS que define un tamaño fluido: mínimo, preferido (relativo), máximo. |

---

## 🏗️ Arquitectura General: Cómo se conectan todos los archivos

El corazón del sistema es el **Store** (`useThemeStore.js`). Todos los demás archivos giran alrededor de él:

```
useThemeStore.js  ──────────────────────────────────────────────────────────
        │  (estado global: colores, tipografías, fuentes)                   │
        │                                                                   │
   Lee  │  Escribe              Lee                Lee                     │ Lee
        ▼                       ▼                  ▼                       ▼
PaletteEditor.vue   TypographyEditor.vue   FontManager.vue        StylePreview.vue
(cambia colores)    (cambia tamaños)       (sube fuentes)         (visualiza en tiempo real)
        │                       │                  │
        └───────────────────────┴──────────────────┘
                                │ Todos usan además:
                                ▼
                        useToast.js (composable)
                      (notificaciones al usuario)

─────────────────────────────────────────────────────
        aparte: Vista del Catálogo de Usuario
─────────────────────────────────────────────────────
CarouselBanner.vue  +  ProductosSection.vue
 (usa variables CSS del store, pero NO modifica el store)
```

> **Punto clave:** Los componentes de usuario como el carrusel **no importan** el store directamente. Ellos simplemente usan las **Variables Nativas de CSS** (`var(--color-primary)`, etc.) que el store inyectó al `<html>`. Por eso los colores cambian automáticamente cuando el admin edita el tema.

---

## 🧠 ARCHIVO 1: `useThemeStore.js` — El cerebro del sistema

**Ruta:** `src/stores/useThemeStore.js`  
**¿Qué es?** El estado global de la aplicación. Define y gestiona colores, tipografías y fuentes.

### Las paletas predefinidas (constantes)

```js
const PALETA_PRINCIPAL = {
  name: 'Frescura del Mar',
  type: 'claro',
  isDefault: true,         // Esta paleta NO se puede eliminar
  colors: {
    primary: '#1a91db',    // Color azul principal
    accent: '#db8b1a',     // Naranja para detalles
    secondary: '#3f8bba',  // Azul más oscuro para botones secundarios
    bgPage: '#f0f2f5',     // Fondo gris claro de la página
    textPrimary: '#121212',// Texto oscuro principal
  }
}
```

**¿Por qué constantes fuera del store?** Porque son valores inmutables que sirven como punto de restauración. Si el admin rompe algo, siempre hay un punto de partida limpio.

---

### El estado reactivo: `reactive()`

```js
const state = reactive({
  mode: 'claro',           // Modo activo: 'claro' | 'oscuro' | 'daltonico'
  paletas: [...],          // Array con todas las paletas guardadas
  currentColors: {...},    // Los colores que se están aplicando AHORA
  draftColors: null,       // "Borrador" temporal antes de confirmar cambios
  editingPaletteId: null,  // ID de la paleta que se está editando
  typography: {...},       // Tamaños en rem de h1, h2, h3, p
  fonts: [...],            // Array de fuentes registradas
})
```

**¿Por qué `reactive()` y no variables simples?** Porque Vue necesita "observar" el objeto para saber cuándo re-dibujar la UI. Si usaras `let state = { mode: 'claro' }` normal, Vue no detectaría los cambios.

**¿Qué es `draftColors`?** Es el sistema de "previsualización sin guardar". Cuando el admin empieza a editar una paleta, los cambios van a `draftColors` en vez de a `currentColors`. Así, si el admin cancela, se descarta `draftColors` y los colores reales no se alteraron.

---

### La función más importante: `applyToDom()`

```js
function applyToDom(colors, typo) {
  const r = document.documentElement.style   // Apunta al elemento <html>
  const c = colors || state.currentColors    // Si no se pasan colores, usa los actuales
  
  // Inyecta variables CSS nativas directamente al HTML
  r.setProperty('--color-primary', c.primary)
  r.setProperty('--color-accent', c.accent)
  // ... (5 colores base)

  // Deriva colores automáticamente usando color-mix() nativo de CSS
  r.setProperty('--color-bg-card', `color-mix(in srgb, ${c.bgPage} 96%, ${c.textPrimary})`)
  
  // Deriva las sombras convirtiendo el color hex a RGB
  const rgb = hexToRgb(c.primary)   // '#1a91db' → '26, 145, 219'
  r.setProperty('--shadow-sm', `0 4px 12px rgba(${rgb}, 0.12)`)
  
  // Aplica tipografías
  r.setProperty('--font-size-h1', `${t.h1}rem`)
  // ...
}
```

**¿Por qué se modifica `document.documentElement.style`?** Porque toda la aplicación usa variables CSS así: `background: var(--color-primary)`. Cuando el store cambia esa variable en el `<html>`, **todos** los elementos que la usan se actualizan instantáneamente. No hay que recargar ni re-renderizar componentes manualmente.

---

### Helper: `hexToRgb()`

```js
function hexToRgb(hex) {
  const clean = hex.replace('#', '')          // '#1a91db' → '1a91db'
  const r = parseInt(clean.substring(0, 2), 16)  // '1a' base 16 = 26
  const g = parseInt(clean.substring(2, 4), 16)  // '91' base 16 = 145
  const b = parseInt(clean.substring(4, 6), 16)  // 'db' base 16 = 219
  return `${r}, ${g}, ${b}`                   // → '26, 145, 219'
}
```

**¿Para qué sirve?** CSS moderno usa `color-mix()` directamente, pero para las sombras necesitamos `rgba(r, g, b, opacidad)`. Esta función convierte el código hexadecimal (que es lo que te devuelve `<input type="color">`) al formato `r, g, b` que las sombras necesitan.

**¿Por qué `parseInt(..., 16)`?** El `16` indica que estamos convirtiendo desde base 16 (hexadecimal) a base 10 (decimal, el sistema numérico normal).

---

### Persistencia: `localStorage`

```js
function persistToStorage() {
  localStorage.setItem('bdelmar_theme', JSON.stringify({
    paletas: state.paletas,
    currentColors: state.currentColors,
    // Importante: las fuentes con dataUrl (archivos locales grandes) NO se guardan
    fonts: state.fonts.filter(f => !f.dataUrl),
  }))
}

function loadFromStorage() {
  const raw = localStorage.getItem('bdelmar_theme')
  if (raw) {
    const saved = JSON.parse(raw)
    // Restaura cada campo si existe en el storage
    if (saved.paletas) state.paletas = saved.paletas
    // ...
  }
  applyToDom()  // Aplica inmediatamente lo que se recuperó
}
```

**¿Por qué no se guardan las fuentes con `dataUrl`?** Porque una fuente TTF convertida a Base64 puede pesar varios megabytes en texto. `localStorage` tiene un límite de ~5MB por dominio. Si intentaras guardar varias fuentes grandes, el sitio fallaría silenciosamente.

---

## 🎨 ARCHIVO 2: `PaletteEditor.vue` — Editor de colores

**Ruta:** `src/components/admin/PaletteEditor.vue`

### ¿Cómo funciona el selector de color?

```html
<input
  type="color"
  :value="currentValue(field.key)"    <!-- Muestra el color actual -->
  @input="onColorChange(field.key, $event)"  <!-- Escucha cambios -->
  class="native-color-input"
/>
```

**`type="color"`** es un elemento **nativo de HTML5**. No necesita librerías. El navegador lo implementa con el selector de colores del sistema operativo (Windows, Mac, móvil). Devuelve el color elegido como string hexadecimal ej: `"#1a91db"`.

**¿Por qué está invisible (`opacity: 0`)?** Se superpone transparente sobre el cuadro de color visual (`.color-preview-swatch`). Así el usuario hace clic en el cuadro visualmente bonito, pero en realidad está activando el `<input type="color">` invisible encima.

### La lógica de edición con "borrador"

```js
function onColorChange(key, event) {
  // Si aún no hay un borrador activo, lo inicia
  if (!state.draftColors) themeStore.startDraft()
  
  // Modifica el borrador (NO los colores guardados)
  themeStore.setColor(key, event.target.value)
  
  // Avisa al padre que hubo un cambio (para que muestre botones de guardar/cancelar)
  emit('color-changed')
}
```

**¿Qué hace `startDraft()`?** Copia los colores actuales en `draftColors`: `state.draftColors = { ...state.currentColors }`. El operador `...` (spread) crea una copia independiente. Así, si cancelas, los originales no se tocaron.

**¿Qué es `emit('color-changed')`?** El componente padre necesita saber que el usuario empezó a editar para mostrar los botones "Guardar" y "Cancelar". Como el padre no puede ver directamente qué pasa dentro de este componente, el hijo le "emite" un evento personalizado.

### `currentValue(key)`: ¿Draft o real?

```js
function currentValue(key) {
  return state.draftColors ? state.draftColors[key] : state.currentColors[key]
}
```

Esta función decide qué color mostrar: si hay un borrador activo, muestra el color del borrador (el que el usuario está editando). Si no, muestra el color real guardado.

---

## 📏 ARCHIVO 3: `TypographyEditor.vue` — Control de tamaños

**Ruta:** `src/components/admin/TypographyEditor.vue`

### El array de configuración de sliders

```js
const typographyFields = [
  { key: 'h1', label: 'Título Principal (H1)', min: 1.6, max: 3.8, step: 0.1, unit: 'rem' },
  { key: 'h2', label: 'Subtítulo (H2)',         min: 1.1, max: 2.6, step: 0.1, unit: 'rem' },
  { key: 'h3', label: 'Subtítulo (H3)',         min: 0.9, max: 2.0, step: 0.1, unit: 'rem' },
  { key: 'p',  label: 'Párrafo / Botones / Menú', min: 0.75, max: 1.4, step: 0.05, unit: 'rem' },
]
```

**¿Por qué un array de objetos en vez de 4 sliders separados en el HTML?** Con `v-for` se genera 1 slider por cada objeto del array. Si en el futuro necesitas agregar un nuevo nivel (ej: "caption"), solo agregas un objeto al array. El HTML no cambia. Esto se llama **datos como configuración**.

### La función guardiana de jerarquía

```js
function onSliderChange(key, event) {
  const newVal = parseFloat(event.target.value)  // Convierte el string '2.4' al número 2.4
  const current = state.typography

  // Regla 1: H1 debe ser MAYOR que H2
  if (key === 'h1' && newVal <= current.h2) {
    error('El título principal (H1) debe ser mayor que el subtítulo (H2)')
    event.target.value = current.h1  // Devuelve el slider a la posición original
    return
  }
  // Regla 2: H2 debe estar entre H1 y H3
  if (key === 'h2' && (newVal >= current.h1 || newVal <= current.h3)) {
    error(...)
    event.target.value = current.h2
    return
  }
  // Si pasa todas las reglas, aplica el cambio
  themeStore.setTypography(key, newVal)
}
```

**¿Por qué `event.target.value = current.h1`?** El navegador ya movió el slider visualmente antes de que se ejecute este código. Asignarle manualmente el valor anterior lo hace "rebotar" de vuelta a su posición. Es la forma de decirle al usuario "esto no está permitido" sin necesitar botones de confirmación.

**¿Por qué `parseFloat()`?** Los eventos del DOM siempre devuelven valores como **strings** (texto). `'2.4'` no es lo mismo que `2.4` para las comparaciones matemáticas. `parseFloat()` convierte el string al número real con decimales.

### Preview en tiempo real en el template

```html
<div
  class="typo-preview"
  :style="{ fontSize: `${state.typography[field.key]}rem` }"
>
  <template v-if="field.key === 'h1'">B DEL MAR 3011</template>
  <template v-else-if="field.key === 'h2'">Mariscos Frescos</template>
  <!-- ... -->
</div>
```

Mientras el slider se mueve, `state.typography[field.key]` cambia reactivamente, y Vue re-aplica el `:style` automáticamente. El texto de preview se agranda/achica en tiempo real.

---

## 🔤 ARCHIVO 4: `FontManager.vue` — Gestor de tipografías

**Ruta:** `src/components/admin/FontManager.vue`

### Importaciones clave

```js
import DataTable from 'datatables.net-vue3'
import DataTablesCore from 'datatables.net'
import 'datatables.net-dt/css/dataTables.dataTables.css'
DataTable.use(DataTablesCore)
```

**¿Por qué dos importaciones (`datatables.net-vue3` y `datatables.net`)?** La librería está dividida: el "núcleo" (`DataTablesCore`) tiene la lógica de búsqueda/paginación, y el "adaptador" (`datatables.net-vue3`) es el componente Vue que lo envuelve. Se registra el core dentro del adaptador con `DataTable.use(DataTablesCore)`.

### Método 1: Google Fonts

```js
async function uploadFont() {
  const nm = fontName.value.trim()    // Ej: 'Playfair Display'
  
  // Construye la URL de la hoja de estilos de Google Fonts
  // Los espacios se reemplazan con '+' porque las URLs no aceptan espacios
  const url = `https://fonts.googleapis.com/css2?family=${nm.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`
  
  const linkId = `gfont-${nm.replace(/\s+/g, '-').toLowerCase()}`
  
  // Verifica si ya se añadió ese link para no duplicarlo
  if (!document.getElementById(linkId)) {
    const link = document.createElement('link')   // Crea un <link> de HTML
    link.id = linkId
    link.rel = 'stylesheet'
    link.href = url
    document.head.appendChild(link)   // Lo inyecta en el <head> del documento
  }
  
  // Registra la fuente en el store
  themeStore.addFont({
    name: nm,
    role: fontRole.value,
    cssFamily: `'${nm}', ${fontRole.value === 'heading' ? 'serif' : 'sans-serif'}`,
  })
}
```

**¿Qué hace `document.head.appendChild(link)`?** Agrega dinámicamente un tag `<link href="...google fonts url...">` al `<head>` de la página. Es exactamente el mismo efecto que si lo hubieras escrito en el HTML original, pero lo hace JavaScript en tiempo de ejecución. El navegador entonces descarga la fuente de Google.

**¿Qué es `wght@300;400;500;600;700`?** Son los pesos (grosores) de la fuente que se solicitan. `400` es normal, `700` es negrita. Solicitarlos desde el principio evita que el texto se vea "incorrecto" cuando cambias a negrita.

### Método 2: Archivo local con FileReader

```js
const reader = new FileReader()     // Crea el lector de archivos (API nativa del navegador)

reader.onload = (e) => {            // Callback: se ejecuta cuando termine de leer
  const dataUrl = e.target.result   // El archivo completo en formato Base64 (texto largo)
  
  themeStore.addFont({
    name: nm,
    role: fontRole.value,
    dataUrl,                        // Se guarda el Base64 para registrar la fuente
    cssFamily: `'${nm}', sans-serif`,
  })
}

reader.readAsDataURL(fontFile.value) // Inicia la lectura del archivo
```

**¿Qué es un `DataURL`?** Es una representación del archivo en base64. Una fuente TTF de 50KB se convierte en un string de texto que empieza así: `data:font/ttf;base64,AAEAAAA...` (miles de caracteres). Esta técnica permite "incrustar" el archivo directamente en JavaScript sin hacer una petición al servidor.

### Cómo el store registra una fuente local

En `useThemeStore.js`, la función `addFont()` hace:

```js
if (fontData.dataUrl) {
  // FontFace API: API nativa del navegador para registrar fuentes en memoria
  const fontFace = new FontFace(fontData.name, `url(${fontData.dataUrl})`)
  
  fontFace.load().then(loaded => {   // Carga la fuente (puede tardar un momento)
    document.fonts.add(loaded)        // La registra en el sistema de fuentes del documento
  })
}
```

**`new FontFace(nombre, url)`** es la API nativa de fuentes del navegador. Normalmente las fuentes se declaran en CSS con `@font-face {}`, pero aquí lo hacemos directamente desde JavaScript usando el DataURL de Base64. El `.then()` espera a que la fuente cargue antes de añadirla, porque es una operación asíncrona (puede tardar).

### La tabla con DataTables

```html
<DataTable :key="state.fonts.length" :options="dtOptions">
  <thead>...</thead>
  <tbody>
    <tr v-for="font in state.fonts" :key="font.id">
      <!-- Preview en la fuente real -->
      <td>
        <div class="font-preview" :style="previewFontStyle(font)">
          Aa — B DEL MAR
        </div>
      </td>
    </tr>
  </tbody>
</DataTable>
```

**`:key="state.fonts.length"`** fuerza a Vue a destruir y recrear el componente DataTable cada vez que cambia el número de fuentes. DataTables toma control del DOM de la tabla, y si se agregan filas después de que se inicializó, no las detecta. Cambiar el `:key` es la solución: al cambiar el key, Vue destruye el componente viejo y crea uno nuevo con todos los datos actualizados.

```js
function previewFontStyle(font) {
  return { fontFamily: font.cssFamily }  // Ej: { fontFamily: "'Poppins', sans-serif" }
}
```

**¿Por qué devuelve un objeto?** El atributo `:style` de Vue acepta un objeto JavaScript donde las claves son propiedades CSS en camelCase. `{ fontFamily: 'Poppins' }` equivale al CSS `font-family: Poppins`. Esto hace que cada fila de la tabla muestre el texto "Aa — B DEL MAR" en su propia fuente, como una preview visual.

---

## 👁️ ARCHIVO 5: `StylePreview.vue` — Vista previa en tiempo real

**Ruta:** `src/components/admin/StylePreview.vue`

```html
<div class="style-preview" :style="store.getDraftStyles()">
```

**El truco más elegante del módulo.** Al pasar las variables CSS como `:style` inline al div contenedor, estas variables CSS sobrescriben (en ese contenedor específico) las variables globales del `<html>`. Así la preview muestra los colores del borrador, mientras el resto de la app sigue mostrando los colores guardados.

**¿Qué devuelve `getDraftStyles()`?**

```js
function getDraftStyles() {
  const c = state.draftColors || state.currentColors
  return {
    '--color-primary': c.primary,
    '--color-accent': c.accent,
    '--color-bg-card': `color-mix(in srgb, ${c.bgPage} 96%, ${c.textPrimary})`,
    '--shadow-sm': `0 4px 12px rgba(${rgb}, 0.12)`,
    '--font-size-h1': `${t.h1}rem`,
    // ...
  }
}
```

Devuelve un objeto de variables CSS. `:style` en Vue puede recibir variables CSS (`--custom-prop`) directamente como claves del objeto. El navegador aplica estas variables al elemento y a todos sus descendientes, creando un contexto CSS aislado.

**¿Por qué es mejor esto que aplicar los cambios directo al DOM global?** Porque el admin puede ver CÓMO quedaría antes de confirmar. Si cancela, simplemente se descarta `draftColors` y la preview vuelve a mostrar los colores actuales. El resto de la app nunca se enteró de los cambios.

---

## 🎠 ARCHIVO 6: `CarouselBanner.vue` — Carrusel del catálogo de usuario

**Ruta:** `src/components/user/CarouselBanner.vue`

### Importaciones de vue3-carousel

```js
import { Carousel, Slide, Navigation, Pagination } from 'vue3-carousel'
import 'vue3-carousel/dist/carousel.css'
import banner1 from '@/assets/banner1.png'
```

**`vue3-carousel`** es una librería de carrusel específica para Vue 3. Se importan 4 componentes:
- `Carousel`: el contenedor principal
- `Slide`: cada diapositiva individual
- `Navigation`: los botones de "anterior" y "siguiente"
- `Pagination`: los puntitos indicadores de posición

**`import banner1 from '@/assets/banner1.png'`** importa la imagen como un módulo JavaScript. **Vite** (el bundler de este proyecto) genera una URL optimizada y con hash para la imagen. Si la imagen no existiera, la app fallaría al compilar. `@` es un alias configurado en Vite que apunta a la carpeta `src/`.

### Las diapositivas como datos

```js
const slides = [
  {
    image: banner1,          // Referencia al archivo importado
    title: 'Mariscos Frescos del Día',
    subtitle: 'Directamente del mar a tu mesa',
    cta: 'Ver Productos',    // Texto del botón de llamada a acción
  },
  { image: banner2, ... }
]
```

**¿Por qué guardar el contenido en un array de objetos y no en el HTML directamente?** El `v-for` recorre el array y genera cada slide. Si quieres agregar una tercera diapositiva, solo agregas un objeto al array. El template no cambia. Es el mismo principio que en `TypographyEditor.vue`.

### El template del carrusel

```html
<Carousel :autoplay="5000" :wrapAround="true" class="main-carousel">
  <Slide v-for="(slide, i) in slides" :key="i">
    <div class="carousel-slide">
      <img :src="slide.image" :alt="slide.title" class="slide-img" />
      <div class="slide-overlay"></div>      <!-- Gradiente oscuro encima de la imagen -->
      <div class="slide-content">
        <h1 class="slide-title">{{ slide.title }}</h1>
        <a :href="'#productos'" class="slide-cta">{{ slide.cta }}</a>
      </div>
    </div>
  </Slide>

  <!-- Slot especial de vue3-carousel para los controles -->
  <template #addons>
    <Navigation />
    <Pagination />
  </template>
</Carousel>
```

**`:autoplay="5000"`** pasa la prop `autoplay` con el valor `5000` milisegundos (5 segundos). Sin los `:` sería el string `"5000"`, no el número.

**`:wrapAround="true"`** hace que el carrusel sea circular (al llegar al último slide, vuelve al primero).

**`<template #addons>`** es un "named slot". `vue3-carousel` espera que los controles (Navigation y Pagination) se coloquen dentro de un slot llamado `addons`. Si simplemente los pones fuera, no funcionan.

### Conexión con el sistema de tema (CSS variables)

```css
.slide-overlay {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-primary) 70%, black) 0%,
    rgba(0,0,0,0.35) 100%
  );
}

.slide-cta {
  background: var(--color-accent);
}
```

**Aquí está la magia de la conexión.** El carrusel nunca importa el store. Pero cuando el admin cambia `--color-primary`, **este componente también cambia de color** porque sus estilos CSS usan `var(--color-primary)`. El store inyectó esas variables en el `<html>` y todos los elementos de la página las heredan automáticamente.

**`:deep(.carousel__prev)`**: El selector `:deep()` permite sobrescribir estilos de elementos que están dentro de un componente de librería externo (`vue3-carousel`). Sin `:deep()`, el `scoped` de Vue impediría que los estilos llegaran a esos elementos internos.

---

## 🐟 ARCHIVO 7: `ProductosSection.vue` — Sección de productos con carrusel

**Ruta:** `src/components/user/ProductosSection.vue`

### Carga de imágenes dinámica con Vite

```js
function getImageUrl(name) {
  return new URL(`../../assets/${name}.jpg`, import.meta.url).href
}

const products = [
  { name: 'Curbina', desc: '...', image: getImageUrl('Corvina') },
  { name: 'Carite',  desc: '...', image: getImageUrl('Carite') },
  // ...
]
```

**¿Por qué `new URL(..., import.meta.url).href` en vez de `import imagen from '...'`?** Con `import` estático necesitarías escribir cada imagen por separado. Con `new URL()` y el nombre como variable, Vite puede detectar el patrón y optimizar las imágenes dinámicamente. `import.meta.url` es la URL del archivo actual, necesaria para resolver la ruta relativa correctamente.

### Breakpoints responsivos del carrusel

```js
const breakpoints = {
  300:  { itemsToShow: 1, snapAlign: 'center' },  // Móvil: 1 producto visible
  700:  { itemsToShow: 2, snapAlign: 'center' },  // Tablet: 2 productos
  1024: { itemsToShow: 3, snapAlign: 'start' },   // Desktop: 3 productos
}
```

**`breakpoints`** es una prop de `vue3-carousel` que ajusta el número de slides visibles según el ancho de la pantalla. La clave es el ancho mínimo en píxeles. Es más limpio que hacer media queries CSS para cambiar el layout del carrusel.

### Manejo de error en imágenes

```html
<img :src="product.image" :alt="product.name"
     @error="e => e.target.style.display = 'none'" />
<svg class="product-placeholder-icon">...</svg>
```

**¿Por qué hay un SVG de placeholder debajo de la imagen?** Si la imagen falla (nombre mal escrito, archivo no existe), el evento `@error` la oculta con `display: none`. El SVG placeholder siempre está ahí debajo, por lo que si la imagen falla, se ve el ícono en vez de un área rota.

### Conexión con el tema

```css
.product-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-md);    /* Sombra derivada del color primario */
}

.product-name {
  color: var(--color-primary);
}

.section-heading h2 {
  font-size: var(--font-size-h2);  /* Tamaño controlado por TypographyEditor */
}
```

El título de la sección usa `var(--font-size-h2)`. Si el admin ajusta el slider de H2 en `TypographyEditor.vue`, ese cambio viaja así:
1. `TypographyEditor` llama a `themeStore.setTypography('h2', nuevoValor)`.
2. `setTypography()` llama a `applyToDom()`.
3. `applyToDom()` hace `r.setProperty('--font-size-h2', '1.8rem')` en el `<html>`.
4. El CSS de `ProductosSection.vue` que dice `font-size: var(--font-size-h2)` se actualiza automáticamente.

---

## 🔔 ARCHIVO 8: `useToast.js` — Sistema de notificaciones

**Ruta:** `src/composables/useToast.js`

```js
// Estado global de los toasts (fuera de la función, se comparte entre todos los componentes)
const toasts = reactive([])
let nextId = 1

function showToast(message, type = 'info', undoFn = null, duration = null) {
  const id = nextId++
  const ms = duration || (undoFn ? 6000 : 3000)  // Con undo: 6s, sin undo: 3s

  const toast = { id, message, type, undoFn, progress: 100, dismissed: false }
  toasts.push(toast)

  // Anima la barra de progreso cada 100ms
  const interval = setInterval(() => {
    const t = toasts.find(t => t.id === id)
    if (!t || t.dismissed) { clearInterval(interval); return }
    t.progress = Math.max(0, t.progress - (100 / (ms / 100)))
  }, 100)

  // Auto-elimina el toast después de 'ms' milisegundos
  setTimeout(() => { dismiss(id); clearInterval(interval) }, ms)
}

export function useToast() {
  return {
    toasts,               // Array reactivo (para que el componente de toasts los dibuje)
    success: (msg, undoFn) => showToast(msg, 'success', undoFn),
    info: (msg) => showToast(msg, 'info'),
    warning: (msg) => showToast(msg, 'warning'),
    error: (msg) => showToast(msg, 'error'),
  }
}
```

**¿Por qué `toasts` está fuera de la función `useToast()`?** Para que sea un singleton: un único array compartido por todos los componentes. Si estuviera dentro, cada componente que llame a `useToast()` tendría su propio array separado y los toasts no aparecerían en pantalla.

**¿Cómo funciona la barra de progreso?** `setInterval()` ejecuta una función cada 100ms. Cada vez, reduce `t.progress` en `100 / (ms / 100)`. Si `ms = 3000`, cada tick reduce progress en `100 / 30 ≈ 3.33`. En 30 ticks (3 segundos), llega a 0. El componente de toast usa esta propiedad para animar una barra CSS con `width: t.progress + '%'`.

**¿Dónde se muestran los toasts?** Hay un componente (generalmente en `App.vue`) que importa `toasts` del composable y los dibuja. Como `toasts` es `reactive`, Vue actualiza la lista automáticamente cuando se añaden o eliminan notificaciones.

---

## 🔗 Diagrama de flujo: ¿Qué pasa cuando el admin cambia un color?

```
Admin hace clic en el cuadrado de color
          │
          ▼
  PaletteEditor.vue: @input="onColorChange('primary', $event)"
          │
          ▼
  onColorChange(): Verifica si hay draft. Si no, llama startDraft()
  Luego llama: themeStore.setColor('primary', '#FF0000')
  Finalmente: emit('color-changed') ──► el padre muestra botones Guardar/Cancelar
          │
          ▼
  useThemeStore.js: setColor() modifica state.draftColors.primary
          │
          ▼ (si no hay draft activo, llama applyToDom() directamente)
  En StylePreview.vue: getDraftStyles() devuelve las variables con draftColors
  El :style del div aplica '--color-primary': '#FF0000' solo en la preview
          │
  Si el admin hace clic en "Guardar":
          ▼
  guardarCambiosEdicion() → copia draftColors a currentColors → llama applyToDom()
  applyToDom(): r.setProperty('--color-primary', '#FF0000') en document.documentElement
          │
          ▼
  TODA LA APP cambia de color: CarouselBanner, ProductosSection, botones, tablas...
  porque todos usan var(--color-primary) en su CSS.
```

---

## ❓ Preguntas frecuentes de exposición (con respuestas)

**P: ¿Por qué se usó Pinia en vez de simplemente pasar props entre componentes?**  
R: El estado del tema necesita estar disponible en componentes que no tienen ninguna relación de padre-hijo entre sí. Por ejemplo, `PaletteEditor` (admin) y `CarouselBanner` (usuario) son ramas completamente distintas del árbol de componentes. Pinia evita el "prop drilling" (pasar datos por 5 niveles de componentes intermedios que no los usan).

**P: ¿Por qué las Variables Nativas de CSS en vez de clases CSS condicionales?**  
R: Con variables CSS, un único cambio en `document.documentElement` impacta instancaneamente a todos los elementos que usan esa variable, sin importar cuántos sean ni dónde estén. Con clases CSS habría que modificar el DOM de cada elemento individualmente, lo cual no escalaría bien.

**P: ¿Qué pasa si el usuario cambia el color y recarga la página?**  
R: El store llama `persistToStorage()` después de cada cambio confirmado. Al cargar la app, se llama `loadFromStorage()` que recupera el estado guardado en `localStorage` y llama `applyToDom()`. El tema aparece igual que cuando el admin lo dejó.

**P: ¿Por qué `CarouselBanner.vue` no importa el store si usa los colores del tema?**  
R: No necesita importarlo porque solo consume las variables CSS, no modifica el estado. El store ya aplicó esas variables al `<html>`. Es como enchufar algo a la corriente eléctrica: el aparato no necesita conocer la central eléctrica, solo usar el enchufe.

**P: ¿Qué es `color-mix()` y por qué se usa?**  
R: Es una función CSS moderna nativa que mezcla dos colores. Se usa para derivar automáticamente variantes de los 5 colores base (por ejemplo, un fondo de tarjeta ligeramente diferente al fondo de página) sin pedirle al admin que configure 20 colores. Reduce complejidad en la interfaz.

**P: ¿Por qué `<style scoped>` si se está usando variables CSS globales?**  
R: Los selectores CSS (clases, elementos) tienen scope, pero las variables CSS (`var()`) que se heredan del `<html>` atraviesan cualquier scope. `scoped` evita que `.product-card` de un componente afecte a `.product-card` de otro componente, pero las variables del tema siguen funcionando porque son propiedades CSS heredadas.
