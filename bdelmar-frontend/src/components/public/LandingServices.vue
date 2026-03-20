<script setup>
const services = [
  {
    icon: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M10 12l2-4 2 4"/><path d="M12 2v6"/><circle cx="12" cy="12" r="2"/></svg>`,
    title: 'De la Bahía a tu Negocio',
    description: 'Recibimos cavas con cientos de kilos de pescado fresco de forma directa desde las costas, asegurando la máxima frescura desde la captura hasta tu local.'
  },
  {
    icon: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></svg>`,
    title: 'Abastecimiento a Revendedores',
    description: 'Somos el aliado ideal para vendedores de empanadas, restaurantes pequeños y revendedores particulares, brindando materia prima accesible y de la mejor calidad.'
  },
  {
    icon: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
    title: 'Ventas al Mayor y Detal',
    description: 'Apostamos por la flexibilidad: Manejamos fuertes volúmenes de mercancía para pedidos al mayor, sin dejar de ofrecer opciones ocasionales para compras al menor.'
  }
]
</script>

<template>
  <section class="landing-services" id="servicios">
    <div class="container">
      <div class="header">
        <span class="subtitle">Soluciones Integrales</span>
        <h2 class="title">¿Por qué elegir a B-DEL MAR 3011?</h2>
        <p class="description">
          Más que un proveedor, somos tu aliado estratégico en distribución de productos del mar. 
          Entendemos las exigencias de la industria gastronómica y comercial.
        </p>
      </div>

      <div class="services-grid">
        <div class="service-card" v-for="(service, index) in services" :key="index">
          <div class="icon-wrapper" v-html="service.icon"></div>
          <h3 class="service-title">{{ service.title }}</h3>
          <p class="service-desc">{{ service.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.landing-services {
  padding: 6rem 1.5rem;
  background: var(--color-bg-page, #f8fafc);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  max-width: 700px;
  margin: 0 auto 4rem;
}

.subtitle {
  color: var(--color-primary, #1a91db);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-size: 0.85rem;
  display: block;
  margin-bottom: 0.5rem;
}

.title {
  color: var(--color-text-primary, #1e293b);
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.2;
}

.description {
  color: var(--color-text-secondary, #64748b);
  font-size: 1.1rem;
  line-height: 1.6;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
}

.service-card {
  background: var(--color-bg-card, white);
  padding: 3rem 2rem;
  border-radius: 20px;
  box-shadow: var(--shadow-sm, 0 10px 30px -10px rgba(0,0,0,0.05));
  border: 1px solid rgba(128,128,128,0.06);
  transition: transform 0.3s, box-shadow 0.3s;
  text-align: center;
}

.service-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
}

.icon-wrapper {
  width: 80px;
  height: 80px;
  background: color-mix(in srgb, var(--color-primary, #1a91db) 10%, transparent);
  color: var(--color-primary, #1a91db);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.service-title {
  font-size: 1.4rem;
  color: var(--color-text-primary, #1e293b);
  font-weight: 700;
  margin-bottom: 1rem;
}

.service-desc {
  color: var(--color-text-secondary, #64748b);
  line-height: 1.6;
}
</style>
