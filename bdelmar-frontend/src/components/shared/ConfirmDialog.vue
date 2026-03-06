<script setup>
const props = defineProps({
  show:          { type: Boolean, default: false },
  title:         { type: String,  default: '¿Estás seguro?' },
  message:       { type: String,  default: 'Esta acción no se puede deshacer.' },
  confirmLabel:  { type: String,  default: 'Confirmar' },
  cancelLabel:   { type: String,  default: 'Cancelar' },
  danger:        { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <teleport to="body">
    <transition name="dialog-fade">
      <div v-if="show" class="dialog-overlay" @click.self="$emit('cancel')">
        <div class="dialog-box" role="alertdialog" :aria-label="title">
          <!-- Icono -->
          <div class="dialog-icon" :class="{ 'dialog-icon--danger': danger }">
            <svg v-if="danger" width="28" height="28" viewBox="0 0 24 24">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
            <svg v-else width="28" height="28" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </div>

          <h2 class="dialog-title">{{ title }}</h2>
          <p class="dialog-msg">{{ message }}</p>

          <div class="dialog-actions">
            <button class="dialog-btn dialog-btn--cancel" @click="$emit('cancel')">
              {{ cancelLabel }}
            </button>
            <button
              class="dialog-btn dialog-btn--confirm"
              :class="{ 'dialog-btn--danger': danger }"
              @click="$emit('confirm')"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
.dialog-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(5px);
  display: flex; align-items: center; justify-content: center;
  z-index: 10000;
  padding: 1rem;
}

.dialog-box {
  background: var(--color-bg-card, #fff);
  border-radius: 20px;
  padding: 2.2rem 2rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 24px 60px rgba(0,0,0,0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  text-align: center;
}

.dialog-icon {
  width: 60px; height: 60px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-primary, #1a91db) 12%, transparent);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 0.2rem;
}
.dialog-icon svg { fill: var(--color-primary, #1a91db); }
.dialog-icon--danger {
  background: rgba(220,50,50,0.12);
}
.dialog-icon--danger svg { fill: #dc3232; }

.dialog-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--color-text-primary, #121212);
  margin: 0;
}

.dialog-msg {
  font-size: 0.9rem;
  color: var(--color-text-secondary, #555);
  line-height: 1.5;
  margin: 0;
}

.dialog-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.8rem;
  width: 100%;
}

.dialog-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 50px;
  border: none;
  font-size: 0.9rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}
.dialog-btn--cancel {
  background: var(--color-bg-page, #f0f2f5);
  color: var(--color-text-secondary, #555);
}
.dialog-btn--cancel:hover { filter: brightness(0.95); }
.dialog-btn--confirm {
  background: var(--color-primary, #1a91db);
  color: white;
  box-shadow: 0 4px 14px rgba(26,145,219,0.3);
}
.dialog-btn--confirm:hover { filter: brightness(1.08); transform: translateY(-1px); }
.dialog-btn--danger {
  background: #dc3232 !important;
  box-shadow: 0 4px 14px rgba(220,50,50,0.3) !important;
}

/* Animación */
.dialog-fade-enter-active { animation: dialog-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.dialog-fade-leave-active { animation: dialog-out 0.18s ease forwards; }
@keyframes dialog-in  { from { opacity: 0; transform: scale(0.88); } to { opacity:1; transform:scale(1); } }
@keyframes dialog-out { to { opacity: 0; transform: scale(0.9); } }
</style>
