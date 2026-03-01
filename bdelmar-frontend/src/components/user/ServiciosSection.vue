<script setup>
const services = [
  {
    icon: `<path d="M20 6h-2.18c.07-.44.18-.86.18-1.3C18 2.57 15.43 0 12.3 0c-1.87 0-3.5.97-4.48 2.44L12 7.4l4.18-4.97C16.74 2.14 17.43 2 18 2c1.1 0 2 .9 2 2 0 .48-.1.94-.28 1.37l-1.52 1.83-1.83 1.41L12 12l-4.37-3.39-1.83-1.41L4.28 5.37C4.1 4.94 4 4.48 4 4c0-1.1.9-2 2-2 .57 0 1.26.14 1.82.43L12 7.4l4.18-4.97C15.2.97 13.57 0 11.7 0 8.57 0 6 2.57 6 5.7c0 .44.11.86.18 1.3H4C2.9 7 2 7.9 2 9v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z"/>`,
    title: 'Venta al Mayor',
    desc: 'Distribución directa para restaurantes, hoteles y negocios. Precios competitivos, volumen garantizado y servicio personalizado.',
    detail: 'Desde 10 kg',
  },
  {
    icon: `<path d="M19.05 3.28L13.59.1c-.99-.57-2.2-.57-3.18 0L4.95 3.28c-.99.57-1.6 1.62-1.6 2.76v6.32c0 1.14.61 2.19 1.6 2.76l5.46 3.18c.99.57 2.2.57 3.18 0l5.46-3.18c.99-.57 1.6-1.62 1.6-2.76V6.04c0-1.14-.61-2.19-1.6-2.76zM12 14.5L6.5 11.5v-6L12 8.5l5.5-3v6L12 14.5z"/>`,
    title: 'Envíos a Domicilio',
    desc: 'Llevamos el sabor del mar hasta tu puerta. Cobertura local con empaques isotérmicos que mantienen la frescura durante el trayecto.',
    detail: 'Same day delivery',
  },
  {
    icon: `<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l5 2.18V11c0 3.5-2.33 6.79-5 7.93C9.33 17.79 7 14.5 7 11V7.18L12 5zm-1 5v2h2v-2h-2zm0 4v2h2v-2h-2z"/>`,
    title: 'Frescura Garantizada',
    desc: 'Captura diaria directo de los mejores puertos. Cadena de frío ininterrumpida. Si no estás satisfecho, devolvemos tu dinero.',
    detail: '100% garantizado',
  },
  {
    icon: `<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>`,
    title: 'Asesoría Gastronómica',
    desc: 'Te orientamos sobre los mejores mariscos para cada preparación. Recetas, consejos de cocción y maridaje incluidos.',
    detail: 'Gratis con tu compra',
  },
]
</script>

<template>
  <section class="servicios" id="servicios">
    <div class="section-container">
      <div class="section-heading">
        <span class="heading-badge">Nuestros Servicios</span>
        <h2>¿Cómo Podemos Ayudarte?</h2>
        <p>La felicidad se respira a la orilla del mar. Estamos aquí para llevarte lo mejor del océano.</p>
      </div>

      <div class="servicios-grid">
        <div
          v-for="(srv, i) in services"
          :key="srv.title"
          class="servicio-card"
          :style="{ '--delay': `${i * 0.1}s` }"
        >
          <div class="servicio-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" v-html="srv.icon"></svg>
          </div>
          <div class="servicio-content">
            <div class="servicio-detail">{{ srv.detail }}</div>
            <h3 class="servicio-title">{{ srv.title }}</h3>
            <p class="servicio-desc">{{ srv.desc }}</p>
          </div>
          <div class="servicio-line"></div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.servicios {
  padding: 5rem 1.5rem;
  background: var(--color-bg-page);
}
.section-container { max-width: 1200px; margin: 0 auto; }

/* Encabezado de sección */
.section-heading {
  text-align: center;
  margin-bottom: 3.5rem;
}
.heading-badge {
  display: inline-block;
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  padding: 5px 18px;
  border-radius: 20px;
  margin-bottom: 0.75rem;
}
.section-heading h2 {
  font-size: var(--font-size-h2);
  font-weight: 800;
  color: var(--color-text-primary);
  margin-bottom: 0.75rem;
}
.section-heading p {
  font-size: var(--font-size-p);
  color: var(--color-text-secondary);
  max-width: 520px;
  margin: 0 auto;
}

/* Grid */
.servicios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.servicio-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  padding: 2rem 1.5rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(128,128,128,0.06);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: transform 0.25s, box-shadow 0.25s;
  position: relative;
  overflow: hidden;
}
.servicio-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-md);
}
.servicio-card:hover .servicio-line { width: 100%; }

.servicio-icon {
  width: 56px; height: 56px;
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-primary);
  flex-shrink: 0;
}
.servicio-icon svg { fill: currentColor; }

.servicio-content { flex: 1; }
.servicio-detail {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0.4rem;
}
.servicio-title {
  font-size: var(--font-size-h3);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}
.servicio-desc {
  font-size: 0.88rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

/* Línea de acento inferior */
.servicio-line {
  position: absolute;
  bottom: 0; left: 0;
  height: 3px;
  width: 0;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  transition: width 0.4s ease;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
}
</style>
