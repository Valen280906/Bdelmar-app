<script setup>
import { useThemeStore } from '../../stores/useThemeStore.js'

const themeStore = useThemeStore()
const state = themeStore.state

const typographyFields = [
  { key: 'h1',  label: 'Título Principal (H1)', min: 1.6, max: 3.8, step: 0.1, unit: 'rem' },
  { key: 'h2',  label: 'Subtítulo (H2)',         min: 1.1, max: 2.6, step: 0.1, unit: 'rem' },
  { key: 'h3',  label: 'Subtítulo (H3)',         min: 0.9, max: 2.0, step: 0.1, unit: 'rem' },
  { key: 'p',   label: 'Párrafo / Botones / Menú', min: 0.75, max: 1.4, step: 0.05, unit: 'rem', note: 'Afecta también el texto de botones y menú' },
]

function onSliderChange(key, event) {
  themeStore.setTypography(key, parseFloat(event.target.value))
}
</script>

<template>
  <div class="typography-editor-card">
    <div class="section-header">
      <h2>Tipografía</h2>
      <span class="section-badge">4 escalas</span>
    </div>
    <p class="editor-desc">
      Ajusta los tamaños de texto con deslizadores. El tamaño de Párrafo controla
      automáticamente los botones y el menú de navegación.
    </p>

    <div class="typo-fields">
      <div v-for="field in typographyFields" :key="field.key" class="typo-item">
        <div class="typo-label-row">
          <label :for="`typo-${field.key}`">{{ field.label }}</label>
          <div class="typo-value-badge">{{ state.typography[field.key].toFixed(2) }}rem</div>
        </div>
        <div v-if="field.note" class="typo-note">{{ field.note }}</div>
        <div class="slider-wrapper">
          <input
            :id="`typo-${field.key}`"
            type="range"
            :min="field.min"
            :max="field.max"
            :step="field.step"
            :value="state.typography[field.key]"
            @input="onSliderChange(field.key, $event)"
            class="typo-slider"
          />
        </div>
        <!-- Preview de texto -->
        <div
          class="typo-preview"
          :style="{ fontSize: `${state.typography[field.key]}rem` }"
        >
          <template v-if="field.key === 'h1'">B DEL MAR 3011</template>
          <template v-else-if="field.key === 'h2'">Mariscos Frescos</template>
          <template v-else-if="field.key === 'h3'">Distribuidora</template>
          <template v-else>La felicidad se respira a la orilla del mar</template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.typography-editor-card {
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
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  color: var(--color-accent);
  font-size: 0.72rem; font-weight: 600;
  padding: 2px 10px; border-radius: 20px;
}
.editor-desc {
  font-size: 0.8rem; color: var(--color-text-secondary);
  margin-bottom: 1.2rem; line-height: 1.5;
}

.typo-fields { display: flex; flex-direction: column; gap: 1.4rem; }

.typo-item {
  border-bottom: 1px solid rgba(128,128,128,0.08);
  padding-bottom: 1.2rem;
}
.typo-item:last-child { border-bottom: none; padding-bottom: 0; }

.typo-label-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 0.2rem;
}
.typo-label-row label {
  font-size: 0.82rem; font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase; letter-spacing: 0.6px;
}
.typo-value-badge {
  font-size: 0.78rem; font-weight: 700;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  padding: 2px 10px; border-radius: 20px;
  font-family: 'Courier New', monospace;
}
.typo-note {
  font-size: 0.72rem; color: var(--color-accent);
  margin-bottom: 0.4rem; font-style: italic;
}

/* Slider */
.slider-wrapper { margin: 0.4rem 0; }
.typo-slider {
  -webkit-appearance: none;
  width: 100%; height: 5px;
  border-radius: 5px;
  background: linear-gradient(to right, var(--color-primary) 0%, var(--color-bg-page) 0%);
  outline: none; cursor: pointer;
}
.typo-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: var(--color-primary);
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  transition: transform 0.15s;
}
.typo-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }

/* Vista previa tipografía */
.typo-preview {
  color: var(--color-primary);
  font-weight: 700;
  line-height: 1.2;
  margin-top: 0.4rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: font-size 0.2s;
}
</style>
