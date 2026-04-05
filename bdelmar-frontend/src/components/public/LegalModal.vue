<script setup>
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  initialSection: {
    type: String,
    default: 'terminos'
  }
})

const emit = defineEmits(['close'])

import { ref, watch } from 'vue'

const currentSection = ref(props.initialSection)

watch(() => props.initialSection, (newSection) => {
  currentSection.value = newSection
})

function isSection(sec) {
  return currentSection.value === sec
}

function setSection(sec) {
  currentSection.value = sec
}

function closeModal() {
  emit('close')
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-container">
      <!-- Mismo diseño que tenías antes pero encapsulado en un modal -->
      <aside class="modal-sidebar">
        <h3>Información Legal</h3>
        <nav>
          <a href="#" @click.prevent="setSection('terminos')" :class="{ active: isSection('terminos') }">Términos y Condiciones</a>
          <a href="#" @click.prevent="setSection('privacidad')" :class="{ active: isSection('privacidad') }">Políticas de Privacidad</a>
          <a href="#" @click.prevent="setSection('cookies')" :class="{ active: isSection('cookies') }">Políticas de Cookies</a>
        </nav>
      </aside>

      <section class="modal-content-area">
        <div class="scrollable-text">
          <div v-if="isSection('terminos')">
            <h1>Términos y Condiciones de Uso</h1>
            <p><strong>Última actualización:</strong> Abril 2026</p>
            <p>
              Bienvenido al portal digital de <strong>Distribuidora y Comercializadora B-DEL MAR 3011 C.A.</strong>, RIF: J500760817. Los presentes Términos y Condiciones regulan el acceso y uso de nuestro sitio web, plataforma de gestión y servicios comerciales en línea. Al acceder o utilizar cualquier sección de este portal, usted declara haber leído, comprendido y aceptado estas condiciones en su totalidad.
            </p>

            <h2>1. Propiedad Intelectual</h2>
            <p>
              Todo el contenido presente en este sitio web —incluyendo, de manera enunciativa mas no limitativa, el código fuente, diseño visual, arquitectura del sistema, logotipos, paletas de colores, tipografías personalizadas, iconografía, textos, imágenes y estructura de navegación— constituye propiedad intelectual exclusiva de sus creadores y de <strong>B-DEL MAR 3011 C.A.</strong> Queda expresamente prohibida su reproducción total o parcial, distribución, modificación, ingeniería inversa o uso comercial sin la autorización escrita previa del titular. Cualquier infracción será perseguida conforme a las leyes venezolanas de propiedad intelectual e industrial vigentes.
            </p>

            <h2>2. Limitación de Responsabilidad</h2>
            <p>
              B-DEL MAR 3011 C.A. no se hace responsable por daños directos, indirectos, incidentales o consecuentes que pudieran derivarse del uso o la imposibilidad de uso de este portal, incluyendo pérdida de datos, interrupciones del servicio o errores de contenido. Los precios, disponibilidad de producto y condiciones comerciales publicadas tienen carácter informativo y están sujetos a confirmación por parte de nuestro equipo de ventas.
            </p>

            <h2>3. Usos Prohibidos</h2>
            <p>
              Está estrictamente prohibido utilizar este sitio para: (a) suplantar la identidad de la empresa o de terceros; (b) introducir virus informáticos o código malicioso; (c) realizar scraping automatizado de precios, catálogos o datos de contacto; (d) publicar contenido ilegal, ofensivo o que viole derechos de terceros; (e) cualquier actividad que contravenga el orden público o las leyes venezolanas vigentes. B-DEL MAR 3011 se reserva el derecho de bloquear accesos que incurran en estas conductas sin previo aviso.
            </p>

            <h2>4. Jurisdicción Legal Aplicable</h2>
            <p>
              El presente acuerdo se rige íntegramente por las leyes de la <strong>República Bolivariana de Venezuela</strong>. Para la resolución de cualquier controversia derivada del uso de este portal o de los servicios que en él se ofrecen, ambas partes se someten expresamente a la jurisdicción de los tribunales competentes con sede en la República Bolivariana de Venezuela, renunciando a cualquier otro fuero que pudiera corresponderles.
            </p>

            <h2>5. Modificaciones</h2>
            <p>
              B-DEL MAR 3011 C.A. se reserva el derecho de actualizar estos Términos y Condiciones en cualquier momento. Las modificaciones entrarán en vigor desde su publicación en este portal. Se recomienda revisarlos periódicamente.
            </p>
          </div>

          <div v-else-if="isSection('privacidad')">
            <h1>Políticas de Privacidad y Protección de Datos</h1>
            <p><strong>Última actualización:</strong> Abril 2026</p>
            <p>
              En <strong>Distribuidora y Comercializadora B-DEL MAR 3011 C.A.</strong> valoramos y respetamos su privacidad. La presente Política describe de forma transparente qué información personal recopilamos, cómo la utilizamos, cómo la protegemos y cuáles son sus derechos como titular de dichos datos, en cumplimiento de las disposiciones legales vigentes en la República Bolivariana de Venezuela.
            </p>

            <h2>1. Datos que Recopilamos</h2>
            <p>
              A través de nuestro formulario de registro y contacto, recopilamos datos personales tales como: <strong>nombre completo o razón social, dirección de correo electrónico, número de teléfono de contacto y, cuando aplique, RIF o documento de identidad</strong>. Esta información es suministrada voluntariamente por usted al crear una cuenta o al comunicarse con nuestro equipo comercial.
            </p>

            <h2>2. Finalidad del Tratamiento</h2>
            <p>
              Los datos recopilados son utilizados exclusivamente para los siguientes fines: (a) gestionar su registro y acceso al portal; (b) responder sus consultas comerciales y enviarle cotizaciones o presupuestos; (c) notificarle sobre disponibilidad de productos, despachos y novedades relevantes para su negocio; (d) cumplir con las obligaciones legales y fiscales correspondientes. No utilizamos sus datos para fines publicitarios de terceros ni realizamos cesión comercial de la información.
            </p>

            <h2>3. Confidencialidad y Seguridad</h2>
            <p>
              B-DEL MAR 3011 C.A. implementa medidas técnicas y organizativas razonables para proteger su información personal contra accesos no autorizados, pérdida, alteración o divulgación indebida. Su información nunca será vendida, arrendada ni compartida con terceros, salvo requerimiento de autoridad competente conforme a la ley venezolana.
            </p>

            <h2>4. Derechos del Titular de los Datos</h2>
            <p>
              Usted tiene el derecho de solicitar en cualquier momento: (a) el acceso a los datos personales que mantenemos sobre usted; (b) la corrección de datos incorrectos o desactualizados; (c) la eliminación definitiva de su información de nuestros registros; (d) la revocación del consentimiento otorgado. Para ejercer estos derechos, puede escribirnos directamente al correo <strong>bdelmar69@gmail.com</strong> indicando su solicitud.
            </p>

            <h2>5. Retención de Datos</h2>
            <p>
              Sus datos serán conservados durante el tiempo que mantenga una relación comercial activa con B-DEL MAR 3011 C.A., o hasta que solicite su eliminación, salvo obligación legal de conservación por un período mayor.
            </p>
          </div>

          <div v-else-if="isSection('cookies')">
            <h1>Políticas de Cookies y Almacenamiento Local</h1>
            <p><strong>Última actualización:</strong> Abril 2026</p>
            <p>
              Con el objetivo de garantizar una experiencia de usuario fluida, segura y personalizada en nuestro portal, <strong>B-DEL MAR 3011 C.A.</strong> utiliza tecnologías de almacenamiento en su navegador web. A continuación le explicamos qué son, para qué las usamos y cómo puede gestionarlas.
            </p>

            <h2>1. ¿Qué son las Cookies?</h2>
            <p>
              Las cookies son pequeños archivos de texto que un sitio web almacena en su navegador cuando lo visita. Permiten que el sitio recuerde información sobre su visita, como sus preferencias o su sesión activa, para que no tenga que configurarlas de nuevo la próxima vez. Son completamente inofensivas y no contienen virus ni malware.
            </p>

            <h2>2. Tipos de Cookies que Utilizamos</h2>
            <p>
              <strong>Cookies técnicas o esenciales:</strong> Son imprescindibles para el correcto funcionamiento del portal. Permiten mantener su sesión activa tras el inicio de sesión, recordar su rol en el sistema (Administrador o Usuario) y navegar de forma segura entre las secciones privadas del sitio. Sin estas cookies, determinadas funciones del portal no estarán disponibles.
            </p>
            <p>
              <strong>Almacenamiento Local (Local Storage):</strong> Utilizamos el Local Storage del navegador para guardar preferencias visuales como el modo de color (claro, oscuro o daltonismo) y las configuraciones de diseño del sitio personalizadas por el administrador. Estos datos permanecen únicamente en su dispositivo y no son transmitidos a servidores externos.
            </p>
            <p>
              <strong>Cookies de análisis:</strong> En caso de que en el futuro implementemos herramientas de análisis de tráfico (como estadísticas de visitas), estas serán anonimizadas y usadas exclusivamente para mejorar la experiencia del usuario. Le informaremos con la debida anticipación.
            </p>

            <h2>3. Consentimiento</h2>
            <p>
              Al navegar por nuestro sitio web y autenticarse con sus credenciales, usted consiente el uso de las cookies técnicas descritas, las cuales son necesarias para el correcto funcionamiento del portal.
            </p>

            <h2>4. Cómo Desactivarlas</h2>
            <p>
              Usted puede configurar su navegador para bloquear o eliminar las cookies y el almacenamiento local en cualquier momento. A continuación le indicamos cómo acceder a esa configuración en los navegadores más comunes:
            </p>
            <p>
              • <strong>Google Chrome:</strong> Configuración → Privacidad y seguridad → Cookies y otros datos de sitios.<br/>
              • <strong>Mozilla Firefox:</strong> Opciones → Privacidad y seguridad → Cookies y datos del sitio.<br/>
              • <strong>Microsoft Edge:</strong> Configuración → Cookies y permisos de sitio.<br/>
              • <strong>Safari:</strong> Preferencias → Privacidad → Gestionar datos del sitio web.
            </p>
            <p>
              <strong>Nota:</strong> Si deshabilita las cookies técnicas, es posible que algunas funcionalidades esenciales del portal —como el inicio de sesión y la visualización de su catálogo privado— dejen de funcionar correctamente.
            </p>
          </div>
        </div>
        
        <div class="modal-footer-actions">
          <button class="btn-aceptar" @click="closeModal">He leído y acepto los términos</button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  display: flex;
  background: white;
  width: 100%;
  max-width: 900px;
  height: 80vh;
  max-height: 600px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
  animation: modal-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modal-up {
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-sidebar {
  width: 250px;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  padding: 2rem;
  flex-shrink: 0;
}

.modal-sidebar h3 {
  font-size: 1rem;
  color: #1e293b;
  margin-bottom: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.modal-sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modal-sidebar a {
  color: #64748b;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
  padding: 0.8rem 1rem;
  border-radius: 8px;
}

.modal-sidebar a:hover {
  background: #f1f5f9;
  color: var(--color-primary, #1a91db);
}

.modal-sidebar a.active {
  background: color-mix(in srgb, var(--color-primary, #1a91db) 10%, transparent);
  color: var(--color-primary, #1a91db);
  font-weight: 700;
}

.modal-content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.scrollable-text {
  flex: 1;
  overflow-y: auto;
  padding: 3rem;
  color: #334155;
}

.scrollable-text h1 {
  font-size: 2rem;
  color: #0f172a;
  margin-bottom: 1.5rem;
}

.scrollable-text h2 {
  font-size: 1.2rem;
  color: #1e293b;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.scrollable-text p {
  line-height: 1.7;
  font-size: 1.05rem;
  margin-bottom: 1rem;
}

.modal-footer-actions {
  padding: 1.5rem 3rem;
  border-top: 1px solid #e2e8f0;
  background: #fafbfc;
  display: flex;
  justify-content: flex-end;
}

.btn-aceptar {
  background: var(--color-primary, #1a91db);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 50px;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-aceptar:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(26, 145, 219, 0.3);
}

@media (max-width: 768px) {
  .modal-container {
    flex-direction: column;
    height: 90vh;
  }
  .modal-sidebar {
    width: 100%;
    padding: 1.5rem;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }
  .modal-sidebar nav {
    flex-direction: row;
    overflow-x: auto;
  }
  .modal-sidebar a {
    white-space: nowrap;
  }
  .scrollable-text {
    padding: 1.5rem;
  }
  .modal-footer-actions {
    padding: 1rem 1.5rem;
  }
}
</style>
