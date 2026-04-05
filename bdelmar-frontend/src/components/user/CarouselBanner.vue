<script setup>
import { ref } from 'vue'
import { Carousel, Slide, Navigation, Pagination } from 'vue3-carousel'
import 'vue3-carousel/dist/carousel.css'
import banner1 from '@/assets/banner1.png'
import banner2 from '@/assets/banner2.jpg'

const slides = [
  {
    image: banner1,
    title: 'Mariscos Frescos del Día',
    subtitle: 'Directamente del mar a tu mesa · Distribución al mayor y detal',
    cta: 'Ver Productos',
  },
  {
    image: banner2,
    title: 'Ceviches y Preparaciones',
    subtitle: 'Calidad premium garantizada · RIF J500760817',
    cta: 'Nuestros Servicios',
  },
]
</script>

<template>
  <section class="carousel-section" id="inicio">
    <Carousel :autoplay="5000" :wrapAround="true" class="main-carousel">
      <Slide v-for="(slide, i) in slides" :key="i">
        <div class="carousel-slide">
          <img :src="slide.image" :alt="slide.title" class="slide-img" />
          <div class="slide-overlay"></div>
          <div class="slide-content">
            <div class="slide-badge">B DEL MAR 3011</div>
            <h1 class="slide-title">{{ slide.title }}</h1>
            <p class="slide-subtitle">{{ slide.subtitle }}</p>
            <a :href="'#productos'" class="slide-cta">
              {{ slide.cta }}
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
            </a>
          </div>
        </div>
      </Slide>

      <template #addons>
        <Navigation />
        <Pagination />
      </template>
    </Carousel>
  </section>
</template>

<style scoped>
.carousel-section {
  position: relative;
  height: 520px;
  overflow: hidden;
}

.main-carousel {
  height: 100%;
}
:deep(.carousel__track) {
  height: 100%;
}
:deep(.carousel__viewport) {
  height: 100%;
}

.carousel-slide {
  position: relative;
  width: 100%; height: 520px;
}

.slide-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Overlay gradiente usando paleta */
.slide-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-primary) 70%, black) 0%,
    rgba(0,0,0,0.35) 100%
  );
}

/* Contenido */
.slide-content {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: 3rem 4rem;
  z-index: 2;
}
.slide-badge {
  display: inline-block;
  background: var(--color-accent);
  color: var(--color-text-primary, white);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 4px 14px;
  border-radius: 20px;
  margin-bottom: 0.8rem;
}
.slide-title {
  font-size: clamp(1.8rem, 4vw, 3rem);
  font-weight: 800;
  color: var(--color-text-primary, white);
  line-height: 1.1;
  margin-bottom: 0.6rem;
  text-shadow: 0 2px 12px rgba(0,0,0,0.3);
}
.slide-subtitle {
  font-size: 1rem;
  color: color-mix(in srgb, var(--color-text-primary, white) 85%, transparent);
  margin-bottom: 1.5rem;
}
.slide-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-accent);
  color: var(--color-text-primary, white);
  padding: 0.85rem 2rem;
  border-radius: var(--radius-pill);
  font-weight: 700;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-decoration: none;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 4px 16px rgba(0,0,0,0.25);
}
.slide-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); color: var(--color-text-primary, white); }
.slide-cta svg { fill: var(--color-text-primary, white); }

/* Vue3 Carousel Customization */
:deep(.carousel__prev), :deep(.carousel__next) {
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 50%;
  width: 48px; height: 48px;
  color: white;
  transition: background 0.15s, transform 0.15s;
}
:deep(.carousel__prev:hover), :deep(.carousel__next:hover) { 
  background: var(--color-primary); 
  transform: scale(1.08); 
}
:deep(.carousel__icon) {
  fill: currentColor;
}
:deep(.carousel__pagination) {
  position: absolute;
  bottom: 1.5rem;
  left: 50%; transform: translateX(-50%);
  z-index: 5;
  display: flex; gap: 8px;
  padding: 0;
}
:deep(.carousel__pagination-button) {
  padding: 0; margin: 0;
}
:deep(.carousel__pagination-button::after) {
  content: ''; display: block;
  width: 10px; height: 10px; border-radius: 50%;
  background: rgba(255,255,255,0.4);
  transition: background 0.2s, transform 0.2s;
}
:deep(.carousel__pagination-button--active::after) {
  background: var(--color-accent);
  transform: scale(1.3);
}

@media (max-width: 768px) {
  .carousel-section { height: 380px; }
  .carousel-slide { height: 380px; }
  .slide-content { padding: 2rem 1.5rem; }
  :deep(.carousel__prev), :deep(.carousel__next) { width: 38px; height: 38px; }
}
</style>
