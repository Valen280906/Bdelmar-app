<script setup>
import { Carousel, Slide, Navigation, Pagination } from 'vue3-carousel'
import 'vue3-carousel/dist/carousel.css'

// Se pueden cargar de forma dinámica con Vite:
function getImageUrl(name) {
  return new URL(`../../assets/${name}.jpg`, import.meta.url).href
}

const products = [
  { name: 'Curbina', desc: 'Carne blanca y suave, excelente para ceviches y horno.', image: getImageUrl('Corvina') },
  { name: 'Carite', desc: 'Perfecto para freír en ruedas con limón.', image: getImageUrl('Carite') },
  { name: 'Pargo Rojo', desc: 'El rey de la parrilla y platos horneados.', image: getImageUrl('Pargo-rojo') },
  { name: 'Pargo Blanco', desc: 'Textura suave y sabor inconfundible.', image: getImageUrl('Pargo-blanco') },
  { name: 'Merluza', desc: 'Filetes sin espinas, ideal para empanizar.', image: getImageUrl('Merluza') },
  { name: 'Róbalo', desc: 'Pescado de alta gama, carne firme.', image: getImageUrl('Robalo') },
  { name: 'Jurel', desc: 'Apto para sancochos y sudados jugosos.', image: getImageUrl('Jurel') },
  { name: 'Tajalí', desc: 'Clásico frito de la costa venezolana.', image: getImageUrl('Tajali') },
  { name: 'Cámara sin Concha', desc: 'Listos para paellas y al ajillo.', image: getImageUrl('Camaron') },
  { name: 'Mojito de Raya', desc: 'Desmenuzado y listo para guisar.', image: getImageUrl('Mojito de Raya') },
  { name: 'Cazón', desc: 'Para las tradicionales empanadas orientales.', image: getImageUrl('Mojito de Cazon') },
]

const breakpoints = {
  300: { itemsToShow: 1, snapAlign: 'center' },
  700: { itemsToShow: 2, snapAlign: 'center' },
  1024: { itemsToShow: 3, snapAlign: 'start' },
}
</script>

<template>
  <section class="productos" id="productos">
    <div class="section-container">
      <div class="section-heading">
        <span class="heading-badge">Nuestros Productos</span>
        <h2>Lo Mejor del Océano</h2>
        <p>Selección diaria de los mejores mariscos. Calidad y frescura garantizada en cada pedido.</p>
      </div>

      <div class="productos-carousel-wrapper">
        <Carousel :breakpoints="breakpoints" :wrapAround="true">
          <Slide v-for="product in products" :key="product.name">
            <article class="product-card">
              <div class="product-image">
                <img :src="product.image" :alt="product.name" class="product-real-img" @error="e => e.target.style.display = 'none'" />
                <svg width="52" height="52" viewBox="0 0 24 24" class="product-placeholder-icon">
                  <path d="M21 6.5C21 8.43 19.43 10 17.5 10 15.57 10 14 8.43 14 6.5S15.57 3 17.5 3 21 4.57 21 6.5zM3.5 10C5.43 10 7 8.43 7 6.5S5.43 3 3.5 3 0 4.57 0 6.5 1.57 10 3.5 10zM12 13c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z" opacity="0.35"/>
                </svg>
              </div>
              <div class="product-body">
                <h3 class="product-name">{{ product.name }}</h3>
                <p class="product-desc">{{ product.desc }}</p>
              </div>
            </article>
          </Slide>

          <template #addons>
            <Navigation />
            <Pagination />
          </template>
        </Carousel>
      </div>

      <!-- CTA -->
      <div class="productos-cta">
        <a href="#contacto" class="cta-link">
          ¿Necesitas un pedido personalizado? Contáctanos directamente
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.productos {
  padding: 5rem 1.5rem;
  background: var(--color-bg-card);
}
.section-container { max-width: 1200px; margin: 0 auto; }
.section-heading {
  text-align: center;
  margin-bottom: 3rem;
}
.heading-badge {
  display: inline-block;
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  color: var(--color-accent);
  font-size: 0.75rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 2px;
  padding: 5px 18px; border-radius: 20px;
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
.productos-carousel-wrapper {
  padding: 0 1rem;
}
:deep(.carousel__slide) {
  padding: 10px;
}

/* Tarjeta */
.product-card {
  background: var(--color-bg-page);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid rgba(128,128,128,0.06);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  transition: transform 0.25s, box-shadow 0.25s;
}
.product-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-md); }

/* Imagen */
.product-image {
  height: 180px;
  background: var(--color-bg-page);
  border-bottom: 3px solid var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.product-real-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

.product-placeholder-icon { fill: var(--color-primary); z-index: 0; position: absolute; }

/* Cuerpo */
.product-body {
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}
.product-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.product-desc {
  font-size: 0.83rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
  flex: 1;
}

/* CTA */
.productos-cta {
  text-align: center;
  margin-top: 2.5rem;
}
.cta-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-primary);
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  border-bottom: 2px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
  padding-bottom: 2px;
  transition: border-color 0.15s, color 0.15s;
}
.cta-link:hover { color: var(--color-accent); border-color: var(--color-accent); }
.cta-link svg { fill: currentColor; }

/* Vue3 Carousel Controls Optimization */
:deep(.carousel__prev), :deep(.carousel__next) {
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  width: 40px; height: 40px;
}
:deep(.carousel__prev:hover), :deep(.carousel__next:hover) {
  filter: brightness(1.1);
}
:deep(.carousel__icon) {
  fill: currentColor;
}
:deep(.carousel__pagination-button::after) {
  background: rgba(128,128,128,0.3);
  width: 10px; height: 10px; border-radius: 50%;
}
:deep(.carousel__pagination-button--active::after) {
  background: var(--color-primary);
  transform: scale(1.2);
}
</style>
