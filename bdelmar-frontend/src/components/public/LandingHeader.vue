<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const menuOpen = ref(false)

const navLinks = [
  { label: 'Servicios', href: '/#servicios' },
  { label: 'Nosotros', href: '/#nosotros' },
  { label: 'Contacto',  href: '/#contacto' },
]

function goToLogin() {
  router.push('/login')
}
function goToRegister() {
  router.push('/login?mode=register')
}
</script>

<template>
  <header class="landing-header">
    <div class="header-inner">
      <!-- Logo -->
      <a href="#" class="header-logo">
        <img src="@/assets/bdelmar_logo.png" alt="B-DEL MAR 3011 C.A" class="logo-img" />
      </a>

      <!-- Desktop Nav -->
      <nav class="desktop-nav">
        <a
          v-for="link in navLinks"
          :key="link.label"
          :href="link.href"
          class="nav-link"
        >{{ link.label }}</a>
      </nav>

      <!-- Auth Buttons -->
      <div class="header-actions">
        <button class="btn-login" @click="goToLogin">Iniciar Sesión</button>
        <button class="btn-register" @click="goToRegister">Registrarse</button>
        
        <!-- Hamburger mobile -->
        <button class="hamburger" @click="menuOpen = !menuOpen">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path v-if="!menuOpen" d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
            <path v-else d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Nav -->
    <div class="mobile-nav" :class="{ open: menuOpen }">
      <a
        v-for="link in navLinks"
        :key="link.label"
        :href="link.href"
        class="mobile-nav-link"
        @click="menuOpen = false"
      >{{ link.label }}</a>
      <div class="mobile-auth">
        <button class="btn-login-mobile" @click="goToLogin">Iniciar Sesión</button>
        <button class="btn-register-mobile" @click="goToRegister">Registrarse</button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.landing-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0,0,0,0.05);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Logo */
.header-logo {
  display: flex;
  align-items: center;
  text-decoration: none;
}
.logo-img { width: 80px; height: 80px; object-fit: contain; transition: transform 0.2s; }
.logo-img:hover { transform: scale(1.05); }

/* Nav Desktop */
.desktop-nav {
  display: flex;
  gap: 2rem;
}
.nav-link {
  color: #475569;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s;
}
.nav-link:hover {
  color: var(--color-primary, #1a91db);
}

/* Actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.btn-login {
  background: transparent;
  border: none;
  color: #475569;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.5rem 1rem;
  transition: color 0.2s;
}
.btn-login:hover { color: var(--color-primary, #1a91db); }

.btn-register {
  background: var(--color-primary, #1a91db);
  color: white;
  border: none;
  padding: 0.7rem 1.5rem;
  border-radius: 50px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.btn-register:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 145, 219, 0.3);
}

/* Hamburger */
.hamburger {
  display: none;
  background: none; border: none; cursor: pointer;
  color: #475569;
  padding: 6px;
}

/* Mobile Nav */
.mobile-nav {
  display: none;
  flex-direction: column;
  background: white;
  border-top: 1px solid rgba(0,0,0,0.05);
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}
.mobile-nav.open { max-height: 400px; }
.mobile-nav-link {
  padding: 1rem 1.5rem;
  color: #475569;
  font-weight: 600;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  text-decoration: none;
}
.mobile-auth {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  gap: 1rem;
}
.btn-login-mobile, .btn-register-mobile {
  padding: 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
}
.btn-login-mobile {
  background: transparent;
  border: 2px solid var(--color-primary, #1a91db);
  color: var(--color-primary, #1a91db);
}
.btn-register-mobile {
  background: var(--color-primary, #1a91db);
  color: white;
  border: none;
}

@media (max-width: 900px) {
  .desktop-nav { display: none; }
  .btn-login, .btn-register { display: none; }
  .hamburger { display: block; }
  .mobile-nav { display: flex; }
}
</style>
