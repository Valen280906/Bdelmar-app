# El Sistema de Preview (StylePreview)

## Glosario de Términos
*   **Preview (Vista Previa):** Una zona segura en la pantalla que refleja cómo se verá la aplicación con los nuevos colores sin haberlos guardado aún.
*   **Inline Styles (Estilos en Línea):** Estilos CSS que se aplican directamente en la etiqueta de un elemento HTML (Ej. `<div style="color: red;">`), forzando así su comportamiento frente a jerarquías globales.
*   **Mock Data:** Datos falsos o de relleno ("Mojito", "Merluza", "$125") escritos directamente en el código del sistema solo con fines ilustrativos.

---

## ¿Cómo funciona el Preview?
El archivo `StylePreview.vue` es uno de los elementos más ingeniosos de la arquitectura. Su trabajo principal es mostrarte los cambios que estás realizando en tiempo real, **pero evitar que el resto de tu pantalla de administrador cambie de color inesperadamente** hasta que estés 100% seguro y le des al botón "Guardar".

### El Aislamiento CSS
Si los controles deslizantes (PaletteEditor o Typography) inyectaran inmediatamente variables CSS globales a la raíz de la aplicación (`:root`), toda la interfaz web, incluyendo los propios paneles administrativos donde estás leyendo, cambiarían de tamaño y color bruscamente (lo cual podría causar mareos y romper los botones de guardado temporalmente).

Para evitar este caos, el Preview utiliza la técnica de **aislamiento temporal**:
Posee una función llamada `store.getDraftStyles()`, la cual agarra los colores que estás "editando en el borrador" y los devuelve como un bloque de objetos CSS de variables.

Ese bloque se le inyecta directamente al bloque contenedor del Preview mediante el atributo `:style`:

```html
<div class="style-preview" :style="store.getDraftStyles()">
```

### ¿Qué significa esto?
Significa que el navegador crea una "mini caja de arena" (sandbox). Todas las variables CSS (Como `--color-primary`) que existan dentro del div del `StylePreview` tendrán los valores nuevos y locos que estés experimentando. Pero las variables globales de afuera (en el panel de administración donde están tus botones) seguirán usando el color seguro original. 

### ¿Qué elementos contiene?
El componente contiene todas las variaciones de la interfaz de B del Mar construidas de manera condensada:
1.  **Escala Tipográfica:** Renderiza desde el `H1` hasta el `<p>` para que pruebes las fuentes.
2.  **Botones:** Renderiza las clases nativas `.btn-primary`, `.btn-secondary`, `.btn-accent`.
3.  **Formularios:** Demuestra cómo se verán los `<input>`, cómo reacciona el borde al hacer ":focus" leyendo el color primario modificado.
4.  **Tablas y Tarjetas (Mock Data):** Utiliza Mock Data introduciendo textos demostrativos como "Langosta" o precios en grande simulando la tienda real.
