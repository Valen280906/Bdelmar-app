# Análisis de Usabilidad - Keystroke Level Model (KLM)

Este documento presenta una estimación cuantitativa del tiempo que le tomaría a un usuario experto completar un flujo de compra de dos productos mediante pago móvil en la aplicación B-del-Mar, siguiendo el modelo KLM (Keystroke Level Model).

## Operadores y Valores Asignados
* **K (Keystroke / Tecla):** 0.2 s
* **P (Pointing / Apuntar):** 1.1 s
* **H (Homing / Cambio de dispositivo):** 0.4 s
* **M (Mental / Preparación):** 1.2 s
* **B (Button / Clic ratón):** 0.1 s
* **Scrolling (Mover scroll):** 3.96 s
* **R (Respuesta del sistema):** Asumida como `t` (se calculará el tiempo teórico neto sin contar la espera de la red).

## Escenario de Análisis
* **Estado inicial:** Usuario ya logueado en la aplicación y con la mano inicialmente colocada en el ratón.
* **Flujo del recorrido:** 
  1. Hacer scroll hasta los productos.
  2. Seleccionar el primer producto, ir al carrito y pagar con Pago Móvil.
  3. Llenar los datos de pago y descargar la factura.
  4. Volver a la sección de productos (hacer scroll de nuevo).
  5. Seleccionar un segundo producto distinto.
  6. Repetir el proceso de pago para finalizar el ciclo completo y listo.

---

### Fase 1: Compra del Primer Producto y Descarga de Factura

| \# | Acción del Usuario | Operadores KLM | Tiempo Parcial | Detalles de la Acción |
|---|---|---|---|---|
| 1 | Buscar producto | `M + Scrolling` | 5.16 s | El usuario piensa, decide buscar y hace scroll por la página bajando a los productos. |
| 2 | Seleccionar producto | `P + B` | 1.20 s | Apunta al botón de "Añadir/Comprar" de un producto y hace clic. |
| 3 | Ir a la vista de Carrito | `M + P + B` | 2.40 s | Piensa en su siguiente paso, apunta visualmente al icono del carrito y hace clic. |
| 4 | Iniciar Checkout | `M + P + B` | 2.40 s | Verifica su carrito mentalmente, apunta a "Pagar" y hace clic. |
| 5 | Seleccionar Pago Móvil | `M + P + B` | 2.40 s | Lee las opciones de pago, apunta a "Pago Móvil" y hace clic. |
| 6 | Posicionarse para escribir | `P + B` | 1.20 s | Apunta al primer campo (Ej: Teléfono) y hace clic para enfocarlo. |
| 7 | Homing (Ratón a Teclado) | `H` | 0.40 s | Mueve la mano del ratón al teclado. |
| 8 | Ingresar Teléfono | `11K` | 2.20 s | Escribe su número de teléfono (11 dígitos). |
| 9 | Pasar a Cédula/Identidad | `K` (Tab) | 0.20 s | Usa la tecla Tab para ir al siguiente campo ágilmente. |
| 10 | Ingresar Cédula | `8K` | 1.60 s | Escribe su número de identidad (8 dígitos). |
| 11 | Pasar a Banco | `K` (Tab) | 0.20 s | Usa la tecla Tab para ir al menú/campo de selección de Banco. |
| 12 | Seleccionar Banco | `4K` | 0.80 s | Escribe las primeras letras del banco y presiona Enter/espacio. |
| 13 | Pasar a Referencia | `K` (Tab) | 0.20 s | Usa la tecla Tab para posicionarse en la referencia del pago. |
| 14 | Ingresar Referencia | `6K` | 1.20 s | Escribe los 6 dígitos del código comprobante de banco. |
| 15 | Homing (Teclado a Ratón) | `H` | 0.40 s | Devuelve su mano principal de vuelta al ratón. |
| 16 | Confirmar Pago | `M + P + B` | 2.40 s | Revisa mentalmente que todo esté bien, apunta a "Confirmar Pago" y da clic. |
| 17 | Descargar Factura | `M + P + B` | 2.40 s | Lee el mensaje de éxito (mental), apunta al botón "Descargar Factura" y da clic. |
| **Total** | | | **26.76 s** | *(Excluyendo tiempos de respuesta del sistema 'R')* |

---

### Fase 2: Seguir comprando y Adquisición del Segundo Producto

| \# | Acción del Usuario | Operadores KLM | Tiempo Parcial | Detalles de la Acción |
|---|---|---|---|---|
| 18 | Volver a los productos | `M + P + B` | 2.40 s | Piensa en seguir comprando, apunta a un botón de Inicio/Tienda y hace clic. |
| 19 | Buscar el 2do producto | `M + Scrolling` | 5.16 s | Piensa en buscar otro artículo y vuelve a hacer scroll por el catálogo para bajar. |
| 20 | Seleccionar producto 2 | `P + B` | 1.20 s | Apunta al segundo producto deseado y hace clic en "Añadir/Comprar". |
| 21 | Ir a la vista de Carrito | `M + P + B` | 2.40 s | Piensa en ir a pagar otra vez, apunta al carrito y hace clic. |
| 22 | Iniciar Checkout | `M + P + B` | 2.40 s | Verifica nuevamente la pantalla, apunta a "Pagar" y hace clic. |
| 23 | Seleccionar Pago Móvil | `M + P + B` | 2.40 s | Verifica las opciones, apunta a "Pago Móvil" y hace clic. |
| 24 | Posicionarse para escribir | `P + B` | 1.20 s | Apunta al primer campo o sección (Teléfono) y hace clic. |
| 25 | Homing (Ratón a Teclado) | `H` | 0.40 s | Mueve la mano del ratón al teclado. |
| 26 | Ingresar Datos Completos | `30K` | 6.00 s | Escribir todo ágilmente: (11K Teléf + K Tab + 8K CI + K Tab + 4K Banco + K Tab + 6K Ref). |
| 27 | Homing (Teclado a Ratón) | `H` | 0.40 s | Devuelve la mano al ratón desde el teclado. |
| 28 | Confirmar Pago Final | `M + P + B` | 2.40 s | Revisa los datos, apunta a "Confirmar" y hace clic ("y listo"). |
| **Total** | | | **26.36 s** | *(Excluyendo tiempos de respuesta del sistema 'R')* |

---

## Resultados Consolidados y Tiempo de Tarea

| Resumen de las Fases | Tiempo Estimado |
|---|---|
| Fase 1 (Primer Producto, Pagar Móvil y Descargar Factura) | **26.76 segundos** |
| Fase 2 (Regresar, Segundo Producto y Pagar Móvil) | **26.36 segundos** |
| **Tiempo Cognitivo y Motor Total (KLM neto)** | **53.12 segundos** |

> **Nota sobre la Fricción Real (Tiempos de Sistema):** Este modelo proyecta el tiempo ideal neto del propio usuario. En un escenario vivo, sobre estos **~53 segundos**, el usuario experimentará adiciones de latencia que corresponden al operador `R` (tiempos de carga de interfaz, procesamiento de la compra y peticiones de la red por cada clic en botones clave).
