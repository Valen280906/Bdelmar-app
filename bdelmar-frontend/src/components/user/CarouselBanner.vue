<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const slides = [
  {
    image: '/banner1.png',
    title: 'Mariscos Frescos del Día',
    subtitle: 'Directamente del mar a tu mesa · Distribución al mayor y detal',
    cta: 'Ver Productos',
  },
  {
    image: '/banner2.png',
    title: 'Ceviches y Preparaciones',
    subtitle: 'Calidad premium garantizada · RIF J500760817',
    cta: 'Nuestros Servicios',
  },
  {
    image: '/banner3.png',
    title: 'Distribución Comercial',
    subtitle: 'Contáctanos: 0424-4293765 · 0412-7550945',
    cta: 'Contactar',
  },
]

const current = ref(0)
let timer = null

function prev() {
  current.value = (current.value - 1 + slides.length) % slides.length
  resetTimer()
}
function next() {
  current.value = (current.value + 1) % slides.length
  resetTimer()
}
function goTo(i) {
  current.value = i
  resetTimer()
}
function resetTimer() {
  clearInterval(timer)
  timer = setInterval(next, 5000)
}

onMounted(() => { timer = setInterval(next, 5000) })
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <section class="carousel" id="inicio">
    <div class="carousel-track">
      <div
        v-for="(slide, i) in slides"
        :key="i"
        class="carousel-slide"
        :class="{ active: i === current }"
      >
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
    </div>

    <!-- Flechas -->
    <button class="carousel-arrow carousel-arrow--prev" @click="prev">
      <svg width="22" height="22" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
    </button>
    <button class="carousel-arrow carousel-arrow--next" @click="next">
      <svg width="22" height="22" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
    </button>

    <!-- Indicadores -->
    <div class="carousel-dots">
      <button
        v-for="(_, i) in slides"
        :key="i"
        class="carousel-dot"
        :class="{ active: i === current }"
        @click="goTo(i)"
      ></button>
    </div>
  </section>
</template>

<style scoped>
.carousel {
  position: relative;
  height: 520px;
  overflow: hidden;
}

/* TRACK */
.carousel-track { position: relative; width: 100%; height: 100%; }
.carousel-slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.7s ease;
}
.carousel-slide.active { opacity: 1; z-index: 1; }

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
  color: white;
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
  color: white;
  line-height: 1.1;
  margin-bottom: 0.6rem;
  text-shadow: 0 2px 12px rgba(0,0,0,0.3);
}
.slide-subtitle {
  font-size: 1rem;
  color: rgba(255,255,255,0.85);
  margin-bottom: 1.5rem;
}
.slide-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-accent);
  color: white;
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
.slide-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); color: white; }
.slide-cta svg { fill: white; }

/* FLECHAS */
.carousel-arrow {
  position: absolute;
  top: 50%; transform: translateY(-50%);
  z-index: 5;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 50%;
  width: 48px; height: 48px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: white;
  transition: background 0.15s, transform 0.15s;
}
.carousel-arrow:hover { background: var(--color-primary); transform: translateY(-50%) scale(1.08); }
.carousel-arrow svg { fill: currentColor; }
.carousel-arrow--prev { left: 1.5rem; }
.carousel-arrow--next { right: 1.5rem; }

/* DOTS */
.carousel-dots {
  position: absolute;
  bottom: 1.5rem; left: 50%; transform: translateX(-50%);
  display: flex; gap: 8px; z-index: 5;
}
.carousel-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.4);
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}
.carousel-dot.active {
  background: var(--color-accent);
  transform: scale(1.3);
}

@media (max-width: 768px) {
  .carousel { height: 380px; }
  .slide-content { padding: 2rem 1.5rem; }
  .carousel-arrow { width: 38px; height: 38px; }
}
</style>
