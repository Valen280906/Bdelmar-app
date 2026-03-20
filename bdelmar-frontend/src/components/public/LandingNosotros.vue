<script setup>
</script>

<template>
  <section class="landing-nosotros" id="nosotros">
    <div class="container">
      <div class="nosotros-content">
        <h2 class="title">Sobre Nosotros</h2>
        <div class="divider"></div>
        <p class="description">
          En <strong>Distribuidora y Comercializadora B-DEL MAR 3011 C.A</strong>, nos enorgullecemos de ser el puente directo entre el océano y tu negocio. Con años de experiencia en el sector pesquero y comercial, nos hemos consolidado como líderes en la distribución al mayor de productos del mar de primera calidad a lo largo de todo el territorio nacional.
        </p>
        <p class="description">
          Nuestro compromiso es simple: <em>garantizar frescura absoluta, mantener los más altos estándares de cadena de frío y brindar un excelente servicio de atención comercial a nuestros clientes.</em>
        </p>
        
        <div class="values-grid">
          <div class="value-item">
            <div class="value-icon">
              <!-- Ancla: simbolo de compromiso y estabilidad -->
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-primary, #1a91db)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="5" r="3"/>
                <line x1="12" y1="8" x2="12" y2="22"/>
                <path d="M5 15s1.5 2 7 2 7-2 7-2"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <h4>Compromiso</h4>
            <p>Entrega puntual y responsabilidad con cada pedido.</p>
          </div>
          <div class="value-item">
            <div class="value-icon">
              <!-- Copo de nieve: cadena de frio y calidad -->
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-primary, #1a91db)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="2" x2="12" y2="22"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <polyline points="17 7 12 2 7 7"/>
                <polyline points="17 17 12 22 7 17"/>
                <polyline points="7 7 2 12 7 17"/>
                <polyline points="17 7 22 12 17 17"/>
              </svg>
            </div>
            <h4>Calidad Total</h4>
            <p>Monitoreo térmico desde la pesca hasta su recepción.</p>
          </div>
          <div class="value-item">
            <div class="value-icon">
              <!-- Apretar manos: alianza comercial -->
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-primary, #1a91db)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <h4>Alianza</h4>
            <p>Buscamos el crecimiento mutuo con nuestros socios comerciales.</p>
          </div>
        </div>
      </div>
      
      <div class="nosotros-image">
        <!-- Puedes actualizar URL de la imagen descargándola a tus assets locale y usando src="@/assets/playa.jpg" -->
        <div class="playa-bg" style="background-image: url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')">
          <div class="overlay">
            <h3 class="image-text">"LA FELICIDAD SE RESPIRA A LA ORILLA DEL MAR"</h3>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.landing-nosotros {
  padding: 6rem 1.5rem;
  background: var(--color-bg-page, white);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.title {
  color: var(--color-text-primary, #1e293b);
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.divider {
  width: 60px;
  height: 4px;
  background: var(--color-primary, #1a91db);
  margin-bottom: 2rem;
  border-radius: 2px;
}

.description {
  color: var(--color-text-secondary, #64748b);
  font-size: 1.1rem;
  line-height: 1.7;
  margin-bottom: 1.5rem;
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
  margin-top: 3rem;
}

.value-item h4 {
  color: var(--color-text-primary, #1e293b);
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.value-item p {
  color: var(--color-text-secondary, #64748b);
  font-size: 0.9rem;
  line-height: 1.4;
}

.value-icon {
  width: 44px;
  height: 44px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--color-primary, #1a91db) 10%, transparent);
  border-radius: 10px;
  padding: 8px;
}
.value-icon svg { width: 100%; height: 100%; }

.nosotros-image {
  width: 100%;
  height: 100%;
  min-height: 400px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1);
}

.playa-bg {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.5s ease;
}

.playa-bg:hover {
  transform: scale(1.03);
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.image-text {
  color: white;
  font-size: 2.2rem;
  font-weight: 800;
  text-align: center;
  line-height: 1.4;
  font-style: italic;
  text-shadow: 0 4px 12px rgba(0,0,0,0.6);
  position: relative;
  z-index: 1;
}

@media (max-width: 900px) {
  .container {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
  .nosotros-image {
    min-height: 250px;
  }
}
</style>
