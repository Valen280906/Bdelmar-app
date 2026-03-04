<script setup>
import { useRoute } from 'vue-router'
import LandingHeader from '@/components/public/LandingHeader.vue'
import LandingFooter from '@/components/public/LandingFooter.vue'
import { computed } from 'vue'

const route = useRoute()

// Determinar qué mostrar según la URL: /legal/terminos, /legal/privacidad, /legal/cookies
const currentSection = computed(() => route.params.seccion || 'terminos')

function isSection(sec) {
  return currentSection.value === sec
}
</script>

<template>
  <div class="legal-page">
    <LandingHeader />
    
    <main class="legal-content">
      <div class="container">
        <!-- Sidebar de navegación -->
        <aside class="legal-sidebar">
          <h3>Información Legal</h3>
          <nav>
            <router-link to="/legal/terminos" :class="{ active: isSection('terminos') }">Términos y Condiciones</router-link>
            <router-link to="/legal/privacidad" :class="{ active: isSection('privacidad') }">Políticas de Privacidad</router-link>
            <router-link to="/legal/cookies" :class="{ active: isSection('cookies') }">Políticas de Cookies</router-link>
          </nav>
        </aside>

        <!-- Contenido -->
        <section class="legal-text">
          
          <div v-if="isSection('terminos')">
            <h1>Términos y Condiciones</h1>
            <p>Bienvenido a Distribuidora y Comercializadora B-DEL MAR 3011 C.A. Al utilizar nuestro sitio web y servicios, usted acepta cumplir con los siguientes Términos y Condiciones. Le recomendamos leer este documento detenidamente.</p>
            
            <h2>1. Uso del Servicio</h2>
            <p>Los servicios prestados por B-DEL MAR 3011 se centran en la venta al mayor de productos del mar dirigidos a entidades comerciales. Cualquier solicitud de registro está sujeta a la aprobación y verificación de su identidad comercial.</p>
            
            <h2>2. Pedidos y Envíos</h2>
            <p>Los pedidos se procesan una vez confirmado el pago. Los tiempos de envío para asegurar la cadena de frío varían dependiendo del volumen y ubicación, pero B-DEL MAR 3011 garantiza los mayores estándares de calidad y tiempos óptimos.</p>
            
            <h2>3. Cancelaciones y Devoluciones</h2>
            <p>Dada la naturaleza perecedera de nuestros productos, toda devolución o reclamo de calidad debe hacerse al momento de la entrega o en un plazo no mayor a 24 horas después de recibido el envío.</p>
          </div>

          <div v-else-if="isSection('privacidad')">
            <h1>Políticas de Privacidad</h1>
            <p>En B-DEL MAR 3011, la privacidad de su información es de vital importancia.</p>
            
            <h2>Recolección de Datos</h2>
            <p>Al crearse una cuenta, almacenamos su correo electrónico y nombre de usuario. No vendemos, alquilamos ni compartimos su información personal a terceros no autorizados.</p>
            
            <h2>Uso de la Información</h2>
            <p>Su correo electrónico será utilizado de manera exclusiva para fines comerciales, recuperación de contraseñas, confirmación de pedidos y envío de novedades relevantes.</p>
            
            <h2>Seguridad</h2>
            <p>Empleamos estrictos protocolos de encriptación (como algoritmos bcrypt) para garantizar que sus credenciales permanezcan seguras en todo momento.</p>
          </div>

          <div v-else-if="isSection('cookies')">
            <h1>Políticas de Cookies</h1>
            <p>Este sitio web puede usar "cookies" para mejorar su experiencia.</p>
            
            <h2>¿Qué son las cookies?</h2>
            <p>Las cookies son pequeños archivos de texto que se guardan en su navegador que nos permiten agilizar su acceso al sistema, recordando por ejemplo si su cuenta ha iniciado sesión.</p>
            
            <h2>Nuestro uso de Cookies y Almacenamiento Local</h2>
            <p>Utilizamos tecnologías como localStorage para preservar sus preferencias de sesión y roles, para lograr una interfaz fluida sin que tenga que reconectarse a cada instante.</p>
          </div>

        </section>
      </div>
    </main>

    <LandingFooter />
  </div>
</template>

<style scoped>
.legal-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.legal-content {
  flex: 1;
  padding: 4rem 1.5rem;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  gap: 3rem;
  background: white;
  padding: 3rem;
  border-radius: 20px;
  box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
  border: 1px solid rgba(0,0,0,0.05);
}

.legal-sidebar {
  width: 250px;
  flex-shrink: 0;
  border-right: 1px solid #e2e8f0;
  padding-right: 2rem;
}

.legal-sidebar h3 {
  font-size: 1.1rem;
  color: #1e293b;
  margin-bottom: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.legal-sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.legal-sidebar a {
  color: #64748b;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
  padding: 0.5rem 0;
}

.legal-sidebar a:hover {
  color: var(--color-primary, #1a91db);
}

.legal-sidebar a.active {
  color: var(--color-primary, #1a91db);
  font-weight: 700;
  border-right: 3px solid var(--color-primary, #1a91db);
}

.legal-text {
  flex: 1;
  color: #334155;
}

.legal-text h1 {
  font-size: 2.2rem;
  color: #0f172a;
  margin-bottom: 1.5rem;
}

.legal-text h2 {
  font-size: 1.4rem;
  color: #1e293b;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.legal-text p {
  line-height: 1.7;
  font-size: 1.05rem;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .container {
    flex-direction: column;
    padding: 2rem;
  }
  .legal-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
    padding-right: 0;
    padding-bottom: 2rem;
  }
}
</style>
