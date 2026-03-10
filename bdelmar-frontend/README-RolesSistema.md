# 📖 B-DEL MAR: Sistema de Roles (Admin vs. Usuario)

Este documento detalla la lógica de autenticación y autorización del sistema B-DEL MAR, explicando cómo la plataforma distingue entre un Administrador y un Usuario estándar, y cómo esta información fluye desde la base de datos hasta la interfaz gráfica (Frontend).

---

## 📚 1. Diccionario de Términos (Conceptos Clave)

Antes de profundizar en la lógica, es importante entender los siguientes términos técnicos y de base de datos utilizados en el sistema:

* **Autenticación (Authentication):** Es el proceso de verificar **quién** eres. En el sistema, esto ocurre cuando ingresas tu usuario/correo y contraseña en el `/login`.
* **Autorización (Authorization):** Es el proceso de verificar **qué** puedes hacer. Una vez que el sistema sabe quién eres (autenticado), verifica tu **Rol** para determinar a qué páginas tienes acceso.
* **Rol (Role):** Es una etiqueta asignada a cada cuenta en la base de datos (`'admin'` o `'user'`). Esta etiqueta dicta los permisos del usuario en la plataforma.
* **Base de Datos (MySQL):** El almacén centralizado donde se guardan permanentemente los datos. Nuestra tabla relevante aquí se llama `users`.
* **Hash (Bcrypt):** Es un mecanismo de seguridad. Las contraseñas no se guardan como texto plano (ej. "1234") en la base de datos, sino que se convierten en una cadena de caracteres indescifrable (el *hash*). `Bcrypt` es la librería que hace esta conversión y verificación.
* **Endpoint / API (Backend):** Son las "rutas" del servidor que el Frontend llama para enviar o solicitar información. Por ejemplo, el endpoint de inicio de sesión es `/api/login`.
* **LocalStorage:** Es un pequeño espacio de almacenamiento temporal en tu navegador web. El Frontend de B-DEL MAR lo usa para recordar de forma rápida qué Rol tienes, sin tener que consultar la base de datos en cada clic.
* **Navigation Guard (Guardia de Navegación):** Es un "guardia de seguridad" en el código del Frontend (configurado en Vue Router) que se interpone milisegundos antes de que cargues cualquier página, verificando si tienes el Rol adecuado para verla.

---

## ⚙️ 2. ¿Cómo funciona la lógica de Roles?

### 🗄️ A. Lógica en la Base de Datos y Backend (El Cerebro)

1. **Estructura en la Base de Datos (`schema.sql`):**
   La tabla de usuarios (`users`) tiene una columna crucial llamada `role`.
   ```sql
   role VARCHAR(20) NOT NULL DEFAULT 'user',
   CONSTRAINT chk_role CHECK (role IN ('admin','user'))
   ```
   Esta restricción asegura a un nivel muy profundo que en el sistema solo pueden existir dos tipos de cuentas, evitando errores de tipeo:
   * `'admin'`: Tiene acceso a las configuraciones del negocio (colores, fuentes tipográficas, etc.).
   * `'user'`: Es un cliente o visitante que solo debe ver opciones estándar como el catálogo de productos.

2. **El Proceso de Login (`server.js`):**
   Cuando un usuario intenta iniciar sesión, el servidor recibe el correo y la contraseña, y ejecuta la siguiente lógica:
   * **Búsqueda:** Busca en la base de datos al usuario usando la instrucción `SELECT * FROM users WHERE email = ?`.
   * **Validación:** Compara la contraseña ingresada con el Hash guardado usando `bcrypt`.
   * **Extracción de Identidad:** Si la contraseña es correcta, el servidor recopila los datos del usuario. **La pieza de información más importante que el servidor extrae es el rol (`user.role`).**
   * **Respuesta:** El servidor empaqueta esta información y se la devuelve al Frontend en formato JSON.
   
   ```javascript
   // Estructura de la respuesta enviada al Frontend
   res.json({
     success: true,
     data: {
       id: user.id,
       username: user.username,
       email: user.email,
       role: user.role, // <-- ¡Este es el dato que permite saber si es admin o no!
     }
   })
   ```

### 🌐 B. Comunicación y Lógica en el Frontend (La Interfaz)

Una vez que el Frontend (la parte visual) recibe ese paquete del Backend confirmando que el acceso fue exitoso, toma el control de la seguridad visual:

1. **Memoria del Navegador (Almacenamiento del Rol):**
   Como la web no mantiene conexiones fijas continuas, el Frontend guarda la palabra recibida (ya sea `'admin'` o `'user'`) en el **LocalStorage** del navegador del usuario bajo una etiqueta llamada `bdelmar_role`. 
   
   Esto es fundamental: si el usuario recarga la página o abre una nueva pestaña, el navegador lee el LocalStorage y recuerda de inmediato los permisos del usuario sin pedirle iniciar sesión otra vez.

2. **El Guardia de Navegación (`router/index.js`):**
   La librería Vue Router, que se encarga de cambiar de páginas (vistas) en la app, tiene configurado un interceptor (`beforeEach`). Su trabajo es evaluar cada intento de cambio de página así:

   * **Lectura Inmediata:**  Primero lee qué rol tiene la persona (`const role = localStorage.getItem('bdelmar_role')`).
   * **Direccionamiento Inteligente en el Login:** Si el usuario, ya teniendo una sesión activa, intenta entrar a la página visual de `/login` por error, el sistema evalúa: si su rol es `'admin'` lo desvía hacia el panel `/admin`; si su rol es `'user'`, lo desvía a la tienda en `/catalogo`.
   * **Protección de Rutas Restringidas (El control maestro):** 
     Hay rutas exclusivas marcadas en el código con la etiqueta especial `requiresAdmin: true` (por ejemplo, `/admin/configuracion`). 
     Si un usuario intenta navegar a esa URL de configuración, el guardia ejecuta esta condición estricta:
     ```javascript
     if (to.meta.requiresAdmin && role !== 'admin') {
         return next('/catalogo') // ¡Acceso denegado!
     }
     ```
     Básicamente pregunta: *¿Esta página requiere ser Admin? Sí. ¿Tu rol almacenado en LocalStorage es diferente de 'admin'? Sí.* Como resultado, bloquea la acción y patea al usuario hacia el catálogo (la vista para usuarios sin privilegios).

### 🤝 C. Resumen Paso a Paso (El Flujo Completo)

Para entender cómo se conecta "el todo", este es el viaje de los datos:

1. El usuario ingresa sus datos en el formulario de la web y hace clic en *Ingresar*.
2. El **Frontend** manda esa petición por debajo de la mesa al **Backend**.
3. El **Backend** consulta la **Base de Datos**. Ésta le dice "Sí existe". Luego valida que la contraseña encaje.
4. El **Backend** observa en la fila de la base de datos que la columna `role` dice `'admin'`, y se lo envía al **Frontend** como respuesta.
5. El **Frontend** recibe la respuesta, y guarda la palabra `'admin'` en la memoria pequeña del navegador (**LocalStorage**).
6. El usuario hace clic en un botón visual que dice "Ir a Panel de Control" (`/admin`).
7. El **Router (Frontend)** intercepta ese clic, revisa el **LocalStorage** en milisegundos, confirma que efectivamente dice `'admin'`, permite el paso, y finalmente la pantalla de configuración se dibuja.
