<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goToRegister() {
  router.push('/login?mode=register')
}
</script>

<template>
  <section class="hero-banner">
    <div class="hero-bg">
      <img src="@/assets/seafood_banner.png" alt="Mariscos al mayor" class="bg-img" />
      <div class="overlay"></div>
    </div>
    
    <div class="hero-content">
      <span class="badge">Nº 1 en Distribución Mayorista</span>
      <h1 class="title">El Sabor del Mar <br/>Directo a tu Negocio</h1>
      <p class="subtitle">
        Proveeemos los productos del mar más frescos para restaurantes, hoteles y pescaderías, con logística de cadena de frío garantizada a nivel nacional.
      </p>
      
      <div class="actions">
        <button class="btn-primary" @click="goToRegister">Unirse a nuestra red</button>
        <a href="#servicios" class="btn-secondary">Conocer más</a>
      </div>
      
      <div class="stats">
        <div class="stat-item">
          <span class="stat-number">+500</span>
          <span class="stat-text">Clientes Activos</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-number">24/7</span>
          <span class="stat-text">Logística de Frío</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-number">100%</span>
          <span class="stat-text">Frescura Garantizada</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-banner {
  position: relative;
  min-height: 85vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}
.bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(15, 52, 96, 0.9) 0%, rgba(26, 145, 219, 0.7) 100%);
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 900px;
  text-align: center;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.badge {
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(4px);
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 2rem;
  border: 1px solid rgba(255,255,255,0.3);
}

.title {
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  text-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.subtitle {
  font-size: clamp(1.1rem, 2vw, 1.4rem);
  font-weight: 400;
  color: rgba(255,255,255,0.9);
  max-width: 700px;
  margin-bottom: 3rem;
  line-height: 1.6;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 4rem;
}
.btn-primary {
  background: white;
  color: var(--color-primary, #1a91db);
  border: none;
  padding: 1rem 2.5rem;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}
.btn-secondary {
  background: rgba(255,255,255,0.1);
  color: white;
  border: 2px solid white;
  padding: 1rem 2.5rem;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  text-decoration: none;
  display: flex;
  align-items: center;
  transition: background 0.2s;
}
.btn-secondary:hover {
  background: rgba(255,255,255,0.2);
}

.stats {
  display: flex;
  align-items: center;
  gap: 2rem;
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(10px);
  padding: 1.5rem 3rem;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.1);
}
.stat-item {
  display: flex;
  flex-direction: column;
}
.stat-number {
  font-size: 2rem;
  font-weight: 800;
  color: #fff;
}
.stat-text {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.7);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}
.stat-divider {
  width: 2px;
  height: 40px;
  background: rgba(255,255,255,0.2);
}

@media (max-width: 768px) {
  .actions { flex-direction: column; width: 100%; max-width: 300px; }
  .stats { flex-direction: column; gap: 1.5rem; width: 100%; }
  .stat-divider { width: 100%; height: 2px; }
}
</style>
