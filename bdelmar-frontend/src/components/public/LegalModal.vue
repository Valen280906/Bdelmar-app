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
            <h1>Términos y Condiciones de Uso Comercial</h1>
            <p><strong>Última actualización:</strong> Marzo 2026</p>
            <p>Bienvenido al portal comercial de <strong>Distribuidora y Comercializadora B-DEL MAR 3011 C.A.</strong> J500760817. Los presentes Términos y Condiciones regulan el uso de nuestros servicios de abastecimiento, distribución y logística de productos pesqueros y acuícolas.</p>
            
            <h2>1. Naturaleza de los Servicios y Operaciones</h2>
            <p>Nuestra empresa opera bajo un modelo de adquisición directa en zonas costeras (bahías y playas) para su posterior comercialización al mayor y detal. Actuamos como proveedores primarios para revendedores minoristas, cadenas de restaurantes, locales gastronómicos (ventas de empanadas, cevicherías, etc.) y público en general. Al registrarse o transar con B-DEL MAR 3011, el cliente asume conocimiento de nuestro modelo de distribución basado en la pesca diaria y factores climáticos.</p>

            <h2>2. Condiciones de Venta, Precios y Pedidos</h2>
            <p>Los precios de nuestros productos marinos están sujetos a la fluctuación del mercado de pesca diaria, costos operativos logísticos de cadena de frío y disponibilidad del recurso. Los pedidos al mayor requieren una confirmación previa de nuestro departamento de ventas para garantizar el volumen solicitado. Nos reservamos el derecho de modificar el tarifario sin previo aviso, aunque siempre honraremos las cotizaciones ya aprobadas y facturadas.</p>
            
            <h2>3. Logística de Frío y Responsabilidad de Entrega</h2>
            <p>Garantizamos la preservación térmica (cadena de frío) de todos los productos del mar desde su extracción/recepción en bahía hasta el punto de entrega acordado con el cliente. Es responsabilidad estricta del cliente o de su personal designado inspeccionar el producto al momento de la recepción. Una vez firmada la nota de entrega o factura, B-DEL MAR 3011 cede la custodia térmica al comprador, declinando cualquier responsabilidad por el posterior deterioro físico, organoléptico o microbiológico derivado de un almacenamiento indebido.</p>

            <h2>4. Políticas de Reclamos y Devoluciones</h2>
            <p>Dada la naturaleza altamente perecedera de nuestra mercancía, cualquier reclamo sobre la calidad, peso o estado del pescado y mariscos deberá realizarse en un lapso <strong>no mayor a 12 horas</strong> posteriores a su recepción. El reclamo deberá acompañarse de evidencia fotográfica y física del lote entregado. Bajo ninguna circunstancia se aceptarán devoluciones de mercancía que haya sido procesada, descongelada o manipulada sin las normas de salubridad vigentes.</p>
          </div>

          <div v-else-if="isSection('privacidad')">
            <h1>Políticas de Privacidad y Tratamiento de Datos</h1>
            <p><strong>Distribuidora y Comercializadora B-DEL MAR 3011 C.A.</strong>, comprometida con la seguridad de sus clientes comerciales y particulares, establece la presente política para regular la recolección y tratamiento de la información personal y fiscal.</p>
            
            <h2>1. Recolección de Datos</h2>
            <p>Al registrarse en nuestra plataforma o solicitar nuestros servicios al mayor, recopilaremos datos identificativos tales como: nombres de la empresa o persona natural, RIF o documento de identidad, números de contacto, direcciones de despacho y direcciones de correo electrónico. Toda información es suministrada de manera voluntaria por el usuario.</p>
            
            <h2>2. Uso de la Información Comercial</h2>
            <p>Los datos recabados serán empleados única y exclusivamente con fines operativos, de facturación y logísticos. Esto abarca: la gestión integral de sus pedidos, comunicaciones sobre despachos, notificaciones de disponibilidad de pesca fresca, envíos de cotizaciones, y recuperación de credenciales de acceso al portal. No realizamos perfilamiento masivo ni comercialización de su base de datos.</p>
            
            <h2>3. Resguardo y Confidencialidad a Terceros</h2>
            <p>B-DEL MAR 3011 protege su información corporativa. En ningún caso venderemos, cederemos o alquilaremos sus listas de contactos, historial de compras ni proyecciones de volumen a terceros competidores ni entidades externas, sin la intervención de un mandato u orden legal emitida por una autoridad competente.</p>
          </div>

          <div v-else-if="isSection('cookies')">
            <h1>Políticas de Cookies y Tecnologías Rastreables</h1>
            <p>Con el objetivo de proveer una experiencia de usuario rápida, segura y fluida en nuestro portal de compras y catálogo, B-DEL MAR 3011 hace uso de tecnologías de almacenamiento local en su dispositivo.</p>
            
            <h2>1. Uso de Cookies Estrictamente Necesarias</h2>
            <p>Las "Cookies" son pequeños ficheros de datos que se ubican en su navegador web. En nuestro sitio web, utilizamos exclusívamente cookies estructurales y técnicas que permiten sostener la sesión activa del usuario comercial tras el inicio de sesión. Esto previene que usted deba reescribir sus credenciales por cada producto que consulte en nuestro catálogo privado.</p>
            
            <h2>2. Almacenamiento Local (Local Storage)</h2>
            <p>Como complemento a las cookies de sesión, empleamos la tecnología Local Storage del navegador para almacenar preferencias del usuario, como el "Rol" en el sistema (Administrador o Revendedor/Usuario) y las preferencias visuales (Modo claro/oscuro). Dichos datos no son rastreadores de publicidad, sino elementos vitales para redibujar la interfaz correctamente.</p>
            
            <h2>3. Consentimiento y Desactivación</h2>
            <p>Al seguir navegando por el sitio y autenticándose mediante sus credenciales, usted acepta tácitamente la colocación de estas herramientas técnicas en su navegador. Usted puede en cualquier momento bloquear el almacenamiento local directamente desde los ajustes de seguridad de su explorador; sin embargo, advertimos que esto inutilizará el acceso al catálogo protegido de clientes.</p>
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
