<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ThemeSwitcher from './ThemeSwitcher.vue'
import { useCartStore } from '@/stores/useCartStore'

const router = useRouter()
const menuOpen = ref(false)
const cartStore = useCartStore()

function logout() {
  localStorage.removeItem('bdelmar_role')
  localStorage.removeItem('bdelmar_user')
  router.push('/login')
}

const navLinks = [
  { label: 'Inicio',    href: '#inicio' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Productos', href: '#productos' },
  { label: 'Contacto',  href: '#contacto' },
]
</script>

<template>
  <header class="site-header">
    <div class="header-inner">
      <!-- Logo -->
      <a href="#inicio" class="header-logo">
        <img src="@/assets/bdelmar_logo.png" alt="B-DEL MAR 3011 C.A" class="logo-img" />
      </a>

      <!-- Nav Desktop -->
      <nav class="desktop-nav">
        <a
          v-for="link in navLinks"
          :key="link.label"
          :href="link.href"
          class="nav-link"
        >{{ link.label }}</a>
      </nav>

      <!-- Acciones -->
      <div class="header-actions">
        <ThemeSwitcher />
        <!-- Perfil -->
        <button class="icon-btn" @click="router.push('/perfil')" title="Mi Perfil">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </button>
        <!-- Carrito -->
        <button class="icon-btn cart-btn" @click="router.push('/carrito')" title="Mi Carrito">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <span v-if="cartStore.totalItems > 0" class="cart-badge">{{ cartStore.totalItems }}</span>
        </button>
        <button class="btn-admin" @click="logout" title="Salir">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
        </button>
        <!-- Hamburger mobile -->
        <button class="hamburger" @click="menuOpen = !menuOpen">
          <svg width="22" height="22" viewBox="0 0 24 24">
            <path v-if="!menuOpen" d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
            <path v-else d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Nav Mobile -->
    <div class="mobile-nav" :class="{ open: menuOpen }">
      <a
        v-for="link in navLinks"
        :key="link.label"
        :href="link.href"
        class="mobile-nav-link"
        @click="menuOpen = false"
      >{{ link.label }}</a>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  background: var(--color-bg-card);
  border-bottom: 1px solid rgba(128,128,128,0.1);
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: var(--shadow-sm);
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 68px;
  display: flex;
  align-items: center;
  gap: 2rem;
}

/* Logo */
.header-logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
}
.logo-img { width: 60px; height: 60px; object-fit: contain; transition: transform 0.2s; }
.logo-img:hover { transform: scale(1.05); }

/* Desktop nav */
.desktop-nav {
  display: flex;
  gap: 0;
  flex: 1;
  justify-content: center;
}
.nav-link {
  padding: 0.5rem 1rem;
  color: var(--color-text-secondary);
  font-family: var(--font-family-body);
  font-size: var(--font-size-p, 0.95rem);
  font-weight: 600;
  text-decoration: none;
  border-radius: var(--radius-sm);
  transition: color 0.15s, background 0.15s;
}
.nav-link:hover {
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
}

/* Acciones */
.header-actions { display: flex; align-items: center; gap: 0.5rem; }
.btn-admin {
  background: none;
  border: 1px solid rgba(128,128,128,0.15);
  border-radius: 8px;
  padding: 7px;
  cursor: pointer;
  color: var(--color-text-secondary);
  display: flex;
  transition: all 0.15s;
}
.btn-admin:hover { color: #dc3232; border-color: rgba(220,50,50,0.3); background: rgba(220,50,50,0.06); }
.btn-admin svg { fill: currentColor; }

/* Hamburger */
.hamburger {
  display: none;
  background: none; border: none; cursor: pointer;
  color: var(--color-text-secondary);
  padding: 6px; border-radius: 8px;
}
.hamburger svg { fill: none; }

.icon-btn {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  transition: background 0.15s, color 0.15s;
}
.icon-btn:hover { background: color-mix(in srgb, var(--color-primary) 8%, transparent); color: var(--color-primary); }
.icon-btn svg { stroke: currentColor; }

.cart-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: var(--color-primary);
  color: #fff;
  font-size: 0.62rem;
  font-weight: 800;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  pointer-events: none;
}

/* Mobile nav */
.mobile-nav {
  display: none;
  flex-direction: column;
  background: var(--color-bg-card);
  border-top: 1px solid rgba(128,128,128,0.08);
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}
.mobile-nav.open { max-height: 300px; }
.mobile-nav-link {
  padding: 1rem 1.5rem;
  color: var(--color-text-secondary);
  font-family: var(--font-family-body);
  font-size: var(--font-size-p, 1rem);
  font-weight: 600;
  border-bottom: 1px solid rgba(128,128,128,0.06);
  text-decoration: none;
  transition: color 0.15s, background 0.15s;
}
.mobile-nav-link:hover { color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 5%, transparent); }

@media (max-width: 768px) {
  .desktop-nav { display: none; }
  .hamburger   { display: flex; }
  .mobile-nav  { display: flex; }
}
</style>
