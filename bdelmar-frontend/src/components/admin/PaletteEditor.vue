<script setup>
// Panel lateral donde el admin ajustar uno por uno los colores de la marca 
// (Principal, Acento, Fondo, etc.)

import { useThemeStore } from '../../stores/useThemeStore.js'
import { useToast } from '../../composables/useToast.js'

const themeStore = useThemeStore()
const state = themeStore.state
const { info } = useToast()
const emit = defineEmits(['color-changed'])

const colorFields = [
  { key: 'primary',       label: 'Color Principal',    desc: 'Títulos, badges, bordes activos' },
  { key: 'accent',        label: 'Acento',             desc: 'Precios, detalles destacados' },
  { key: 'secondary',     label: 'Secundario',         desc: 'Botones, fondos secundarios' },
  { key: 'bgPage',        label: 'Fondo de Página',    desc: 'Fondo general de la app' },
  { key: 'textPrimary',   label: 'Texto Principal',    desc: 'Texto de párrafos y cuerpo' },
]

function onColorChange(key, event) {
  // Inicia draft si aún no existe
  if (!state.draftColors) themeStore.startDraft()
  themeStore.setColor(key, event.target.value)
  emit('color-changed')
}

function copyHex(hex) {
  navigator.clipboard.writeText(hex).then(() => info(`¡Copiado: ${hex}!`))
}

function currentValue(key) {
  return state.draftColors ? state.draftColors[key] : state.currentColors[key]
}
</script>

<template>
  <div class="palette-editor-card">
    <div class="section-header">
      <h2>Paleta de Colores</h2>
      <span class="section-badge">8 variables</span>
    </div>
    <p class="editor-desc">
      Cada cambio se refleja en tiempo real en la vista previa y en toda la aplicación.
      Los iconos SVG y sombras también heredan los valores.
    </p>

    <div class="color-grid">
      <div
        v-for="field in colorFields"
        :key="field.key"
        class="color-item"
      >
        <label :for="`color-${field.key}`" class="color-label">
          {{ field.label }}
        </label>
        <div class="color-picker-row">
          <div class="color-preview-swatch" :style="{ background: currentValue(field.key) }">
            <input
              :id="`color-${field.key}`"
              type="color"
              :value="currentValue(field.key)"
              @input="onColorChange(field.key, $event)"
              class="native-color-input"
              :title="field.desc"
            />
          </div>
          <div class="color-meta">
            <div class="hex-row">
              <code class="color-hex">{{ currentValue(field.key) }}</code>
              <button
                class="copy-btn"
                @click="copyHex(currentValue(field.key))"
                title="Copiar hex"
              >
                <svg width="13" height="13" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
              </button>
            </div>
            <span class="color-desc">{{ field.desc }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.palette-editor-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(128,128,128,0.08);
}
.section-header {
  display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;
}
.section-header h2 { font-size: 1rem; font-weight: 700; color: var(--color-text-primary); }
.section-badge {
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
  font-size: 0.72rem; font-weight: 600;
  padding: 2px 10px; border-radius: 20px;
}
.editor-desc {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin-bottom: 1.2rem;
  line-height: 1.5;
}

.color-grid {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}



.color-label {
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 0.35rem;
}

.color-picker-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.color-preview-swatch {
  width: 44px; height: 44px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  border: 2px solid rgba(255,255,255,0.3);
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  cursor: pointer;
  transition: transform 0.15s;
}
.color-preview-swatch:hover { transform: scale(1.08); }

.native-color-input {
  position: absolute; inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%; height: 100%;
  padding: 0; border: none;
}

.color-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
code.color-hex {
  font-size: 0.82rem;
  font-family: 'Courier New', monospace;
  color: var(--color-text-primary);
  background: var(--color-bg-page);
  padding: 2px 7px;
  border-radius: 5px;
  font-weight: 600;
  width: fit-content;
}
.hex-row {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 5px;
  color: var(--color-text-secondary);
  display: flex;
  transition: background 0.15s, color 0.15s;
}
.copy-btn svg { fill: currentColor; }
.copy-btn:hover { background: color-mix(in srgb, var(--color-primary) 10%, transparent); color: var(--color-primary); }
.color-desc {
  font-size: 0.73rem;
  color: var(--color-text-secondary);
}
</style>
