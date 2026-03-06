<script setup>
import { useToast } from '../../composables/useToast.js'

const { toasts, dismiss, undo } = useToast()

const icons = {
  success: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>`,
  error:   `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>`,
  warning: `<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>`,
  info:    `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>`,
}
</script>

<template>
  <teleport to="body">
    <div class="toast-container" aria-live="polite">
      <transition-group name="toast-anim" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="`toast--${toast.type}`"
        >
          <!-- Icono -->
          <svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" v-html="icons[toast.type]" />

          <!-- Mensaje -->
          <div class="toast-body">
            <span class="toast-msg">{{ toast.message }}</span>
            <button
              v-if="toast.undoFn"
              class="toast-undo"
              @click="undo(toast.id)"
            >
              Deshacer ({{ toast.countdown }}s)
            </button>
          </div>

          <!-- Cerrar -->
          <button class="toast-close" @click="dismiss(toast.id)" title="Cerrar">
            <svg width="14" height="14" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>

          <!-- Barra de progreso -->
          <div class="toast-progress">
            <div class="toast-progress-bar" :style="{ width: toast.progress + '%' }" />
          </div>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  max-width: 380px;
  width: calc(100vw - 3rem);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1rem 1.4rem 1rem;
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  position: relative;
  overflow: hidden;
  pointer-events: all;
  border: 1px solid transparent;
  backdrop-filter: blur(12px);
}

.toast--success { background: rgba(16, 185, 129, 0.95); border-color: rgba(255,255,255,0.15); color: #fff; }
.toast--error   { background: rgba(220, 50, 50, 0.95); border-color: rgba(255,255,255,0.15); color: #fff; }
.toast--warning { background: rgba(245, 158, 11, 0.95); border-color: rgba(255,255,255,0.15); color: #fff; }
.toast--info    { background: rgba(26, 145, 219, 0.95); border-color: rgba(255,255,255,0.15); color: #fff; }

.toast-icon { fill: white; flex-shrink: 0; margin-top: 1px; }

.toast-body { flex: 1; display: flex; flex-direction: column; gap: 0.4rem; }
.toast-msg { font-size: 0.9rem; font-weight: 600; line-height: 1.4; }
.toast-undo {
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.35);
  color: white;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  cursor: pointer;
  width: fit-content;
  transition: background 0.15s;
  font-family: inherit;
}
.toast-undo:hover { background: rgba(255,255,255,0.35); }

.toast-close {
  background: rgba(255,255,255,0.15);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  padding: 3px;
  display: flex;
  transition: background 0.15s;
  flex-shrink: 0;
}
.toast-close:hover { background: rgba(255,255,255,0.3); }
.toast-close svg { fill: white; }

.toast-progress {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 4px;
  background: rgba(255,255,255,0.2);
}
.toast-progress-bar {
  height: 100%;
  background: rgba(255,255,255,0.6);
  transition: width 0.1s linear;
  border-radius: 0 0 0 14px;
}

/* Animaciones */
.toast-anim-enter-active { animation: slide-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-anim-leave-active { animation: slide-out 0.2s ease forwards; }

@keyframes slide-in {
  from { opacity: 0; transform: translateX(120%); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes slide-out {
  to { opacity: 0; transform: translateX(120%); }
}
</style>
