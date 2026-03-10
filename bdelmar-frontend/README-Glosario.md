# Glosario Principal del Sistema de Configuración

A continuación se detalla una lista centralizada con los términos informáticos, técnicos y de arquitectura más abstractos utilizados a lo largo del módulo de personalización (Paletas, Tipografía y Fuentes) del sistema B del Mar.

---

### A
*   **Accesibilidad (Accessibility / A11y):** Prácticas de diseño para garantizar que la plataforma sea utilizable por personas con limitaciones visuales. Por esto se provee una paleta especializada para "Daltonismo".
*   **API (Application Programming Interface):** Reglas y comandos que expone el navegador (Como *FileReader* o *Clipboard*) para que el código Vue.js pueda comunicarse con el sistema operativo de la computadora.

### B
*   **Borrador (Draft State):** Un segmento temporal de memoria. Cuando mueves un control de color, modifícas el *Borrador*. El sistema real no adopta el borrador hasta que apruebas la transacción confirmándola (Guardar Paleta).
*   **Base64 (DataURL):** Método matemático de codificación que agarra un archivo físico pesado (como un archivo `.ttf` de tipografía o una imagen) y lo transforma en una ridícula y gigantesca cadena de letras de texto. Permite guardar archivos complejos usando simples variables de texto dentro de la memoria caché.

### C
*   **CSS Custom Properties (Variables Nativas CSS):** Elementos dentro de los estilos web declarados con dos guiones adelante (`--color-primary`). Permiten que el sistema sea temático. Cuando el motor de Vue altera el valor en la raíz CSS de la aplicación, el color cambia instantáneamente sin necesidad de reiniciar web o procesar lógicas complejas.
*   **color-mix():** Herramienta matemática de navegación moderna que recibe dos colores y los mezcla en porcentajes. El sistema la usa para crear transparencias perfectas o variaciones del color activo (como fondos suavecitos) sin que tú tengas que declararle cada tonalidad al código.

### D
*   **DOM (Document Object Model):** El "Cuerpo" visible de la página web. Si los componentes son los planetas, el DOM es el universo físico que ves y donde estos existen. Altera variables en la 'root' del DOM significa afectar todo el tejido espacial de la página.

### H
*   **Hexadecimal (Hex):** Sistema numérico en base 16 (0-9 y A-F) que utilizan las pantallas de las computadoras para mezclar tonalidades de rojo (Red), verde (Green) y azul (Blue) mediante un solo string de texto de seis letras ej. `#FFFFFF` (Blanco puro).

### M
*   **Mock Data:** Datos "basura" o ficticios creados manualmente solo para tener visuales a la hora de maquetar. Ejemplos del proyecto: "Ceviche a $125". No existen en la base de datos real, sirven para rellenar visualmente el *StylePreview*.

### P
*   **Pinia (Store global):** Es la librería oficial de estado de Vue. Imagínala como un banco central o "cerebro" donde todos los componentes independientes (Barra de arriba, Footer, Editor de Colores) envían a preguntar "¿Qué color o modo visual debemos tener actualmente?". Previene que componentes dispersos tengan lógicas incompatibles.

### R
*   **Reactividad:** Fenómeno técnico de Vue.js. Literalmente significa que las variables de la web "reaccionan" con su ambiente; si en el código la variable de tu color cambia de Azul a Rojo, Vue.js busca y actualiza automáticamente los píxeles de la pantalla sin obligarte a refrescar con "F5".
*   **REM:** "Root EM". Una unidad de medida flexible que usa CSS basándose en el estándar visual de tu resolución de pantalla, en vez de obligar a forzar Pixeles estáticos. Escala de maravilla para móviles y computadores ultra anchos.

### S
*   **Semántica de variables:** Darle nombres a los datos por lo que "Significan" y no por lo que "Son". Ej. Usar el nombre de variable `primary` (Significado) en vez de llamarla `color-azul` (Lo que es), así si el primario un día lo decides poner Verde, tu código no pierde sentido.
