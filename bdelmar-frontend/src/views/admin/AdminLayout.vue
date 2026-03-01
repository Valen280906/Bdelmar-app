<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const sidebarOpen = ref(true)

const navItems = [
  { icon: 'settings', label: 'Configuración', path: '/admin/configuracion' },
]

function isActive(path) {
  return route.path === path
}

function logout() {
  localStorage.removeItem('bdelmar_role')
  router.push('/login')
}
</script>

<template>
  <div class="admin-shell">
    <!-- SIDEBAR -->
    <aside class="sidebar" :class="{ collapsed: !sidebarOpen }">
      <div class="sidebar-header">
        <div class="sidebar-brand" v-if="sidebarOpen">
          <svg width="32" height="32" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="22" fill="var(--color-primary)" opacity="0.2"/>
            <path d="M8 26C12 18 20 14 24 20C28 14 36 18 40 26C36 34 28 38 24 32C20 38 12 34 8 26Z" fill="var(--color-primary)"/>
            <circle cx="17" cy="23" r="2" fill="white"/>
          </svg>
          <span class="brand-text">B DEL MAR <strong>3011</strong></span>
        </div>
        <button class="toggle-btn" @click="sidebarOpen = !sidebarOpen">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
          </svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <svg v-if="item.icon === 'settings'" width="20" height="20" viewBox="0 0 24 24">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
          <span v-if="sidebarOpen">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="admin-badge" v-if="sidebarOpen">
          <div class="admin-avatar">A</div>
          <div class="admin-info">
            <span class="admin-name">Administrador</span>
            <span class="admin-role">Admin</span>
          </div>
        </div>
        <button class="logout-btn" @click="logout" :title="sidebarOpen ? '' : 'Cerrar sesión'">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
          <span v-if="sidebarOpen">Salir</span>
        </button>
      </div>
    </aside>

    <!-- CONTENIDO PRINCIPAL -->
    <main class="admin-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.admin-shell {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg-page);
}

/* === SIDEBAR === */
.sidebar {
  width: 240px;
  min-width: 240px;
  background: var(--color-bg-card);
  border-right: 1px solid rgba(128,128,128,0.12);
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease, min-width 0.25s ease;
  box-shadow: var(--shadow-sm);
  z-index: 10;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
}
.sidebar.collapsed {
  width: 64px;
  min-width: 64px;
}

/* Header del sidebar */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.2rem 1rem;
  border-bottom: 1px solid rgba(128,128,128,0.1);
  gap: 0.5rem;
}
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  overflow: hidden;
  flex: 1;
}
.brand-text {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  white-space: nowrap;
}
.brand-text strong { color: var(--color-primary); font-size: 0.95rem; }

.toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}
.toggle-btn:hover { background: var(--color-bg-page); color: var(--color-primary); }

/* Nav items */
.sidebar-nav {
  padding: 1rem 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
}
.nav-item:hover { background: color-mix(in srgb, var(--color-primary) 8%, transparent); color: var(--color-primary); }
.nav-item.active {
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
  font-weight: 600;
}
.nav-item svg { fill: currentColor; flex-shrink: 0; }

/* Footer del sidebar */
.sidebar-footer {
  padding: 1rem 0.6rem;
  border-top: 1px solid rgba(128,128,128,0.1);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.admin-badge {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem;
  overflow: hidden;
}
.admin-avatar {
  width: 34px; height: 34px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
}
.admin-info { display: flex; flex-direction: column; overflow: hidden; }
.admin-name { font-size: 0.85rem; font-weight: 600; color: var(--color-text-primary); white-space: nowrap; }
.admin-role { font-size: 0.72rem; color: var(--color-primary); white-space: nowrap; }

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 0.9rem;
  border-radius: var(--radius-sm);
  border: none;
  background: none;
  color: var(--color-text-secondary);
  font-size: 0.88rem;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  width: 100%;
}
.logout-btn:hover { background: rgba(220,50,50,0.08); color: #dc3232; }
.logout-btn svg { fill: currentColor; flex-shrink: 0; }

/* === CONTENIDO === */
.admin-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  min-width: 0;
}
</style>
