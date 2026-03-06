<script setup>
import { ref, computed, watch } from 'vue'
import { useThemeStore } from '../../stores/useThemeStore.js'
import { useToast } from '../../composables/useToast.js'
import ConfirmDialog from '../shared/ConfirmDialog.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  paletaId: { type: Number, default: null },
})
const emit = defineEmits(['close'])

const themeStore = useThemeStore()
const state = themeStore.state
const { success, error } = useToast()

// Copia local de colores para edición
const localName    = ref('')
const localType    = ref('claro')
const localColors  = ref({})

const colorFields = [
  { key: 'primary',       label: 'Color Principal',  desc: 'Títulos, badges, bordes' },
  { key: 'accent',        label: 'Acento',            desc: 'Precios, detalles destacados' },
  { key: 'secondary',     label: 'Secundario',        desc: 'Botones, fondos secundarios' },
  { key: 'bgPage',        label: 'Fondo de Página',   desc: 'Fondo general de la app' },
  { key: 'bgCard',        label: 'Fondo de Tarjeta',  desc: 'Fondo de cards y paneles' },
  { key: 'textPrimary',   label: 'Texto Principal',   desc: 'Párrafos y cuerpo' },
  { key: 'textSecondary', label: 'Texto Secundario',  desc: 'Subtexto, placeholders' },
  { key: 'imageBg',       label: 'Fondo de Imagen',   desc: 'Placeholder de imágenes' },
]

// Cálculo de Luminancia Relativa (Fórmula Oficial W3C WCAG 2.1)
function getLuminance(hex) {
  const clean = String(hex).replace('#', '')
  if (clean.length !== 6) return 0
  const rgb = [
    parseInt(clean.substring(0,2), 16) / 255,
    parseInt(clean.substring(2,4), 16) / 255,
    parseInt(clean.substring(4,6), 16) / 255
  ]
  const [r, g, b] = rgb.map(c => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  // Retorna un valor entre 0.0 (negro puro) y 1.0 (blanco puro)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function getContrastRatio(lum1, lum2) {
  const l1 = Math.max(lum1, lum2)
  const l2 = Math.min(lum1, lum2)
  return (l1 + 0.05) / (l2 + 0.05)
}

function getFeedback(key, hex, type, allColors = {}) {
  const lum = getLuminance(hex) // 0.0 a 1.0 según WCAG
  const bgHex = allColors.bgPage || (type === 'oscuro' ? '#121212' : '#ffffff')
  const bgLum = getLuminance(bgHex)
  
  const isBg = ['bgPage', 'bgCard', 'imageBg'].includes(key)
  const isText = ['textPrimary', 'textSecondary'].includes(key)
  const isPrimary = key === 'primary' || key === 'accent' || key === 'secondary'
  
  const contrastWithBg = getContrastRatio(lum, bgLum)
  
  if (type === 'claro') {
    if (isBg)      return lum < 0.7 ? { type: 'warn', text: '⚠️ Basado en W3C: Muy oscuro para fondo claro' } : { type: 'safe', text: '✓ WCAG: Buen nivel de blanco para fondo' }
    if (isText)    return contrastWithBg < 4.5 ? { type: 'warn', text: `⚠️ Ratio W3C bajo (${contrastWithBg.toFixed(1)}:1) contra fondo. Usa tono más oscuro.` } : { type: 'safe', text: `✓ WCAG: Contraste óptimo (${contrastWithBg.toFixed(1)}:1)` }
    if (isPrimary) return contrastWithBg < 3.0 ? { type: 'warn', text: `⚠️ Ratio W3C bajo (${contrastWithBg.toFixed(1)}:1) contra fondo. Usa tono más oscuro.` } : { type: 'safe', text: `✓ WCAG: Buen contraste de color (${contrastWithBg.toFixed(1)}:1)` }
  } else if (type === 'oscuro') {
    if (isBg)      return lum > 0.25 ? { type: 'warn', text: '⚠️ Basado en W3C: Muy luminoso para fondo oscuro' } : { type: 'safe', text: '✓ WCAG: Nivel oscuro óptimo para fondo' }
    if (isText)    return contrastWithBg < 4.5 ? { type: 'warn', text: `⚠️ Ratio W3C bajo (${contrastWithBg.toFixed(1)}:1) contra fondo. Usa tono más claro.` } : { type: 'safe', text: `✓ WCAG: Lectura cómoda (${contrastWithBg.toFixed(1)}:1)` }
    if (isPrimary) return contrastWithBg < 3.0 ? { type: 'warn', text: `⚠️ Ratio W3C bajo (${contrastWithBg.toFixed(1)}:1) contra fondo. Usa tono más claro.` } : { type: 'safe', text: `✓ WCAG: Buen resalte (${contrastWithBg.toFixed(1)}:1)` }
  } else if (type === 'daltonico') {
    const clean = String(hex).replace('#', '')
    if (clean.length === 6) {
      const r = parseInt(clean.substring(0,2), 16)
      const g = parseInt(clean.substring(2,4), 16)
      const b = parseInt(clean.substring(4,6), 16)
      
      // Protanopia/Deuteranopia: Inhabilidad para distinguir rojo y verde puros
      // Falso positivo común: Cian (#4cb1f0) tiene G alto, pero B también es altísimo (es azul/celeste).
      // Solo advertimos si R o G dominan Y el Azul (B) es bajo.
      const isRedish = r > 150 && r > g * 1.5 && b < 100
      const isGreenish = g > 150 && g > r * 1.2 && b < 130

      if (isRedish || isGreenish) {
        return { type: 'warn', text: '❌ Riesgo WCAG: Posible confusión Rojo/Verde puro' }
      }
      
      // En daltonismo también es crucial que el contraste general de luces sea alto
      if (!isBg && contrastWithBg < 3.0) {
        return { type: 'warn', text: `⚠️ Riesgo WCAG: Bajo contraste (${contrastWithBg.toFixed(1)}:1) con el fondo de página.` }
      }
      
      return { type: 'safe', text: `✓ WCAG: Color seguro y buen contraste (${contrastWithBg.toFixed(1)}:1)` }
    }
  }
  return null
}

watch(() => props.show, (val) => {
  if (val) {
    if (props.paletaId !== null) {
      // Editando existente
      const p = state.paletas.find(p => p.id === props.paletaId)
      if (p) {
        localName.value   = p.name
        localType.value   = p.type || 'claro'
        localColors.value = { ...p.colors }
      }
    } else {
      // Creando nueva desde cero
      localName.value   = ''
      localType.value   = 'claro'
      localColors.value = {
        primary:       '#1a91db',
        accent:        '#db8b1a',
        secondary:     '#3f8bba',
        bgPage:        '#f0f2f5',
        bgCard:        '#fafafa',
        textPrimary:   '#121212',
        textSecondary: '#2c3e50',
        imageBg:       '#d4dce4',
      }
    }
  }
})

function save() {
  if (!localName.value.trim()) { error('El nombre no puede estar vacío'); return }
  
  if (props.paletaId !== null) {
    // Actualizar
    const ok = themeStore.editarPaleta(props.paletaId, {
      name:   localName.value.trim(),
      colors: { ...localColors.value },
      type:   localType.value,
    })
    if (ok) {
      success(`Paleta "${localName.value}" actualizada correctamente`)
      emit('close')
    } else {
      error('No se pudo actualizar la paleta')
    }
  } else {
    // Crear nueva
    const nueva = {
      id: state.nextId++,
      name: localName.value.trim(),
      type: localType.value,
      isDefault: false,
      active: false,
      colors: { ...localColors.value }
    }
    state.paletas.push(nueva)
    // Guardar en persistToStorage. Como no lo exportamos directamente, activarlo y volver al actual es la forma más limpia o usar un emit.
    // Usaremos un emit y lo guardaremos desde la vista, o sencillamente lo pusheamos al state.
    emit('created', nueva)
    success(`Paleta "${localName.value}" creada exitosamente`)
    emit('close')
  }
}
</script>

<template>
  <teleport to="body">
    <transition name="dialog-fade">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="edit-modal">
          <!-- Filtro SVG oculto para daltonismo -->
          <svg width="0" height="0" style="position: absolute; pointer-events: none;">
            <filter id="deuteranopia-filter">
              <feColorMatrix type="matrix" values="
                0.625 0.375 0 0 0
                0.7   0.3   0 0 0
                0     0.3 0.7 0 0
                0     0     0 1 0" />
            </filter>
          </svg>

          <!-- Header -->
          <div class="modal-header">
            <h2>{{ paletaId === null ? 'Crear Nueva Paleta' : 'Editar Paleta' }}</h2>
            <button class="modal-close" @click="$emit('close')">
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>

          <!-- Nombre y tipo -->
          <div class="meta-grid">
            <div class="meta-field">
              <label>Nombre de la paleta</label>
              <input v-model="localName" type="text" class="name-input" placeholder="Nombre..." />
            </div>
            <div class="meta-field">
              <label>Tipo (Afecta validaciones)</label>
              <select v-model="localType" class="type-select">
                <option value="claro">☀ Claro</option>
                <option value="oscuro">🌙 Oscuro</option>
                <option value="daltonico">◉ Daltonismo</option>
              </select>
            </div>
          </div>

          <!-- Colores -->
          <div class="colors-grid">
            <div v-for="field in colorFields" :key="field.key" class="color-row">
              <div class="color-swatch-btn" :style="{ background: localColors[field.key] }">
                <input
                  type="color"
                  :value="localColors[field.key]"
                  @input="localColors[field.key] = $event.target.value"
                  class="native-color"
                  :title="field.desc"
                />
              </div>
              <div class="color-info">
                <span class="color-label">{{ field.label }}</span>
                <code class="color-hex">{{ localColors[field.key] }}</code>
                
                <!-- Feedback Content -->
                <div v-if="getFeedback(field.key, localColors[field.key], localType, localColors)" 
                     class="color-feedback" 
                     :class="getFeedback(field.key, localColors[field.key], localType, localColors).type">
                  {{ getFeedback(field.key, localColors[field.key], localType, localColors).text }}
                </div>
              </div>
              
              <!-- Preview swatch grande -->
              <div class="color-bar-wrapper">
                <div class="color-bar" :style="{ background: localColors[field.key] }" title="Vista normal" />
                <div v-if="localType === 'daltonico'" 
                     class="color-bar color-bar-daltonico" 
                     :style="{ background: localColors[field.key] }" 
                     title="Simulación para Daltonismo" />
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="modal-actions">
            <button class="btn-cancel" @click="$emit('close')">Cancelar</button>
            <button class="btn-save" @click="save">
              <svg width="16" height="16" viewBox="0 0 24 24"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(5px);
  display: flex; align-items: center; justify-content: center;
  z-index: 10000; padding: 1rem;
}
.edit-modal {
  background: var(--color-bg-card);
  border-radius: 20px;
  padding: 2rem;
  max-width: 700px; width: 100%;
  max-height: 90vh; overflow-y: auto;
  box-shadow: 0 24px 60px rgba(0,0,0,0.25);
  display: flex; flex-direction: column; gap: 1.2rem;
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
}
.modal-header h2 { font-size: 1.2rem; font-weight: 800; color: var(--color-text-primary); margin: 0; }
.modal-close {
  background: none; border: none; cursor: pointer;
  color: var(--color-text-secondary); padding: 4px; border-radius: 8px;
  transition: background 0.15s;
}
.modal-close:hover { background: var(--color-bg-page); }
.modal-close svg { fill: currentColor; }

.meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
.meta-field label { display: block; font-size: 0.75rem; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.35rem; }
.name-input, .type-select {
  width: 100%; padding: 0.6rem 0.8rem;
  border: 2px solid rgba(128,128,128,0.15);
  border-radius: var(--radius-sm);
  background: var(--color-bg-page);
  color: var(--color-text-primary);
  font-size: 0.9rem; font-family: inherit; outline: none;
  transition: border-color 0.2s;
}
.name-input:focus, .type-select:focus { border-color: var(--color-primary); }

.colors-grid { display: flex; flex-direction: column; gap: 0.6rem; }
.color-row { display: flex; align-items: center; gap: 0.75rem; }
.color-swatch-btn {
  width: 40px; height: 40px; border-radius: 10px;
  border: 2px solid rgba(255,255,255,0.35);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  cursor: pointer; position: relative; overflow: hidden; flex-shrink: 0;
  transition: transform 0.15s;
}
.color-swatch-btn:hover { transform: scale(1.08); }
.native-color {
  position: absolute; inset: 0; opacity: 0;
  cursor: pointer; width: 100%; height: 100%;
}
.color-info { display: flex; flex-direction: column; gap: 1px; flex: 1; }
.color-label { font-size: 0.78rem; font-weight: 600; color: var(--color-text-secondary); }
.color-hex {
  font-size: 0.75rem; font-family: 'Courier New', monospace;
  color: var(--color-text-primary);
  background: var(--color-bg-page); padding: 1px 6px; border-radius: 4px;
  width: fit-content;
}

.color-feedback {
  font-size: 0.68rem;
  margin-top: 3px;
  line-height: 1.2;
}
.color-feedback.warn { color: #d97706; font-weight: 600; }
.color-feedback.info { color: var(--color-primary); font-weight: 500; }
.color-feedback.safe { color: #10b981; font-weight: 500; }

.color-bar-wrapper { flex: 2; display: flex; flex-direction: column; gap: 4px; }
.color-bar { height: 12px; border-radius: 6px; width: 100%; }
.color-bar-daltonico {
  filter: url(#deuteranopia-filter);
  border: 1px dashed rgba(128,128,128,0.5);
  height: 8px;
}

.modal-actions { display: flex; gap: 0.6rem; justify-content: flex-end; margin-top: 0.4rem; }
.btn-cancel {
  padding: 0.6rem 1.4rem; border-radius: 50px;
  border: 1px solid rgba(128,128,128,0.2);
  background: none; color: var(--color-text-secondary);
  font-size: 0.88rem; font-weight: 600; font-family: inherit; cursor: pointer;
}
.btn-save {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.6rem 1.6rem; border-radius: 50px;
  background: var(--color-primary); color: white;
  border: none; font-size: 0.88rem; font-weight: 700;
  font-family: inherit; cursor: pointer;
  transition: filter 0.15s, transform 0.1s;
  box-shadow: 0 4px 14px rgba(26,145,219,0.25);
}
.btn-save svg { fill: white; }
.btn-save:hover { filter: brightness(1.08); transform: translateY(-1px); }

.dialog-fade-enter-active { animation: dialog-in 0.25s cubic-bezier(0.34,1.56,0.64,1); }
.dialog-fade-leave-active { animation: dialog-out 0.18s ease forwards; }
@keyframes dialog-in  { from { opacity:0; transform:scale(0.88); } to { opacity:1; transform:scale(1); } }
@keyframes dialog-out { to { opacity:0; transform:scale(0.9); } }
</style>
