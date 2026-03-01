<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const menuOpen = ref(false)

function logout() {
  localStorage.removeItem('bdelmar_role')
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
        <svg width="36" height="36" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="22" fill="var(--color-primary)" opacity="0.15"/>
          <path d="M8 26C12 18 20 14 24 20C28 14 36 18 40 26C36 34 28 38 24 32C20 38 12 34 8 26Z" fill="var(--color-primary)"/>
          <circle cx="17" cy="23" r="2" fill="white"/>
        </svg>
        <div class="logo-text">
          <span class="logo-main">B DEL MAR</span>
          <span class="logo-number">3011</span>
        </div>
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
  gap: 0.7rem;
  text-decoration: none;
  flex-shrink: 0;
}
.logo-text { display: flex; flex-direction: column; line-height: 1.1; }
.logo-main {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: 2px;
}
.logo-number {
  font-size: 0.72rem;
  color: var(--color-accent);
  font-weight: 600;
  letter-spacing: 4px;
}

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
  font-size: var(--font-size-menu);
  font-weight: 500;
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
  font-size: var(--font-size-menu);
  font-weight: 500;
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
