<script setup>
// Panel lateral donde el admin ajustar uno por uno los colores de la marca 
// (Principal, Acento, Fondo, etc.)

import { useThemeStore } from '../../stores/useThemeStore.js'
import { useToast } from '../../composables/useToast.js'

const themeStore = useThemeStore()
const state = themeStore.state
const { info, error } = useToast()
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

function isValidHex(hex) {
  return /^#[0-9A-F]{6}$/i.test(hex)
}

function onHexChange(key, event) {
  const val = event.target.value.trim()
  if (isValidHex(val)) {
    if (!state.draftColors) themeStore.startDraft()
    themeStore.setColor(key, val)
    emit('color-changed')
  } else {
    // revertir a lo que había
    event.target.value = currentValue(key)
    error('Formato inválido. Debe ser #RRGGBB')
  }
}

// --- WCAG 2.1 AA Contrast Logic ---
function getLuminance(hex) {
  if (!isValidHex(hex)) return 1;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const a = [r, g, b].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(hex1, hex2) {
  const L1 = getLuminance(hex1);
  const L2 = getLuminance(hex2);
  return L1 > L2 ? (L1 + 0.05) / (L2 + 0.05) : (L2 + 0.05) / (L1 + 0.05);
}

function getWCAGWarning(key) {
  const bg = currentValue('bgPage')
  let ratio = 0
  
  if (key === 'textPrimary') {
    ratio = getContrastRatio(currentValue('textPrimary'), bg)
    if (ratio < 4.5) return `⚠ El texto podría ser difícil de leer. Sugerencia: Busca mayor contraste con el fondo.`
  } else if (key === 'primary' || key === 'accent') {
    ratio = getContrastRatio(currentValue(key), bg)
    if (ratio < 3.0) return `⚠ El color podría perderse. Intenta diferenciarlo más del fondo.`
  } else if (key === 'bgPage') {
    ratio = getContrastRatio(bg, currentValue('textPrimary'))
    if (ratio < 4.5) return `⚠ Este fondo dificulta la lectura del texto. Sugerencia: Busca mayor contraste.`
  }
  return null
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
              <input 
                type="text" 
                class="color-hex-input" 
                :value="currentValue(field.key)"
                @change="onHexChange(field.key, $event)"
                maxlength="7"
                title="Escribe un color hex y presiona Enter"
              />
              <button
                class="copy-btn"
                @click="copyHex(currentValue(field.key))"
                title="Copiar hex"
              >
                <svg width="13" height="13" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
              </button>
            </div>
            <span class="color-desc">{{ field.desc }}</span>
            <span v-if="getWCAGWarning(field.key)" class="wcag-warning">
              {{ getWCAGWarning(field.key) }}
            </span>
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
.color-hex-input {
  font-size: 0.82rem;
  font-family: 'Courier New', monospace;
  color: var(--color-text-primary);
  background: var(--color-bg-page);
  padding: 4px 6px;
  border-radius: 5px;
  font-weight: 600;
  width: 75px;
  border: 1px solid rgba(128,128,128,0.2);
  outline: none;
  transition: border-color 0.2s;
  text-transform: uppercase;
}
.color-hex-input:focus {
  border-color: var(--color-primary);
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
.wcag-warning {
  font-size: 0.7rem;
  color: #dc2626;
  font-weight: 600;
  margin-top: 2px;
}
</style>
