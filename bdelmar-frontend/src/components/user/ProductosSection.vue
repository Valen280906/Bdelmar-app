<script setup>
import { ref, onMounted } from 'vue'
import { Carousel, Slide, Navigation, Pagination } from 'vue3-carousel'
import 'vue3-carousel/dist/carousel.css'
import ProductCard from '../public/ProductCard.vue'

const products = ref([])
const isLoading = ref(true)

// Se pueden cargar de forma dinámica con Vite:
function getImageUrl(name) {
  if (!name) return 'https://via.placeholder.com/400x300.png?text=Imagen+No+Disponible'
  if (name.startsWith('/uploads')) {
    return `http://localhost:3001${name}`
  }
  try {
    return new URL(`../../assets/${name}.jpg`, import.meta.url).href
  } catch (e) {
    return 'https://via.placeholder.com/400x300.png?text=Imagen+No+Disponible'
  }
}

const fetchProducts = async () => {
  try {
    const res = await fetch('http://localhost:3001/api/products')
    const json = await res.json()
    if (json.success) {
      products.value = json.data.map(dbProd => ({
        id: dbProd.id,
        name: dbProd.name,
        category: dbProd.category || 'Pescados',
        badge: dbProd.badge,
        description: dbProd.description,
        image: getImageUrl(dbProd.image),
        basePrice: dbProd.basePrice,
        combos: dbProd.combos || []
      }))
    }
  } catch (error) {
    console.error('Error fetching products from DB:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchProducts()
})

const breakpoints = {
  300: { itemsToShow: 1, snapAlign: 'center' },
  800: { itemsToShow: 2, snapAlign: 'center' },
  1100: { itemsToShow: 3, snapAlign: 'start' },
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
        <div v-if="isLoading" class="loading-catalog">
          <svg width="40" height="40" viewBox="0 0 24 24" class="spinner">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <p>Cargando catálogo fresco del mar...</p>
        </div>
        <Carousel v-else-if="products.length > 0" :breakpoints="breakpoints" :wrapAround="true">
          <Slide v-for="product in products" :key="product.id">
            <div class="carousel-card-wrapper">
              <ProductCard :product="product" />
            </div>
          </Slide>

          <template #addons>
            <Navigation />
            <Pagination />
          </template>
        </Carousel>
        <div v-else class="empty-catalog">
          <p>En este momento no hay productos registrados en el catálogo.</p>
        </div>
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

/* Loadings y Empty states */
.loading-catalog, .empty-catalog {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--color-text-secondary);
}
.spinner {
  animation: spin 1.5s linear infinite;
  color: var(--color-primary);
  margin-bottom: 1rem;
}
@keyframes spin { 100% { transform: rotate(360deg); } }

/* Fix del carrusel para ProductCard interna */
.carousel-card-wrapper {
  padding: 15px;
  height: 100%;
  width: 100%;
  display: flex;
}
:deep(.product-card) {
  /* Forzamos a apilarse verticalmente dentro del carrusel para mantener espacio */
  flex-direction: column !important; 
  margin: 0;
  width: 100%;
  height: 100%;
}
:deep(.product-visual) {
  width: 100% !important;
  min-height: 220px;
}
:deep(.product-image) {
  max-height: 200px !important;
}
:deep(.product-details) {
  width: 100% !important;
  padding: 1.5rem !important;
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
